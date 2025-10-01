const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://3001-ibm9e2tpgyi1y3a08h5id-e61bfc4f.manusvm.computer',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 20000,
    requestTimeout: 20000,
    responseTimeout: 20000,
    pageLoadTimeout: 60000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    
    env: {
      // URLs para teste
      FRONTEND_URL: 'https://3001-ibm9e2tpgyi1y3a08h5id-e61bfc4f.manusvm.computer',
      API_URL: 'https://3002-ibm9e2tpgyi1y3a08h5id-e61bfc4f.manusvm.computer',
      
      // Credenciais de teste
      ADMIN_EMAIL: 'demo@plataforma.com',
      ADMIN_PASSWORD: 'demo123',
      AGENT_EMAIL: 'atendente@plataforma.com',
      AGENT_PASSWORD: 'demo123',
      
      // Dados de teste
      HAPPY_CUSTOMER_CPF: '111.111.111-11',
      UNHAPPY_CUSTOMER_CPF: '222.222.222-22'
    }
  },
})

