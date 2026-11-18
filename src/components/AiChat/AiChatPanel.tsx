import { Badge, Box, Button, Flex, HStack, IconButton, Text, Textarea, VStack, useColorMode } from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useFinance } from '../../context/FinanceContext';
import { useAiBridge } from '../../hooks/useAiBridge';
import { useAllCryptoPrices } from '../../hooks/useAllCryptoPrices';
import { useCurrencyRates } from '../../hooks/useCurrencyRates';
import { loadAiPreferencias, loadAiToken } from '../../services/ai/aiSettings';
import { buildSnapshot } from '../../services/ai/buildSnapshot';
import { MAX_PERGUNTA_CHARS } from '../../services/ai/chatProtocol';
import type { Conexao } from '../../services/ai/chatReducer';
import { descreverSessao } from '../../services/ai/sessaoInfo';
import { darkColors, lightColors } from '../../theme/colors';
import { ChatMessage } from './ChatMessage';

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
  const { data } = useFinance();
  const { prices } = useAllCryptoPrices(data.cryptos);
  const { usdToBrl } = useCurrencyRates();
  const snapshot = useMemo(() => buildSnapshot(data, prices, usdToBrl), [data, prices, usdToBrl]);
  const [token] = useState(loadAiToken);
  const [preferencias] = useState(loadAiPreferencias);
  const { state, enviar, limpar } = useAiBridge(snapshot, token, preferencias);
  const sessaoInfo = descreverSessao(state.sessao, preferencias);
  const [texto, setTexto] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.mensagens]);

  const podeEnviar = state.conexao === 'conectada' && !state.ocupado;
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
        <Badge colorScheme={status.cor} px={2} py={1} borderRadius="md" whiteSpace="normal">
          {status.texto}
        </Badge>
        <Button size="xs" variant="ghost" onClick={limpar} isDisabled={state.mensagens.length === 0}>
          Limpar chat
        </Button>
      </HStack>

      {sessaoInfo.atual && (
        <Box fontSize="xs" mt={-1}>
          <Text color={colors.textMuted}>Modelo da sessão: {sessaoInfo.atual}</Text>
          {sessaoInfo.aviso && <Text color={colors.warning}>{sessaoInfo.aviso}</Text>}
        </Box>
      )}

      <Box flex={1} overflowY="auto" pr={1}>
        <VStack spacing={3} align="stretch">
          {state.mensagens.length === 0 && (
            <Text fontSize="sm" color={colors.textMuted}>
              Pergunte sobre seus investimentos, saldos, criptos ou evolução do patrimônio.
            </Text>
          )}
          {state.mensagens.map((m) => (
            <ChatMessage key={m.id} mensagem={m} />
          ))}
          <div ref={fimRef} />
        </VStack>
      </Box>

      <VStack spacing={1} align="stretch">
        <HStack align="flex-end">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Escreva sua pergunta (Enter envia, Shift+Enter quebra linha)"
            maxLength={MAX_PERGUNTA_CHARS}
            rows={2}
            resize="none"
            isDisabled={!podeEnviar}
          />
          <IconButton
            aria-label="Enviar pergunta"
            icon={<FaPaperPlane />}
            colorScheme="brand"
            onClick={submeter}
            isDisabled={!podeEnviar || !texto.trim()}
            isLoading={state.ocupado}
          />
        </HStack>
        <Text fontSize="xs" color={colors.textMuted}>
          Para a IA esquecer a conversa, use /clear no terminal.
        </Text>
      </VStack>
    </Flex>
  );
};
