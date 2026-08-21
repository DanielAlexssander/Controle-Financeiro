import {
  Box, Container, Heading, Card, CardBody, CardHeader, VStack,
  Switch, Button, useColorMode, useToast, Text, Divider, HStack, Icon, Flex,
  Badge, SimpleGrid, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure
} from '@chakra-ui/react';
import { useRef } from 'react';
import { FaMoon, FaSun, FaDownload, FaUpload, FaTrash, FaInfoCircle, FaShieldAlt, FaDatabase, FaGithub } from 'react-icons/fa';
import { lightColors, darkColors } from '../theme/colors';
import type { FinanceData } from '../types/index.js';

export const ConfigPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const showToast = (title: string, description: string | undefined, status: 'success' | 'error' | 'warning' | 'info') => {
    toast({ 
      title, 
      description,
      status, 
      duration: 3000, 
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleExportData = () => {
    const data = localStorage.getItem('finance-data');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup criado!', 'Seus dados foram exportados com sucesso.', 'success');
    } else {
      showToast('Nenhum dado encontrado', 'Não há dados para exportar.', 'warning');
    }
  };

  const validateImportedData = (data: unknown): data is FinanceData => {
    return (
      data !== null &&
      typeof data === 'object' &&
      Array.isArray((data as FinanceData).banks) &&
      Array.isArray((data as FinanceData).cryptos) &&
      Array.isArray((data as FinanceData).loans) &&
      Array.isArray((data as FinanceData).monthlyGrowth) &&
      (data as FinanceData).diversification !== undefined &&
      typeof (data as FinanceData).diversification === 'object'
    );
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const result = event.target?.result;
          if (typeof result !== 'string') return;
          
          const data = JSON.parse(result);
          
          if (!validateImportedData(data)) {
            showToast('Arquivo inválido', 'O formato dos dados não é compatível com o sistema.', 'error');
            return;
          }
          
          localStorage.setItem('finance-data', JSON.stringify(data));
          showToast('Dados importados!', 'A página será recarregada em instantes.', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          showToast('Erro ao importar', 'Verifique se o arquivo é um JSON válido.', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    localStorage.removeItem('finance-data');
    showToast('Dados removidos!', 'Todos os dados foram apagados.', 'info');
    onClose();
    setTimeout(() => window.location.reload(), 1500);
  };

  // Get storage info
  const getStorageInfo = () => {
    const data = localStorage.getItem('finance-data');
    if (!data) return { size: '0 KB', banks: 0, cryptos: 0, loans: 0, months: 0 };
    
    const parsed = JSON.parse(data) as FinanceData;
    const sizeInKB = (new Blob([data]).size / 1024).toFixed(2);
    
    return {
      size: `${sizeInKB} KB`,
      banks: parsed.banks?.length || 0,
      cryptos: parsed.cryptos?.length || 0,
      loans: parsed.loans?.length || 0,
      months: parsed.monthlyGrowth?.length || 0,
    };
  };

  const storageInfo = getStorageInfo();

  return (
    <Box minH="100vh" bg={colors.bg} pb={10}>
      <Container maxW="900px" py={8} px={{ base: 4, md: 8 }}>
        <Box mb={8}>
          <Heading size="xl" fontWeight="800" letterSpacing="-0.03em">
            Configurações
          </Heading>
          <Text color={colors.textSecondary} mt={1}>
            Personalize sua experiência
          </Text>
        </Box>

        <VStack spacing={6} align="stretch">
          {/* Appearance */}
          <Card>
            <CardHeader pb={2}>
              <Flex align="center" gap={2}>
                <Icon as={colorMode === 'dark' ? FaMoon : FaSun} color={colors.primary} />
                <Heading size="md" fontWeight="700">Aparência</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={2}>
              <Flex 
                justify="space-between" 
                align="center"
                p={4}
                borderRadius="lg"
                bg={colors.bgInput}
              >
                <Box>
                  <Text fontWeight="600">Tema Escuro</Text>
                  <Text fontSize="sm" color={colors.textMuted}>
                    {colorMode === 'dark' ? 'Modo escuro ativado' : 'Modo claro ativado'}
                  </Text>
                </Box>
                <HStack spacing={3}>
                  <Icon as={FaSun} color={colorMode === 'light' ? colors.warning : colors.textMuted} />
                  <Switch 
                    isChecked={colorMode === 'dark'} 
                    onChange={toggleColorMode} 
                    colorScheme="brand"
                    size="lg"
                  />
                  <Icon as={FaMoon} color={colorMode === 'dark' ? colors.primary : colors.textMuted} />
                </HStack>
              </Flex>
            </CardBody>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader pb={2}>
              <Flex align="center" gap={2}>
                <Icon as={FaDatabase} color={colors.accent} />
                <Heading size="md" fontWeight="700">Gerenciar Dados</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={2}>
              <VStack spacing={4} align="stretch">
                {/* Storage Stats */}
                <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3} mb={2}>
                  <Box p={3} borderRadius="lg" bg={colors.bgInput} textAlign="center">
                    <Text fontSize="xs" color={colors.textMuted}>Bancos</Text>
                    <Text fontWeight="700" fontSize="lg">{storageInfo.banks}</Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg={colors.bgInput} textAlign="center">
                    <Text fontSize="xs" color={colors.textMuted}>Criptos</Text>
                    <Text fontWeight="700" fontSize="lg">{storageInfo.cryptos}</Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg={colors.bgInput} textAlign="center">
                    <Text fontSize="xs" color={colors.textMuted}>Empréstimos</Text>
                    <Text fontWeight="700" fontSize="lg">{storageInfo.loans}</Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg={colors.bgInput} textAlign="center">
                    <Text fontSize="xs" color={colors.textMuted}>Meses</Text>
                    <Text fontWeight="700" fontSize="lg">{storageInfo.months}</Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg={colors.bgInput} textAlign="center">
                    <Text fontSize="xs" color={colors.textMuted}>Tamanho</Text>
                    <Text fontWeight="700" fontSize="lg">{storageInfo.size}</Text>
                  </Box>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <Button 
                    leftIcon={<FaDownload />} 
                    colorScheme="brand"
                    size="lg"
                    onClick={handleExportData}
                  >
                    Exportar Backup
                  </Button>
                  <Button 
                    leftIcon={<FaUpload />} 
                    colorScheme="green"
                    size="lg"
                    onClick={handleImportData}
                  >
                    Importar Dados
                  </Button>
                </SimpleGrid>

                <Divider my={2} />

                <Button 
                  leftIcon={<FaTrash />} 
                  colorScheme="red"
                  variant="outline"
                  size="lg"
                  onClick={onOpen}
                >
                  Limpar Todos os Dados
                </Button>

                <Flex 
                  align="center" 
                  gap={2} 
                  p={3} 
                  borderRadius="lg" 
                  bg={`${colors.warning}15`}
                  borderWidth={1}
                  borderColor={`${colors.warning}30`}
                >
                  <Icon as={FaShieldAlt} color={colors.warning} />
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Seus dados são armazenados localmente no navegador. Faça backups regulares para evitar perdas.
                  </Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          {/* About */}
          <Card>
            <CardHeader pb={2}>
              <Flex align="center" gap={2}>
                <Icon as={FaInfoCircle} color={colors.success} />
                <Heading size="md" fontWeight="700">Sobre</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Flex 
                    justify="space-between" 
                    p={3} 
                    borderRadius="lg" 
                    bg={colors.bgInput}
                  >
                    <Text color={colors.textSecondary}>Versão</Text>
                    <Badge colorScheme="brand" borderRadius="full" px={3}>1.0.0</Badge>
                  </Flex>
                  <Flex 
                    justify="space-between" 
                    p={3} 
                    borderRadius="lg" 
                    bg={colors.bgInput}
                  >
                    <Text color={colors.textSecondary}>Armazenamento</Text>
                    <Badge colorScheme="green" borderRadius="full" px={3}>LocalStorage</Badge>
                  </Flex>
                </SimpleGrid>

                <Box p={4} borderRadius="lg" bg={colors.bgInput}>
                  <Text fontSize="sm" color={colors.textSecondary} lineHeight="tall">
                    Sistema de controle financeiro pessoal desenvolvido com React, TypeScript e Chakra UI. 
                    Gerencie múltiplos bancos, carteira de criptomoedas, empréstimos concedidos e acompanhe 
                    o crescimento mensal do seu patrimônio.
                  </Text>
                </Box>

                <Button
                  as="a"
                  href="https://github.com/DanielAlexssander/Controle-Financeiro"
                  target="_blank"
                  leftIcon={<FaGithub />}
                  variant="outline"
                  size="lg"
                >
                  Ver no GitHub
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={colors.bgCard} borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="700">
              Limpar Todos os Dados
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="stretch" spacing={3}>
                <Text>
                  Tem certeza que deseja excluir todos os seus dados? Esta ação não pode ser desfeita.
                </Text>
                <Box p={3} borderRadius="lg" bg={`${colors.danger}15`} borderWidth={1} borderColor={`${colors.danger}30`}>
                  <Text fontSize="sm" color={colors.danger} fontWeight="500">
                    ⚠️ Recomendamos fazer um backup antes de continuar.
                  </Text>
                </Box>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleClearData}>
                Excluir Tudo
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
