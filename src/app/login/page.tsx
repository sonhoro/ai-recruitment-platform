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

export default function LoginPage() {
  return <LoginForm />;
}
