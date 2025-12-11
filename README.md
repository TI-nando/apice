# Ápice

Aplicação de controle financeiro com tema Dark/Luxo e Light/Contrast, AI Advisor (Gemini), autenticação JWT, Prisma + MySQL, React + Vite e Tailwind.

## Stack
- Frontend: React (Vite), TypeScript, Tailwind v4
- Backend: Node.js (Express), TypeScript
- Banco: MySQL (XAMPP)
- ORM: Prisma 5.15
- AI: Google Generative AI (Gemini)

## Pré‑requisitos
- Node.js 18+
- XAMPP com MySQL ativo em `localhost:3306`
- `.env` no `server` com:
  - `DATABASE_URL="mysql://root:@localhost:3306/finance_db"`
  - `JWT_SECRET="segredo_super_seguro"`
  - `GEMINI_API_KEY="SUA_CHAVE_AQUI"`

## Comandos
- `npm run start-all` — instala dependências, prepara Prisma e inicia front + back
- `npm run bootstrap` — instala dependências (`server` e `client`)
- `npm run setup` — aplica schema e gera Prisma Client
- `npm run dev` — executa `server` e `client` em paralelo
- `npm run build` — build do `server` e `client`
- `npm run start` — inicia apenas o backend (produção)
- `npm run preview` — preview do frontend

## Uso
1. Inicie MySQL pelo XAMPP
2. Na raiz `finance-flow-app`, rode `npm run start-all`
3. Acesse `http://localhost:5173/`
4. Crie conta ou faça login; Dashboard carrega transações do banco.
5. Use o botão “Menu” para abrir Sidebar e “Conselhos da AI” para o advisor.

## API (resumo)
- Autenticação (`/api/auth`)
  - `POST /register` { name, email, password }
  - `POST /login` { email, password }
- Transações (`/api`)
  - `GET /transactions` (JWT)
  - `POST /transactions` (JWT)
  - `DELETE /transactions/reset` (JWT)
- AI Advisor (`/api/ai-advisor`) — envia transações e recebe dicas (usa fallback se a AI falhar)

## Tema e UI/UX
- Dark: gradiente preto→vermelho escuro, glassmorphism, acentos dourados.
- Light: gradiente claro, sombras mais fortes, texto preto.
- Mobile: Navbar sticky, Sidebar como drawer com overlay, gráficos com altura adaptável.

## Estrutura
- `client/src/components` — Navbar, Sidebar, AIModal, SummaryCards, etc.
- `client/src/pages` — Login, Register, Dashboard
- `server/src` — rotas, controllers, middleware, prisma client

## Segurança
- JWT guard no backend.
- Sem exposição de segredos no cliente.

## Notas
- Ajuste `GEMINI_API_KEY` no `.env` do `server` para ativar a AI.
- O Prisma está fixado na versão 5.15 por compatibilidade.

