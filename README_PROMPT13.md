# Documentação - Prompt 13: Expansão do Modo de Demonstração

## Visão Geral

Este documento descreve as implementações realizadas para expandir o modo de demonstração da plataforma omnichannel, conforme solicitado no Prompt 13. O objetivo foi criar uma experiência de demonstração mais completa e convincente, simulando funcionalidades pendentes e adicionando suporte visual para múltiplos canais.

## Funcionalidades Implementadas

### 1. Novos Endpoints Mock no Backend

Foram adicionados quatro novos endpoints ao servidor de API Mock para simular funcionalidades específicas:

| Endpoint | Descrição | Resposta |
|----------|-----------|----------|
| `GET /api/mock-erp/leitura/:cpf` | Consulta próxima leitura do medidor | Data da próxima leitura, endereço, tipo de medidor |
| `GET /api/mock-erp/abastecimento/:cpf` | Verifica status de abastecimento | Status de fornecimento, região, qualidade de energia |
| `GET /api/mock-erp/simulacao-fatura/:cpf` | Simula valor da próxima fatura | Valor simulado, período, consumo estimado |
| `GET /api/mock-erp/negociacao/:cpf` | Busca proposta de negociação | Proposta personalizada baseada no CPF |

Comportamentos específicos:
- Para CPF 111.111.111-11 (Maria Adimplente): Sem débitos para negociar
- Para CPF 222.222.222-22 (João Inadimplente): Proposta de R$ 350,00 em 3x

### 2. Construtor de Fluxo Aprimorado

O dropdown "Ação a Executar" no construtor de fluxo foi expandido para incluir as novas ações mockadas:

- "Consultar Próxima Leitura (Mock)"
- "Verificar Status de Abastecimento (Mock)"
- "Simular Valor da Fatura (Mock)"
- "Buscar Proposta de Negociação (Mock)"

Estas ações permitem que o usuário demo crie fluxos de chatbot mais complexos para demonstração.

### 3. Simulador Omnichannel Visual

Foi implementado um seletor de canais no simulador de demonstração, permitindo alternar entre diferentes interfaces visuais:

| Canal | Características Visuais |
|-------|-------------------------|
| WhatsApp | Header verde, bolhas verdes, ícones do WhatsApp |
| Facebook Messenger | Header azul, bolhas azuis, estilo do Messenger |
| Instagram | Header gradiente roxo-rosa, bolhas com gradiente |
| Webchat | Header índigo, bolhas índigo, nome "Atendimento Online" |

Funcionalidades:
- Troca dinâmica de temas visuais ao selecionar um canal diferente
- Reinicialização da conversa com o bot ao trocar de canal
- Envio do tipo de canal correto para o backend

## Arquivos Modificados

1. **Backend:**
   - `/src/controllers/MockErpController.ts` - Adicionados novos métodos mock
   - `/src/routes/mockErp.ts` - Registrados novos endpoints

2. **Frontend:**
   - `/src/app/demonstracao/page.tsx` - Implementado seletor de canais e temas visuais
   - `/src/app/dashboard/flow-builder/page.tsx` - Atualizado dropdown de ações

## Como Testar

### Endpoints Mock:
```bash
curl -s "http://localhost:3000/api/mock-erp/leitura/111.111.111-11"
curl -s "http://localhost:3000/api/mock-erp/abastecimento/222.222.222-22"
curl -s "http://localhost:3000/api/mock-erp/simulacao-fatura/111.111.111-11"
curl -s "http://localhost:3000/api/mock-erp/negociacao/222.222.222-22"
```

### Simulador Omnichannel:
1. Acesse: `https://[URL_DO_FRONTEND]/demonstracao`
2. Use o dropdown "Simular Canal de Atendimento" para alternar entre canais
3. Observe as mudanças visuais no header e nas bolhas de mensagem
4. Teste o bot com CPFs diferentes: 111.111.111-11 e 222.222.222-22

### Construtor de Fluxo:
1. Acesse: `https://[URL_DO_FRONTEND]/dashboard/flow-builder`
2. Adicione um nó de integração
3. Verifique as novas opções no dropdown "Ação"

## Conclusão

A expansão do modo de demonstração foi concluída com sucesso, oferecendo uma experiência mais rica e convincente para apresentações ao cliente. As funcionalidades mockadas e o simulador omnichannel visual permitem demonstrar o potencial completo da plataforma, mesmo com algumas funcionalidades ainda em desenvolvimento.

