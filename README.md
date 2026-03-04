# Scam Tracker

Sistema de redirecionamento com rastreamento de acessos, perfis anonimizados e painel administrativo protegido por senha. Indicado para campanhas em que o usuário é redirecionado para URLs específicas (ex.: páginas de denúncia ou suporte) com registro de acessos e histórico por ID anônimo.

## Funcionalidades

- **Redirect invisível**: Acesso a `/r/[slug]` resulta em redirecionamento HTTP 302 para a URL configurada (ou para o Google se a campanha estiver fechada ou o slug não existir). Não há página intermediária visível.
- **Tracker**: Cada acesso registra IP, user-agent, referer e um ID anônimo (cookie `uid`), permitindo histórico por “perfil” sem dados pessoais.
- **Campanhas**: Gerenciador de campanhas com slug customizado, URL de destino, metadados (título, descrição, OG image) e status (aberta/fechada). Campanha fechada ainda registra o acesso mas redireciona para o Google.
- **404**: Slugs inexistentes são tratados como “campanha 404”: o acesso é registrado e o usuário é redirecionado para o Google.
- **Admin**: Área restrita por senha única (hash no banco). Dashboard com totais, relatórios por campanha e por ID anônimo.

## Requisitos

- Node.js 20.19+ (recomendado 22.x)
- Conta [Neon](https://neon.tech) (ou banco Postgres com connection string)

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. **Banco Neon**: Crie um projeto em [Neon](https://console.neon.tech) (ou use o banco já criado). No painel, copie:
   - **POSTGRES_PRISMA_URL** (recomendado) ou a URL **“Recommended for most uses”** (pooled).
   - **POSTGRES_URL_NON_POOLING** (ou equivalente sem `-pooler`) para migrations.

3. Crie o arquivo `.env.local` na raiz (nunca commite este arquivo):

   ```bash
   cp .env.example .env.local
   ```

   Edite `.env.local` e preencha:

   - `DATABASE_URL`: cole o valor de **POSTGRES_PRISMA_URL** (ou a URL pooled do Neon).
   - `DIRECT_URL`: cole a URL **sem pooler** (para o Prisma rodar migrations).

4. Gere o cliente Prisma e aplique as migrations (o `postinstall` já roda `prisma generate`; para migrations use):

   ```bash
   npm run db:migrate
   ```

5. (Opcional) Execute o seed para criar a senha inicial do admin:

   ```bash
   npm run db:seed
   ```

   A senha padrão em desenvolvimento é `admin123`, a menos que você defina `ADMIN_SEED_PASSWORD` no `.env.local`. Em produção, altere a senha ou use um hash definido por outro meio.

## Desenvolvimento local

1. Com `.env.local` configurado e migrations aplicadas:

   ```bash
   npm run dev
   ```

2. Acesse [http://localhost:3000](http://localhost:3000).

3. **Admin**: Acesse [http://localhost:3000/admin](http://localhost:3000/admin). Será redirecionado para `/admin/login`. Use a senha definida pelo seed (ex.: `admin123`) ou a que você configurou.

4. **Testar redirect**: Crie uma campanha no admin (ex.: slug `teste`, URL `https://www.google.com`) e acesse `http://localhost:3000/r/teste`. Deve redirecionar e registrar o acesso no dashboard.

5. **Teste de conexão**: GET [http://localhost:3000/api/test-db](http://localhost:3000/api/test-db) — retorna `{ "ok": true, "method": "neon-http" }` se o banco estiver acessível.

6. **Testes e2e (Playwright)**: `npm run test:e2e` (sobe o dev server e roda os testes). `npm run test:e2e:ui` abre a interface do Playwright.

## Deploy na Vercel (Prisma 7 + Neon HTTP)

O projeto usa **Prisma 7** com o adapter **Neon HTTP**: a conexão com o Neon é feita por **HTTPS** (porta 443), não por TCP 5432, o que funciona em redes que bloqueiam PostgreSQL.

1. Conecte o repositório ao projeto na Vercel.

2. Em **Project Settings → Environment Variables**, adicione:
   - **`DATABASE_URL`**: connection string **pooled** do Neon (Recommended ou POSTGRES_PRISMA_URL).
   - **`DIRECT_URL`**: connection string **sem pooler** (DATABASE_URL_UNPOOLED ou POSTGRES_URL_NON_POOLING).

3. O comando `postinstall` roda `prisma generate` após `npm install`; o build usa o cliente gerado. Não é obrigatório rodar migrations no build.

4. **Uma vez**: aplique as migrations no banco de produção com `npx prisma migrate deploy` (na sua máquina com env de produção). Depois rode `npm run db:seed` para criar o admin (senha padrão `admin123`).

Detalhes e checklist: **[docs/VERCEL.md](docs/VERCEL.md)**.

## Variáveis de ambiente

| Variável            | Descrição                                                                 | Obrigatório |
|---------------------|---------------------------------------------------------------------------|-------------|
| `DATABASE_URL`      | Connection string PostgreSQL **pooled** (uso em runtime)                 | Sim         |
| `DIRECT_URL`        | Connection string PostgreSQL **sem pooler** (migrations)                  | Sim         |
| `ADMIN_SEED_PASSWORD` | Senha usada pelo seed para criar o primeiro admin (apenas no seed)     | Não         |

## Estrutura do projeto

```
app/
  r/[slug]/route.ts       # Redirect 302 + tracker (cookie uid, log, redirect)
  admin/
    layout.tsx            # Layout raiz do admin
    login/page.tsx        # Página de login (senha única)
    (protected)/
      layout.tsx          # Proteção por sessão + navegação
      page.tsx            # Dashboard (visão geral)
      campaigns/          # Listagem, nova, editar campanha
      reports/
        campaign/[id]/    # Relatório por campanha (id "404" = acessos 404)
        user/[id]/        # Relatório por anonymous_id
  api/
    admin/login/          # POST senha → sessão
    admin/logout/         # POST → limpa sessão e redireciona
lib/
  db.ts                   # Prisma client singleton
  auth.ts                 # Sessão, hash e validação de senha
  redirect.ts             # Resolução slug → URL destino (campanha/404/Google)
prisma/
  schema.prisma           # Modelos Campaign, Access, AdminConfig
  migrations/             # Migrations SQL
  seed.ts                 # Cria primeiro AdminConfig (senha padrão dev)
```

## Banco de dados

- **Campaign**: slug (único), URL de redirecionamento, status (OPEN/CLOSED), metadados opcionais.
- **Access**: cada acesso com campaignId (ou null para 404), anonymousId, IP, user-agent, referer, requestedSlug (para 404).
- **AdminConfig**: um registro com hash da senha do admin.

Migrations: `npm run db:migrate` (dev) ou `npx prisma migrate deploy` (produção).  
Seed: `npm run db:seed`.  
Prisma Studio: `npm run db:studio` para inspecionar dados.

## Segurança

- Nunca commite `.env.local` nem credenciais no repositório.
- A área `/admin` (exceto `/admin/login`) é protegida por cookie de sessão. A senha é armazenada apenas em hash (bcrypt) na tabela `AdminConfig`.
- Troque a senha padrão do seed em produção e, se possível, rotacione a connection string do banco após qualquer exposição.

## Licença

Privado / uso interno.
