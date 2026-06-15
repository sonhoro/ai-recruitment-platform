-- ============================================================
-- AI Recruitment Platform — Seed Data
-- ============================================================
-- Ejecutar en Supabase SQL Editor después de las migraciones.
--
-- Logins:
--   admin@example.com     / admin123   → Reclutador (full access)
--   entrevistador@email.com / admin123 → Entrevistador (solo entrevistas)
--   ana.garcia@email.com  / admin123   → Candidato (sus postulaciones)
--
-- Crea:
--   3 auth users (admin, interviewer, candidate)
--   2 recruiter profiles (recruiter + interviewer roles)
--   3 vacantes (jobs)
--   6 candidatos (1 linked to auth)
--   6 evaluaciones IA (scores)
--   5 entrevistas
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. AUTH USER (login: admin@example.com / admin123)
-- ─────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Reclutador"}',
  NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
);

-- ─────────────────────────────────────────────
-- 2. INTERVIEWER AUTH USER (login: entrevistador@email.com / admin123)
-- ─────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'entrevistador@email.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sandra Ruiz"}',
  NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'entrevistador@email.com'
);

-- ─────────────────────────────────────────────
-- 3. RECRUITER + INTERVIEWER profiles
-- ─────────────────────────────────────────────
INSERT INTO public.recruiters (id, auth_user_id, full_name, email, company_name, department, role)
SELECT
  gen_random_uuid(), id,
  'Admin Reclutador', 'admin@example.com',
  'TechCorp México', 'Ingeniería',
  'recruiter'
FROM auth.users
WHERE email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.recruiters WHERE email = 'admin@example.com');

INSERT INTO public.recruiters (id, auth_user_id, full_name, email, company_name, department, role)
SELECT
  gen_random_uuid(), id,
  'Sandra Ruiz', 'entrevistador@email.com',
  'TechCorp México', 'Ingeniería',
  'interviewer'
FROM auth.users
WHERE email = 'entrevistador@email.com'
  AND NOT EXISTS (SELECT 1 FROM public.recruiters WHERE email = 'entrevistador@email.com');

-- ─────────────────────────────────────────────
-- 4. JOBS (vacantes)
-- ─────────────────────────────────────────────

INSERT INTO public.jobs (id, recruiter_id, title, description, requirements, location, remote_policy, salary_min, salary_max, currency, status, department, employment_type, skills_required, published_at)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'Senior Frontend Engineer',
  'Buscamos un Senior Frontend Engineer para liderar el desarrollo de nuestra plataforma SaaS de recruiting. Trabajarás con React, TypeScript y Next.js construyendo interfaces de alta calidad.',
  '• 5+ años de experiencia con React y TypeScript
• Experiencia con Next.js y Server Components
• Conocimientos de Tailwind CSS y diseño responsive
• Experiencia con testing (Jest, Cypress)
• Buenas prácticas de accesibilidad (a11y)',
  'Ciudad de México',
  'hybrid',
  85000, 120000,
  'MXN',
  'open'::job_status,
  'Ingeniería',
  'full_time',
  ARRAY['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Jest'],
  NOW() - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.jobs WHERE id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO public.jobs (id, recruiter_id, title, description, requirements, location, remote_policy, salary_min, salary_max, currency, status, department, employment_type, skills_required, published_at)
SELECT
  'a0000000-0000-0000-0000-000000000002'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'Backend Engineer (Node.js)',
  'Estamos buscando un Backend Engineer con experiencia en Node.js y PostgreSQL para construir y mantener nuestra API REST y servicios de procesamiento de CVs.',
  '• 3+ años con Node.js y TypeScript
• Experiencia con PostgreSQL y Supabase
• Conocimientos de serverless y Edge Functions
• Experiencia con APIs REST y GraphQL
• Familiaridad con colas de mensajes (RabbitMQ/SQS)',
  'Remoto',
  'remote',
  70000, 100000,
  'MXN',
  'open'::job_status,
  'Ingeniería',
  'full_time',
  ARRAY['Node.js', 'TypeScript', 'PostgreSQL', 'Supabase', 'REST APIs', 'Docker'],
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM public.jobs WHERE id = 'a0000000-0000-0000-0000-000000000002');

INSERT INTO public.jobs (id, recruiter_id, title, description, requirements, location, remote_policy, salary_min, salary_max, currency, status, department, employment_type, skills_required, published_at)
SELECT
  'a0000000-0000-0000-0000-000000000003'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'Product Designer (UX/UI)',
  'Buscamos un Product Designer para diseñar la experiencia de reclutadores y candidatos en nuestra plataforma. Trabajarás junto a producto e ingeniería.',
  '• 4+ años de experiencia en diseño UX/UI
• Manejo de Figma y sistemas de diseño
• Experiencia con design tokens y accesibilidad
• Conocimientos de HTML/CSS para prototyping
• Portfolio de productos SaaS',
  'Ciudad de México',
  'hybrid',
  65000, 95000,
  'MXN',
  'open'::job_status,
  'Diseño',
  'full_time',
  ARRAY['Figma', 'UX Research', 'UI Design', 'Design Systems', 'Prototyping', 'User Testing'],
  NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM public.jobs WHERE id = 'a0000000-0000-0000-0000-000000000003');

-- ─────────────────────────────────────────────
-- 5. CANDIDATES
-- ─────────────────────────────────────────────

INSERT INTO public.candidates (id, job_id, full_name, email, phone, location, linkedin_url, resume_url, status, source, notes, ai_summary, seniority, applied_at)
SELECT
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Ana García Martínez', 'ana.garcia@email.com', '+52 55 1234 5678',
  'Ciudad de México', 'https://linkedin.com/in/ana-garcia', 'https://example.com/cvs/ana-garcia.pdf',
  'screening'::candidate_status, 'linkedin',
  'Excelente perfil técnico, experiencia previa en startups.',
  'Ingeniera de Software con 6+ años de experiencia construyendo aplicaciones web escalables. Especialista en React y TypeScript con historial comprobado de liderazgo técnico en equipos ágiles.',
  'Senior',
  NOW() - INTERVAL '6 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = 'b0000000-0000-0000-0000-000000000001');

INSERT INTO public.candidates (id, job_id, full_name, email, phone, location, linkedin_url, resume_url, status, source, notes, ai_summary, seniority, applied_at)
SELECT
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Carlos Mendoza López', 'carlos.mendoza@email.com', '+52 55 2345 6789',
  'Guadalajara', 'https://linkedin.com/in/carlos-mendoza', 'https://example.com/cvs/carlos-mendoza.pdf',
  'interview'::candidate_status, 'referral',
  'Recomendado por Ricardo Hernández.',
  'Frontend Engineer con 4 años de experiencia creando interfaces de usuario modernas con React, Next.js y Tailwind CSS. Apasionado por la accesibilidad web y el rendimiento frontend.',
  'Semi-Senior',
  NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = 'b0000000-0000-0000-0000-000000000002');

INSERT INTO public.candidates (id, job_id, full_name, email, phone, location, linkedin_url, resume_url, status, source, notes, ai_summary, seniority, applied_at)
SELECT
  'b0000000-0000-0000-0000-000000000003'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'María Fernández Torres', 'maria.fernandez@email.com', '+52 55 3456 7890',
  'Monterrey', 'https://linkedin.com/in/maria-fernandez', 'https://example.com/cvs/maria-fernandez.pdf',
  'new'::candidate_status, 'careers_page',
  'Postulación directa desde la plataforma.',
  'Desarrolladora Full-Stack con 3 años de experiencia. Dominio de React, Node.js y bases de datos SQL. Enfocada en escribir código limpio y bien documentado.',
  'Semi-Senior',
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = 'b0000000-0000-0000-0000-000000000003');

INSERT INTO public.candidates (id, job_id, full_name, email, phone, location, linkedin_url, resume_url, status, source, notes, ai_summary, seniority, applied_at)
SELECT
  'b0000000-0000-0000-0000-000000000004'::uuid,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Roberto Juárez Castillo', 'roberto.juarez@email.com', '+52 55 4567 8901',
  'Ciudad de México', 'https://linkedin.com/in/roberto-juarez', 'https://example.com/cvs/roberto-juarez.pdf',
  'screening'::candidate_status, 'linkedin',
  'Fuerte en backend, experiencia con sistemas distribuidos.',
  'Backend Engineer con 7+ años de experiencia en Node.js, Python y arquitecturas de microservicios. Experto en PostgreSQL, sistemas de colas y despliegues cloud (AWS/GCP).',
  'Senior',
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = 'b0000000-0000-0000-0000-000000000004');

INSERT INTO public.candidates (id, job_id, full_name, email, phone, location, linkedin_url, resume_url, status, source, notes, ai_summary, seniority, applied_at)
SELECT
  'b0000000-0000-0000-0000-000000000005'::uuid,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Diana Ríos Navarro', 'diana.rios@email.com', '+52 55 5678 9012',
  'Querétaro', 'https://linkedin.com/in/diana-rios', 'https://example.com/cvs/diana-rios.pdf',
  'new'::candidate_status, 'referral',
  'Recomendada por equipo de ingeniería.',
  'Desarrolladora Backend con 2 años de experiencia en Node.js y TypeScript. Conocimientos sólidos de PostgreSQL, Docker y CI/CD. Entusiasta del código abierto.',
  'Junior',
  NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = 'b0000000-0000-0000-0000-000000000005');

INSERT INTO public.candidates (id, job_id, full_name, email, phone, location, linkedin_url, resume_url, status, source, notes, ai_summary, seniority, applied_at)
SELECT
  'b0000000-0000-0000-0000-000000000006'::uuid,
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'Pedro Vargas Ortiz', 'pedro.vargas@email.com', '+52 55 6789 0123',
  'Ciudad de México', 'https://linkedin.com/in/pedro-vargas', 'https://example.com/cvs/pedro-vargas.pdf',
  'interview'::candidate_status, 'linkedin',
  'Excelente portafolio, experiencia en diseño de productos SaaS.',
  'Product Designer con 5+ años diseñando productos B2B SaaS. Experto en Figma, sistemas de diseño y metodologías de investigación de usuarios. Portfolio galardonado.',
  'Senior',
  NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = 'b0000000-0000-0000-0000-000000000006');

-- ─────────────────────────────────────────────
-- 6. Link candidate to auth user (for candidate login)
-- ─────────────────────────────────────────────
-- Crea auth user para Ana García (login: ana.garcia@email.com / admin123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ana.garcia@email.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ana García Martínez"}',
  NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'ana.garcia@email.com'
);

-- Link candidate row to auth user
UPDATE public.candidates
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'ana.garcia@email.com')
WHERE email = 'ana.garcia@email.com'
  AND auth_user_id IS NULL;

-- ─────────────────────────────────────────────
-- 7. SCORES (AI evaluations)
-- ─────────────────────────────────────────────

INSERT INTO public.scores (candidate_id, job_id, stage, score, recommendation, reasoning, strengths, weaknesses, model_version, prompt_tokens, completion_tokens, latency_ms)
SELECT
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'overall'::score_stage, 92.00, 'advance',
  'Ana cumple con todos los requisitos técnicos y tiene experiencia liderando equipos. Su experiencia en startups la hace ideal para un entorno ágil.',
  ARRAY['Liderazgo técnico', 'Arquitectura frontend', 'Mentoría', 'React/TypeScript avanzado'],
  ARRAY['Sin experiencia con GraphQL', 'Salario esperado alto'],
  'gpt-4o-2024-08-06', 1250, 420, 2340
WHERE NOT EXISTS (SELECT 1 FROM public.scores WHERE candidate_id = 'b0000000-0000-0000-0000-000000000001' AND stage = 'overall'::score_stage);

INSERT INTO public.scores (candidate_id, job_id, stage, score, recommendation, reasoning, strengths, weaknesses, model_version, prompt_tokens, completion_tokens, latency_ms)
SELECT
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'overall'::score_stage, 78.50, 'advance',
  'Carlos tiene buena experiencia frontend y cumple con los requisitos técnicos. Su experiencia en accesibilidad es un plus importante.',
  ARRAY['Accesibilidad (a11y)', 'Rendimiento frontend', 'Next.js', 'Testing'],
  ARRAY['Poca experiencia en liderazgo', 'No tiene experiencia con sistemas de diseño'],
  'gpt-4o-2024-08-06', 1180, 380, 2100
WHERE NOT EXISTS (SELECT 1 FROM public.scores WHERE candidate_id = 'b0000000-0000-0000-0000-000000000002' AND stage = 'overall'::score_stage);

INSERT INTO public.scores (candidate_id, job_id, stage, score, recommendation, reasoning, strengths, weaknesses, model_version, prompt_tokens, completion_tokens, latency_ms)
SELECT
  'b0000000-0000-0000-0000-000000000003'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'overall'::score_stage, 65.00, 'hold',
  'María tiene conocimientos sólidos pero su experiencia es limitada comparada con otros candidatos. Podría ser buena opción para un rol mid-level.',
  ARRAY['Código limpio', 'Documentación', 'Full-stack'],
  ARRAY['Poca experiencia (3 años)', 'Sin experiencia con Next.js 15', 'No ha trabajado con Server Components'],
  'gpt-4o-2024-08-06', 1100, 350, 1950
WHERE NOT EXISTS (SELECT 1 FROM public.scores WHERE candidate_id = 'b0000000-0000-0000-0000-000000000003' AND stage = 'overall'::score_stage);

INSERT INTO public.scores (candidate_id, job_id, stage, score, recommendation, reasoning, strengths, weaknesses, model_version, prompt_tokens, completion_tokens, latency_ms)
SELECT
  'b0000000-0000-0000-0000-000000000004'::uuid,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'overall'::score_stage, 88.00, 'advance',
  'Roberto es un ingeniero backend experimentado con un perfil técnico muy sólido. Su experiencia con sistemas distribuidos es exactamente lo que buscamos.',
  ARRAY['Arquitectura distribuida', 'PostgreSQL avanzado', 'Cloud (AWS/GCP)', 'Liderazgo técnico'],
  ARRAY['Sin experiencia con Supabase', 'Preferencia por AWS sobre serverless'],
  'gpt-4o-2024-08-06', 1300, 440, 2450
WHERE NOT EXISTS (SELECT 1 FROM public.scores WHERE candidate_id = 'b0000000-0000-0000-0000-000000000004' AND stage = 'overall'::score_stage);

INSERT INTO public.scores (candidate_id, job_id, stage, score, recommendation, reasoning, strengths, weaknesses, model_version, prompt_tokens, completion_tokens, latency_ms)
SELECT
  'b0000000-0000-0000-0000-000000000005'::uuid,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'overall'::score_stage, 62.00, 'hold',
  'Diana tiene buen potencial pero su experiencia es limitada. Su entusiasmo por el código abierto es un punto a favor. Recomendamos evaluar para rol junior.',
  ARRAY['Código abierto', 'Docker/CI/CD', 'TypeScript', 'Actitud proactiva'],
  ARRAY['Solo 2 años de experiencia', 'Sin experiencia en producción con alta carga', 'No conoce sistemas de colas'],
  'gpt-4o-2024-08-06', 1050, 330, 1850
WHERE NOT EXISTS (SELECT 1 FROM public.scores WHERE candidate_id = 'b0000000-0000-0000-0000-000000000005' AND stage = 'overall'::score_stage);

INSERT INTO public.scores (candidate_id, job_id, stage, score, recommendation, reasoning, strengths, weaknesses, model_version, prompt_tokens, completion_tokens, latency_ms)
SELECT
  'b0000000-0000-0000-0000-000000000006'::uuid,
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'overall'::score_stage, 90.50, 'advance',
  'Pedro tiene un perfil sobresaliente para el rol de Product Designer. Su experiencia en productos SaaS y sistemas de diseño es exactamente lo que necesitamos.',
  ARRAY['Diseño de productos SaaS', 'Sistemas de diseño', 'UX Research', 'Figma avanzado', 'Portfolio galardonado'],
  ARRAY['Disponibilidad limitada (proyecto actual)', 'Sin experiencia con design tokens en código'],
  'gpt-4o-2024-08-06', 1200, 400, 2250
WHERE NOT EXISTS (SELECT 1 FROM public.scores WHERE candidate_id = 'b0000000-0000-0000-0000-000000000006' AND stage = 'overall'::score_stage);

-- ─────────────────────────────────────────────
-- 8. INTERVIEWS (with interviewer_ids referencing the interviewer recruiter)
-- ─────────────────────────────────────────────

INSERT INTO public.interviews (id, candidate_id, job_id, recruiter_id, interview_type, status, scheduled_at, duration_minutes, timezone, meeting_url, interviewer_ids)
SELECT
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'technical'::interview_type,
  'scheduled'::interview_status,
  NOW() + INTERVAL '2 days' + TIME '10:00:00',
  60,
  'America/Mexico_City',
  'https://meet.google.com/abc-defg-hij',
  (SELECT ARRAY_AGG(id) FROM public.recruiters WHERE role = 'interviewer')
WHERE NOT EXISTS (SELECT 1 FROM public.interviews WHERE id = 'c0000000-0000-0000-0000-000000000001');

INSERT INTO public.interviews (id, candidate_id, job_id, recruiter_id, interview_type, status, scheduled_at, duration_minutes, timezone, meeting_url, interviewer_ids)
SELECT
  'c0000000-0000-0000-0000-000000000002'::uuid,
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'behavioral'::interview_type,
  'scheduled'::interview_status,
  NOW() + INTERVAL '2 days' + TIME '15:30:00',
  45,
  'America/Mexico_City',
  'https://meet.google.com/klm-nopq-rst',
  (SELECT ARRAY_AGG(id) FROM public.recruiters WHERE role = 'interviewer')
WHERE NOT EXISTS (SELECT 1 FROM public.interviews WHERE id = 'c0000000-0000-0000-0000-000000000002');

INSERT INTO public.interviews (id, candidate_id, job_id, recruiter_id, interview_type, status, scheduled_at, duration_minutes, timezone, meeting_url, interviewer_ids)
SELECT
  'c0000000-0000-0000-0000-000000000003'::uuid,
  'b0000000-0000-0000-0000-000000000006'::uuid,
  'a0000000-0000-0000-0000-000000000003'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'panel'::interview_type,
  'scheduled'::interview_status,
  NOW() + INTERVAL '3 days' + TIME '11:00:00',
  90,
  'America/Mexico_City',
  'https://meet.google.com/uvw-xyz-123',
  (SELECT ARRAY_AGG(id) FROM public.recruiters WHERE role = 'interviewer')
WHERE NOT EXISTS (SELECT 1 FROM public.interviews WHERE id = 'c0000000-0000-0000-0000-000000000003');

INSERT INTO public.interviews (id, candidate_id, job_id, recruiter_id, interview_type, status, scheduled_at, duration_minutes, timezone, meeting_url, interviewer_ids)
SELECT
  'c0000000-0000-0000-0000-000000000004'::uuid,
  'b0000000-0000-0000-0000-000000000004'::uuid,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'phone_screen'::interview_type,
  'completed'::interview_status,
  NOW() - INTERVAL '1 day' + TIME '09:00:00',
  30,
  'America/Mexico_City',
  NULL,
  (SELECT ARRAY_AGG(id) FROM public.recruiters WHERE role = 'interviewer')
WHERE NOT EXISTS (SELECT 1 FROM public.interviews WHERE id = 'c0000000-0000-0000-0000-000000000004');

INSERT INTO public.interviews (id, candidate_id, job_id, recruiter_id, interview_type, status, scheduled_at, duration_minutes, timezone, meeting_url, interviewer_ids)
SELECT
  'c0000000-0000-0000-0000-000000000005'::uuid,
  'b0000000-0000-0000-0000-000000000005'::uuid,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  (SELECT id FROM public.recruiters WHERE email = 'admin@example.com'),
  'final'::interview_type,
  'scheduled'::interview_status,
  NOW() + INTERVAL '4 days' + TIME '14:00:00',
  60,
  'America/Mexico_City',
  'https://meet.google.com/456-789-abc',
  (SELECT ARRAY_AGG(id) FROM public.recruiters WHERE role = 'interviewer')
WHERE NOT EXISTS (SELECT 1 FROM public.interviews WHERE id = 'c0000000-0000-0000-0000-000000000005');
