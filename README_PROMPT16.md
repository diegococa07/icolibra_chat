# Prompt 16: Motor de Envio de Campanhas (Background Job)

## Visão Geral

Este prompt implementa o motor de envio de campanhas, um sistema de processamento em segundo plano (background) responsável por processar e enviar campanhas agendadas de forma assíncrona. O sistema utiliza uma arquitetura de filas com BullMQ e Redis para garantir escalabilidade, resiliência e controle sobre o processo de envio em massa.

## Funcionalidades Implementadas

### 1. Arquitetura de Filas com BullMQ e Redis

- **Dependências Instaladas**:
  - `bullmq`: Sistema de filas robusto baseado em Redis
  - `redis`: Armazenamento em memória para gerenciamento de filas
  - `winston`: Sistema de logging para rastreamento de operações

- **Configuração do Redis**:
  - Arquivo de configuração com opções para ambiente de desenvolvimento e produção
  - Suporte a autenticação e múltiplos bancos de dados
  - Configurações para melhorar a estabilidade e resiliência

- **Estrutura de Filas**:
  - `campaignSchedulerQueue`: Para verificar campanhas agendadas
  - `campaignSenderQueue`: Para processar o envio de campanhas
  - `messageProcessorQueue`: Para processar mensagens individuais

- **Gerenciador de Filas**:
  - Classe `QueueManager` para gerenciar todas as filas
  - Métodos para criar filas, workers e schedulers
  - Funções auxiliares para adicionar jobs às filas
  - Sistema de logging integrado para rastreamento de operações

### 2. Job Agendador (Scheduler)

- **Verificação Periódica**:
  - Job que roda a cada minuto para verificar campanhas com status `SCHEDULED` e data de agendamento no passado

- **Atualização de Status**:
  - Altera o status da campanha para `SENDING` ao iniciar o processamento

- **Disparo do Job de Envio**:
  - Adiciona um job à fila `campaignSenderQueue` para cada campanha encontrada

### 3. Job de Envio (Sender)

- **Busca de Destinatários**:
  - Integração com a API do ERP (mock) para buscar clientes com base nos critérios de segmentação da campanha

- **Enfileiramento de Mensagens Individuais**:
  - Itera sobre a lista de clientes e cria um novo job na fila `messageProcessorQueue` para cada cliente individual

- **Atualização de Status**:
  - Altera o status da campanha para `COMPLETED` após o enfileiramento de todas as mensagens

### 4. Job de Processamento de Mensagens Individuais

- **Substituição de Variáveis**:
  - Substitui as variáveis do template com dados específicos de cada cliente

- **Envio de Mensagens**:
  - Simula o envio da mensagem via WhatsApp API

- **Controle de Taxa de Envio**:
  - Implementado mecanismo de controle de taxa de envio para não sobrecarregar a API do WhatsApp

## Arquivos Criados/Modificados

### Backend

1. **Configuração**:
   - `/src/config/redis.ts`: Configuração do Redis e das filas

2. **Jobs**:
   - `/src/jobs/queue.ts`: Estrutura base para gerenciamento de filas
   - `/src/jobs/campaignScheduler.ts`: Job agendador para campanhas
   - `/src/jobs/campaignSender.ts`: Job de envio de campanhas
   - `/src/jobs/messageProcessor.ts`: Job de processamento de mensagens individuais
   - `/src/jobs/index.ts`: Arquivo de índice para inicialização de todos os jobs

3. **Utilitários**:
   - `/src/utils/logger.ts`: Utilitário de logging com Winston
   - `/src/utils/campaignErpIntegration.ts`: Utilitário para integração com ERP para campanhas

4. **Rotas e Controladores**:
   - `/src/routes/mockErp.ts`: Adicionado endpoint para busca de clientes no mock ERP
   - `/src/controllers/MockErpController.ts`: Adicionado método para busca de clientes no mock ERP

5. **Arquivo Principal**:
   - `/src/index.ts`: Adicionada inicialização dos jobs ao iniciar o servidor

## Como Usar

O motor de envio de campanhas funciona de forma totalmente automática em segundo plano. O fluxo de operação é o seguinte:

1. **Criação e Agendamento da Campanha**:
   - Um administrador ou supervisor cria e agenda uma campanha através do painel de campanhas (implementado no Prompt 15)

2. **Verificação do Agendador**:
   - O job agendador verifica a cada minuto se há campanhas agendadas para serem enviadas

3. **Processamento da Campanha**:
   - Quando uma campanha é encontrada, o agendador muda seu status para `SENDING` e dispara o job de envio

4. **Busca de Destinatários e Enfileiramento**:
   - O job de envio busca os destinatários no ERP e enfileira um job de processamento para cada mensagem individual

5. **Processamento e Envio das Mensagens**:
   - O job de processamento substitui as variáveis do template e simula o envio da mensagem via WhatsApp

6. **Conclusão da Campanha**:
   - Após o enfileiramento de todas as mensagens, o status da campanha é atualizado para `COMPLETED`

## Próximos Passos

Para finalizar a implementação do sistema de campanhas, seria necessário:

1. **Implementar testes e validações** para garantir que todo o fluxo funcione corretamente
2. **Integrar com uma API real do WhatsApp** para envio de mensagens em ambiente de produção
3. **Monitorar o desempenho** do sistema de filas e ajustar as configurações conforme necessário

## Conclusão

O motor de envio de campanhas implementa a lógica de backend necessária para processar e enviar campanhas agendadas de forma assíncrona. Combinado com o Gerenciamento de Templates de Mensagem (Prompt 14) e o Painel de Campanhas e Agendamento (Prompt 15), este sistema fornece uma solução completa para comunicação proativa com clientes através de mensagens WhatsApp aprovadas pela Meta.

