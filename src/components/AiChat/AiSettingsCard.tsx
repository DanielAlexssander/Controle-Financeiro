import {
  Box, Button, Card, CardBody, CardHeader, Code, Flex, Heading, HStack, Icon, Input, Select, Text, VStack,
  useColorMode, useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { loadAiPreferencias, loadAiToken, saveAiPreferencias, saveAiToken } from '../../services/ai/aiSettings';
import { MODELOS, type Esforco, type Modelo } from '../../services/ai/chatProtocol';
import { ClaudeCodeBrand, ClaudeModelName } from './ClaudeModels';
import { darkColors, lightColors } from '../../theme/colors';

const perfilModelo: Record<Modelo, string> = {
  sonnet: 'Equilibrado',
  opus: 'Mais capaz',
  haiku: 'Mais rápido',
};

const OPCOES_ESFORCO: readonly { valor: Esforco; rotulo: string }[] = [
  { valor: 'low', rotulo: 'Esforço baixo' },
  { valor: 'medium', rotulo: 'Esforço médio' },
  { valor: 'high', rotulo: 'Esforço alto' },
];

export const AiSettingsCard = () => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const toast = useToast();
  const [token, setToken] = useState(loadAiToken);
  const [preferencias, setPreferencias] = useState(loadAiPreferencias);

  const avisar = (ok: boolean, titulo: string, descricao: string) =>
    toast({
      title: ok ? titulo : 'Não foi possível salvar',
      description: ok ? descricao : 'O navegador bloqueou o armazenamento local.',
      status: ok ? 'success' : 'error',
      duration: 4000,
      isClosable: true,
      position: 'top-right',
    });

  const salvarToken = () => avisar(saveAiToken(token), 'Token salvo!', 'Abra o chat pelo botão do assistente.');

  const salvarPreferencias = () =>
    avisar(
      saveAiPreferencias(preferencias),
      'Preferência salva!',
      'Ela chega ao financas quando o chat conectar e vale no próximo início.',
    );

  return (
    <Card>
      <CardHeader pb={2}>
        <Flex align="center" gap={2} wrap="wrap">
          <Icon as={LuSparkles} color={colors.primary} />
          <Heading size="md" fontWeight="700">Assistente de IA</Heading>
          <ClaudeCodeBrand />
        </Flex>
      </CardHeader>
      <CardBody pt={2}>
        <VStack spacing={4} align="stretch">
          <Box p={4} borderRadius="lg" bg={colors.bgInput}>
            <fieldset className="model-picker">
              <legend>Modelos compatíveis</legend>
              <div className="model-options">
                {MODELOS.map(model => (
                  <label key={model}>
                    <input type="radio" name="modelo-assistente" value={model}
                      checked={preferencias.modelo === model}
                      onChange={() => setPreferencias({ ...preferencias, modelo: model })} />
                    <ClaudeModelName model={model} />
                    <small>{perfilModelo[model]}</small>
                  </label>
                ))}
              </div>
            </fieldset>
            <Text fontSize="sm" color={colors.textMuted} my={3}>
              Vale a partir do próximo <Code>financas</Code>. O chat avisa se a sessão aberta estiver com outro modelo.
            </Text>
            <HStack flexWrap={{ base: 'wrap', md: 'nowrap' }}>
              <Select
                aria-label="Esforço do modelo"
                value={preferencias.esforco}
                onChange={(e) => setPreferencias({ ...preferencias, esforco: e.target.value as Esforco })}
              >
                {OPCOES_ESFORCO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
              </Select>
              <Button colorScheme="brand" onClick={salvarPreferencias} flexShrink={0}>
                Salvar
              </Button>
            </HStack>
          </Box>

          <Box p={4} borderRadius="lg" bg={colors.bgInput}>
            <Text fontWeight="600" mb={1}>Token</Text>
            <Text fontSize="sm" color={colors.textMuted} mb={3}>
              Preenchido sozinho quando o site é aberto pelo <Code>financas</Code>. Use este campo só se abrir o
              site por outro caminho.
            </Text>
            <HStack>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                aria-label="Token do chat"
                placeholder="Token do chat"
                autoComplete="off"
              />
              <Button colorScheme="brand" onClick={salvarToken} isDisabled={!token.trim()} flexShrink={0}>
                Salvar token
              </Button>
            </HStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};
