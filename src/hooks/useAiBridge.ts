import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { bridgeUrl, createBridgeClient, type BridgeClient } from '../services/ai/bridgeClient';
import type { FinanceSnapshot } from '../services/ai/chatProtocol';
import { CHAT_INICIAL, chatReducer, type ChatState } from '../services/ai/chatReducer';

const MSG_DESCONECTADA = 'A IA está desconectada. Rode npm run ia.';

export type AiBridge = { state: ChatState; enviar(texto: string): void; limpar(): void };

/** Liga o chat ao canal local. Conectar/reconectar e enviar dados nunca acionam o modelo. */
export const useAiBridge = (snapshot: FinanceSnapshot | null, token: string): AiBridge => {
  const [state, dispatch] = useReducer(chatReducer, CHAT_INICIAL);
  const clientRef = useRef<BridgeClient | null>(null);
  const snapshotJson = useMemo(() => (snapshot ? JSON.stringify(snapshot) : null), [snapshot]);
  const snapshotJsonRef = useRef<string | null>(snapshotJson);

  useEffect(() => {
    snapshotJsonRef.current = snapshotJson;
  }, [snapshotJson]);

  useEffect(() => {
    if (!token) return;
    const enviarSnapshot = (c: BridgeClient) => {
      const json = snapshotJsonRef.current;
      if (json) c.send({ type: 'snapshot', data: JSON.parse(json) as FinanceSnapshot });
    };
    const client = createBridgeClient({
      url: bridgeUrl(token),
      onServerMessage: (mensagem) => dispatch({ tipo: 'servidor', mensagem }),
      onConexao: (conexao) => {
        dispatch({ tipo: 'conexao', conexao });
        if (conexao === 'conectada') enviarSnapshot(client);
      },
    });
    clientRef.current = client;
    client.connect();
    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [token]);

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

  const limpar = useCallback(() => dispatch({ tipo: 'limpar' }), []);

  return { state: token ? state : { ...state, conexao: 'sem_token' }, enviar, limpar };
};
