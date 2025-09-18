# 🎭 Modo de Demonstração - Plataforma Omnichannel

Este documento descreve o **Modo de Demonstração**, um ambiente completo e controlado para apresentações comerciais da Plataforma Omnichannel. Ele foi implementado através dos Prompts A, B e C.

## 🚀 Funcionalidades Principais

- **API Mock para ERP**: Simula um sistema ERP com dados fictícios, permitindo demonstrações de integração sem depender de um sistema real.
- **Usuário Demo Especial**: Um usuário `demo@plataforma.com` que, ao logar, ativa automaticamente o modo de demonstração e redireciona todas as chamadas de API para o servidor mock.
- **Simulador de Cliente WhatsApp**: Uma página pública que simula a interface do WhatsApp, permitindo interagir com o chatbot de forma realista.
- **Painel de Controle do Apresentador**: Uma página para gerenciar a demonstração, com estatísticas, controles e um roteiro passo-a-passo.
- **Dados de Demonstração**: Um conjunto completo de dados fictícios (usuários, equipes, fluxos, conversas, etc.) para popular a plataforma.

## 🎯 Componentes Implementados

### Prompt A: Servidor de API Mock para ERP

- **Controller**: `src/controllers/MockErpController.ts`
- **Rotas**: `src/routes/mockErp.ts`
- **Endpoints**:
  - `GET /api/mock-erp/status`
  - `GET /api/mock-erp/clientes/:cpf`
  - `GET /api/mock-erp/faturas/:cpf`
  - `POST /api/mock-erp/clientes/:cpf/contato`
- **Dados Fictícios**:
  - **Maria Adimplente** (CPF: 111.111.111-11)
  - **João Inadimplente** (CPF: 222.222.222-22)

### Prompt B: Modo Demo e Usuário Especial

- **Script de Seeding**: `src/database/seed-demo.sql` e `src/database/seed-demo.ts`
- **Lógica de Ativação**: `src/utils/demoMode.ts` e `src/utils/erpIntegration.ts`
- **Credenciais Demo**:
  - **Admin**: `demo@plataforma.com` / `demo123`
  - **Atendente**: `atendente@plataforma.com` / `demo123`
  - **Supervisor**: `supervisor@plataforma.com` / `demo123`

### Prompt C: Simulador de Cliente WhatsApp

- **Página do Simulador**: `omnichannel-frontend/src/app/demonstracao/page.tsx`
- **Painel de Controle**: `omnichannel-frontend/src/app/demonstracao/controle/page.tsx`
- **Rotas Públicas**: `src/routes/public.ts`
- **Endpoints Públicos**:
  - `POST /api/public/conversations`
  - `POST /api/public/conversations/:id/messages`
  - `GET /api/public/conversations/:id/messages`
  - `GET /api/public/demo/status`

## 📋 Como Usar o Modo de Demonstração

1. **Execute o Seeding**: Rode o script `seed-demo.ts` para popular o banco de dados com os dados de demonstração.
   ```bash
   cd omnichannel-platform
   npx ts-node src/database/seed-demo.ts
   ```

2. **Inicie os Servidores**: Inicie o backend e o frontend da plataforma.

3. **Acesse o Painel de Controle**: Abra a página `/demonstracao/controle` no navegador. Este é o seu ponto de partida para a apresentação.

4. **Abra o Simulador**: No painel de controle, clique em "Abrir Simulador". Uma nova aba será aberta com a interface do WhatsApp.

5. **Interaja com o Chatbot**: No simulador, comece a interagir com o chatbot. Use os CPFs dos clientes fictícios para testar os fluxos de consulta e atualização de dados.

6. **Acesse o Dashboard**: No painel de controle, clique em "Abrir Dashboard". Faça login com o usuário `demo@plataforma.com` para mostrar a visão do administrador.

7. **Demonstre as Funcionalidades**: Use o roteiro no painel de controle para guiar sua apresentação, mostrando as conversas em tempo real, os relatórios, o construtor de fluxo, etc.

8. **Resete a Demonstração**: Ao final da apresentação, você pode usar o botão "Resetar Demonstração" no painel de controle para limpar os dados e preparar o ambiente para a próxima demonstração.

## ✨ Vantagens do Modo de Demonstração

- **Apresentações Profissionais**: Crie uma experiência imersiva e realista para seus clientes.
- **Ambiente Controlado**: Evite imprevistos e dependências de sistemas externos.
- **Reutilizável**: Resete facilmente o ambiente para múltiplas demonstrações.
- **Foco no Produto**: Destaque as funcionalidades da plataforma sem se preocupar com a infraestrutura.
- **Impressione seus Clientes**: Mostre o poder da sua solução de forma prática e visualmente atraente.


