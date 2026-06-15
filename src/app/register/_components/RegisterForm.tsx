'use client';

import { useTransition, useState } from 'react';
import { candidateRegister } from '@/app/_actions/auth';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  UserPlusIcon,
  AlertCircleIcon,
  LoaderIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await candidateRegister(formData);
      if (result && !result.success) {
        setError(result.error ?? null);
      } else if (result?.redirect) {
        window.location.href = result.redirect;
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#08080e] flex items-center justify-center p-4">

      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#1e1e2a] bg-[#101016] p-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600">
              <UserPlusIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Registro de candidato
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Crea tu cuenta para dar seguimiento a tus postulaciones
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
              <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Nombre completo
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Ana García Martínez"
                  required
                  disabled={isPending}
                  className="w-full rounded-lg border border-[#1e1e2a] bg-[#101016] py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 disabled:opacity-50"
                />
              </div>
            </div>

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
                  placeholder="candidato@email.com"
                  required
                  disabled={isPending}
                  className="w-full rounded-lg border border-[#1e1e2a] bg-[#101016] py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 disabled:opacity-50"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={isPending}
                  className="w-full rounded-lg border border-[#1e1e2a] bg-[#101016] py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 disabled:opacity-50"
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

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 px-4 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Creando cuenta…
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-4 h-4" />
                  Crear cuenta
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
