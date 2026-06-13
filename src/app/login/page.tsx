/**
 * src/app/login/page.tsx
 * Server Component — página de login.
 */

import type { Metadata } from 'next';
import LoginForm from './_components/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión | AI Recruitment Platform',
  description: 'Accede al panel de reclutamiento con IA.',
};

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return <LoginForm error={error} />;
}
