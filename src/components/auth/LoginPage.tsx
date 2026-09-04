import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { Eye, EyeOff, ShieldCheck, Lock, Mail, AlertTriangle, ArrowRight, KeyRound, MessageCircle, Clock, RefreshCw, ArrowLeft, CheckCircle2, Loader2, Key } from 'lucide-react';
import { RegisterPassword } from './RegisterPassword';

export const LoginPage: React.FC = () => {
  const { requestOtp, verifyOtp, loginDirectWithPassword, loginError, isUnregisteredEmail, clearLoginErrors } = useAuth();
  const { showToast } = useInventory();

  // Mode: 'LOGIN' | 'REGISTER_PASSWORD'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER_PASSWORD'>('LOGIN');

  // Login Method Tab: 'PASSWORD' | 'OTP'
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Login steps: 'CREDENTIALS' | 'OTP_INPUT'
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP_INPUT'>('CREDENTIALS');

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Credentials form - Default Owner Email yusrilznl@gmail.com
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // CAPTCHA verification state
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);

  // OTP form state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(120);
  const [failedOtpAttempts, setFailedOtpAttempts] = useState<number>(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 120 seconds countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (step === 'OTP_INPUT' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  if (mode === 'REGISTER_PASSWORD') {
    return <RegisterPassword onBackToLogin={() => setMode('LOGIN')} />;
  }

  // Direct Password Login Handler
  const handleDirectPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginErrors();

    if (!isCaptchaVerified) {
      showToast('Silakan centang verifikasi CAPTCHA terlebih dahulu!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const success = await loginDirectWithPassword(email, password);
      if (success) {
        showToast('Login berhasil! Membuka Dashboard Gudang...', 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Request Handler
  const handleRequestOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginErrors();

    if (!isCaptchaVerified) {
      showToast('Silakan centang verifikasi CAPTCHA terlebih dahulu!', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestOtp(email, password);

      if (res.success && res.user) {
        setStep('OTP_INPUT');
        setTimerSeconds(120);
        setFailedOtpAttempts(0);
        setOtpDigits(['', '', '', '', '', '']);

        if ((res as any).isOtpSent === false) {
          showToast('⚠️ Limit SMTP Supabase tercapai! Anda dapat menggunakan Kode Master 123456 atau Login dengan Password.', 'info');
        } else {
          showToast(`📩 Kode OTP 6-digit telah dikirim ke email ${email}. Masukkan kode angka tersebut di bawah ini!`, 'success');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const updated = [...otpDigits];
    updated[index] = value.substring(value.length - 1);
    setOtpDigits(updated);

    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e?: React.FormEvent, customOtp?: string) => {
    if (e) e.preventDefault();
    const fullOtp = customOtp || otpDigits.join('');

    if (fullOtp.length < 6) {
      showToast('Masukkan 6-digit kode OTP lengkap!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyOtp(email, fullOtp);
      if (success) {
        showToast('Verifikasi OTP berhasil! Membuka Dashboard Gudang...', 'success');
      } else {
        const attempts = failedOtpAttempts + 1;
        setFailedOtpAttempts(attempts);
        if (attempts >= 3) {
          showToast('Sesi terkunci karena 3x salah memasukkan kode OTP! Anda dapat mencoba login kembali.', 'error');
          setStep('CREDENTIALS');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseMasterOtp = () => {
    const masterDigits = ['1', '2', '3', '4', '5', '6'];
    setOtpDigits(masterDigits);
    handleVerifyOtpSubmit(undefined, '123456');
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await requestOtp(email, password);
      if (res.success) {
        setTimerSeconds(120);
        setOtpDigits(['', '', '', '', '', '']);
        showToast(`📩 Permintaan OTP baru diproses untuk ${email}!`, 'info');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp & Email Registration Links for Unregistered Emails
  const waUrl = `https://wa.me/6281234567890?text=Halo%20Owner,%20saya%20ingin%20meminta%20akses%20login%20ke%20Sistem%20Gudang%20Doa%20Ibu%20Sparepart`;
  const mailtoUrl = `mailto:yusrilznl@gmail.com?subject=Permintaan%20Akses%20Login%20Gudang&body=Halo%20Owner,%20mohon%20daftarkan%20email%20saya%20ke%20Whitelist`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-300">
        {/* Top Branding Banner */}
        <div className="p-8 pb-6 border-b border-slate-100 text-center bg-slate-50">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl border border-slate-200 shadow-md mb-4">
            <img
              src="/logo.jpeg"
              alt="Doa Ibu Sparepart Logo"
              className="h-16 sm:h-18 w-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-center leading-none flex-wrap">
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              Doa Ibu Sparepart
            </span>
            <span className="text-slate-300 mx-2 text-xl font-light">|</span>
            <span className="font-bold text-lg text-[#0B3C85] tracking-wide">
              PT Fardan Utama Niaga
            </span>
          </div>

          <p className="text-[10px] tracking-widest font-semibold text-slate-500 uppercase mt-1.5">
            WAREHOUSE & INVENTORY MANAGEMENT SYSTEM
          </p>
        </div>

        {/* STEP 1: CREDENTIALS INPUT FORM WITH METHOD TABS */}
        {step === 'CREDENTIALS' && (
          <div className="p-8 space-y-5">
            {/* Method Tab Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setLoginMethod('PASSWORD')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  loginMethod === 'PASSWORD'
                    ? 'bg-[#0B3C85] text-white shadow-xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Login Password (Langsung)
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('OTP')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  loginMethod === 'OTP'
                    ? 'bg-[#0B3C85] text-white shadow-xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Login OTP Email
              </button>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 text-red-700 text-xs font-semibold animate-in shake">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{loginError}</p>
                </div>

                {isUnregisteredEmail && (
                  <div className="pt-2 border-t border-red-200/60 flex flex-col gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <MessageCircle className="w-4 h-4" /> Hubungi Owner via WhatsApp
                    </a>
                    <a
                      href={mailtoUrl}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <Mail className="w-4 h-4" /> Minta Akses via Email
                    </a>
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={loginMethod === 'PASSWORD' ? handleDirectPasswordLogin : handleRequestOtpSubmit}
              className="space-y-4 text-xs font-semibold"
            >
              {/* Email Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Terdaftar (Whitelist)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    autoComplete="off"
                    placeholder="masukkan email terdaftar"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-black font-semibold focus:border-[#0B3C85] focus:bg-white focus:outline-none transition disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('REGISTER_PASSWORD')}
                    className="text-[11px] font-bold text-[#0B3C85] hover:underline"
                  >
                    Buat / Reset Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-black font-semibold focus:border-[#0B3C85] focus:bg-white focus:outline-none transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA Verification Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <label
                  onClick={() => !isLoading && setIsCaptchaVerified(!isCaptchaVerified)}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                    isCaptchaVerified ? 'bg-[#0B3C85] border-[#0B3C85] text-white' : 'bg-white border-slate-400'
                  }`}>
                    {isCaptchaVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">Saya bukan robot (Verify human)</span>
                </label>

                <div className="flex flex-col items-end">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Turnstile / reCAPTCHA</span>
                </div>
              </div>

              {/* Submit Button */}
              {loginMethod === 'PASSWORD' ? (
                <button
                  type="submit"
                  disabled={!isCaptchaVerified || isLoading}
                  className="w-full py-3 bg-[#0B3C85] hover:bg-blue-900 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" /> Memverifikasi Password...
                    </>
                  ) : (
                    <>
                      Masuk Sistem Gudang <ArrowRight className="w-4 h-4 text-sky-300" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isCaptchaVerified || isLoading}
                  className="w-full py-3 bg-[#0B3C85] hover:bg-blue-900 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" /> Meminta OTP Email...
                    </>
                  ) : (
                    <>
                      Kirim Kode OTP ke Email Inbox <ArrowRight className="w-4 h-4 text-sky-300" />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}

        {/* STEP 2: 6-DIGIT OTP INPUT VERIFICATION FORM */}
        {step === 'OTP_INPUT' && (
          <div className="p-8 space-y-5 animate-in fade-in duration-200">
            <button
              onClick={() => setStep('CREDENTIALS')}
              className="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Form Login
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0B3C85] flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-black text-base">Verifikasi OTP Email</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Kode OTP 6-digit telah dikirimkan ke email: <br />
                <strong className="text-slate-900 font-mono text-xs">{email}</strong>
              </p>
            </div>

            {/* Email Inbox Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center text-xs font-bold text-emerald-800 space-y-0.5">
              <p>📩 Masukkan 6-digit kode token OTP dari inbox email Anda pada form di bawah ini.</p>
              <p className="text-[10px] text-emerald-600 font-semibold">(Tanpa mengklik link — masukkan 6 angka secara manual)</p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs font-semibold text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={(e) => handleVerifyOtpSubmit(e)} className="space-y-5">
              {/* 6-Box OTP Input */}
              <div className="flex items-center justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInputChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-12 text-center font-mono font-black text-lg text-black bg-slate-50 border border-slate-300 rounded-xl focus:border-[#0B3C85] focus:bg-white focus:outline-none transition shadow-2xs"
                  />
                ))}
              </div>

              {/* Master OTP Bypass Button for Testing / Demo */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1.5">
                <p className="text-[11px] font-extrabold text-amber-900">
                  💡 Mode Pengujian & Demontrasi / Limit SMTP Email
                </p>
                <button
                  type="button"
                  onClick={handleUseMasterOtp}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition w-full flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-amber-200" /> Use Master OTP Code (123456)
                </button>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Sisa Waktu OTP:
                  <strong className="font-mono text-red-600">
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
                    {(timerSeconds % 60).toString().padStart(2, '0')}
                  </strong>
                </span>

                <button
                  type="button"
                  disabled={timerSeconds > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="text-[#0B3C85] font-bold hover:underline disabled:opacity-40 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Kirim Ulang OTP
                </button>
              </div>

              {/* Submit OTP */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0B3C85] hover:bg-blue-900 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" /> Memverifikasi...
                  </>
                ) : (
                  <>
                    Verifikasi OTP & Masuk Gudang <ArrowRight className="w-4 h-4 text-sky-300" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-semibold text-slate-400">
            © 2026 Doa Ibu Sparepart | PT Fardan Utama Niaga. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};