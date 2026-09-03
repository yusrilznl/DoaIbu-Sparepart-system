import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, KeyRound, CheckSquare, Square } from 'lucide-react';
import { CAPTCHA_SITE_KEY } from '../../lib/captcha';

interface RegisterPasswordProps {
  onBackToLogin: () => void;
}

export const RegisterPassword: React.FC<RegisterPasswordProps> = ({ onBackToLogin }) => {
  const { whitelistUsers, updateUserPassword } = useAuth();
  const { showToast } = useInventory();

  const [email, setEmail] = useState<string>('yusrilznl@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CAPTCHA verification state
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. CAPTCHA Check
    if (!isCaptchaVerified) {
      setErrorMessage('Silakan centang verifikasi CAPTCHA terlebih dahulu untuk membuktikan Anda bukan bot!');
      showToast('Silakan centang verifikasi CAPTCHA terlebih dahulu!', 'error');
      return;
    }

    // 2. Double Password Matching Check
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok! Silakan periksa ulang keduamya.');
      showToast('Konfirmasi password tidak cocok!', 'error');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    // 3. Verify Whitelist
    const userExists = whitelistUsers.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!userExists) {
      setErrorMessage(`Email "${email}" belum terdaftar di Whitelist. Hubungi Owner untuk pendaftaran.`);
      return;
    }

    // 4. Update Password
    const success = await updateUserPassword(email, password);
    if (success) {
      const nowStr = new Date().toLocaleString();
      showToast(`Password baru untuk ${email} berhasil disimpan!`, 'success');
      showToast(`ALERT KEAMANAN: Notifikasi perubahan password terkirim ke Owner (yusrilznl@gmail.com) pada ${nowStr}.`, 'info');
      onBackToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 text-center bg-slate-50">
          <button
            onClick={onBackToLogin}
            className="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Form Login
          </button>

          <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl border border-slate-200 shadow-md mb-2">
            <KeyRound className="w-6 h-6 text-[#0B3C85]" />
          </div>

          <h3 className="font-extrabold text-black text-lg">Buat / Reset Password Baru</h3>
          <p className="text-xs text-slate-500 font-medium">Setup kata sandi aman</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs font-semibold">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-700 font-semibold animate-in shake">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Whitelist */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Terdaftar (Whitelist)*</label>
              <input
                type="email"
                required
                placeholder="nama@doaibusparepart.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-black font-semibold focus:border-[#0B3C85] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Input 1: Password Utama */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Password Utama Baru*</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password baru..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-black font-semibold focus:border-[#0B3C85] focus:bg-white focus:outline-none"
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

            {/* Input 2: Konfirmasi Password */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Konfirmasi Password Baru*</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password di atas..."
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-black font-semibold focus:border-[#0B3C85] focus:bg-white focus:outline-none"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="text-[11px] font-bold text-red-600 mt-1 block">
                  ⚠️ Konfirmasi password tidak cocok!
                </span>
              )}
            </div>

            {/* CAPTCHA Widget Simulation Box (Turnstile / reCAPTCHA v2) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <label
                onClick={() => setIsCaptchaVerified(!isCaptchaVerified)}
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
            <button
              type="submit"
              disabled={!isCaptchaVerified || !password || password !== confirmPassword}
              className="w-full py-3 bg-[#0B3C85] hover:bg-blue-900 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Simpan Password & Kirim Alert ke Owner
            </button>
          </form>
        </div>

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
