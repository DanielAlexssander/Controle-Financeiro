# Canal `financas` (chat de IA do site pelo plano do Claude)

MCP próprio que funciona como *channel* do Claude Code: o chat do site manda a pergunta para uma
sessão interativa do Claude Code (logada com o seu plano) e a resposta volta para o chat, com o
mesmo texto que aparece no terminal.

```
site ──WebSocket 127.0.0.1:8790──► canal financas ──notificação──► sessão do Claude Code
  ▲                                                                     │
  └──────── hooks MessageDisplay / Stop / StopFailure (http) ◄──────────┘
```

## Comando global

| Onde | Comando | O que faz |
|---|---|---|
| Qualquer terminal, qualquer pasta | `financas` | Abre o site do **GitHub Pages** e a sessão do Claude com o canal |
| Qualquer terminal, qualquer pasta | `financas local` | Sobe o `npm run dev` se a porta 5173 estiver livre, abre o **localhost** e a sessão. Ao sair, encerra o dev server que ele subiu |
| Qualquer terminal | `financas ajuda` | Mostra o uso e a pasta do projeto |
| Dentro de qualquer sessão do Claude | `/financas` ou `/financas local` | Abre uma nova aba do Windows Terminal rodando `financas` (o canal só liga quando o Claude inicia) |
| Raiz do projeto | `npm run ia` | O mesmo que `financas local` |

Instalação (já feita nesta máquina): `cd mcp/financas-channel && npm link`. Para remover: `npm unlink -g financas-channel`.
O `/financas` fica em `~/.claude/commands/financas.md`.

O MCP também está registrado como **global** (aparece no `/mcp` de toda sessão):
`claude mcp add --scope user financas -- bun "<projeto>/mcp/financas-channel/src/server.ts"`.
Fora da sessão aberta pelo `financas` ele fica **inerte**: conecta, mas não abre a porta 8790, não vira canal e
não manda instruções (só o launcher define `FINANCAS_CANAL=1`). Assim nenhuma outra sessão "rouba" o chat.
Para remover: `claude mcp remove --scope user financas`.

O chat funciona nos dois ambientes porque quem conecta no canal é o seu Chrome:
- **Token automático:** o `financas` abre o site com `#ia=<token>`. O site salva o token, apaga esse trecho da barra
  de endereço e abre o chat sozinho. O fragmento (`#…`) nunca é enviado ao servidor.
- **GitHub Pages:** na primeira vez o Chrome pergunta se o site pode acessar a rede local: permita (só uma vez).

## Como usar

1. Rode `financas` (ou `financas local`, ou `npm run ia` na raiz do projeto).
2. O terminal mostra **o token do chat**. Copie (só precisa na primeira vez: ele fica salvo em
   `~/.claude/channels/financas/token`).
3. O Claude Code abre um aviso de canais de desenvolvimento: escolha
   **"I am using this for local development"**.
4. Confira o aviso abaixo do banner: `Channels (experimental) messages from server:financas inject directly in this session`.
5. O site abre com o chat já conectado (o token vai junto no endereço). Se abrir o site por outro caminho, o token
   também pode ser colado em **Configurações → Assistente de IA**.
6. Abra o chat pelo botão do robô no canto inferior direito.

Deixe o terminal do `npm run ia` aberto enquanto usar o chat. `/clear` nele faz a IA esquecer a conversa.

**Modelo da sessão** (prioridade de cima para baixo):
1. Variáveis `FINANCAS_MODEL` / `FINANCAS_EFFORT` (PowerShell: `$env:FINANCAS_MODEL='opus'; financas`).
2. **Preferência do site**: Configurações → Assistente de IA → Modelo. O chat entrega a preferência ao canal quando
   conecta; ela fica em `~/.claude/channels/financas/preferencias.json` e vale no **próximo** `financas`.
   Enquanto a sessão aberta estiver com outro modelo, o chat mostra o aviso.
3. Padrão: **Sonnet**, esforço **medium**.

O terminal mostra qual foi usado, por exemplo `Modelo: opus · esforço high (preferência do site)`.

## Uso do plano

- Parado (sem perguntas): **zero uso**. Nada fica verificando a página; atualizar os dados no site só
  guarda o snapshot no canal, sem acionar o modelo.
- Cada pergunta: 1 turno do Claude na sessão (com os dados anexados só quando mudaram).

## Testes

- Unitários e integração: `cd mcp/financas-channel && bun test` (e `bun run typecheck`).
- Fumaça do canal sem o Claude (não gasta uso; com o `npm run ia` **fechado**):
  `bun mcp/financas-channel/scripts/smoke.ts` → deve terminar com `SMOKE OK`.
- Pergunta real sem o site (com o `npm run ia` aberto):
  `bun mcp/financas-channel/scripts/dev-ask.ts "Quanto tenho em cripto?"` (usa dados de exemplo).

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Sem o aviso `Channels (experimental)…` | Rode `/mcp` na sessão. Se `financas` falhou, reinicie com `claude --debug` (mesmos argumentos de `scripts/start.ts`) e veja `~/.claude/debug/`. Se o motivo for a revisão do protocolo, adicione `MCP_SDK_GENERATION: 'v1'` ao `env` em `scripts/start.ts`. |
| Resposta aparece no terminal mas não no site | `/hooks` na sessão deve listar os 3 hooks http. Se não listar, remova o par `--setting-sources project` em `scripts/start.ts`. |
| Chat diz "Token inválido" | Cole de novo o token impresso pelo `npm run ia`. |
| Chat diz "A sessão do Claude não respondeu" | Veja o terminal: pode haver um diálogo esperando resposta. |
| `EADDRINUSE` na porta 8790 | Outra sessão `npm run ia` (ou o smoke) ainda está aberta. |

## Limitações

- *Channels* estão em prévia de pesquisa: o aviso aparece a cada início e o formato pode mudar.
- O Claude Code precisa ficar aberto e o PC ligado.
- Uso exclusivamente pessoal: não exponha a porta nem compartilhe o token.
- A resposta chega por blocos de linhas (é como o Claude Code entrega ao terminal).
- A IA não tem ferramentas: não lê arquivos, não roda comandos, não acessa a web.

## Verificação na sessão real

Verificado automaticamente (sem o Claude): handshake MCP com `claude/channel`, pergunta → notificação,
snapshot sem notificação, hooks → site (`scripts/smoke.ts`).

Pendente de rodar com a sessão real (não dá para automatizar: o aviso só é aceito no terminal):

- [ ] canal registrado (aviso `Channels (experimental)…`)
- [ ] `/mcp` mostra só `financas`; `/hooks` mostra os 3 hooks
- [ ] `dev-ask.ts` recebe a resposta igual à do terminal
- [ ] pedido de listar arquivos é recusado (sem ferramentas)
- [ ] `/usage` igual após 30 min parado
