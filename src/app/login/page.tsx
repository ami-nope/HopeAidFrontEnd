'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Loader2, Lock, Mail, Terminal, ShieldCheck, Briefcase, Users } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { LOGIN_ROLE_OPTIONS } from '@/lib/rbac';

type LoginErrorDisplay = {
  code: number;
  message: string;
};

const ERROR_CODE_POOLS = {
  invalidCredentials: [101, 104, 109],
  roleMismatch: [201, 207, 212],
  forbidden: [301, 307, 313],
  rateLimited: [429, 430, 431],
  backendUnavailable: [500, 502, 503],
  network: [901, 902, 903],
  unknown: [990, 995, 999],
} as const;

function pickRandomCode(pool: readonly number[]): number {
  return pool[Math.floor(Math.random() * pool.length)];
}

function mapLoginError(error: unknown): LoginErrorDisplay {
  const fallback = 'Login failed. Please try again.';
  const rawMessage = error instanceof Error ? error.message.trim() : fallback;
  const lower = rawMessage.toLowerCase();

  if (lower.includes('invalid email or password') || lower.includes('credentials')) {
    return {
      code: pickRandomCode(ERROR_CODE_POOLS.invalidCredentials),
      message: 'Invalid credentials. Check your email and password.',
    };
  }

  if (lower.includes('selected role does not match')) {
    return {
      code: pickRandomCode(ERROR_CODE_POOLS.roleMismatch),
      message: rawMessage,
    };
  }

  if (lower.includes('insufficient permissions') || lower.includes('access denied')) {
    return {
      code: pickRandomCode(ERROR_CODE_POOLS.forbidden),
      message: 'This account does not have access for the selected portal.',
    };
  }

  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('429')) {
    return {
      code: pickRandomCode(ERROR_CODE_POOLS.rateLimited),
      message: 'Too many login attempts. Wait a bit and try again.',
    };
  }

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return {
      code: pickRandomCode(ERROR_CODE_POOLS.network),
      message: 'Network error while contacting the server.',
    };
  }

  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('service unavailable') ||
    lower.includes('internal server error')
  ) {
    return {
      code: pickRandomCode(ERROR_CODE_POOLS.backendUnavailable),
      message: 'Backend service is temporarily unavailable.',
    };
  }

  return {
    code: pickRandomCode(ERROR_CODE_POOLS.unknown),
    message: rawMessage || fallback,
  };
}

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginAs, setLoginAs] = useState<string>(LOGIN_ROLE_OPTIONS[0].value);
  const [error, setError] = useState<LoginErrorDisplay | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password, loginAs);
    } catch (err: unknown) {
      setError(mapLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_45%,#e2e8f0_100%)] px-4 py-12 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,#18274f_0%,#0a1021_44%,#050814_100%)] dark:text-gray-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-[-7rem] h-80 w-80 rounded-full bg-blue-300/35 blur-3xl dark:bg-cyan-400/16" />
        <div className="absolute -left-24 bottom-[-8rem] h-96 w-96 rounded-full bg-indigo-300/35 blur-3xl dark:bg-blue-600/18" />
      </div>

      <div className="absolute right-5 top-5 z-20 rounded-full border border-slate-200/80 bg-white/85 p-1 shadow-lg shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="relative overflow-visible rounded-3xl border border-slate-200/80 bg-white/92 shadow-2xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-950/78 dark:shadow-black/30">
          <div className="border-b border-slate-200/80 px-8 pb-6 pt-10 text-center dark:border-white/10">
            <div className="mb-6 flex justify-center">
              <img 
                src="/images/hopeaid-logo-final-light.png" 
                alt="HopeAid Logo" 
                className="h-20 w-auto object-contain transition-all dark:hidden" 
              />
              <img 
                src="/images/hopeaid-logo-final-dark.png" 
                alt="HopeAid Logo" 
                className="h-20 w-auto object-contain transition-all hidden dark:block" 
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Sign in to your HopeAid dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 pb-8 pt-6">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                <div className="relative group">
                  <button
                    type="button"
                    aria-label="Show error details"
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-300/80 bg-white/70 text-red-600 transition-colors hover:bg-white dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
                  >
                    <AlertCircle size={12} />
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-72 -translate-x-1/2 rounded-lg border border-red-200/80 bg-white p-2 text-xs text-red-700 shadow-lg group-hover:block group-focus-within:block dark:border-red-400/25 dark:bg-slate-900 dark:text-red-200">
                    {error.message}
                  </div>
                </div>
                <div className="flex items-center gap-2 leading-tight">
                  <p className="font-semibold">Error code: {error.code}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                Login as
              </label>
              <div className="grid grid-cols-4 gap-3">
                {LOGIN_ROLE_OPTIONS.map((option) => {
                  const Icon = option.value === 'super_admin' ? Terminal : option.value === 'admin' ? ShieldCheck : option.value === 'org_manager' ? Briefcase : Users;
                  const shortLabel = option.value === 'super_admin' ? 'Dev' : option.value === 'admin' ? 'Admin' : option.value === 'org_manager' ? 'Manager' : 'Volunteer';
                  const isSelected = loginAs === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLoginAs(option.value)}
                      className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-1 sm:p-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/50 dark:bg-blue-500/20 dark:text-blue-300 scale-[1.02]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon size={22} className={isSelected ? 'mb-1 text-blue-600 dark:text-blue-400' : 'mb-1 opacity-70'} />
                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide">
                        {shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                Email or phone number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@organization.com or +91XXXXXXXXXX"
                  className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-offset-slate-950"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-gray-500">
          HopeAid - Humanitarian Aid Management Platform
        </p>
      </div>
    </div>
  );
}
