# Documentação da API

## Autenticação
### POST /api/auth/register
Body: `{ name, email, password }`
Retorno: `{ user, token }`

### POST /api/auth/login
Body: `{ email, password }`
Retorno: `{ user, token }`

## Transações (JWT obrigatório)
### GET /api/transactions
Retorno: `Transaction[]`

### POST /api/transactions
Body: `{ description, amount, type, category, date }`
Retorno: `Transaction`

### DELETE /api/transactions/reset
Retorno: `{ ok: true }`

## AI Advisor
### POST /api/ai-advisor
Body: `{ transactions: Transaction[] }`
Retorno: `{ resumo, dicas[], riscos[], oportunidades[] }` (pode vir de fallback)

