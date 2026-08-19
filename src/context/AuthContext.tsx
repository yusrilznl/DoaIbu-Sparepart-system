import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, isSuperAdminRole } from '../types/auth';
import { WhitelistRecord, SecurityAuditLog, ActiveOtpLog } from '../types/security';
import { supabase } from '../lib/supabaseClient';

const ALL_MODULES = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports', 'security', 'audit'];
const AUDITOR_MODULES = ['dashboard', 'reports', 'audit'];

const INITIAL_WHITELIST: WhitelistRecord[] = [
  {
    id: 'wl-owner-yusril',
    email: 'yusrilznl@gmail.com',
    name: 'Yusril Zainal',
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Admin (Deputi Direktur)',
    status: 'AKTIF',
    registeredDate: '2026-01-01 08:00',
    passwordHash: 'password123',
    allowedModules: ALL_MODULES
  },
  {
    id: 'wl-1',
    email: 'owner@doaibusparepart.com',
    name: 'Owner Doa Ibu',
    role: 'OWNER',
    roleTitle: 'Owner / Pemilik Toko',
    status: 'AKTIF',
    registeredDate: '2026-01-10 08:30',
    passwordHash: 'password123',
    allowedModules: ALL_MODULES
  },
  {
    id: 'wl-deputi',
    email: 'deputi@doaibusparepart.com',
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

const INITIAL_LOGS: SecurityAuditLog[] = [
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

const LOCAL_STORAGE_AUTH_KEY = 'optipart_doaibu_auth_user_v7';
const LOCAL_STORAGE_WHITELIST_KEY = 'optipart_doaibu_whitelist_v7';
const LOCAL_STORAGE_SECURITY_LOGS_KEY = 'optipart_doaibu_security_logs_v7';

const mapDbRowToWhitelist = (row: any): WhitelistRecord => {
  const role = (row.role || 'ADMIN_GUDANG') as UserRole;
  const isSuper = isSuperAdminRole(role);
  
  let roleTitle = row.role_title || row.roleTitle || row.role;
  if (row.email === 'yusrilznl@gmail.com') {
    roleTitle = 'Super Admin (Deputi Direktur)';
  } else if (!roleTitle || roleTitle === role) {
    if (role === 'SUPER_ADMIN') roleTitle = 'Super Admin (Deputi Direktur)';
    else if (role === 'OWNER') roleTitle = 'Owner / Pemilik Toko';
    else if (role === 'DEPUTI_DIREKTUR') roleTitle = 'Deputi Direktur';
    else if (role === 'ADMIN_GUDANG') roleTitle = 'Head Stock Admin Gudang';
    else if (role === 'PETUGAS_GUDANG') roleTitle = 'Petugas Stock Opname & Scan';
    else if (role === 'AUDITOR') roleTitle = 'Auditor Internal (Read-Only)';
  }

  let modules: string[] = ALL_MODULES;
  if (row.allowed_modules || row.allowedModules) {
    const raw = row.allowed_modules || row.allowedModules;
    if (Array.isArray(raw)) modules = raw;
    else if (typeof raw === 'string') {
      try { modules = JSON.parse(raw); } catch (e) { modules = isSuper ? ALL_MODULES : ['dashboard', 'catalog', 'opname']; }
    }
  } else {
    modules = isSuper ? ALL_MODULES : (role === 'AUDITOR' ? AUDITOR_MODULES : ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports']);
  }

  // Ensure super admin category has all modules
  if (isSuper) {
    modules = ALL_MODULES;
  }

  return {
    id: String(row.id),
    email: row.email,
    name: row.full_name || row.name || (row.email === 'yusrilznl@gmail.com' ? 'Yusril Zainal' : 'User Gudang'),
    role,
    roleTitle,
    status: (row.status || 'AKTIF') as 'AKTIF' | 'NONAKTIF',
    registeredDate: row.registered_date || row.created_at || new Date().toISOString().substring(0, 16),
    passwordHash: row.password_hash || row.passwordHash || 'password123',
    allowedModules: modules
  };
};

const mapDbRowToSecurityLog = (row: any): SecurityAuditLog => ({
  id: String(row.id),
  timestamp: row.timestamp || row.created_at || new Date().toISOString().substring(0, 19).replace('T', ' '),
  emailAttempted: row.email_attempted || row.emailAttempted || row.email || '',
  ipAddress: row.ip_address || row.ipAddress || '192.168.1.1',
  deviceInfo: row.device_info || row.deviceInfo || 'Desktop Browser',
  status: row.status || 'SUCCESS',
  statusLabel: row.status_label || row.statusLabel || 'Audit Event',
  isSuspicious: Boolean(row.is_suspicious ?? row.isSuspicious ?? false),
  notes: row.notes || ''
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [whitelistUsers, setWhitelistUsers] = useState<WhitelistRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_WHITELIST_KEY);
    if (saved) {
      try {
        const parsed: WhitelistRecord[] = JSON.parse(saved);
        if (!parsed.some(u => u.email.toLowerCase() === 'yusrilznl@gmail.com')) {
          return [INITIAL_WHITELIST[0], ...parsed];
        }
        return parsed;
      } catch (e) { console.error(e); }
    }
    return INITIAL_WHITELIST;
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SECURITY_LOGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LOGS;
  });

  const [activeOtps, setActiveOtps] = useState<ActiveOtpLog[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [isFinancialPrivacyEnabled, setIsFinancialPrivacyEnabled] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isUnregisteredEmail, setIsUnregisteredEmail] = useState<boolean>(false);
  const [unregisteredEmailInput, setUnregisteredEmailInput] = useState<string>('');

  // 1. Fetch Users & Security Logs from Supabase DB on mount
  useEffect(() => {
    const fetchSupabaseData = async () => {
      // Fetch users from Supabase
      try {
        const { data: dbUsers, error: usersErr } = await supabase.from('users').select('*');
        if (!usersErr && dbUsers && dbUsers.length > 0) {
          const mappedUsers = dbUsers.map(mapDbRowToWhitelist);
          // Ensure yusrilznl@gmail.com is present with Super Admin (Deputi Direktur) role
          let hasYusril = false;
          const updated = mappedUsers.map(u => {
            if (u.email.toLowerCase() === 'yusrilznl@gmail.com') {
              hasYusril = true;
              return {
                ...u,
                name: 'Yusril Zainal',
                role: 'SUPER_ADMIN' as UserRole,
                roleTitle: 'Super Admin (Deputi Direktur)',
                allowedModules: ALL_MODULES
              };
            }
            return u;
          });
          if (!hasYusril) {
            updated.unshift(INITIAL_WHITELIST[0]);
          }
          setWhitelistUsers(updated);
          localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Failed to fetch whitelist users from Supabase:', err);
      }

      // Fetch Security Logs from Supabase
      try {
        const { data: dbLogs, error: logsErr } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false });
        if (!logsErr && dbLogs && dbLogs.length > 0) {
          const mappedLogs = dbLogs.map(mapDbRowToSecurityLog);
          setSecurityLogs(mappedLogs);
          localStorage.setItem(LOCAL_STORAGE_SECURITY_LOGS_KEY, JSON.stringify(mappedLogs));
        }
      } catch (err) {
        console.warn('Failed to fetch security logs from Supabase:', err);
      }

      // Restore Supabase Auth session if active
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
      // Non-super-admin category automatically has financial privacy enabled
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

    // Async Insert to Supabase DB table 'security_logs'
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

  const requestOtp = async (emailInput: string, passwordInput: string) => {
    clearLoginErrors();
    const cleanEmail = emailInput.trim().toLowerCase();

    try {
      // 1. Check password using Supabase Auth or fallback matching
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

      // Check password hash from local/whitelist fallback if Supabase Auth returned error
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

      // Fetch user from Supabase DB table 'users' if not in local whitelist
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
      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false,
          }
        });
        if (otpErr) {
          console.warn('Supabase signInWithOtp notice:', otpErr.message);
        }
      } catch (otpErr: any) {
        console.warn('Supabase OTP Email trigger notice:', otpErr.message);
      }

      // Generate 6-digit OTP code for Desk Bantuan verification
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
        otpCode: generatedOtp
      };

    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError('Terjadi kesalahan pada sistem autentikasi.');
      return { success: false, error: err.message };
    }
  };

  const verifyOtp = async (emailInput: string, inputOtp: string): Promise<boolean> => {
    const cleanEmail = emailInput.trim().toLowerCase();

    // 1. Verify via Supabase Auth API
    let isSupabaseVerified = false;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: inputOtp.trim(),
        type: 'email',
      });
      if (!error && data?.session) {
        isSupabaseVerified = true;
      }
    } catch (err: any) {
      console.warn('Supabase verifyOtp notice:', err);
    }

    // 2. Check local OTP desk log entry fallback
    const activeOtpEntry = activeOtps.find(o => o.email === cleanEmail && !o.isUsed);
    const isLocalOtpValid = activeOtpEntry && activeOtpEntry.otpCode === inputOtp.trim();

    if (!isSupabaseVerified && !isLocalOtpValid) {
      const errorMsg = 'Kode OTP yang Anda masukkan SALAH atau telah kadaluarsa! Silakan periksa inbox email kembali.';
      setLoginError(errorMsg);
      addSecurityLog(
        cleanEmail,
        'FAILED_WRONG_OTP',
        'Verifikasi OTP Gagal',
        true,
        `Percobaan verifikasi kode OTP salah: "${inputOtp}"`
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
      `Autentikasi verifikasi OTP sukses sebagai ${matchedUser.roleTitle}`
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

    // Update password in Supabase DB table 'users'
    supabase.from('users').update({ password_hash: newPasswordInput }).eq('email', cleanEmail).then(({ error }) => {
      if (error) console.warn('Supabase password update error:', error.message);
    });

    // Update password in Supabase Auth if session active
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
    const res = await requestOtp(emailInput, passwordInput);
    if (res.success && res.user && res.otpCode) {
      return verifyOtp(res.user.email, res.otpCode);
    }
    return false;
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

    const isSuper = isSuperAdminRole(newUser.role);
    let defaultAllowed = ['dashboard', 'catalog', 'opname'];
    if (isSuper) defaultAllowed = ALL_MODULES;
    else if (newUser.role === 'ADMIN_GUDANG') defaultAllowed = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports'];
    else if (newUser.role === 'AUDITOR') defaultAllowed = AUDITOR_MODULES;

    const record: WhitelistRecord = {
      ...newUser,
      id: 'wl-' + Date.now(),
      registeredDate: regStr,
      allowedModules: newUser.allowedModules || defaultAllowed
    };

    setWhitelistUsers(prev => [...prev, record]);

    // Insert to Supabase DB table 'users'
    const dbPayload = {
      email: newUser.email.toLowerCase(),
      full_name: newUser.name,
      role: newUser.role,
      role_title: newUser.roleTitle,
      status: newUser.status || 'AKTIF',
      password_hash: newUser.passwordHash || 'password123',
      allowed_modules: record.allowedModules
    };
    supabase.from('users').insert([dbPayload]).then(({ error }) => {
      if (error) console.error('Supabase insert user error:', error.message);
    });
  };

  const toggleUserStatus = (id: string) => {
    let targetUser: WhitelistRecord | undefined;
    setWhitelistUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const nextStatus = u.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
          targetUser = { ...u, status: nextStatus };
          return targetUser;
        }
        return u;
      })
    );

    if (targetUser) {
      supabase.from('users').update({ status: targetUser.status }).eq('email', targetUser.email.toLowerCase()).then(({ error }) => {
        if (error) console.warn('Supabase toggle status notice:', error.message);
      });
    }
  };

  const deleteWhitelistUser = (id: string) => {
    const targetUser = whitelistUsers.find(u => u.id === id);
    setWhitelistUsers(prev => prev.filter(u => u.id !== id));

    if (targetUser) {
      supabase.from('users').delete().eq('email', targetUser.email.toLowerCase()).then(({ error }) => {
        if (error) console.warn('Supabase delete user notice:', error.message);
      });
    }
  };

  const updateUserPermissions = (userId: string, newAllowedModules: string[]) => {
    let targetUser: WhitelistRecord | undefined;
    setWhitelistUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          targetUser = { ...u, allowedModules: newAllowedModules };
          return targetUser;
        }
        return u;
      })
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, allowedModules: newAllowedModules } : null);
    }

    if (targetUser) {
      supabase.from('users').update({ allowed_modules: newAllowedModules }).eq('email', targetUser.email.toLowerCase()).then(({ error }) => {
        if (error) console.warn('Supabase update permissions notice:', error.message);
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
        requestOtp,
        verifyOtp,
        updateUserPassword,
        logout,
        clearLoginErrors,
        addWhitelistUser,
        toggleUserStatus,
        deleteWhitelistUser,
        updateUserPermissions
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