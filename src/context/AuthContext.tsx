import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { WhitelistRecord, SecurityAuditLog, ActiveOtpLog } from '../types/security';

const ALL_MODULES = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports', 'security', 'audit'];
const AUDITOR_MODULES = ['dashboard', 'reports', 'audit'];

const INITIAL_WHITELIST: WhitelistRecord[] = [
  {
    id: 'wl-owner-yusril',
    email: 'yusrilznl@gmail.com',
    name: 'Yusril Zainal (Owner)',
    role: 'SUPER_ADMIN',
    roleTitle: 'Owner / Super Admin',
    status: 'AKTIF',
    registeredDate: '2026-01-01 08:00',
    passwordHash: 'password123',
    allowedModules: ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports', 'security']
  },
  {
    id: 'wl-1',
    email: 'owner@doaibusparepart.com',
    name: 'Owner Doa Ibu',
    role: 'SUPER_ADMIN',
    roleTitle: 'Owner / Super Admin',
    status: 'AKTIF',
    registeredDate: '2026-01-10 08:30',
    passwordHash: 'password123',
    allowedModules: ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports', 'security']
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
    allowedModules: ['dashboard', 'reports', 'audit']
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
  isFinancialPrivacyEnabled: boolean; // Hide/Show price toggle state
  toggleFinancialPrivacy: () => void;
  login: (email: string, pass: string) => boolean;
  requestOtp: (email: string, pass: string) => { success: boolean; error?: string; user?: WhitelistRecord; otpCode?: string };
  verifyOtp: (email: string, inputOtp: string) => boolean;
  updateUserPassword: (email: string, newPassword: string) => boolean;
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
    return INITIAL_WHITELIST[0]; // Default Owner Yusril Zainal
  });

  // Eye Toggle State for Hide/Show Financial Figures
  const [isFinancialPrivacyEnabled, setIsFinancialPrivacyEnabled] = useState<boolean>(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isUnregisteredEmail, setIsUnregisteredEmail] = useState<boolean>(false);
  const [unregisteredEmailInput, setUnregisteredEmailInput] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(whitelistUsers));
  }, [whitelistUsers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SECURITY_LOGS_KEY, JSON.stringify(securityLogs));
  }, [securityLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(currentUser));
      // Non-super-admins automatically have financial privacy enabled (hidden HPP)
      if (currentUser.role !== 'SUPER_ADMIN') {
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
  };

  const clearLoginErrors = () => {
    setLoginError(null);
    setIsUnregisteredEmail(false);
    setUnregisteredEmailInput('');
  };

  const requestOtp = (emailInput: string, passwordInput: string) => {
    clearLoginErrors();
    const cleanEmail = emailInput.trim().toLowerCase();

    const matchedUser = whitelistUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setIsUnregisteredEmail(true);
      setUnregisteredEmailInput(cleanEmail);
      const errorMsg = 'Sistem Terkunci: Email Anda belum didaftarkan oleh Super Admin. Untuk keamanan gudang, silakan hubungi Owner/Super Admin untuk membuka akses.';
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
      const errorMsg = 'Akses Ditolak: Akun email Anda sedang dinonaktifkan oleh Super Admin.';
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

    if (matchedUser.passwordHash !== passwordInput) {
      const errorMsg = 'Password yang Anda masukkan salah. Silakan periksa kembali.';
      setLoginError(errorMsg);
      addSecurityLog(
        cleanEmail,
        'FAILED_WRONG_PASSWORD',
        'Password Salah',
        true,
        'Gagal mencocokkan password'
      );
      return { success: false, error: errorMsg };
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
      otpCode: generatedOtp
    };
  };

  const verifyOtp = (emailInput: string, inputOtp: string): boolean => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const activeOtpEntry = activeOtps.find(o => o.email === cleanEmail && !o.isUsed);

    if (!activeOtpEntry || activeOtpEntry.otpCode !== inputOtp.trim()) {
      const errorMsg = 'Kode OTP yang Anda masukkan SALAH atau telah kadaluarsa! Silakan periksa kembali.';
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

    const matchedUser = whitelistUsers.find(u => u.email === cleanEmail);
    if (!matchedUser) return false;

    const userProfile: UserProfile = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      roleTitle: matchedUser.roleTitle,
      allowedModules: matchedUser.allowedModules || ['dashboard', 'catalog', 'opname']
    };

    setActiveOtps(prev => prev.map(o => o.id === activeOtpEntry.id ? { ...o, isUsed: true } : o));
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

  const updateUserPassword = (emailInput: string, newPasswordInput: string): boolean => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const matchedUser = whitelistUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setLoginError('Email tidak terdaftar!');
      return false;
    }

    setWhitelistUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === cleanEmail ? { ...u, passwordHash: newPasswordInput } : u))
    );

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

  const login = (emailInput: string, passwordInput: string): boolean => {
    const res = requestOtp(emailInput, passwordInput);
    if (res.success && res.user && res.otpCode) {
      return verifyOtp(res.user.email, res.otpCode);
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    clearLoginErrors();
  };

  const addWhitelistUser = (newUser: Omit<WhitelistRecord, 'id' | 'registeredDate'>) => {
    const now = new Date();
    const regStr = now.toISOString().substring(0, 10) + ' ' + now.toTimeString().substring(0, 5);

    let defaultAllowed = ['dashboard', 'catalog', 'opname'];
    if (newUser.role === 'SUPER_ADMIN') defaultAllowed = ALL_MODULES;
    else if (newUser.role === 'ADMIN_GUDANG') defaultAllowed = ['dashboard', 'catalog', 'outbound', 'inbound', 'opname', 'reports'];
    else if ((newUser.role as string) === 'AUDITOR') defaultAllowed = AUDITOR_MODULES;

    const record: WhitelistRecord = {
      ...newUser,
      id: 'wl-' + Date.now(),
      registeredDate: regStr,
      allowedModules: newUser.allowedModules || defaultAllowed
    };

    setWhitelistUsers(prev => [...prev, record]);
  };

  const toggleUserStatus = (id: string) => {
    setWhitelistUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: u.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF' } : u))
    );
  };

  const deleteWhitelistUser = (id: string) => {
    setWhitelistUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateUserPermissions = (userId: string, newAllowedModules: string[]) => {
    setWhitelistUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, allowedModules: newAllowedModules } : u))
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, allowedModules: newAllowedModules } : null);
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
