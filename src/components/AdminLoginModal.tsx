import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const {
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    loginAdmin,
    login,
    user,
    setCurrentView,
  } = useApp();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdminLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pin.trim()) {
      setErrorMsg('Masukkan PIN Admin.');
      return;
    }

    setIsSubmitting(true);
    const result = loginAdmin(pin);
    setIsSubmitting(false);

    if (result.success) {
      setPin('');
      setIsAdminLoginModalOpen(false);
      setCurrentView('admin');
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleGoogleAdminLogin = async () => {
    try {
      await login();
      setIsAdminLoginModalOpen(false);
      setCurrentView('admin');
    } catch (e: any) {
      setErrorMsg('Gagal masuk Google: ' + (e.message || 'Periksa koneksi'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#181e27] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Login Admin &amp; Owner</h3>
              <p className="text-xs text-slate-400">Autentikasi Hak Akses Khusus Manajemen</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setPin('');
              setIsAdminLoginModalOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              Area ini diproteksi untuk <strong>Pemilik Toko &amp; Tim Operasional</strong>. Masukkan PIN keamanan untuk mengakses Profil Toko, POS Thermal, Database Sheets, dan Log Aktivitas.
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                PIN Admin / Owner
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Ketik PIN (Default: 1234)"
                  autoFocus
                  maxLength={10}
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 tracking-wider font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                <span>PIN Bawaan Default: <code className="bg-slate-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">1234</code></span>
                <button
                  type="button"
                  onClick={() => setPin('1234')}
                  className="text-amber-600 hover:text-amber-700 font-semibold underline cursor-pointer"
                >
                  Isi Otomatis
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Panel Admin / Owner'}</span>
            </button>
          </form>

          {/* Alternative Google Sign In for Authorized Admins */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-center text-[11px] text-slate-500 mb-2">
              Atau masuk dengan Akun Google terdaftar
            </div>
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{user ? `Lanjutkan sebagai ${user.displayName || user.email}` : 'Masuk dengan Google'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>GROSIR NUSANTARA Security</span>
          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setPin('');
              setIsAdminLoginModalOpen(false);
            }}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};
