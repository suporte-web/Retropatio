# APP RETROPATIO - Sistema de Controle de Pátio e Portaria

## Visão Geral

Sistema web completo para controle de entrada e saída de veículos e visitantes em pátios logísticos, com perfis de usuário RBAC e operação multi-filial.

## Arquitetura

### Stack Tecnológico
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + TypeScript
- **Banco de Dados**: PostgreSQL (Neon)
- **Real-time**: WebSockets (ws)
- **Autenticação**: Passport.js + Session-based
- **ORM**: Drizzle ORM

### Estrutura Multi-tenant
- Cada filial tem isolamento lógico de dados
- Schema PostgreSQL único com field `filialId`
- 3 filiais configuradas: Guarulhos, Araraquara, Costeira

## Perfis de Usuário (RBAC)

### 1. Porteiro
- Registro de entrada e saída de veículos
- Visualização do mapa de vagas em tempo real
- Gestão de visitantes (cadastro, aprovação, entrada/saída)
- Atendimento de chamadas de motorista

### 2. Cliente
- Dashboard com visão geral das operações
- Relatórios de movimentação com filtros
- Exportação de dados (CSV)
- Visualização de status em tempo real

### 3. Gestor/Admin
- CRUD completo de usuários
- CRUD completo de filiais
- Gestão de permissões por filial
- Acesso a logs de auditoria
- Visão consolidada de todas as filiais

## Funcionalidades Principais

### Controle de Portaria
- Registro de entrada de veículos (placa cavalo, carreta, motorista, CPF, transportadora, cliente, doca)
- Atribuição de vagas
- Controle de situação do veículo (aguardando, docado, carregando, descarregando, finalizado)
- Registro de saída com liberação automática da vaga

### Mapa de Vagas
- Visualização em tempo real de todas as vagas
- Status: Livre/Ocupada
- Atualização via WebSocket
- 20 vagas por filial

### Gestão de Visitantes
- Cadastro de visitantes e prestadores de serviço
- Fluxo de aprovação
- Status: Aguardando, Aprovado, Dentro, Saiu
- Controle de entrada e saída

### Sistema de Chamadas
- Notificações de motorista
- Status: Pendente, Atendida, Cancelada
- Atualização em tempo real via WebSocket

### Relatórios
- Filtros por:
  - Período (data início/fim)
  - Cliente
  - Transportadora
  - Situação do veículo
- Exportação em CSV
- Histórico completo de movimentações

### Auditoria
- Registro completo de todas as ações
- Informações capturadas:
  - Usuário que executou a ação
  - Data/hora
  - Filial
  - Tipo de ação
  - Entidade afetada
  - Dados antes e depois (JSON)
  - IP e User Agent

## WebSocket - Real-time

### Eventos Broadcast
- `veiculo_entrada`: Nova entrada de veículo
- `veiculo_saida`: Saída de veículo
- `vaga_updated`: Atualização de status de vaga
- `visitante_novo`: Novo visitante cadastrado
- `visitante_aprovado`: Visitante aprovado
- `visitante_entrada`: Entrada de visitante
- `visitante_saida`: Saída de visitante
- `chamada_nova`: Nova chamada de motorista
- `chamada_atendida`: Chamada atendida

### Conexão
```javascript
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);
```

## Endpoints da API

### Autenticação
- `POST /api/register` - Criar nova conta (retorna accessToken + refreshToken)
- `POST /api/login` - Fazer login (retorna accessToken + refreshToken)
- `POST /api/refresh` - Renovar access token usando refresh token
- `POST /api/logout` - Fazer logout (invalida refresh token)
- `GET /api/user` - Obter usuário atual (requer Bearer token)

**Autenticação**: Todas as rotas protegidas requerem header `Authorization: Bearer <accessToken>`

### Usuários
- `GET /api/users` - Listar todos os usuários
- `POST /api/users` - Criar novo usuário
- `PATCH /api/users/:id` - Atualizar usuário
- `GET /api/user-filiais` - Filiais do usuário atual

### Filiais
- `GET /api/filiais` - Listar todas as filiais
- `POST /api/filiais` - Criar nova filial
- `PATCH /api/filiais/:id` - Atualizar filial

### Veículos
- `GET /api/veiculos/:filialId` - Veículos de uma filial
- `GET /api/veiculos/all` - Todos os veículos
- `POST /api/veiculos` - Registrar entrada
- `PATCH /api/veiculos/:id/saida` - Registrar saída

### Vagas
- `GET /api/vagas/:filialId` - Vagas de uma filial
- `POST /api/vagas` - Criar nova vaga
- `PATCH /api/vagas/:id` - Atualizar vaga

### Visitantes
- `GET /api/visitantes/:filialId` - Visitantes de uma filial
- `POST /api/visitantes` - Cadastrar visitante
- `PATCH /api/visitantes/:id/aprovar` - Aprovar visitante
- `PATCH /api/visitantes/:id/entrada` - Registrar entrada
- `PATCH /api/visitantes/:id/saida` - Registrar saída

### Chamadas
- `GET /api/chamadas/:filialId` - Chamadas de uma filial
- `POST /api/chamadas` - Criar chamada
- `PATCH /api/chamadas/:id/atender` - Atender chamada

### Auditoria
- `GET /api/audit-logs` - Todos os logs de auditoria (últimos 1000)

## Credenciais de Teste

```
Admin:
  username: admin
  password: admin123
  role: gestor

Porteiro:
  username: porteiro
  password: porteiro123
  role: porteiro

Cliente:
  username: cliente
  password: cliente123
  role: cliente
```

## Estrutura do Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `filiais` - Filiais/unidades
- `user_permissions` - Permissões de usuário por filial
- `refresh_tokens` - Tokens JWT de atualização (com expiração)
- `veiculos` - Registro de veículos
- `vagas` - Vagas do pátio
- `visitantes` - Visitantes e prestadores
- `chamadas` - Chamadas de motorista
- `audit_logs` - Logs de auditoria

## Segurança

### Autenticação
- JWT com access tokens (15 minutos) e refresh tokens (7 dias)
- Passwords hasheados com scrypt
- Bloqueio automático após 5 tentativas falhas (15 minutos)
- Refresh tokens armazenados no PostgreSQL com expiração
- Limpeza automática de tokens expirados a cada hora

### Autorização
- Bearer token em Authorization header para todas as rotas protegidas
- RBAC com 3 perfis distintos (requireRole middleware)
- Validação Zod em todos os request bodies
- Header X-Filial obrigatório para isolamento multi-tenant
- Sanitização de dados sensíveis (password, loginAttempts, lockedUntil) em todas as respostas

### Auditoria
- Todas as ações críticas são registradas
- Captura de IP e User Agent
- Registro de estado antes/depois para mudanças

## Design System

### Cores
- Primary: Azul #3B82F6 (operações principais)
- Success: Verde (status positivo)
- Warning: Amarelo/Laranja (aguardando, alertas)
- Danger: Vermelho (erros, cancelamentos)
- Sidebar: Azul escuro profissional

### Tipografia
- Font: Inter (Google Fonts)
- Hierarquia clara para operações logísticas
- Foco em legibilidade para longos períodos de uso

### Componentes
- Shadcn UI (Radix primitives)
- Design system consistente
- Dark mode support completo
- Responsivo (mobile, tablet, desktop)

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Push schema changes
npm run db:push

# Seed database
tsx server/seed.ts

# Build
npm run build
```

## Próximas Funcionalidades (Futuro)

1. Integração com ERP externo
2. Leitura automática de placas (LPR) com câmeras
3. Checklist digital com captura de fotos
4. Dashboard analítico com gráficos
5. Notificações por email e SMS (Twilio)
6. Relatórios em PDF
7. Aplicativo mobile
8. Impressão de etiquetas/comprovantes

## Notas Técnicas

- O sistema usa React Query para cache e sincronização de dados
- Estados de loading e erro implementados em todas as telas
- Validação de formulários com Zod
- Date-fns para formatação de datas em PT-BR
- WebSocket path: `/ws` (separado do Vite HMR)
- Session secret configurado via environment variable

## Estrutura de Arquivos

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── hooks/       # Custom hooks (useAuth)
│   │   └── lib/         # Utilities (queryClient, protected-route)
├── server/              # Backend Express
│   ├── auth.ts         # Configuração de autenticação
│   ├── db.ts           # Conexão com banco
│   ├── routes.ts       # Rotas da API + WebSocket
│   ├── storage.ts      # Camada de acesso a dados
│   └── seed.ts         # Script de seed
├── shared/             # Código compartilhado
│   └── schema.ts       # Schemas Drizzle + Zod
└── design_guidelines.md # Guidelines de design
```

## Status do Projeto

✅ Schema e modelos de dados completos
✅ Autenticação e autorização
✅ CRUD completo de todas entidades
✅ WebSocket para atualizações em tempo real
✅ Sistema de auditoria
✅ Interface completa para todos os perfis
✅ Dark mode
✅ Responsivo
✅ Exportação CSV

## Contato e Suporte

Sistema desenvolvido para controle de pátios logísticos com foco em eficiência operacional e segurança.
