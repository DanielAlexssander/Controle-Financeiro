#!/usr/bin/env bun
// Cliente de teste do canal, sem o site:
//   bun mcp/financas-channel/scripts/dev-ask.ts "Quanto tenho em cripto?"
import {
  DEFAULT_BRIDGE_PORT,
  type FinanceSnapshot,
  type ServerMessage,
} from '../../../src/services/ai/chatProtocol.ts'
import { loadOrCreateToken } from '../src/auth'
import { TOKEN_DIR } from '../src/config'

const SNAPSHOT_EXEMPLO: FinanceSnapshot = {
  cotacaoUsdBrl: 5,
  totais: { bancosBrl: 10000, investimentosBrl: 6000, criptoUsd: 2000, criptoBrl: 10000, emprestimosBrl: 0, patrimonioBrl: 20000 },
  bancos: [{ nome: 'Banco Exemplo', saldoBrl: 10000, investimentos: [{ nome: 'CDB 110%', tipo: 'Renda fixa', valorBrl: 6000 }] }],
  criptos: [{ simbolo: 'BTC', quantidade: 0.02, precoCompraUsd: 60000, precoAtualUsd: 100000, valorAtualUsd: 2000, variacaoPct: 66.67 }],
  emprestimos: [],
  historicoMensal: [{ mes: '2026-10', patrimonioBrl: 19000 }],
  diversificacaoPct: { acoes: 0, cripto: 50, rendaFixa: 30, caixa: 20 },
  observacoes: ['Dados de exemplo do dev-ask, não são os dados reais do site.'],
}

const pergunta = process.argv[2]
if (!pergunta) {
  console.error('Uso: bun mcp/financas-channel/scripts/dev-ask.ts "sua pergunta"')
  process.exit(1)
}

const token = loadOrCreateToken(TOKEN_DIR)
const ws = new WebSocket(`ws://127.0.0.1:${DEFAULT_BRIDGE_PORT}/chat?token=${token}`, {
  headers: { Origin: 'http://localhost:5173' },
} as unknown as string[])

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ type: 'snapshot', data: SNAPSHOT_EXEMPLO }))
  ws.send(JSON.stringify({ type: 'pergunta', ia: 'claude', texto: pergunta }))
})

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(String(ev.data)) as ServerMessage
  if (msg.type === 'parcial') process.stdout.write(msg.texto)
  if (msg.type === 'status') console.error(`[status] ${msg.estado}`)
  if (msg.type === 'final') {
    console.log(`\n--- final ---\n${msg.texto}`)
    ws.close()
  }
  if (msg.type === 'erro') {
    console.error(`[erro] ${msg.mensagem}`)
    ws.close()
  }
})

ws.addEventListener('close', (ev) => {
  if (ev.code === 4001) console.error('Token recusado pelo canal.')
  process.exit(0)
})

ws.addEventListener('error', () => {
  console.error('Não conectou. A sessão `npm run ia` está aberta?')
  process.exit(1)
})
