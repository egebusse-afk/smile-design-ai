'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    
    try {
      if (isLogin) {
        // Login
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch(`${apiUrl}/token`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
            let errorMessage = 'Giriş başarısız. Bilgilerinizi kontrol edin.';
            try {
                // Try to parse JSON error if available
                const errData = await res.json();
                if (errData.detail) errorMessage = errData.detail;
            } catch (e) {
                 console.error('Login error (non-JSON):', await res.text());
            }
            throw new Error(errorMessage);
        }

        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        router.push('/dashboard');
      } else {
        // Register
        const res = await fetch(`${apiUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName }),
        });

        if (!res.ok) {
            let errorMessage = 'Kayıt başarısız.';
            try {
                const errData = await res.json();
                errorMessage = errData.detail || errorMessage;
            } catch (e) {
                // If response is not JSON (e.g. 500 HTML page), read as text
                const text = await res.text();
                console.error('Registration error (non-JSON):', text);
                errorMessage = `Sunucu hatası: ${res.status}`;
            }
            throw new Error(errorMessage);
        }

        // Auto login after register
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const loginRes = await fetch(`${apiUrl}/token`, {
            method: 'POST',
            body: formData,
        });
        const data = await loginRes.json();
        localStorage.setItem('token', data.access_token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-amber-500/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 mb-4 shadow-lg shadow-blue-900/50">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLogin ? 'Tekrar Hoşgeldiniz' : 'Hesap Oluşturun'}
          </h1>
          <p className="text-slate-400 mt-2">
            {isLogin ? 'Gülüş tasarımınıza devam edin' : 'Profesyonel gülüş tasarımı dünyasına katılın'}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Adınız Soyadınız"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="ornek@email.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    if (e.target.value.length <= 72) {
                        setPassword(e.target.value);
                    }
                  }}
                  maxLength={72}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
              {password.length >= 72 && (
                <p className="text-xs text-amber-500 mt-1 ml-1">
                  Şifre en fazla 72 karakter olabilir.
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Giriş Yap' : 'Kayıt Ol'} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
