'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import {
  XIcon,
  PhoneIcon,
  LinkIcon,
  GlobeIcon,
  LockIcon,
  UserIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { updateProfile, changePassword } from '@/app/_actions/profile';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Mi perfil</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'profile'
                ? 'text-emerald-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Datos personales
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'password'
                ? 'text-emerald-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Contraseña
            {activeTab === 'password' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        </div>

        <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' ? <ProfileForm onSuccess={onClose} /> : <PasswordForm />}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateProfile(formData);
      if ('success' in result) {
        onSuccess();
      }
      return result;
    },
    null,
  );

  const error = state && 'error' in state ? state.error : null;

  return (
    <form action={formAction} className="space-y-4">
      {/* Phone */}
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Teléfono
        </label>
        <div className="relative">
          <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+52 55 1234 5678"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
        </div>
      </div>

      {/* LinkedIn */}
      <div className="space-y-1.5">
        <label htmlFor="linkedin_url" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          LinkedIn
        </label>
        <div className="relative">
          <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            placeholder="https://linkedin.com/in/tu-perfil"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Portfolio / GitHub */}
      <div className="space-y-1.5">
        <label htmlFor="portfolio_url" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Portfolio / GitHub
        </label>
        <div className="relative">
          <GlobeIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="portfolio_url"
            name="portfolio_url"
            type="url"
            placeholder="https://github.com/tu-usuario"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
          <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><LoaderIcon className="w-4 h-4 animate-spin" /> Guardando…</>
        ) : (
          'Guardar cambios'
        )}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, null);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const success = state && 'success' in state;
  const error   = state && 'error' in state ? state.error : null;

  return (
    <form action={formAction} className="space-y-4">
      {/* Current password */}
      <div className="space-y-1.5">
        <label htmlFor="current_password" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Contraseña actual
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="current_password"
            name="current_password"
            type={showCur ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={isPending}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowCur((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showCur ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <label htmlFor="new_password" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Nueva contraseña
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="new_password"
            name="new_password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowNew((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showNew ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300">Contraseña actualizada correctamente.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
          <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><LoaderIcon className="w-4 h-4 animate-spin" /> Cambiando…</>
        ) : (
          'Cambiar contraseña'
        )}
      </button>
    </form>
  );
}
