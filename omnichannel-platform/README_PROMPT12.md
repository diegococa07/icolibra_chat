# Prompt 12: Atualização Cadastral via Chatbot

**Feature**: Implementação do fluxo completo de atualização cadastral, habilitando a primeira operação de escrita (WRITE) no ERP via chatbot.

## Descrição Detalhada

Este prompt é um marco arquitetural que expande a plataforma para permitir que o chatbot não apenas leia, mas também escreva informações no sistema de origem (ERP). Para isso, foram aprimoradas três áreas principais: as Configurações, o Construtor de Fluxo e a Engine do Bot.

### Parte 1: Aprimoramento das Configurações de Integração (Jornada do Admin)

- **Interface Visual (`/dashboard/settings` - Aba "Integração")**:
  - Criada uma nova subseção chamada "Ações de Escrita (WRITE)".
  - Nesta seção, o Admin poderá definir uma lista de ações. Para cada ação, ele deve configurar:
    - **Nome da Ação**: Um nome amigável que aparecerá no Construtor de Fluxo (ex: "Atualizar Telefone e Email").
    - **Método HTTP**: Uma seleção (dropdown) entre `POST` e `PUT`.
    - **Endpoint**: A URL relativa da API (ex: `/clientes/{{customer_identifier}}/contato`).
    - **Corpo da Requisição (JSON)**: Uma área de texto para o Admin definir o template do JSON que será enviado. Ele poderá usar variáveis que serão coletadas no fluxo (ex: `{ "email": "{{email_cliente}}", "telefone": "{{telefone_cliente}}" }`).

### Parte 2: Aprimoramento do Construtor de Fluxo (Jornada do Admin)

- **Interface Visual (`/dashboard/flow-builder`)**:
  - Adicionado um novo tipo de nó ao Painel de Nós:
    - **Nó: "Coletar Informação" (Amarelo)**
      - **Propriedades**: Mensagem para o Usuário, Tipo de Validação (Texto Simples, Email, Número de Telefone), Nome da Variável, Mensagem de Erro de Validação.
  - Adicionado um segundo novo tipo de nó ao Painel de Nós:
    - **Nó: "Executar Ação de Escrita" (Vermelho)**
      - **Propriedades**: Ação a Executar (dropdown com ações configuradas), Pontos de Saída ("Sucesso" e "Falha").

### Parte 3: Atualização da Engine do Bot (Lógica de Backend)

- **Lógica de Processamento**:
  - **Processando o Nó "Coletar Informação"**:
    - A engine envia a "Mensagem para o Usuário".
    - Ela então entra em um estado de "espera" pela resposta.
    - Quando o usuário responde, a engine aplica a "Validação". Se falhar, envia a "Mensagem de Erro" e espera novamente. Se for sucesso, armazena a resposta em uma variável de sessão da conversa (ex: `{ email_cliente: 'novo@email.com' }`) e avança para o próximo nó.
  - **Processando o Nó "Executar Ação de Escrita"**:
    - A engine identifica a Ação selecionada (ex: "Atualizar Telefone e Email").
    - Busca os detalhes da ação nas Configurações (Método, Endpoint, Template do Corpo).
    - Substitui as variáveis no template do corpo JSON com os valores salvos na sessão da conversa.
    - Faz a chamada `POST`/`PUT` para a API do ERP.
    - Com base no código de status da resposta (2xx = Sucesso, 4xx/5xx = Falha), a engine avança para o nó conectado na saída correspondente.


