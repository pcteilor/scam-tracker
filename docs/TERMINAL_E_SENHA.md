# Análise do terminal e senha do admin

## O que cada comando faz

| Comando | O que faz |
|--------|------------|
| **npm run db:generate** | Gera o Prisma Client a partir do `schema.prisma`. Cria os tipos e o cliente em `node_modules/@prisma/client`. Não acessa o banco. |
| **npm run db:migrate** | Roda as migrations no banco (cria/atualiza tabelas). Usa `DIRECT_URL` e precisa conseguir conectar ao Neon. |
| **npm run db:seed** | Executa `prisma/seed.ts`: se não existir registro em `AdminConfig`, cria um com a senha em hash (padrão `admin123` ou `ADMIN_SEED_PASSWORD`). Precisa de `DATABASE_URL` e de conexão com o banco. |
| **npm run dev** | Sobe o Next.js em modo desenvolvimento. Carrega `.env.local` e `.env`. O app usa `DATABASE_URL` para acessar o banco. |

---

## Análise do seu terminal (última execução)

- **db:generate** – **OK.** "Environment variables loaded from .env" e "✔ Generated Prisma Client".
- **db:migrate** – **Falhou.** Erro P1001: não conseguiu alcançar o servidor em `ep-noisy-rain-aco14m78.sa-east-1.aws.neon.tech:5432`. As variáveis foram carregadas do `.env`, mas a rede até o Neon falhou.
- **db:seed** – **Falhou.** Mesmo problema: "Can't reach database server" em `ep-noisy-rain-aco14m78-pooler...`. O seed precisa do banco para criar o admin.
- **next dev** – **Subiu.** "Environments: .env.local, .env" e "Ready in 888ms". O servidor está rodando; qualquer página que consulte o banco vai falhar enquanto a conexão com o Neon não funcionar.

Resumo: variáveis de ambiente estão ok; o que está impedindo é a **conectividade** com o Neon (rede/firewall/VPN ou projeto pausado).

---

## Senha do painel admin (sem nada no .env de senha)

A senha do admin **não** vem de variável de ambiente no momento do login. Ela vem do **banco de dados**:

1. O **seed** (`npm run db:seed`) é quem cria o único registro em `AdminConfig`, com um **hash bcrypt** da senha.
2. No seed, a senha usada é: `process.env.ADMIN_SEED_PASSWORD ?? "admin123"`. Se você não definir `ADMIN_SEED_PASSWORD` no `.env`, o padrão é **`admin123`**.
3. No login, o app compara a senha digitada com esse hash gravado no banco (`lib/auth.ts`: `verifyPassword(password, config.passwordHash)`).

**Se o seed nunca rodou com sucesso** (como no seu caso, por falha de conexão), **não existe** registro em `AdminConfig`. Nesse caso não há senha possível: você precisa conseguir conectar ao Neon, rodar `db:migrate` e depois `db:seed`. Depois disso, a senha do painel é **`admin123`** (ou a que você tiver definido em `ADMIN_SEED_PASSWORD`).

---

## Hash de senha no .env: senha em texto ou criptografada?

No **este projeto**, a variável **`ADMIN_PASSWORD_HASH`** **não é usada** em lugar nenhum do código. O login só usa o hash que está na tabela `AdminConfig`, preenchida pelo **seed**. Então colocar algo no `.env` com nome `ADMIN_PASSWORD_HASH` não altera a senha do admin.

Se no futuro você quiser definir o admin **direto no banco** (sem rodar o seed), aí sim você gravaria um **hash bcrypt** na coluna `passwordHash` de `AdminConfig`. Nesse caso:

- Você **não** coloca a senha em texto.
- Você **criptografa** a senha com bcrypt e coloca o **hash** (a string longa que o bcrypt gera). O login compara a senha digitada com esse hash usando `bcrypt.compare`.

Exemplo de geração de hash (Node):  
`require('bcrypt').hashSync('MinhaSenha', 10)` → você grava o resultado no banco, não a senha "MinhaSenha".

Resumo: no fluxo atual, a senha do painel é a que o seed definiu (**`admin123`** por padrão). Para usar o painel, é preciso que o seed tenha rodado com sucesso ao menos uma vez; não é necessário (e o código não usa) colocar hash de senha no `.env`.
