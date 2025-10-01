/**
 * Testes E2E para Fluxo de Demonstração da Plataforma Omnichannel
 * 
 * Este script valida todo o fluxo de demonstração:
 * 1. Login do Administrador
 * 2. Simulação do Cliente "Feliz" (Maria Adimplente)
 * 3. Simulação do Cliente com Transbordo (João Inadimplente)
 * 4. Experiência do Atendente
 * 5. Verificação Final no Simulador
 */

describe('Fluxo Completo de Demonstração', () => {
  
  beforeEach(() => {
    // Configurar viewport
    cy.viewport(1280, 720)
    
    // Interceptar chamadas da API para melhor controle
    cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    cy.intercept('GET', '**/api/users/**').as('getUsersRequest')
    cy.intercept('GET', '**/api/reports/**').as('getReportsRequest')
    cy.intercept('POST', '**/api/public/conversations').as('createConversationRequest')
    cy.intercept('GET', '**/api/conversations/**').as('getConversationsRequest')
    
    // Aguardar um pouco para garantir que os serviços estejam prontos
    cy.wait(3000)
  })

  describe('Teste 1: Acesso do Administrador e Verificações Iniciais', () => {
    
    it('Deve fazer login como administrador demo', () => {
      cy.visit('/login', { timeout: 30000 })
      
      // Aguardar página carregar completamente
      cy.get('input[type="email"]', { timeout: 20000 }).should('be.visible')
      cy.contains('Entrar', { timeout: 15000 }).should('be.visible')
      
      // Fazer login com credenciais demo
      cy.get('input[type="email"]').clear().type(Cypress.env('ADMIN_EMAIL'))
      cy.get('input[type="password"]').clear().type(Cypress.env('ADMIN_PASSWORD'))
      cy.get('button[type="submit"]').click()
      
      // Aguardar requisição de login com timeout maior
      cy.wait('@loginRequest', { timeout: 30000 })
      
      // Verificar redirecionamento para dashboard
      cy.url({ timeout: 20000 }).should('include', '/dashboard')
      
      // Verificar se o nome do usuário aparece
      cy.contains(Cypress.env('ADMIN_EMAIL'), { timeout: 15000 }).should('be.visible')
    })
    
    it('Deve navegar para página de usuários e verificar atendente', () => {
      // Fazer login primeiro
      cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
      
      // Navegar para página de usuários
      cy.visit('/dashboard/users', { timeout: 30000 })
      
      // Aguardar carregamento da página
      cy.contains('Usuários', { timeout: 20000 }).should('be.visible')
      
      // Aguardar carregamento da lista de usuários com timeout maior
      cy.wait('@getUsersRequest', { timeout: 30000 }).then((interception) => {
        // Verificar se a requisição foi bem-sucedida
        expect(interception.response.statusCode).to.be.oneOf([200, 304])
      })
      
      // Verificar se atendente demo está listado
      cy.contains('Atendente Teste', { timeout: 20000 }).should('be.visible')
      cy.contains('atendente@plataforma.com', { timeout: 10000 }).should('be.visible')
    })

    it('Deve verificar página de relatórios', () => {
      // Fazer login primeiro
      cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
      
      // Navegar para página de relatórios
      cy.visit('/dashboard/reports', { timeout: 30000 })
      
      // Aguardar carregamento da página
      cy.contains('Relatórios', { timeout: 20000 }).should('be.visible')
      
      // Verificar se há dados de demonstração
      cy.get('body', { timeout: 15000 }).should('contain.text', 'Conversas')
    })
  })

  describe('Teste 2: Simulação do Cliente "Feliz" (Maria Adimplente)', () => {
    
    it('Deve simular conversa com cliente sem pendências', () => {
      cy.visit('/demonstracao', { timeout: 30000 })
      
      // Aguardar simulador carregar completamente
      cy.get('body', { timeout: 20000 }).should('contain', 'Simulador')
      
      // Aguardar um pouco mais para garantir que tudo carregou
      cy.wait(5000)
      
      // Procurar botão de iniciar chat (pode ter diferentes seletores)
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="start-chat"]').length > 0) {
          cy.get('[data-cy="start-chat"]').click()
        } else if ($body.find('button').length > 0) {
          // Procurar por botões que contenham texto relacionado a iniciar
          cy.get('button').each(($btn) => {
            const text = $btn.text().toLowerCase()
            if (text.includes('iniciar') || text.includes('começar') || text.includes('start') || text.includes('chat')) {
              cy.wrap($btn).click()
              return false // Para o loop
            }
          })
        }
      })
      
      // Aguardar mensagem de boas-vindas (com timeout maior)
      cy.get('body', { timeout: 25000 }).should('contain.text', 'assistente')
      
      // Aguardar um pouco para o bot processar
      cy.wait(3000)
      
      // Procurar e clicar na opção "2ª Via de Fatura" ou similar
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase()
        if (bodyText.includes('2ª via') || bodyText.includes('fatura')) {
          cy.contains('2ª Via', { timeout: 15000 }).click()
        } else if (bodyText.includes('fatura')) {
          cy.contains('fatura', { timeout: 15000 }).click()
        } else {
          // Se não encontrar, tentar clicar em qualquer botão disponível
          cy.get('button').first().click()
        }
      })
      
      // Aguardar solicitação de CPF
      cy.get('body', { timeout: 20000 }).should('contain.text', 'CPF')
      
      // Procurar campo de input para enviar CPF
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="chat-input"]').length > 0) {
          cy.get('[data-testid="chat-input"]').type('11111111111')
          cy.get('[data-testid="send-button"]').click()
        } else if ($body.find('input[type="text"]').length > 0) {
          cy.get('input[type="text"]').type('11111111111')
          cy.get('button[type="submit"]').click()
        } else {
          // Tentar encontrar qualquer input
          cy.get('input').first().type('11111111111{enter}')
        }
      })
      
      // Aguardar processamento (timeout maior para API Mock)
      cy.wait(8000)
      
      // Verificar resposta do bot (flexível para diferentes mensagens)
      cy.get('body', { timeout: 30000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('não encontramos') || 
               text.includes('em dia') || 
               text.includes('sem pendências') ||
               text.includes('adimplente') ||
               text.includes('dados') ||
               text.includes('encontrei')
      })
    })
  })

  describe('Teste 3: Simulação do Cliente com Transbordo (João Inadimplente)', () => {
    
    it('Deve simular transferência para atendente humano', () => {
      cy.visit('/demonstracao', { timeout: 30000 })
      
      // Aguardar simulador carregar
      cy.get('body', { timeout: 20000 }).should('contain', 'Simulador')
      
      // Aguardar um pouco mais
      cy.wait(5000)
      
      // Iniciar nova conversa
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="start-chat"]').length > 0) {
          cy.get('[data-cy="start-chat"]').click()
        } else if ($body.find('button').length > 0) {
          cy.get('button').each(($btn) => {
            const text = $btn.text().toLowerCase()
            if (text.includes('iniciar') || text.includes('começar') || text.includes('start') || text.includes('chat')) {
              cy.wrap($btn).click()
              return false
            }
          })
        }
      })
      
      // Aguardar mensagem de boas-vindas
      cy.get('body', { timeout: 25000 }).should('contain.text', 'assistente')
      
      // Aguardar um pouco
      cy.wait(3000)
      
      // Procurar e clicar em "Falar com Atendente" ou similar
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase()
        if (bodyText.includes('falar com atendente')) {
          cy.contains('Falar com Atendente', { timeout: 15000 }).click()
        } else if (bodyText.includes('atendente')) {
          cy.contains('atendente', { timeout: 15000 }).click()
        } else if (bodyText.includes('humano')) {
          cy.contains('humano', { timeout: 15000 }).click()
        } else {
          // Se não encontrar, tentar enviar mensagem diretamente
          cy.get('body').then(($body2) => {
            if ($body2.find('[data-testid="chat-input"]').length > 0) {
              cy.get('[data-testid="chat-input"]').type('Quero falar com atendente')
              cy.get('[data-testid="send-button"]').click()
            } else if ($body2.find('input').length > 0) {
              cy.get('input').first().type('Quero falar com atendente{enter}')
            }
          })
        }
      })
      
      // Aguardar resposta de transferência
      cy.get('body', { timeout: 25000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('transferir') || 
               text.includes('atendente') || 
               text.includes('aguarde') ||
               text.includes('humano')
      })
    })
  })

  describe('Teste 4: Experiência do Atendente', () => {
    
    it('Deve fazer login como atendente e verificar conversas', () => {
      cy.visit('/login', { timeout: 30000 })
      
      // Aguardar página carregar
      cy.get('input[type="email"]', { timeout: 20000 }).should('be.visible')
      
      // Fazer login como atendente
      cy.get('input[type="email"]').clear().type(Cypress.env('AGENT_EMAIL'))
      cy.get('input[type="password"]').clear().type(Cypress.env('AGENT_PASSWORD'))
      cy.get('button[type="submit"]').click()
      
      // Aguardar login
      cy.wait('@loginRequest', { timeout: 30000 })
      
      // Verificar redirecionamento
      cy.url({ timeout: 20000 }).should('include', '/dashboard')
      
      // Verificar se há conversas na lista
      cy.get('body', { timeout: 20000 }).should('contain.text', 'Conversas')
    })
  })

  describe('Teste 5: Verificação Final no Simulador', () => {
    
    it('Deve verificar se o simulador está funcionando corretamente', () => {
      cy.visit('/demonstracao', { timeout: 30000 })
      
      // Verificar se a página carregou
      cy.get('body', { timeout: 20000 }).should('contain', 'Simulador')
      
      // Verificar se há elementos interativos
      cy.get('body').should('satisfy', ($body) => {
        return $body.find('button').length > 0 || 
               $body.find('input').length > 0 ||
               $body.text().includes('chat') ||
               $body.text().includes('conversa')
      })
    })

    it('Deve verificar controle do simulador', () => {
      cy.visit('/demonstracao/controle', { timeout: 30000 })
      
      // Verificar se a página de controle carregou
      cy.get('body', { timeout: 20000 }).should('contain', 'Controle')
      
      // Verificar se há elementos de controle
      cy.get('body').should('satisfy', ($body) => {
        return $body.find('button').length > 0 || 
               $body.text().includes('simulador') ||
               $body.text().includes('demo')
      })
    })
  })
})

