import type { Metadata } from 'next';
import RegisterForm from './_components/RegisterForm';

export const metadata: Metadata = {
  title: 'Registro | AI Recruitment Platform',
  description: 'Crea tu cuenta de candidato.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
