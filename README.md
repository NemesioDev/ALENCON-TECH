# ContábilDAS — Sistema Web de Automação Contábil (Emissão de DAS via SERPRO)

Aplicação Web Full-Stack voltada para funcionários de escritórios de contabilidade para automatizar a emissão individual e em lote das guias de impostos **DAS (Simples Nacional via PGDAS-D e MEI via PGMEI)** conectada à API oficial **Integra Contador do SERPRO**.

---

## Como Iniciar Rapidamente

Você pode dar dois cliques no arquivo [`iniciar_sistema.bat`](./iniciar_sistema.bat) ou executar nos terminais:

1. **Back-end (Porta 3001):**
   ```bash
   cd backend
   npm run dev
   ```
2. **Front-end (Porta 5173):**
   ```bash
   cd frontend
   npm run dev
   ```
3. Acesse no navegador: **http://localhost:5173**

---

## Estrutura do Projeto

- [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma): Banco de dados SQLite com as tabelas `ConfiguracaoEscritorio`, `EmpresasClientes` e `HistoricoGuiasDas`.
- [`backend/src/seed.ts`](./backend/src/seed.ts): Seed inicial com 5 empresas fictícias (MEI e Simples Nacional).
- [`backend/src/services/serproService.ts`](./backend/src/services/serproService.ts): Motor de integração SERPRO (`trial` e `production` com mTLS `.pfx`), serialização de `pedidoDados.dados`, parsing de `response.data.dados` e salvamento físico do PDF.
- [`backend/src/server.ts`](./backend/src/server.ts): Rotas REST (`/api/empresas`, `/api/configuracoes`, `/api/das/emitir-lote` e `/api/das/download/:id`).
- [`frontend/src/App.tsx`](./frontend/src/App.tsx): Interface SaaS dividida nas 3 telas principais (Painel de Emissão em Lote, Cadastro de Clientes e Configurações SERPRO).

