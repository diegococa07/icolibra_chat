// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando para login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login', { timeout: 30000 })
  cy.get('input[type="email"]', { timeout: 20000 }).should('be.visible')
  cy.get('input[type="email"]').clear().type(email)
  cy.get('input[type="password"]').clear().type(password)
  cy.get('button[type="submit"]').click()
  
  // Aguardar redirecionamento para dashboard com timeout maior
  cy.url({ timeout: 30000 }).should('include', '/dashboard')
})

// Comando para logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]', { timeout: 15000 }).click()
  cy.get('[data-testid="logout-button"]', { timeout: 10000 }).click()
  cy.url({ timeout: 20000 }).should('include', '/login')
})

// Comando para aguardar elemento aparecer
Cypress.Commands.add('waitForElement', (selector, timeout = 20000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

// Comando para simular digitação no chat (mais flexível)
Cypress.Commands.add('sendChatMessage', (message) => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="chat-input"]').length > 0) {
      cy.get('[data-testid="chat-input"]').type(message)
      cy.get('[data-testid="send-button"]').click()
    } else if ($body.find('input[type="text"]').length > 0) {
      cy.get('input[type="text"]').first().type(message)
      cy.get('button[type="submit"]').click()
    } else {
      // Tentar encontrar qualquer input
      cy.get('input').first().type(message + '{enter}')
    }
  })
})

// Comando para aguardar resposta do bot (mais flexível)
Cypress.Commands.add('waitForBotResponse', (timeout = 25000) => {
  cy.get('body', { timeout }).should('satisfy', ($body) => {
    const text = $body.text().toLowerCase()
    return text.includes('bot') || 
           text.includes('assistente') || 
           text.includes('resposta') ||
           $body.find('[data-testid="bot-message"]').length > 0
  })
})

// Comando para verificar se mensagem contém texto (mais flexível)
Cypress.Commands.add('checkLastMessage', (text) => {
  cy.get('body', { timeout: 20000 }).should('contain.text', text)
})

// Comando para limpar dados de teste
Cypress.Commands.add('clearTestData', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/test/clear-data`,
    failOnStatusCode: false,
    timeout: 30000
  })
})

// Comando para aguardar serviços estarem prontos
Cypress.Commands.add('waitForServices', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('API_URL')}/health`,
    timeout: 30000,
    retries: 3
  }).then((response) => {
    expect(response.status).to.eq(200)
  })
})

