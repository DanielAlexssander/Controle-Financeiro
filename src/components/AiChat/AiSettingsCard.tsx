import {
  Button, Card, CardBody, CardHeader, Code, Flex, Heading, HStack, Icon, Input, Text, useColorMode, useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaRobot } from 'react-icons/fa';
import { loadAiToken, saveAiToken } from '../../services/ai/aiSettings';
import { darkColors, lightColors } from '../../theme/colors';

export const AiSettingsCard = () => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const toast = useToast();
  const [token, setToken] = useState(loadAiToken);

  const salvar = () => {
    const ok = saveAiToken(token);
    toast({
      title: ok ? 'Token salvo!' : 'Não foi possível salvar o token',
      description: ok ? 'Abra o chat pelo botão do robô.' : 'O navegador bloqueou o armazenamento local.',
      status: ok ? 'success' : 'error',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  return (
    <Card>
      <CardHeader pb={2}>
        <Flex align="center" gap={2}>
          <Icon as={FaRobot} color={colors.primary} />
          <Heading size="md" fontWeight="700">Assistente de IA</Heading>
        </Flex>
      </CardHeader>
      <CardBody pt={2}>
        <Text fontSize="sm" color={colors.textSecondary} mb={3}>
          O token aparece no terminal ao rodar <Code>npm run ia</Code>.
        </Text>
        <HStack p={4} borderRadius="lg" bg={colors.bgInput}>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token do chat"
            autoComplete="off"
          />
          <Button colorScheme="brand" onClick={salvar} isDisabled={!token.trim()}>
            Salvar token
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
};
