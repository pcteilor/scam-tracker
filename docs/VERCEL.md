# Deploy na Vercel (Prisma 7 + Neon HTTP)

O projeto usa **Prisma 7** com o adapter **Neon HTTP** (`PrismaNeonHttp`). A conexão com o banco é feita por **HTTP/HTTPS** (porta 443), não por TCP na porta 5432, o que funciona em redes que bloqueiam PostgreSQL direto.

## O que você precisa fazer na Vercel

### 1. Variáveis de ambiente

No painel da Vercel: **Project → Settings → Environment Variables**.

Adicione **exatamente** estas duas variáveis (use os valores do seu projeto Neon):

| Nome            | Valor                                                                 | Ambientes      |
|-----------------|-----------------------------------------------------------------------|----------------|
| `DATABASE_URL`  | A connection string **pooled** (com `-pooler` no host). No Neon: use **DATABASE_URL** (Recommended) ou **POSTGRES_PRISMA_URL**. | Production, Preview, Development |
| `DIRECT_URL`    | A connection string **sem pooler**. No Neon: use **DATABASE_URL_UNPOOLED** ou **POSTGRES_URL_NON_POOLING**. | Production, Preview, Development |

- Não use outros nomes (ex.: `POSTGRES_URL`). O código espera `DATABASE_URL` e `DIRECT_URL`.
- O `postinstall` do projeto roda `prisma generate` após `npm install`; o `prisma.config.ts` usa `DIRECT_URL` para o CLI. Em deploy, o build usa `DATABASE_URL` em runtime (Neon HTTP).

### 2. Build e deploy

- **Build Command**: deixe o padrão (`next build`) ou use `npm run build`.
- **Install Command**: `npm install` (o `postinstall` já roda `prisma generate`).
- Não é obrigatório rodar `prisma migrate deploy` no build, **desde que** as tabelas já existam no banco (migrations aplicadas uma vez).

### 3. Migrations no banco de produção

As migrations **não** rodam automaticamente no deploy. Faça **uma vez** (ou quando mudar o schema):

- Na sua máquina, com `.env` ou `.env.local` apontando para o **mesmo** banco de produção (use as mesmas URLs que colocou na Vercel), rode:
  ```bash
  npx prisma migrate deploy
  ```

### 4. Seed (primeiro admin)

Se o banco de produção ainda não tiver o registro de admin:

- Com `DATABASE_URL` e `DIRECT_URL` de **produção** no seu `.env`, rode **uma vez**:
  ```bash
  npm run db:seed
  ```
- Depois use a senha definida (padrão `admin123` ou `ADMIN_SEED_PASSWORD`) para acessar `/admin`.

### 5. Resumo rápido

1. **Vercel → Settings → Environment Variables**: `DATABASE_URL` e `DIRECT_URL` (valores do Neon).
2. **Deploy**: push para o repositório conectado (ou deploy manual).
3. **Uma vez**: rodar `prisma migrate deploy` e `npm run db:seed` apontando para o banco de produção.

## Teste de conexão

Em qualquer ambiente (local ou produção), a rota **GET /api/test-db** testa a conexão com o banco:

- Resposta 200 com `{ "ok": true, "method": "neon-http" }` = conexão OK.
- Resposta 503 = falha de conexão (verifique as variáveis e o Neon).

Use isso para validar após o deploy.

## Erros comuns

### P1001: Can't reach database server at `...neon.tech:5432`

- **Causa**: `prisma migrate deploy` usa `DIRECT_URL` e conecta via **PostgreSQL (TCP, porta 5432)**. A **REST API** do Neon (ex.: `https://...apirest.../rest/v1`) é outro tipo de acesso e **não** é usada pelo Prisma para migrações — habilitar a API no Neon não resolve esse erro.
- **O que fazer**:
  1. No [Neon Console](https://console.neon.tech): abra o projeto → **Connection Details** e use a **Connection string** no modo **Direct** (não "Pooled"). Formato: `postgresql://user:pass@ep-xxx.sa-east-1.aws.neon.tech:5432/neondb?sslmode=require`. Defina como `DIRECT_URL` no `.env.local` e na Vercel.
  2. Se o projeto Neon estiver **paused** (plano free), clique em **Restore** e espere uns segundos.
  3. Se na sua rede a **porta 5432 estiver bloqueada** (comum em escritório/escola), rode as migrações de outro lugar:
     - **Opção A – GitHub Actions**: no repositório, **Settings → Secrets and variables → Actions** → crie o secret `DIRECT_URL` com a connection string Direct do Neon. Depois em **Actions → Migrate database → Run workflow**. O workflow roda `prisma migrate deploy` nos servidores do GitHub (onde 5432 está liberada).
     - **Opção B**: rode `npx prisma migrate deploy` em outra rede (ex.: celular como hotspot) ou em outro ambiente (ex.: máquina com 5432 liberada).

### 42P01: relation "public.Access" does not exist

- **Causa**: as migrações ainda não foram aplicadas nesse banco; as tabelas não existem.
- **O que fazer**: depois de corrigir a conexão (acima), rode **uma vez** `npx prisma migrate deploy` com `DIRECT_URL` apontando para esse banco. Em seguida, se precisar do admin inicial, rode `npm run db:seed`.
