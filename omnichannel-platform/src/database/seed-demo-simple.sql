-- Script de Seeding Simplificado para Modo de Demonstração
-- Apenas usuários essenciais para os testes

BEGIN;

-- Limpar usuários de demonstração existentes
DELETE FROM users WHERE email IN ('demo@plataforma.com', 'atendente@plataforma.com', 'supervisor@plataforma.com');
DELETE FROM teams WHERE name = 'Equipe Demonstração';

-- Inserir equipe de demonstração
INSERT INTO teams (id, name, created_at)
VALUES (
  gen_random_uuid(),
  'Equipe Demonstração',
  NOW()
);

-- Inserir usuário Admin Demo
INSERT INTO users (id, email, full_name, encrypted_password, role, is_two_factor_enabled, created_at)
VALUES (
  gen_random_uuid(),
  'demo@plataforma.com',
  'Administrador Demo',
  '$2b$10$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO',
  'ADMIN',
  false,
  NOW()
);

-- Inserir usuário Atendente Demo
INSERT INTO users (id, email, full_name, encrypted_password, role, team_id, is_two_factor_enabled, created_at)
VALUES (
  gen_random_uuid(),
  'atendente@plataforma.com',
  'Atendente Teste',
  '$2b$10$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO',
  'AGENT',
  (SELECT id FROM teams WHERE name = 'Equipe Demonstração' LIMIT 1),
  false,
  NOW()
);

-- Inserir usuário Supervisor Demo
INSERT INTO users (id, email, full_name, encrypted_password, role, team_id, is_two_factor_enabled, created_at)
VALUES (
  gen_random_uuid(),
  'supervisor@plataforma.com',
  'Supervisor Teste',
  '$2b$10$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO',
  'SUPERVISOR',
  (SELECT id FROM teams WHERE name = 'Equipe Demonstração' LIMIT 1),
  false,
  NOW()
);

COMMIT;

-- Verificar usuários criados
SELECT 'Usuários de demonstração criados:' as info;
SELECT email, full_name, role FROM users WHERE email LIKE '%@plataforma.com';

