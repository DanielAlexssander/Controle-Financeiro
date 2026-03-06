import {
  Container, Heading, Card, CardBody, VStack, FormControl, FormLabel,
  Switch, Button, useColorMode, useToast, Text, Divider, HStack, Box
} from '@chakra-ui/react';
import type { FinanceData } from '../types/index.js';

export const ConfigPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

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
      toast({ title: 'Dados exportados com sucesso', status: 'success', duration: 2000 });
    } else {
      toast({ title: 'Nenhum dado para exportar', status: 'warning', duration: 2000 });
    }
  };

  const validateImportedData = (data: any): data is FinanceData => {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.banks) &&
      Array.isArray(data.cryptos) &&
      Array.isArray(data.loans) &&
      Array.isArray(data.monthlyGrowth) &&
      data.diversification &&
      typeof data.diversification === 'object'
    );
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          
          if (!validateImportedData(data)) {
            toast({ title: 'Arquivo inválido', description: 'O formato dos dados não é compatível', status: 'error', duration: 3000 });
            return;
          }
          
          localStorage.setItem('finance-data', JSON.stringify(data));
          toast({ title: 'Dados importados com sucesso!', status: 'success', duration: 2000 });
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          toast({ title: 'Erro ao importar dados', description: 'Verifique se o arquivo é um JSON válido', status: 'error', duration: 3000 });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('finance-data');
      toast({ title: 'Dados limpos com sucesso!', status: 'info', duration: 2000 });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <Container maxW="800px" py={8} px={{ base: 4, md: 8 }}>
      <Heading mb={6}>Configurações</Heading>

      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Aparência</Heading>
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Tema Escuro</FormLabel>
              <Switch isChecked={colorMode === 'dark'} onChange={toggleColorMode} colorScheme="blue" />
            </FormControl>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Gerenciar Dados</Heading>
            <VStack spacing={3} align="stretch">
              <Button colorScheme="blue" onClick={handleExportData}>
                Exportar Dados (Backup)
              </Button>
              <Button colorScheme="green" onClick={handleImportData}>
                Importar Dados
              </Button>
              <Divider />
              <Button colorScheme="red" variant="outline" onClick={handleClearData}>
                Limpar Todos os Dados
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Sobre</Heading>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold">Versão:</Text>
                <Text>1.0.0</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="bold">Armazenamento:</Text>
                <Text>LocalStorage</Text>
              </HStack>
              <Divider />
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Sistema de controle financeiro pessoal com suporte a múltiplos bancos,
                  carteira de criptomoedas, empréstimos e acompanhamento de crescimento mensal.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};
