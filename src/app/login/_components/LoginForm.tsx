'use client';

/**
 * src/app/login/_components/LoginForm.tsx
 *
 * Formulario de inicio de sesión — Client Component.
 * Usa useActionState para manejar el estado de carga y errores.
 */

import { useActionState, useState } from 'react';
import { signIn } from '@/app/_actions/auth';
import {
  ZapIcon,
  MailIcon,
  LockIcon,
  LogInIcon,
  AlertCircleIcon,
  LoaderIcon,
  SparklesIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';

export default function LoginForm() {
  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function action(_prev: unknown, formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result && !result.success) {
      setError(result.error ?? null);
    }
    return null;
  }

  const [_, formAction, isPending] = useActionState(action, null);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-indigo-600/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/40 p-8">

          {/* Logo + Title */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
              <ZapIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                AI Recruitment
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Inicia sesión para acceder al panel
              </p>
            </div>
          </div>

          {/* DEV badge */}
          {isDev && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">
                  <span className="font-semibold">Modo dev:</span>{' '}
                  cualquier contraseña funciona. El rol se deduce del email:
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2 py-1.5 text-center">
                  <span className="text-violet-300 font-semibold block">Reclutador</span>
                  <span className="text-violet-500">admin@example.com</span>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-center">
                  <span className="text-amber-300 font-semibold block">Entrevistador</span>
                  <span className="text-amber-500">entrevistador@email.com</span>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 text-center">
                  <span className="text-emerald-300 font-semibold block">Candidato</span>
                  <span className="text-emerald-500">ana.garcia@email.com</span>
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
              <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="recruiter@empresa.com"
                  required
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                <>
                  <LogInIcon className="w-4 h-4" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-500">
              ¿Eres candidato?{' '}
              <a href="/register" className="text-violet-400 hover:text-violet-300 font-medium">
                Regístrate aquí
              </a>
            </p>
            <p className="text-xs text-slate-600">
              AI Recruitment Platform · Powered by Supabase + n8n + Claude
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
