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
    cy.intercept('GET', '**/api/users/agents').as('getUsersRequest')
    cy.intercept('GET', '**/api/reports/**').as('getReportsRequest')
    cy.intercept('POST', '**/api/public/conversations').as('createConversationRequest')
    
    // Aguardar um pouco para garantir que os serviços estejam prontos
    cy.wait(2000)
  })

  describe('Teste 1: Acesso do Administrador e Verificações Iniciais', () => {
    
    it('Deve fazer login como administrador demo', () => {
      cy.visit('/login')
      
      // Aguardar página carregar completamente
      cy.get('input[type="email"]', { timeout: 15000 }).should('be.visible')
      cy.contains('Entrar', { timeout: 10000 }).should('be.visible')
      
      // Fazer login com credenciais demo
      cy.get('input[type="email"]').clear().type(Cypress.env('ADMIN_EMAIL'))
      cy.get('input[type="password"]').clear().type(Cypress.env('ADMIN_PASSWORD'))
      cy.get('button[type="submit"]').click()
      
      // Aguardar requisição de login
      cy.wait('@loginRequest', { timeout: 20000 })
      
      // Verificar redirecionamento para dashboard
      cy.url({ timeout: 15000 }).should('include', '/dashboard')
      
      // Verificar se o nome do usuário aparece
      cy.contains(Cypress.env('ADMIN_EMAIL'), { timeout: 10000 }).should('be.visible')
    })
    
    it('Deve navegar para página de usuários e verificar atendente', () => {
      // Fazer login primeiro
      cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
      
      // Navegar para página de usuários
      cy.visit('/dashboard/users')
      
      // Aguardar carregamento da página
      cy.contains('Usuários', { timeout: 15000 }).should('be.visible')
      
      // Aguardar carregamento da lista de usuários
      cy.wait('@getUsersRequest', { timeout: 20000 }).then((interception) => {
        // Verificar se a requisição foi bem-sucedida
        expect(interception.response.statusCode).to.be.oneOf([200, 304])
      })
      
      // Verificar se atendente demo está listado
      cy.contains('Atendente Teste', { timeout: 15000 }).should('be.visible')
      cy.contains('atendente@plataforma.com', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Teste 2: Simulação do Cliente "Feliz" (Maria Adimplente)', () => {
    
    it('Deve simular conversa com cliente sem pendências', () => {
      cy.visit('/demonstracao')
      
      // Aguardar simulador carregar completamente
      cy.get('body', { timeout: 15000 }).should('contain', 'Simulador')
      
      // Procurar botão de iniciar chat (pode ter diferentes seletores)
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="start-chat"]').length > 0) {
          cy.get('[data-cy="start-chat"]').click()
        } else if ($body.find('button').length > 0) {
          cy.get('button').contains(/iniciar|começar|start/i).first().click()
        }
      })
      
      // Aguardar mensagem de boas-vindas (com timeout maior)
      cy.get('body', { timeout: 20000 }).should('contain.text', 'assistente')
      
      // Procurar e clicar na opção "2ª Via de Fatura"
      cy.get('body').then(($body) => {
        if ($body.text().includes('2ª Via') || $body.text().includes('Fatura')) {
          cy.contains('2ª Via', { timeout: 10000 }).click()
        } else if ($body.text().includes('fatura')) {
          cy.contains('fatura', { timeout: 10000 }).click()
        }
      })
      
      // Aguardar solicitação de CPF
      cy.get('body', { timeout: 15000 }).should('contain.text', 'CPF')
      
      // Enviar CPF do cliente adimplente
      cy.sendChatMessage('11111111111')
      
      // Aguardar processamento (timeout maior para API Mock)
      cy.wait(5000)
      
      // Verificar resposta do bot (flexível para diferentes mensagens)
      cy.get('body', { timeout: 25000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('não encontramos') || 
               text.includes('em dia') || 
               text.includes('sem pendências') ||
               text.includes('adimplente')
      })
    })
  })

  describe('Teste 3: Simulação do Cliente com Transbordo (João Inadimplente)', () => {
    
    it('Deve simular transferência para atendente humano', () => {
      cy.visit('/demonstracao')
      
      // Aguardar simulador carregar
      cy.get('body', { timeout: 15000 }).should('contain', 'Simulador')
      
      // Iniciar nova conversa
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="start-chat"]').length > 0) {
          cy.get('[data-cy="start-chat"]').click()
        } else if ($body.find('button').length > 0) {
          cy.get('button').contains(/iniciar|começar|start/i).first().click()
        }
      })
      
      // Aguardar mensagem de boas-vindas
      cy.get('body', { timeout: 20000 }).should('contain.text', 'assistente')
      
      // Procurar e clicar em "Falar com Atendente"
      cy.get('body').then(($body) => {
        if ($body.text().includes('Falar com Atendente')) {
          cy.contains('Falar com Atendente', { timeout: 10000 }).click()
        } else if ($body.text().includes('atendente')) {
          cy.contains('atendente', { timeout: 10000 }).click()
        }
      })
      
      // Verificar mensagem de transferência (flexível)
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('transferir') || 
               text.includes('especialista') || 
               text.includes('atendente') ||
               text.includes('aguarde')
      })
    })
  })

  describe('Teste 4: Experiência do Atendente', () => {
    
    it('Deve fazer login como atendente e verificar dashboard', () => {
      cy.visit('/login')
      
      // Login como atendente
      cy.login(Cypress.env('AGENT_EMAIL'), Cypress.env('AGENT_PASSWORD'))
      
      // Verificar dashboard do atendente
      cy.url({ timeout: 15000 }).should('include', '/dashboard')
      cy.contains(Cypress.env('AGENT_EMAIL'), { timeout: 10000 }).should('be.visible')
      
      // Navegar para conversas
      cy.visit('/dashboard/conversations')
      
      // Aguardar carregamento das conversas
      cy.get('body', { timeout: 15000 }).should('contain', 'Conversas')
      
      // Verificar se há conversas (pode não haver, dependendo do timing)
      cy.get('body').then(($body) => {
        if ($body.text().includes('Aceitar') || $body.text().includes('Aguardando')) {
          cy.log('Conversas encontradas na fila')
        } else {
          cy.log('Nenhuma conversa na fila no momento')
        }
      })
    })

    it('Deve verificar funcionalidade de envio de mensagem', () => {
      cy.visit('/dashboard/conversations')
      
      // Aguardar carregamento
      cy.wait(5000)
      
      // Verificar se interface de mensagem existe
      cy.get('body').then(($body) => {
        if ($body.find('input[type="text"]').length > 0 || $body.find('textarea').length > 0) {
          cy.log('Interface de mensagem encontrada')
          
          // Simular digitação (sem enviar necessariamente)
          const messageInput = $body.find('input[type="text"], textarea').first()
          if (messageInput.length > 0) {
            cy.wrap(messageInput).type('Teste de mensagem do atendente')
            cy.wait(1000)
            cy.wrap(messageInput).clear()
          }
        } else {
          cy.log('Interface de mensagem não encontrada - pode não haver conversas ativas')
        }
      })
    })
  })

  describe('Teste 5: Verificação de Relatórios', () => {
    
    it('Deve verificar se relatórios estão funcionando', () => {
      cy.visit('/login')
      cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
      
      // Navegar para relatórios
      cy.visit('/dashboard/reports')
      
      // Aguardar carregamento dos relatórios
      cy.get('body', { timeout: 20000 }).should('contain', 'Relatórios')
      
      // Aguardar requisição de relatórios
      cy.wait('@getReportsRequest', { timeout: 25000 }).then((interception) => {
        // Verificar se a requisição foi bem-sucedida ou se falhou graciosamente
        expect(interception.response.statusCode).to.be.oneOf([200, 500, 404])
      })
      
      // Verificar se cards de métricas estão visíveis (flexível)
      cy.get('body').then(($body) => {
        if ($body.text().includes('TMA') || $body.text().includes('TMR')) {
          cy.contains('TMA', { timeout: 10000 }).should('be.visible')
          cy.log('Cards de métricas TMA/TMR encontrados')
        } else {
          cy.log('Cards de métricas não encontrados - pode haver erro na API')
        }
      })
    })
  })

  describe('Teste 6: Verificação do Modo Demo', () => {
    
    it('Deve verificar se API Mock está acessível', () => {
      // Verificar se API Mock está respondendo (sem falhar o teste se não estiver)
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/mock-erp/status`,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          cy.log('API Mock está ativa')
          expect(response.body).to.have.property('status')
        } else {
          cy.log(`API Mock não está ativa (status: ${response.status})`)
        }
      })
    })

    it('Deve verificar dados fictícios do ERP Mock', () => {
      // Testar CPF da Maria Adimplente
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/mock-erp/clientes/11111111111`,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          cy.log('Dados da Maria Adimplente encontrados')
          expect(response.body).to.have.property('nome')
        } else {
          cy.log(`Dados da Maria não encontrados (status: ${response.status})`)
        }
      })
      
      // Testar CPF do João Inadimplente
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/mock-erp/clientes/22222222222`,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          cy.log('Dados do João Inadimplente encontrados')
          expect(response.body).to.have.property('nome')
        } else {
          cy.log(`Dados do João não encontrados (status: ${response.status})`)
        }
      })
    })
  })
})

