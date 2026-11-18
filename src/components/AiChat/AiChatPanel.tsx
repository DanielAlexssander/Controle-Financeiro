import { Badge, Box, Button, Flex, HStack, IconButton, Text, Textarea, VStack, useColorMode } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { LuArrowUp, LuSparkles } from 'react-icons/lu';
import { SiClaude } from 'react-icons/si';
import { useFinance } from '../../context/FinanceContext';
import { useAiBridge } from '../../hooks/useAiBridge';
import { useAllCryptoPrices } from '../../hooks/useAllCryptoPrices';
import { useCurrencyRates } from '../../hooks/useCurrencyRates';
import { loadAiPreferencias, loadAiToken } from '../../services/ai/aiSettings';
import { aplicarOperacoes } from '../../services/ai/aplicarOperacoes';
import { buildSnapshot } from '../../services/ai/buildSnapshot';
import { MAX_PERGUNTA_CHARS, type Proposta } from '../../services/ai/chatProtocol';
import type { ChatMensagem, Conexao } from '../../services/ai/chatReducer';
import { descreverOperacoes } from '../../services/ai/descreverOperacoes';
import { descreverSessao } from '../../services/ai/sessaoInfo';
import { darkColors, lightColors } from '../../theme/colors';
import { ChatMessage } from './ChatMessage';
import { CompatibleModels } from './ClaudeModels';
import { PropostaCard } from './PropostaCard';

const STATUS: Record<Conexao, { texto: string; cor: string }> = {
  sem_token: { texto: 'Configure o token do chat em Configurações.', cor: 'orange' },
  conectando: { texto: 'Conectando à IA…', cor: 'gray' },
  conectada: { texto: 'Claude conectado', cor: 'green' },
  desconectada: { texto: 'IA desconectada — rode financas no terminal.', cor: 'red' },
  recusada: { texto: 'Token inválido. Atualize em Configurações.', cor: 'red' },
  substituida: { texto: 'O chat foi aberto em outra aba.', cor: 'orange' },
};

/** Conteúdo do chat. Só é montado com o painel aberto: preços e WebSocket só rodam nesse período. */
export const AiChatPanel = () => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const { data, substituirDados } = useFinance();
  const { prices } = useAllCryptoPrices(data.cryptos);
  const { usdToBrl } = useCurrencyRates();
  const snapshot = useMemo(() => buildSnapshot(data, prices, usdToBrl), [data, prices, usdToBrl]);
  const [token] = useState(loadAiToken);
  const [preferencias] = useState(loadAiPreferencias);
  // Proposta que cita item inexistente falha sozinha (nada muda, então não precisa de clique).
  const validarProposta = useCallback((p: Proposta) => {
    const ensaio = aplicarOperacoes(data, p.operacoes, () => 'ensaio');
    return ensaio.ok ? null : ensaio.erro;
  }, [data]);
  const { state, enviar, limpar, decidirProposta } = useAiBridge(snapshot, token, preferencias, validarProposta);
  const sessaoInfo = descreverSessao(state.sessao, preferencias);
  const [texto, setTexto] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [state.mensagens]);

  const podeEnviar = state.conexao === 'conectada' && !state.ocupado;

  /** Só aqui os dados mudam: o usuário clicou em "Confirmar tudo". Tudo ou nada. */
  const confirmar = (p: Proposta) => {
    const r = aplicarOperacoes(data, p.operacoes, () => crypto.randomUUID());
    if (!r.ok) {
      decidirProposta(p.id, { resultado: 'falhou', detalhe: r.erro });
      return;
    }
    substituirDados(r.dados);
    decidirProposta(p.id, { resultado: 'aplicada', criados: r.criados });
  };

  const cartao = (m: ChatMensagem) =>
    m.proposta && (
      <PropostaCard
        item={m.proposta}
        linhas={descreverOperacoes(data, m.proposta.proposta.operacoes)}
        podeDecidir={state.conexao === 'conectada'}
        onConfirmar={() => m.proposta && confirmar(m.proposta.proposta)}
        onRecusar={() => m.proposta && decidirProposta(m.proposta.proposta.id, { resultado: 'recusada' })}
      />
    );
  const status = STATUS[state.conexao];

  const submeter = () => {
    if (!podeEnviar || !texto.trim()) return;
    enviar(texto);
    setTexto('');
  };

  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submeter();
    }
  };

  return (
    <Flex direction="column" h="100%" gap={3}>
      <HStack justify="space-between">
        <Badge role="status" textTransform="none" fontWeight="500" colorScheme={status.cor} px={2} py={1} borderRadius="md" whiteSpace="normal">
          {status.texto}
        </Badge>
        <Button size="xs" variant="ghost" onClick={limpar} isDisabled={state.mensagens.length === 0 || state.ocupado}>
          Limpar chat
        </Button>
      </HStack>

      <CompatibleModels />

      {sessaoInfo.atual && (
        <Box fontSize="xs" mt={-1}>
          <Text color={colors.textMuted} className="claude-model"><SiClaude aria-hidden="true" />Modelo da sessão: {sessaoInfo.atual}</Text>
          {sessaoInfo.aviso && <Text color={colors.warning}>{sessaoInfo.aviso}</Text>}
        </Box>
      )}

      <Box flex={1} minH={0} overflowY="auto" pr={1} display="flex" flexDirection="column">
        <VStack spacing={3} flex="1 0 auto" align="stretch">
          {state.mensagens.length === 0 && (
            <div className="chat-welcome"><span className="chat-symbol"><LuSparkles /></span>
              <h3>Como posso ajudar?</h3><p>Pergunte sobre seus investimentos, saldos, criptomoedas ou evolução do patrimônio.</p></div>
          )}
          {state.mensagens.map((m) => (
            <ChatMessage key={m.id} mensagem={m} proposta={cartao(m)} />
          ))}
          <div ref={fimRef} />
        </VStack>
      </Box>

      <VStack className="chat-composer" spacing={2} align="stretch">
        <HStack align="flex-end">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            aria-label="Sua pergunta" placeholder="Escreva sua pergunta…"
            maxLength={MAX_PERGUNTA_CHARS}
            rows={2}
            resize="none"
            isDisabled={!podeEnviar}
          />
          <IconButton
            aria-label="Enviar pergunta"
            icon={<LuArrowUp />}
            colorScheme="brand"
            onClick={submeter}
            isDisabled={!podeEnviar || !texto.trim()}
            isLoading={state.ocupado}
          />
        </HStack>
        <Text fontSize="xs" color={colors.textMuted}>
          Enter envia. Shift+Enter quebra a linha. Para a IA esquecer a conversa, use /clear no terminal.
        </Text>
      </VStack>
    </Flex>
  );
};
