'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  X 
} from 'lucide-react';
import { setAuthToken } from '@/lib/api';
import { store, nameFromEmail } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time password requirements evaluation
  const requirements = useMemo(() => {
    return [
      { id: 'len', text: 'At least 8 characters', met: password.length >= 8 },
      { id: 'upper', text: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
      { id: 'lower', text: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(password) },
      { id: 'number', text: 'At least 1 number (0-9)', met: /\d/.test(password) },
      { id: 'special', text: 'At least 1 special character (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password) }
    ];
  }, [password]);

  const passedCount = requirements.filter(r => r.met).length;
  const isAllPassed = passedCount === requirements.length;
  const isMatch = password === confirmPassword && confirmPassword.length > 0;

  // Strength level calculation
  const strength = useMemo(() => {
    if (!password) return { label: 'Enter Password', score: 0, color: 'bg-stone-300', text: 'text-stone-500' };
    if (passedCount <= 2) return { label: 'Weak', score: 25, color: 'bg-rose-500', text: 'text-rose-600' };
    if (passedCount <= 4) return { label: 'Moderate', score: 65, color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong & Secure', score: 100, color: 'bg-emerald-600', text: 'text-emerald-700' };
  }, [password, passedCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!isAllPassed) {
      setError('Password does not satisfy all security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Register account in storage registry
      const regResult = store.registerAccount({
        email: email.trim(),
        password: password,
        fullName: fullName.trim() || nameFromEmail(email.trim()),
        roleOrDept: email.includes('@') ? `${email.split('@')[1]} Scholar` : 'Academic Researcher'
      });

      if (!regResult.success) {
        setError(regResult.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setAuthToken(`session-${Date.now()}`);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4EEE1] relative overflow-hidden py-10">
      <div className="w-full max-w-lg bg-[#FAF7F2] border border-[#D3C4BE] rounded-3xl p-8 shadow-paper-lg relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] text-[#1c1917] shadow-sm mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#1c1917]">Create Secure Profile</h2>
          <p className="text-xs text-[#57534e]">Register your credentials to create a private research vault</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-[#EBCFC4] border border-[#D3C4BE] rounded-2xl text-[#1c1917] text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#1c1917]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Alex Smith"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Academic or Personal Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.smith@stanford.edu or name@gmail.com"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider">
                Strong Password
              </label>
              {password && (
                <span className={`text-[11px] font-extrabold ${strength.text}`}>
                  {strength.label}
                </span>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Must meet all 5 security conditions"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-2xl pl-10 pr-10 py-3 focus:outline-none transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#57534e] hover:text-[#1c1917] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strength.color}`} 
                    style={{ width: `${strength.score}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Password Security Criteria Checklist */}
          <div className="p-3.5 bg-[#F3ECE7] border border-[#D3C4BE] rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-[#1c1917] uppercase tracking-wider block">
              Password Security Checklist:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-center gap-1.5 text-[11px]">
                  {req.met ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3" />
                    </div>
                  )}
                  <span className={req.met ? 'text-emerald-900 font-bold' : 'text-stone-500'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#57534e] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your strong password"
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none transition shadow-inner"
              />
            </div>
            {confirmPassword && (
              <p className={`text-[11px] font-bold mt-1 ${isMatch ? 'text-emerald-700' : 'text-rose-600'}`}>
                {isMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#57534e] bg-[#FAF7F2] p-3 rounded-xl border border-[#D3C4BE]">
            <ShieldCheck className="w-4 h-4 text-[#1c1917] shrink-0" />
            <span>Passwords are cryptographically validated and protected.</span>
          </div>

          <button
            type="submit"
            disabled={loading || !isAllPassed || !isMatch}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-[#292524] hover:bg-[#1c1917] active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-[#F4EEE1] font-black text-xs rounded-2xl transition shadow-paper-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F4EEE1]" />
            ) : (
              <>
                <span>Create Secure Account & Open Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#E9CCB1]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#57534e]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1c1917] hover:underline font-extrabold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
