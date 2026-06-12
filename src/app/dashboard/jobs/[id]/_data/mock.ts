/**
 * src/app/dashboard/jobs/[id]/_data/mock.ts
 *
 * Mock data for the Job Detail / Candidate Ranking page (Phase 1 UI).
 * Types are aligned with the real database schema; extra UI fields
 * (seniority, ai_summary, skills, current_role) are what the AI
 * pipeline will populate in Phase 2.
 */

import type { CandidateStatus, ScoreStage } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────
// Extended types (real schema + AI-enriched fields)
// ─────────────────────────────────────────────────────────────

export type SeniorityLevel = 'Junior' | 'Semi-Senior' | 'Senior';

/**
 * Combines the real `candidates` row with the top `scores` entry
 * and AI-parsed fields that will come from the parsing pipeline.
 */
export interface CandidateWithScore {
  // ── From candidates table ──────────────────────────────────
  id:          string;
  job_id:      string;
  full_name:   string;
  email:       string;
  phone:       string | null;
  resume_url:  string | null;
  status:      CandidateStatus;
  source:      string;
  applied_at:  string;   // ISO 8601

  // ── From scores table (latest 'overall' score) ─────────────
  score_id:         string;
  score:            number;        // 0.00 – 100.00
  stage:            ScoreStage;
  reasoning:        string;
  strengths:        string[];
  weaknesses:       string[];
  model_version:    string;
  prompt_tokens:    number;
  completion_tokens: number;
  latency_ms:       number;

  // ── AI-parsed fields (from resume_text extraction) ─────────
  seniority:         SeniorityLevel;
  current_role:      string;
  years_experience:  number;
  skills:            string[];
  ai_summary:        string;       // 3-4 sentence professional summary
  location:          string;
}

// ─────────────────────────────────────────────────────────────
// Mock Job
// ─────────────────────────────────────────────────────────────

export interface MockJob {
  id:            string;
  title:         string;
  department:    string;
  location:      string;
  remote_policy: string;
  status:        string;
  published_at:  string;
}

export const MOCK_JOB: MockJob = {
  id:            'job-mock-frontend-001',
  title:         'Senior Frontend Engineer',
  department:    'Ingeniería de Producto',
  location:      'Ciudad de México',
  remote_policy: 'hybrid',
  status:        'open',
  published_at:  '2026-05-28T09:00:00Z',
};

// ─────────────────────────────────────────────────────────────
// Mock Candidates — sorted descending by score (as DB would return)
// ─────────────────────────────────────────────────────────────

export const MOCK_CANDIDATES: CandidateWithScore[] = [
  {
    id: 'cand-001',
    job_id: MOCK_JOB.id,
    full_name: 'Andrea Martínez',
    email: 'andrea.martinez@email.com',
    phone: '+52 55 1234 5678',
    resume_url: '#',
    status: 'interview',
    source: 'linkedin',
    applied_at: '2026-05-29T14:22:00Z',
    score_id: 'score-001',
    score: 95,
    stage: 'overall',
    reasoning:
      'Candidata excepcional. Dominio completo del stack requerido, experiencia liderando equipos frontend y contribuciones a proyectos de código abierto muy relevantes. Encaje cultural muy alto.',
    strengths: [
      'Experiencia probada con React 19 y Next.js App Router en producción',
      'Ha liderado migraciones a TypeScript en equipos de +10 devs',
      'Contribuidora activa en repositorios open-source con más de 1.2k estrellas',
    ],
    weaknesses: [
      'Expectativa salarial ligeramente por encima del rango definido',
    ],
    model_version: 'gpt-4o-2024-08-06',
    prompt_tokens: 3120,
    completion_tokens: 820,
    latency_ms: 1840,
    seniority: 'Senior',
    current_role: 'Lead Frontend Engineer @ Fintech MX',
    years_experience: 8,
    skills: ['React', 'Next.js', 'TypeScript', 'GraphQL', 'Storybook', 'Testing Library'],
    ai_summary:
      'Andrea cuenta con 8 años de experiencia construyendo interfaces de alta performance para productos financieros B2C. Ha liderado la adopción de design systems y arquitecturas micro-frontend en su empresa actual, reduciendo el time-to-market en un 35%. Sus contribuciones open-source demuestran un nivel técnico muy por encima del promedio del mercado.',
    location: 'Ciudad de México, MX',
  },
  {
    id: 'cand-002',
    job_id: MOCK_JOB.id,
    full_name: 'Carlos Reyes',
    email: 'c.reyes@devmail.io',
    phone: '+52 81 9876 5432',
    resume_url: '#',
    status: 'screening',
    source: 'referral',
    applied_at: '2026-05-30T10:05:00Z',
    score_id: 'score-002',
    score: 88,
    stage: 'overall',
    reasoning:
      'Candidato sólido con amplia experiencia en arquitecturas frontend escalables. Excelente manejo de performance y accesibilidad. Falta algo de experiencia en entornos de alta concurrencia.',
    strengths: [
      'Experto en optimización de Core Web Vitals (LCP < 1.2 s en producción)',
      'Conocimiento profundo de accesibilidad web (WCAG 2.1 AA)',
      'Experiencia con testing E2E con Playwright y Cypress',
    ],
    weaknesses: [
      'Experiencia limitada con Edge Runtime y SSR en escala',
      'Nunca ha gestionado un equipo mayor a 3 personas',
    ],
    model_version: 'gpt-4o-2024-08-06',
    prompt_tokens: 2950,
    completion_tokens: 760,
    latency_ms: 1620,
    seniority: 'Senior',
    current_role: 'Senior Frontend Dev @ E-commerce Corp',
    years_experience: 6,
    skills: ['React', 'TypeScript', 'Vite', 'Playwright', 'WCAG', 'Webpack'],
    ai_summary:
      'Carlos tiene 6 años enfocados en desarrollo frontend con énfasis en performance y calidad. Ha mejorado métricas de Core Web Vitals en aplicaciones con +5M de usuarios activos mensuales. Su enfoque en testing automatizado y accesibilidad lo convierte en un candidato con fuerte orientación a la calidad del producto.',
    location: 'Monterrey, MX',
  },
  {
    id: 'cand-003',
    job_id: MOCK_JOB.id,
    full_name: 'Lucía Domínguez',
    email: 'lucia.dom@techstudio.com',
    phone: null,
    resume_url: '#',
    status: 'screening',
    source: 'careers_page',
    applied_at: '2026-05-31T08:47:00Z',
    score_id: 'score-003',
    score: 82,
    stage: 'overall',
    reasoning:
      'Buena candidata con base técnica sólida. Sus proyectos freelance muestran creatividad y autonomía. Le falta experiencia en equipos grandes y procesos de revisión de código formales.',
    strengths: [
      'Portfolio con proyectos freelance de alta calidad visual',
      'Experiencia con animaciones complejas (Framer Motion, GSAP)',
      'Conocimiento de arquitectura atómica y component-driven development',
    ],
    weaknesses: [
      'Sin experiencia en grandes codebases (>100k líneas)',
      'Experiencia limitada en metodologías ágiles formales',
    ],
    model_version: 'gpt-4o-2024-08-06',
    prompt_tokens: 2780,
    completion_tokens: 690,
    latency_ms: 1490,
    seniority: 'Mid-Level',
    current_role: 'Frontend Developer Freelance',
    years_experience: 4,
    skills: ['React', 'Framer Motion', 'GSAP', 'Figma', 'Tailwind CSS', 'Astro'],
    ai_summary:
      'Lucía ha desarrollado su carrera principalmente como freelancer independiente, construyendo sitios y aplicaciones web para clientes de distintos sectores. Su trabajo destaca por la atención al detalle visual y las animaciones fluidas. Está lista para dar el salto a un entorno de producto más estructurado.',
    location: 'Guadalajara, MX',
  },
  {
    id: 'cand-004',
    job_id: MOCK_JOB.id,
    full_name: 'Miguel Ángel Torres',
    email: 'miguelt@clouddev.mx',
    phone: '+52 55 4455 6677',
    resume_url: '#',
    status: 'new',
    source: 'linkedin',
    applied_at: '2026-06-01T15:30:00Z',
    score_id: 'score-004',
    score: 74,
    stage: 'overall',
    reasoning:
      'Perfil de backend que ha migrado hacia frontend. Tiene buena base en React pero le falta profundidad en patterns avanzados y diseño de componentes. Potencial alto a medio plazo.',
    strengths: [
      'Sólida comprensión de APIs REST y GraphQL desde el lado cliente',
      'Experiencia con state management complejo (Redux Toolkit, Zustand)',
      'Conocimiento de Docker y CI/CD aplicado al frontend',
    ],
    weaknesses: [
      'Diseño visual por debajo del estándar para el rol',
      'Poca experiencia con testing de componentes (< 1 año)',
      'Transición reciente de backend; gaps en CSS avanzado',
    ],
    model_version: 'gpt-4o-2024-08-06',
    prompt_tokens: 2640,
    completion_tokens: 720,
    latency_ms: 1550,
    seniority: 'Mid-Level',
    current_role: 'Full-Stack Developer @ SaaS Startup',
    years_experience: 5,
    skills: ['React', 'Redux', 'Node.js', 'GraphQL', 'Docker', 'Jest'],
    ai_summary:
      'Miguel viene de una carrera principalmente en backend (Node.js, Python) y lleva 2 años haciendo la transición a frontend. Tiene una comprensión sólida de la integración con APIs y arquitectura de datos en el cliente, pero aún está desarrollando sus habilidades en UI avanzada y diseño de sistemas de componentes.',
    location: 'Ciudad de México, MX',
  },
  {
    id: 'cand-005',
    job_id: MOCK_JOB.id,
    full_name: 'Valeria Sánchez',
    email: 'val.sanchez@outlook.com',
    phone: '+52 33 2211 0099',
    resume_url: '#',
    status: 'new',
    source: 'careers_page',
    applied_at: '2026-06-02T09:15:00Z',
    score_id: 'score-005',
    score: 61,
    stage: 'overall',
    reasoning:
      'Candidata junior con entusiasmo y proyectos propios interesantes. No cumple el nivel Senior requerido, pero podría considerarse para una posición Mid en el futuro.',
    strengths: [
      'Proyectos personales con React y Firebase bien documentados',
      'Conocimiento de accesibilidad básica',
      'Actitud proactiva e iniciativa de aprendizaje autodidacta',
    ],
    weaknesses: [
      'Solo 1.5 años de experiencia profesional',
      'Sin experiencia en equipos o proyectos de producción a escala',
      'Conocimiento superficial de TypeScript (solo JS en proyectos)',
    ],
    model_version: 'gpt-4o-2024-08-06',
    prompt_tokens: 2310,
    completion_tokens: 580,
    latency_ms: 1220,
    seniority: 'Junior',
    current_role: 'Frontend Developer Jr @ Agencia Digital',
    years_experience: 2,
    skills: ['React', 'JavaScript', 'Firebase', 'CSS3', 'Git'],
    ai_summary:
      'Valeria es una desarrolladora junior con 1.5 años de experiencia profesional y proyectos personales que demuestran pasión genuina por el frontend. Aunque su nivel actual no alcanza el rango Senior requerido, su curva de aprendizaje es positiva. Se recomienda considerar para posiciones de menor seniority en el futuro.',
    location: 'Guadalajara, MX',
  },
  {
    id: 'cand-006',
    job_id: MOCK_JOB.id,
    full_name: 'Roberto Jiménez',
    email: 'r.jimenez88@gmail.com',
    phone: null,
    resume_url: '#',
    status: 'rejected',
    source: 'manual_upload',
    applied_at: '2026-06-01T20:00:00Z',
    score_id: 'score-006',
    score: 38,
    stage: 'overall',
    reasoning:
      'El perfil no coincide con los requerimientos. Experiencia principal en jQuery y tecnologías legacy. Sin evidencia de trabajo con frameworks modernos o TypeScript.',
    strengths: [
      'Más de 10 años de experiencia total en desarrollo web',
      'Conocimiento profundo de compatibilidad cross-browser',
    ],
    weaknesses: [
      'Stack completamente legacy (jQuery, PHP, Bootstrap 3)',
      'Sin experiencia con React, Vue o Angular',
      'No demuestra habilidades en TypeScript ni en tooling moderno',
      'CV sin proyectos recientes que demuestren actualización técnica',
    ],
    model_version: 'gpt-4o-2024-08-06',
    prompt_tokens: 2100,
    completion_tokens: 540,
    latency_ms: 1100,
    seniority: 'Mid-Level',
    current_role: 'Web Developer @ Empresa Tradicional',
    years_experience: 10,
    skills: ['jQuery', 'PHP', 'Bootstrap', 'MySQL', 'WordPress'],
    ai_summary:
      'Roberto tiene una larga trayectoria en desarrollo web, pero su experiencia está concentrada en tecnologías legacy. No hay evidencia de adopción de frameworks modernos ni de TypeScript. Para el nivel y stack requerido por esta vacante, el perfil no es compatible en su estado actual.',
    location: 'Puebla, MX',
  },
];
