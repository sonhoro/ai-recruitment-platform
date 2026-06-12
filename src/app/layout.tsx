import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default:  'AI Recruitment Platform',
    template: '%s | AI Recruitment Platform',
  },
  description:
    'Plataforma ATS con inteligencia artificial para evaluar, clasificar y gestionar candidatos de forma automatizada.',
  keywords:  ['ATS', 'reclutamiento', 'IA', 'candidatos', 'n8n', 'Supabase'],
  authors:   [{ name: 'Grupo Backend GIMA' }],
  robots:    'noindex, nofollow',   // internal tool — keep out of search engines
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased bg-[#0a0a0f] text-white min-h-dvh">
        {children}
      </body>
    </html>
  );
}
