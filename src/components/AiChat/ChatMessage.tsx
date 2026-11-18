import { Box, Flex, HStack, Spinner, Text, useColorMode } from '@chakra-ui/react';
import type { ChatMensagem } from '../../services/ai/chatReducer';
import { darkColors, lightColors } from '../../theme/colors';
import { MarkdownResposta } from './MarkdownResposta';

type Cores = typeof lightColors;

// Visual das respostas: tabelas com borda, cabeçalho destacado, linhas zebradas e rolagem
// horizontal; títulos, listas, citações e código no padrão do tema.
const markdownSx = (c: Cores) => ({
  lineHeight: 1.6,
  '& > :first-of-type': { mt: 0 },
  '& > :last-child': { mb: 0 },
  '& p': { my: 2 },
  '& h1, & h2, & h3, & h4': { fontWeight: 700, lineHeight: 1.3, mt: 4, mb: 2 },
  '& h1': { fontSize: 'lg' },
  '& h2': { fontSize: 'md' },
  '& h3, & h4': { fontSize: 'sm' },
  '& ul, & ol': { pl: 5, my: 2 },
  '& li': { my: 1 },
  '& li > ul, & li > ol': { my: 1 },
  '& li input[type="checkbox"]': { mr: 2 },
  '& strong': { fontWeight: 700, color: c.text },
  '& a': { color: c.primary, textDecoration: 'underline' },
  '& blockquote': { borderLeft: '3px solid', borderColor: c.primary, pl: 3, my: 2, color: c.textSecondary },
  '& hr': { my: 3, borderColor: c.border },
  '& code': { fontFamily: 'mono', fontSize: 'xs', px: 1, py: 0.5, borderRadius: 'sm', bg: c.bgCard },
  '& pre': { p: 3, my: 2, borderRadius: 'md', overflowX: 'auto', bg: c.bgCard },
  '& pre code': { p: 0, bg: 'transparent' },
  '& .md-tabela': { overflowX: 'auto', my: 3, border: '1px solid', borderColor: c.border, borderRadius: 'md' },
  '& table': { width: '100%', borderCollapse: 'collapse', fontSize: 'xs' },
  '& th, & td': { px: 3, py: 2, borderBottom: '1px solid', borderColor: c.border, whiteSpace: 'nowrap' },
  '& th': { fontWeight: 700, textAlign: 'left', bg: c.bgCard },
  '& tbody tr:nth-of-type(even)': { bg: c.bgCardHover },
  '& tbody tr:last-of-type td': { borderBottom: 'none' },
});

export const ChatMessage = ({ mensagem }: { mensagem: ChatMensagem }) => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const doUsuario = mensagem.autor === 'voce';
  const pensando = mensagem.estado === 'escrevendo' && mensagem.texto === '';

  return (
    <Flex justify={doUsuario ? 'flex-end' : 'flex-start'}>
      <Box
        maxW={doUsuario ? '85%' : '100%'}
        minW={0}
        px={4}
        py={3}
        borderRadius="xl"
        bg={doUsuario ? '#29553f' : colors.bgInput}
        borderBottomRightRadius={doUsuario ? '3px' : 'xl'}
        borderBottomLeftRadius={doUsuario ? 'xl' : '3px'}
        color={doUsuario ? 'white' : mensagem.estado === 'erro' ? colors.danger : colors.text}
        fontSize="sm"
        wordBreak="break-word"
      >
        {doUsuario && <Text whiteSpace="pre-wrap">{mensagem.texto}</Text>}
        {!doUsuario && pensando && (
          <HStack spacing={2} color={colors.textMuted}>
            <Spinner size="xs" />
            <Text>pensando…</Text>
          </HStack>
        )}
        {!doUsuario && !pensando && (
          <Box sx={markdownSx(colors)}>
            <MarkdownResposta texto={mensagem.texto} />
          </Box>
        )}
      </Box>
    </Flex>
  );
};
