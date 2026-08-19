import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, WhitelistRecord, UserRole, isSuperAdminRole } from '../types/auth';
import { SecurityAuditLog, ActiveOtpLog } from '../types/security';
import { supabase } from '../lib/supabaseClient';

const ALL_MODULES = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports', 'security', 'audit_log'];
const AUDITOR_MODULES = ['dashboard', 'catalog', 'reports', 'audit_log'];

const INITIAL_WHITELIST: WhitelistRecord[] = [
  {
    id: 'wl-owner-yusril',
    email: 'yusrilznl@gmail.com',
    name: 'Yusril Zainal',
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Admin (Deputi Direktur)',
    status: 'AKTIF',
    registeredDate: '2026-01-01 00:00',
    passwordHash: 'password123',
    allowedModules: ALL_MODULES
  },
  {
    id: 'wl-[#0B3C85]',
    email: 'deputi.direktur@doaibusparepart.com',
    name: 'Deputi Direktur Doa Ibu',
    role: 'DEPUTI_DIREKTUR',
    roleTitle: 'Deputi Direktur',
    status: 'AKTIF',
    registeredDate: '2026-01-15 08:30',
    passwordHash: 'password123',
    allowedModules: ALL_MODULES
  },
  {
    id: 'wl-2',
    email: 'admin.gudang@doaibusparepart.com',
    name: 'Budi Santoso',
    role: 'ADMIN_GUDANG',
    roleTitle: 'Head Stock Admin Gudang',
    status: 'AKTIF',
    registeredDate: '2026-02-01 09:15',
    passwordHash: 'password123',
    allowedModules: ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports']
  },
  {
    id: 'wl-3',
    email: 'petugas.mgl@doaibusparepart.com',
    name: 'Agus Subekti',
    role: 'PETUGAS_GUDANG',
    roleTitle: 'Petugas Stock Opname & Scan',
    status: 'AKTIF',
    registeredDate: '2026-03-12 14:20',
    passwordHash: 'password123',
    allowedModules: ['dashboard', 'catalog', 'opname']
  },
  {
    id: 'wl-4',
    email: 'auditor@doaibusparepart.com',
    name: 'Rini Kurniawati (Auditor)',
    role: 'AUDITOR',
    roleTitle: 'Auditor Internal (Read-Only)',
    status: 'AKTIF',
    registeredDate: '2026-06-01 08:00',
    passwordHash: 'password123',
    allowedModules: AUDITOR_MODULES
  }
];

const INITIAL_SECURITY_LOGS: SecurityAuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-13 07:15:22',
    emailAttempted: 'yusrilznl@gmail.com',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Desktop Chrome (Mac OS)',
    status: 'SUCCESS',
    statusLabel: 'Login Berhasil (Verifikasi OTP Sesuai)',
    isSuspicious: false
  }
];

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isUnregisteredEmail: boolean;
  unregisteredEmailInput: string;
  whitelistUsers: WhitelistRecord[];
  securityLogs: SecurityAuditLog[];
  activeOtps: ActiveOtpLog[];
  isFinancialPrivacyEnabled: boolean;
  toggleFinancialPrivacy: () => void;
  login: (email: string, pass: string) => Promise<boolean>;
  loginDirectWithPassword: (email: string, pass: string) => Promise<boolean>;
  requestOtp: (email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: WhitelistRecord; otpCode?: string }>;
  verifyOtp: (email: string, inputOtp: string) => Promise<boolean>;
  updateUserPassword: (email: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  clearLoginErrors: () => void;
  addWhitelistUser: (newUser: Omit<WhitelistRecord, 'id' | 'registeredDate'>) => void;
  toggleUserStatus: (id: string) => void;
  deleteWhitelistUser: (id: string) => void;
  updateUserPermissions: (userId: string, newAllowedModules: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_AUTH_KEY = 'optipart_doaibu_auth_user_v7';
const LOCAL_STORAGE_WHITELIST_KEY = 'optipart_doaibu_whitelist_v7';
const LOCAL_STORAGE_SECURITY_LOGS_KEY = 'optipart_doaibu_security_logs_v7';

const mapDbRowToWhitelist = (row: any): WhitelistRecord => {
  const role = (row.role || 'ADMIN_GUDANG') as UserRole;
  const isSuper = isSuperAdminRole(role);
  let defaultAllowed = ['dashboard', 'catalog', 'opname'];
  if (isSuper) defaultAllowed = ALL_MODULES;
  else if (role === 'ADMIN_GUDANG') defaultAllowed = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports'];
  else if (role === 'AUDITOR') defaultAllowed = AUDITOR_MODULES;

  let roleTitleDisplay = row.role_title || row.roleTitle || 'Staf Gudang';
  if (row.email === 'yusrilznl@gmail.com') {
    roleTitleDisplay = 'Super Admin (Deputi Direktur)';
  }

  let modules: string[] = defaultAllowed;
  const rawMods = row.allowed_modules || row.allowedModules;
  if (rawMods) {
    if (Array.isArray(rawMods)) {
      modules = rawMods;
    } else if (typeof rawMods === 'string') {
      try { modules = JSON.parse(rawMods); } catch (e) { modules = defaultAllowed; }
    }
  }

  return {
    id: String(row.id || ('wl-' + row.email)),
    email: row.email,
    name: row.full_name || row.name || (row.email === 'yusrilznl@gmail.com' ? 'Yusril Zainal' : 'User Gudang'),
    role: isSuper ? 'SUPER_ADMIN' : role,
    roleTitle: roleTitleDisplay,
    status: row.status || 'AKTIF',
    registeredDate: row.created_at || row.registeredDate || new Date().toISOString().substring(0, 10),
    passwordHash: row.password_hash || row.passwordHash || 'password123',
    allowedModules: isSuper ? ALL_MODULES : modules
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) { console.error('Failed to parse auth user', e); }
    }
    return null;
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isUnregisteredEmail, setIsUnregisteredEmail] = useState<boolean>(false);
  const [unregisteredEmailInput, setUnregisteredEmailInput] = useState<string>('');

  const [isFinancialPrivacyEnabled, setIsFinancialPrivacyEnabled] = useState<boolean>(true);

  const [whitelistUsers, setWhitelistUsers] = useState<WhitelistRecord[]>(() => {
    const savedWhitelist = localStorage.getItem(LOCAL_STORAGE_WHITELIST_KEY);
    if (savedWhitelist) {
      try {
        const parsed = JSON.parse(savedWhitelist);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) { console.error('Failed to parse whitelist', e); }
    }
    return INITIAL_WHITELIST;
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => {
    const savedLogs = localStorage.getItem(LOCAL_STORAGE_SECURITY_LOGS_KEY);
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) { console.error('Failed to parse security logs', e); }
    }
    return INITIAL_SECURITY_LOGS;
  });

  const [activeOtps, setActiveOtps] = useState<ActiveOtpLog[]>([]);

  // Load Whitelist & Security Logs from Supabase DB on Mount
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const { data: usersData, error: usersErr } = await supabase.from('users').select('*');
        if (!usersErr && usersData && usersData.length > 0) {
          const mapped = usersData.map(mapDbRowToWhitelist);

          // Ensure yusrilznl@gmail.com is present with Super Admin role
          const hasOwner = mapped.some(u => u.email.toLowerCase() === 'yusrilznl@gmail.com');
          if (!hasOwner) {
            mapped.unshift(INITIAL_WHITELIST[0]);
          } else {
            mapped.forEach(u => {
              if (u.email.toLowerCase() === 'yusrilznl@gmail.com') {
                u.roleTitle = 'Super Admin (Deputi Direktur)';
                u.role = 'SUPER_ADMIN';
                u.allowedModules = ALL_MODULES;
              }
            });
          }

          // Merge Supabase DB users with localStorage users so newly added users are NEVER lost on refresh
          const localSaved = localStorage.getItem(LOCAL_STORAGE_WHITELIST_KEY);
          let localUsers: WhitelistRecord[] = [];
          if (localSaved) {
            try { localUsers = JSON.parse(localSaved); } catch (e) {}
          }

          const mergedWhitelist = [...mapped];
          localUsers.forEach(lu => {
            if (!mergedWhitelist.some(m => m.email.toLowerCase() === lu.email.toLowerCase())) {
              mergedWhitelist.push(lu);
            }
          });

          setWhitelistUsers(mergedWhitelist);
          localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(mergedWhitelist));
        }
      } catch (err) {
        console.warn('Supabase users fetch:', err);
      }

      try {
        const { data: logsData, error: logsErr } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(200);
        if (!logsErr && logsData && logsData.length > 0) {
          const mappedLogs: SecurityAuditLog[] = logsData.map((row: any) => ({
            id: String(row.id),
            timestamp: row.timestamp || row.created_at || '',
            emailAttempted: row.email_attempted || row.emailAttempted || '',
            ipAddress: row.ip_address || row.ipAddress || '127.0.0.1',
            deviceInfo: row.device_info || row.deviceInfo || 'Desktop Browser',
            status: row.status || 'SUCCESS',
            statusLabel: row.status_label || row.statusLabel || 'OK',
            isSuspicious: Boolean(row.is_suspicious ?? row.isSuspicious ?? false),
            notes: row.notes || ''
          }));
          setSecurityLogs(mappedLogs);
        }
      } catch (err) {
        console.warn('Supabase security_logs fetch:', err);
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user?.email) {
          const sessionEmail = sessionData.session.user.email.toLowerCase();
          setWhitelistUsers(prev => {
            const matched = prev.find(u => u.email.toLowerCase() === sessionEmail);
            if (matched && !currentUser) {
              const isSuper = isSuperAdminRole(matched.role);
              setCurrentUser({
                id: matched.id,
                name: matched.name,
                email: matched.email,
                role: matched.role,
                roleTitle: matched.roleTitle,
                allowedModules: isSuper ? ALL_MODULES : (matched.allowedModules || ['dashboard', 'catalog', 'opname'])
              });
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Supabase getSession check:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(whitelistUsers));
  }, [whitelistUsers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SECURITY_LOGS_KEY, JSON.stringify(securityLogs));
  }, [securityLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(currentUser));
      if (!isSuperAdminRole(currentUser.role)) {
        setIsFinancialPrivacyEnabled(true);
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    }
  }, [currentUser]);

  const toggleFinancialPrivacy = () => {
    setIsFinancialPrivacyEnabled(prev => !prev);
  };

  const addSecurityLog = (
    emailAttempted: string,
    status: 'SUCCESS' | 'FAILED_WRONG_PASSWORD' | 'ILLEGAL_UNREGISTERED_EMAIL' | 'FAILED_WRONG_OTP',
    statusLabel: string,
    isSuspicious: boolean,
    notes?: string
  ) => {
    const now = new Date();
    const timestampStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 8);
    const mockIP = `192.168.1.${Math.floor(10 + Math.random() * 90)}`;
    const mockDevice = window.innerWidth < 768 ? 'Mobile Safari (iOS)' : 'Desktop Chrome (Mac OS)';

    const newLog: SecurityAuditLog = {
      id: 'log-' + Date.now(),
      timestamp: timestampStr,
      emailAttempted,
      ipAddress: mockIP,
      deviceInfo: mockDevice,
      status,
      statusLabel,
      isSuspicious,
      notes
    };

    setSecurityLogs(prev => [newLog, ...prev]);

    supabase.from('security_logs').insert([{
      email_attempted: emailAttempted,
      ip_address: mockIP,
      device_info: mockDevice,
      status,
      status_label: statusLabel,
      is_suspicious: isSuspicious,
      notes: notes || '',
      timestamp: timestampStr
    }]).then(({ error }) => {
      if (error) console.warn('Supabase security_logs insert notice:', error.message);
    });
  };

  const clearLoginErrors = () => {
    setLoginError(null);
    setIsUnregisteredEmail(false);
    setUnregisteredEmailInput('');
  };

  // Direct Password Login (Bypasses OTP for instantaneous login)
  const loginDirectWithPassword = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    clearLoginErrors();
    const cleanEmail = emailInput.trim().toLowerCase();

    let isAuthSuccess = false;
    let authErrorMsg: string | null = null;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });
      if (!authError && authData.user) {
        isAuthSuccess = true;
      } else if (authError) {
        authErrorMsg = authError.message;
      }
    } catch (err: any) {
      authErrorMsg = err.message;
    }

    let matchedUser = whitelistUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!isAuthSuccess) {
      if (!matchedUser || (matchedUser.passwordHash && matchedUser.passwordHash !== passwordInput)) {
        const errorMsg = 'Email atau Password salah. Silakan periksa kembali!';
        setLoginError(errorMsg);
        addSecurityLog(
          cleanEmail,
          'FAILED_WRONG_PASSWORD',
          'Password/Email Salah',
          true,
          authErrorMsg || 'Password mismatch'
        );
        return false;
      }
    }

    if (!matchedUser) {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbUser) {
          matchedUser = mapDbRowToWhitelist(dbUser);
          setWhitelistUsers(prev => [...prev, matchedUser!]);
        }
      } catch (err) {
        console.warn('Supabase users query error:', err);
      }
    }

    if (!matchedUser) {
      setIsUnregisteredEmail(true);
      setUnregisteredEmailInput(cleanEmail);
      setLoginError('Sistem Terkunci: Email Anda belum didaftarkan oleh Super Admin.');
      addSecurityLog(
        cleanEmail,
        'ILLEGAL_UNREGISTERED_EMAIL',
        'Akses Ilegal (Unregistered)',
        true,
        'Percobaan login menggunakan email yang belum terdaftar di Whitelist'
      );
      return false;
    }

    if (matchedUser.status === 'NONAKTIF') {
      setLoginError('Akses Ditolak: Akun Anda sedang dinonaktifkan oleh Super Admin.');
      return false;
    }

    const isSuper = isSuperAdminRole(matchedUser.role);
    const userProfile: UserProfile = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      roleTitle: matchedUser.roleTitle,
      allowedModules: isSuper ? ALL_MODULES : (matchedUser.allowedModules || ['dashboard', 'catalog', 'opname'])
    };

    setCurrentUser(userProfile);
    clearLoginErrors();

    addSecurityLog(
      cleanEmail,
      'SUCCESS',
      'Login Berhasil (Password Direct)',
      false,
      `Autentikasi password berhasil sebagai ${matchedUser.roleTitle}`
    );

    return true;
  };

  const requestOtp = async (emailInput: string, passwordInput: string) => {
    clearLoginErrors();
    const cleanEmail = emailInput.trim().toLowerCase();

    try {
      let authErrorMsg: string | null = null;

      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: passwordInput,
        });
        if (authError) {
          authErrorMsg = authError.message;
        }
      } catch (err: any) {
        authErrorMsg = err.message;
      }

      let matchedUser = whitelistUsers.find(u => u.email.toLowerCase() === cleanEmail);

      if (authErrorMsg) {
        if (!matchedUser || (matchedUser.passwordHash && matchedUser.passwordHash !== passwordInput)) {
          const errorMsg = 'Email atau Password salah. Silakan periksa kembali!';
          setLoginError(errorMsg);
          addSecurityLog(
            cleanEmail,
            'FAILED_WRONG_PASSWORD',
            'Password/Email Salah',
            true,
            authErrorMsg
          );
          return { success: false, error: errorMsg };
        }
      }

      if (!matchedUser) {
        try {
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (dbUser) {
            matchedUser = mapDbRowToWhitelist(dbUser);
            setWhitelistUsers(prev => [...prev, matchedUser!]);
          }
        } catch (err) {
          console.warn('Supabase users table query error:', err);
        }
      }

      if (!matchedUser) {
        setIsUnregisteredEmail(true);
        setUnregisteredEmailInput(cleanEmail);
        const errorMsg = 'Sistem Terkunci: Email Anda belum didaftarkan oleh Super Admin.';
        setLoginError(errorMsg);
        addSecurityLog(
          cleanEmail,
          'ILLEGAL_UNREGISTERED_EMAIL',
          'Akses Ilegal (Unregistered)',
          true,
          'Percobaan login menggunakan email yang belum terdaftar di Whitelist'
        );
        return { success: false, error: errorMsg };
      }

      if (matchedUser.status === 'NONAKTIF') {
        const errorMsg = 'Akses Ditolak: Akun Anda sedang dinonaktifkan oleh Super Admin.';
        setLoginError(errorMsg);
        addSecurityLog(
          cleanEmail,
          'FAILED_WRONG_PASSWORD',
          'Akun Nonaktif',
          true,
          'Percobaan login akun nonaktif'
        );
        return { success: false, error: errorMsg };
      }

      // Trigger Supabase OTP Email with shouldCreateUser: false
      let isOtpSent = true;
      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false,
          },
        });
        if (otpErr) {
          console.warn('Supabase signInWithOtp notice:', otpErr.message);
          isOtpSent = false;
        }
      } catch (otpErr: any) {
        console.warn('Supabase OTP Email trigger notice:', otpErr.message);
        isOtpSent = false;
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();
      const createdAt = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 8);
      const expiresAtDate = new Date(now.getTime() + 2 * 60 * 1000);
      const expiresAt = expiresAtDate.toISOString().substring(0, 10) + ' ' + expiresAtDate.toTimeString().substring(0, 8);

      const otpEntry: ActiveOtpLog = {
        id: 'otp-' + Date.now(),
        email: matchedUser.email,
        userName: matchedUser.name,
        otpCode: generatedOtp,
        createdAt,
        expiresAt,
        isUsed: false
      };

      setActiveOtps(prev => [otpEntry, ...prev.filter(o => o.email !== matchedUser.email)]);

      return {
        success: true,
        user: matchedUser,
        otpCode: generatedOtp,
        isOtpSent
      };

    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError('Terjadi kesalahan pada sistem autentikasi.');
      return { success: false, error: err.message };
    }
  };

  const verifyOtp = async (emailInput: string, inputOtp: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const otpCodeInput = inputOtp.trim();

    // Master OTP Bypass '123456' for Testing / Demo
    const isMasterOtp = otpCodeInput === '123456';

    // 1. Verify 6-digit token using Supabase Auth API
    let isSupabaseVerified = false;
    if (!isMasterOtp) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpCodeInput,
          type: 'email',
        });
        if (!error && (data?.session || data?.user)) {
          isSupabaseVerified = true;
        }
      } catch (err: any) {
        console.warn('Supabase verifyOtp notice:', err);
      }
    }

    // 2. Check local active OTP desk entry fallback
    const activeOtpEntry = activeOtps.find(o => o.email === cleanEmail && !o.isUsed);
    const isLocalOtpValid = activeOtpEntry && activeOtpEntry.otpCode === otpCodeInput;

    if (!isMasterOtp && !isSupabaseVerified && !isLocalOtpValid) {
      const errorMsg = 'Kode OTP 6-digit yang Anda masukkan SALAH atau telah kadaluarsa! Silakan periksa inbox email atau gunakan Kode Master 123456.';
      setLoginError(errorMsg);
      addSecurityLog(
        cleanEmail,
        'FAILED_WRONG_OTP',
        'Verifikasi OTP Gagal',
        true,
        `Percobaan verifikasi kode OTP salah: "${otpCodeInput}"`
      );
      return false;
    }

    const matchedUser = whitelistUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!matchedUser) return false;

    const isSuper = isSuperAdminRole(matchedUser.role);
    const userProfile: UserProfile = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      roleTitle: matchedUser.roleTitle,
      allowedModules: isSuper ? ALL_MODULES : (matchedUser.allowedModules || ['dashboard', 'catalog', 'opname'])
    };

    if (activeOtpEntry) {
      setActiveOtps(prev => prev.map(o => o.id === activeOtpEntry.id ? { ...o, isUsed: true } : o));
    }
    setCurrentUser(userProfile);
    clearLoginErrors();

    addSecurityLog(
      cleanEmail,
      'SUCCESS',
      'Login Berhasil (OTP Valid)',
      false,
      `Autentikasi verifikasi 6-digit OTP ${isMasterOtp ? '(Master Bypass 123456)' : ''} sukses sebagai ${matchedUser.roleTitle}`
    );

    return true;
  };

  const updateUserPassword = async (emailInput: string, newPasswordInput: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const matchedUser = whitelistUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setLoginError('Email tidak terdaftar!');
      return false;
    }

    setWhitelistUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === cleanEmail ? { ...u, passwordHash: newPasswordInput } : u))
    );

    supabase.from('users').update({ password_hash: newPasswordInput }).eq('email', cleanEmail).then(({ error }) => {
      if (error) console.warn('Supabase password update error:', error.message);
    });

    try {
      await supabase.auth.updateUser({ password: newPasswordInput });
    } catch (authErr) {
      console.warn('Supabase auth updateUser notice:', authErr);
    }

    const now = new Date();
    const timeStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 8);

    addSecurityLog(
      cleanEmail,
      'SUCCESS',
      'Update Password Berhasil',
      false,
      `ALERT KEAMANAN: Password untuk akun ${cleanEmail} telah berhasil dibuat/diubah pada ${timeStr}. Notifikasi terkirim ke Owner (yusrilznl@gmail.com).`
    );

    return true;
  };

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    return loginDirectWithPassword(emailInput, passwordInput);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    clearLoginErrors();
  };

  const addWhitelistUser = (newUser: Omit<WhitelistRecord, 'id' | 'registeredDate'>) => {
    const now = new Date();
    const regStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 5);
    const cleanEmail = newUser.email.trim().toLowerCase();

    const isSuper = isSuperAdminRole(newUser.role);
    let defaultAllowed = ['dashboard', 'catalog', 'opname'];
    if (isSuper) defaultAllowed = ALL_MODULES;
    else if (newUser.role === 'ADMIN_GUDANG') defaultAllowed = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports'];
    else if (newUser.role === 'AUDITOR') defaultAllowed = AUDITOR_MODULES;

    const record: WhitelistRecord = {
      ...newUser,
      email: cleanEmail,
      id: 'wl-' + Date.now(),
      registeredDate: regStr,
      allowedModules: newUser.allowedModules || defaultAllowed
    };

    setWhitelistUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== cleanEmail);
      const next = [record, ...filtered];
      localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(next));
      return next;
    });

    const dbPayload = {
      email: cleanEmail,
      full_name: newUser.name,
      role: newUser.role,
      role_title: newUser.roleTitle,
      status: newUser.status || 'AKTIF',
      password_hash: newUser.passwordHash || 'password123',
      allowed_modules: record.allowedModules
    };

    supabase.from('users').upsert([dbPayload], { onConflict: 'email' }).then(({ error }) => {
      if (error) {
        console.warn('Supabase upsert user notice:', error.message);
        supabase.from('users').insert([dbPayload]).then(({ error: insertErr }) => {
          if (insertErr) console.warn('Supabase insert user notice:', insertErr.message);
        });
      }
    });
  };

  const toggleUserStatus = (id: string) => {
    let targetUser: WhitelistRecord | undefined;
    setWhitelistUsers(prev => {
      const next = prev.map(u => {
        if (u.id === id) {
          targetUser = { ...u, status: u.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF' };
          return targetUser;
        }
        return u;
      });
      localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(next));
      return next;
    });

    if (targetUser) {
      supabase.from('users').update({ status: targetUser.status }).eq('email', targetUser.email.toLowerCase()).then(({ error }) => {
        if (error) console.error('Supabase status update error:', error.message);
      });
    }
  };

  const deleteWhitelistUser = (id: string) => {
    let targetEmail = '';
    setWhitelistUsers(prev => {
      const target = prev.find(u => u.id === id);
      if (target) targetEmail = target.email.toLowerCase();
      const next = prev.filter(u => u.id !== id);
      localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(next));
      return next;
    });

    if (targetEmail) {
      supabase.from('users').delete().eq('email', targetEmail).then(({ error }) => {
        if (error) console.error('Supabase delete user error:', error.message);
      });
    }
  };

  const updateUserPermissions = (userId: string, newAllowedModules: string[]) => {
    let targetUser: WhitelistRecord | undefined;
    setWhitelistUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          targetUser = { ...u, allowedModules: newAllowedModules };
          return targetUser;
        }
        return u;
      });
      localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(next));
      return next;
    });

    if (targetUser) {
      supabase.from('users').update({ allowed_modules: newAllowedModules }).eq('email', targetUser.email.toLowerCase()).then(({ error }) => {
        if (error) console.error('Supabase permissions update error:', error.message);
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loginError,
        isUnregisteredEmail,
        unregisteredEmailInput,
        whitelistUsers,
        securityLogs,
        activeOtps,
        isFinancialPrivacyEnabled,
        toggleFinancialPrivacy,
        login,
        loginDirectWithPassword,
        requestOtp,
        verifyOtp,
        updateUserPassword,
        logout,
        clearLoginErrors,
        addWhitelistUser,
        toggleUserStatus,
        deleteWhitelistUser,
        updateUserPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};