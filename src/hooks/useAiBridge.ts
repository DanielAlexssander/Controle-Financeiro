import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { bridgeUrl, createBridgeClient, type BridgeClient } from '../services/ai/bridgeClient';
import type { FinanceSnapshot, ItemCriado, Preferencias, Proposta, ResultadoDecisao } from '../services/ai/chatProtocol';
import { CHAT_INICIAL, chatReducer, type ChatState } from '../services/ai/chatReducer';

const MSG_DESCONECTADA = 'A IA está desconectada. Rode financas no terminal.';

export type Decisao = { resultado: ResultadoDecisao; detalhe?: string; criados?: ItemCriado[] };

/** Devolve o motivo se a proposta não puder ser aplicada aos dados atuais (ex.: item inexistente). */
export type ValidarProposta = (proposta: Proposta) => string | null;

export type AiBridge = {
  state: ChatState;
  enviar(texto: string): void;
  limpar(): void;
  decidirProposta(id: string, decisao: Decisao): void;
};

/**
 * Liga o chat ao canal local. Conectar/reconectar, enviar dados e enviar a preferência de modelo
 * nunca acionam o modelo. A preferência fica salva no PC e vale no próximo `financas`.
 * O histórico fica só na memória do `financas` e chega ao conectar; nada é salvo no navegador.
 */
export const useAiBridge = (
  snapshot: FinanceSnapshot | null,
  token: string,
  preferencias: Preferencias,
  validarProposta: ValidarProposta = () => null,
): AiBridge => {
  const [state, dispatch] = useReducer(chatReducer, CHAT_INICIAL);
  const clientRef = useRef<BridgeClient | null>(null);
  const snapshotJson = useMemo(() => (snapshot ? JSON.stringify(snapshot) : null), [snapshot]);
  const snapshotJsonRef = useRef<string | null>(snapshotJson);
  const preferenciasRef = useRef<Preferencias>(preferencias);
  const validarRef = useRef<ValidarProposta>(validarProposta);
  /** Decisões já tomadas: reenviadas se o canal mandar a mesma proposta de novo (conexão caiu após o clique). */
  const decisoesRef = useRef(new Map<string, Decisao>());

  useEffect(() => {
    snapshotJsonRef.current = snapshotJson;
  }, [snapshotJson]);

  useEffect(() => {
    preferenciasRef.current = preferencias;
  }, [preferencias]);

  useEffect(() => {
    validarRef.current = validarProposta;
  }, [validarProposta]);

  const decidirProposta = useCallback((id: string, decisao: Decisao) => {
    decisoesRef.current.set(id, decisao);
    dispatch({ tipo: 'proposta_status', id, status: decisao.resultado, detalhe: decisao.detalhe });
    clientRef.current?.send({ type: 'decisao', id, ...decisao });
  }, []);

  useEffect(() => {
    if (!token) return;
    const enviarSnapshot = (c: BridgeClient) => {
      const json = snapshotJsonRef.current;
      if (json) c.send({ type: 'snapshot', data: JSON.parse(json) as FinanceSnapshot });
    };
    const client = createBridgeClient({
      url: bridgeUrl(token),
      onServerMessage: (mensagem) => {
        dispatch({ tipo: 'servidor', mensagem });
        if (mensagem.type !== 'proposta') return;
        const { id } = mensagem.proposta;
        const anterior = decisoesRef.current.get(id);
        if (anterior) {
          client.send({ type: 'decisao', id, ...anterior });
          return;
        }
        const erro = validarRef.current(mensagem.proposta);
        if (erro) decidirProposta(id, { resultado: 'falhou', detalhe: erro });
      },
      onConexao: (conexao) => {
        dispatch({ tipo: 'conexao', conexao });
        if (conexao !== 'conectada') return;
        enviarSnapshot(client);
        client.send({ type: 'preferencias', preferencias: preferenciasRef.current });
      },
    });
    clientRef.current = client;
    client.connect();
    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [token, decidirProposta]);

  useEffect(() => {
    if (snapshotJson) clientRef.current?.send({ type: 'snapshot', data: JSON.parse(snapshotJson) as FinanceSnapshot });
  }, [snapshotJson]);

  const enviar = useCallback((texto: string) => {
    const t = texto.trim();
    if (!t) return;
    dispatch({ tipo: 'enviada', texto: t });
    const enviado = clientRef.current?.send({ type: 'pergunta', ia: 'claude', texto: t }) ?? false;
    if (!enviado) dispatch({ tipo: 'servidor', mensagem: { type: 'erro', mensagem: MSG_DESCONECTADA } });
  }, []);

  /** Apaga o chat na tela e o histórico guardado no `financas` (a memória da IA só sai com /clear). */
  const limpar = useCallback(() => {
    dispatch({ tipo: 'limpar' });
    clientRef.current?.send({ type: 'limpar' });
  }, []);

  return { state: token ? state : { ...state, conexao: 'sem_token' }, enviar, limpar, decidirProposta };
};
