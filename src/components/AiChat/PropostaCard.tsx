import { Box, Button, HStack, Text, VStack, useColorMode } from '@chakra-ui/react';
import type { LinhaProposta } from '../../services/ai/descreverOperacoes';
import type { PropostaNaTela, StatusProposta } from '../../services/ai/chatReducer';
import { darkColors, lightColors } from '../../theme/colors';

type Props = {
  item: PropostaNaTela;
  linhas: readonly LinhaProposta[];
  /** Só com o chat conectado (a decisão precisa chegar ao financas). */
  podeDecidir: boolean;
  onConfirmar(): void;
  onRecusar(): void;
};

const RESULTADO: Record<Exclude<StatusProposta, 'pendente' | 'falhou'>, string> = {
  aplicada: 'Alterações aplicadas.',
  recusada: 'Recusada. Nada foi alterado.',
  expirou: 'Expirou sem resposta. Nada foi alterado.',
};

/** Cartão de confirmação de uma proposta da IA. Nada muda sem o clique em "Confirmar tudo". */
export const PropostaCard = ({ item, linhas, podeDecidir, onConfirmar, onRecusar }: Props) => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const corDaLinha = { adicionar: colors.success, editar: colors.text, apagar: colors.danger } as const;
  const { status, detalhe, proposta } = item;

  return (
    <Box role="group" aria-label="Proposta de alteração dos dados" border="1px solid" borderColor={colors.border} borderRadius="lg" p={3} mb={2} bg={colors.bgCard}>
      <Text fontWeight="700" fontSize="sm">A IA quer alterar seus dados</Text>
      <Text fontSize="sm" color={colors.textSecondary} mb={2}>{proposta.resumo}</Text>
      <VStack as="ul" align="stretch" spacing={1} listStyleType="none" m={0} p={0}>
        {linhas.map((l, i) => (
          <Text as="li" key={i} fontSize="sm" color={corDaLinha[l.tipo]} wordBreak="break-word">{l.texto}</Text>
        ))}
      </VStack>
      {status === 'pendente' ? (
        <HStack justify="flex-end" mt={3}>
          <Button size="sm" variant="ghost" onClick={onRecusar} isDisabled={!podeDecidir}>Recusar</Button>
          <Button size="sm" colorScheme="brand" onClick={onConfirmar} isDisabled={!podeDecidir}>Confirmar tudo</Button>
        </HStack>
      ) : (
        <Text role="status" mt={3} fontSize="sm" fontWeight="600" color={status === 'aplicada' ? colors.success : colors.textMuted}>
          {status === 'falhou' ? `Não aplicada: ${detalhe ?? 'erro desconhecido'}. Nada foi alterado.` : RESULTADO[status]}
        </Text>
      )}
    </Box>
  );
};
