import type { Metadata } from 'next'
import {
  SettingsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
} from 'lucide-react'


export const metadata: Metadata = {
  title: 'Configuración | AI Recruitment Platform',
}

// ---------------------------------------------------------------------------
// Helpers (server-side only — safe to call in a Server Component)
// ---------------------------------------------------------------------------
function maskSecret(value?: string): string | null {
  if (!value) return null
  if (value.includes('your') || value.includes('change-me')) return null
  return value.slice(0, 8) + '••••••••'
}

function maskUrl(value?: string): string | null {
  if (!value) return null
  if (value.includes('your') || value.includes('change-me')) return null
  try {
    const url = new URL(value)
    return url.hostname
  } catch {
    return value.slice(0, 30) + '…'
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-[#101016] border border-[#1e1e2a] p-6 space-y-4 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-white flex items-center gap-2">{children}</h2>
  )
}

function EnvRow({
  label,
  value,
  alwaysMask = false,
}: {
  label: string
  value: string | null
  alwaysMask?: boolean
}) {
  const display = alwaysMask ? '••••••••' : value ?? 'No configurado'
  const configured = alwaysMask ? true : value !== null

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#1e1e2a] last:border-0">
      <span className="text-xs font-mono text-slate-400 flex-shrink-0">{label}</span>
      <span
        className={`text-xs font-mono px-2 py-0.5 rounded-md ${
          configured
            ? 'bg-[#191922] text-slate-200'
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
        }`}
      >
        {display}
      </span>
    </div>
  )
}

function StatusPill({
  ok,
  okLabel = 'Conectado',
  failLabel = 'Sin configurar',
}: {
  ok: boolean
  okLabel?: string
  failLabel?: string
}) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <CheckCircleIcon className="h-3.5 w-3.5" />
        {okLabel}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
      <AlertTriangleIcon className="h-3.5 w-3.5" />
      {failLabel}
    </span>
  )
}

// N8n flow diagram
function N8nFlowDiagram() {
  const steps = [
    { label: 'Upload', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    { label: 'n8n', color: 'bg-brand-500/10 text-brand-300 border-brand-500/20' },
    { label: 'Claude', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { label: 'Callback', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { label: 'Notificación', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-1 pt-2">
      {steps.map((s, idx) => (
        <div key={s.label} className="flex items-center gap-1">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.color}`}
          >
            {s.label}
          </span>
          {idx < steps.length - 1 && (
            <ArrowRightIcon className="h-3 w-3 text-slate-600 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

// Numbered guide step
function GuideStep({
  number,
  title,
  description,
  link,
}: {
  number: number
  title: string
  description?: string
  link?: { href: string; label: string }
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
        <span className="text-xs font-bold text-brand-300">{number}</span>
      </div>
      <div className="space-y-0.5 pt-0.5">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors mt-0.5"
          >
            {link.label} ↗
          </a>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  // Read env vars server-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  const n8nCallbackSecret = process.env.N8N_CALLBACK_SECRET
  const n8nNotificationsUrl = process.env.N8N_NOTIFICATIONS_WEBHOOK_URL

  const openaiKey = process.env.OPENAI_API_KEY
  const openaiModel = process.env.OPENAI_MODEL
  const geminiKey = process.env.GEMINI_API_KEY

  const devBypassActive = process.env.DEV_BYPASS_AUTH === 'true'

  // Masked values
  const maskedSupabaseUrl = maskSecret(supabaseUrl)
  const maskedAnonKey = supabaseAnonKey && !supabaseAnonKey.includes('your')
    ? 'eyJ••••' + supabaseAnonKey.slice(-4)
    : null
  const maskedServiceKey = maskSecret(supabaseServiceKey)

  const supabaseOk = !!supabaseUrl && !supabaseUrl.includes('your-project')

  const n8nWebhookDisplay = maskUrl(n8nWebhookUrl)
  const n8nNotifDisplay = maskUrl(n8nNotificationsUrl)
  const n8nWebhookOk = !!n8nWebhookUrl && !n8nWebhookUrl.includes('your')
  const n8nNotifOk = !!n8nNotificationsUrl && !n8nNotificationsUrl.includes('your')
  
  const maskedOpenAI = maskSecret(openaiKey)
  const maskedGemini = maskSecret(geminiKey)

  return (
    <main className="min-h-screen bg-[#08080e] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20">
            <SettingsIcon className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración</h1>
            <p className="text-sm text-slate-400">
              Gestiona las integraciones y variables de entorno de la plataforma.
            </p>
          </div>
        </div>

        {/* ── Supabase ── */}
        <SectionCard>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <SectionTitle>🔌 Supabase</SectionTitle>
            <StatusPill ok={supabaseOk} />
          </div>

          <div className="space-y-0">
            <EnvRow label="NEXT_PUBLIC_SUPABASE_URL" value={maskedSupabaseUrl} />
            <EnvRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" value={maskedAnonKey} />
            <EnvRow label="SUPABASE_SERVICE_ROLE_KEY" value={maskedServiceKey} />
          </div>

            <div className="rounded-lg bg-[#191922] border border-[#262633] px-4 py-3">
              <p className="text-xs text-slate-400">
                💡 Configura estas variables en tu archivo{' '}
                <code className="font-mono text-brand-300">.env.local</code>
            </p>
          </div>
        </SectionCard>

        {/* ── n8n Webhooks ── */}
        <SectionCard>
          <SectionTitle>⚡ n8n Webhooks</SectionTitle>

          <div className="space-y-0">
            <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#1e1e2a]">
              <span className="text-xs font-mono text-slate-400">N8N_WEBHOOK_URL</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#191922] text-slate-200">
                  {n8nWebhookDisplay ?? 'No configurado'}
                </span>
                <StatusPill ok={n8nWebhookOk} okLabel="OK" failLabel="No configurado" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[#1e1e2a]">
              <span className="text-xs font-mono text-slate-400">N8N_CALLBACK_SECRET</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#191922] text-slate-200">
                ••••••••
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-xs font-mono text-slate-400">N8N_NOTIFICATIONS_WEBHOOK_URL</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#191922] text-slate-200">
                  {n8nNotifDisplay ?? 'No configurado'}
                </span>
                <StatusPill ok={n8nNotifOk} okLabel="OK" failLabel="No configurado" />
              </div>
            </div>
          </div>

          {/* Flow diagram */}
            <div className="rounded-lg bg-[#191922] border border-[#262633] px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-slate-400">Flujo de procesamiento</p>
            <N8nFlowDiagram />
          </div>
        </SectionCard>

        {/* ── AI Model ── */}
        <SectionCard>
          <SectionTitle>🤖 Modelo de IA</SectionTitle>

          <div className="space-y-0">
            <EnvRow label="OPENAI_API_KEY" value={maskedOpenAI} />
            <EnvRow
              label="OPENAI_MODEL"
              value={openaiModel && !openaiModel.includes('your') ? openaiModel : 'gpt-4o (default)'}
            />
            <EnvRow label="GEMINI_API_KEY" value={maskedGemini} />
          </div>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-3">
            <p className="text-xs text-blue-300">
              ℹ️ El modelo se configura en el nodo LLM de n8n. Esta variable es para uso futuro.
            </p>
          </div>
        </SectionCard>

        {/* ── Setup Guide ── */}
        <SectionCard>
          <SectionTitle>🗺️ Guía de Configuración</SectionTitle>

          <div className="space-y-5">
            <GuideStep
              number={1}
              title="Crea el proyecto en Supabase"
              description="Registra o inicia sesión y crea un nuevo proyecto."
              link={{ href: 'https://supabase.com', label: 'supabase.com' }}
            />
            <GuideStep
              number={2}
              title="Ejecuta la migración SQL"
              description="Abre el SQL Editor de Supabase y ejecuta el script de migración incluido en /supabase/migrations."
            />
            <GuideStep
              number={3}
              title="Configura el bucket de almacenamiento"
              description="Crea el bucket 'cv-resumes' y configúralo como público en Storage > Policies."
            />
            <GuideStep
              number={4}
              title="Crea el flujo en n8n"
              description="Importa el flujo de n8n e configura los 2 webhooks: el de entrada y el de callback."
            />
            <GuideStep
              number={5}
              title="Copia las credenciales y activa autenticación"
              description="Copia todas las credenciales en .env.local y cambia DEV_BYPASS_AUTH=false para producción."
            />
          </div>
        </SectionCard>

        {/* ── Warning banner ── */}
        {devBypassActive && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 px-5 py-4">
            <AlertTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-300">
                DEV_BYPASS_AUTH=true está activo
              </p>
              <p className="text-xs text-amber-400/80">
                Toda ruta está accesible sin autenticación. Cambia a{' '}
                <code className="font-mono text-amber-300">false</code> antes de desplegar en producción.
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
