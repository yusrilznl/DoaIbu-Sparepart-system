import { UserRole } from './auth';

export interface WhitelistRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  status: 'AKTIF' | 'NONAKTIF';
  registeredDate: string;
  passwordHash?: string;
  allowedModules?: string[];
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  emailAttempted: string;
  ipAddress: string;
  deviceInfo: string;
  status: 'SUCCESS' | 'FAILED_WRONG_PASSWORD' | 'ILLEGAL_UNREGISTERED_EMAIL' | 'FAILED_WRONG_OTP';
  statusLabel: string;
  isSuspicious: boolean;
  notes?: string;
}

export interface ActiveOtpLog {
  id: string;
  email: string;
  userName: string;
  otpCode: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}
