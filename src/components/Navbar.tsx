import { Box, Flex, Button, useColorMode, HStack, Text } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useCurrencyRates } from '../hooks/useCurrencyRates';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar = ({ currentPage, onNavigate }: NavbarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const { btcPrice, usdToBrl} = useCurrencyRates();

  return (
    <Box bg={colorMode === 'dark' ? 'gray.800' : 'white'} px={4} py={3} shadow="md">
      <Flex justify="space-between" align="center" maxW="1400px" mx="auto">
        <HStack spacing={4}>
          <Button
            variant={currentPage === 'dashboard' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={currentPage === 'manage' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => onNavigate('manage')}
          >
            Gerenciar
          </Button>
          <Button
            variant={currentPage === 'growth' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => onNavigate('growth')}
          >
            Crescimento
          </Button>
          <Button
            variant={currentPage === 'config' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => onNavigate('config')}
          >
            Configurações
          </Button>
        </HStack>
        <Box display="flex" alignItems="center" gap={6}>
          <Box bg="black" color="white" px={3} py={1} borderRadius="md">
            <Text fontWeight="bold" >BTC/USD:</Text>
            <Text color="orange.500">${btcPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </Box>
          <Box bg="black" color="white" px={3} py={1} borderRadius="md">
            <Text fontWeight="bold">USD/BRL:</Text>
            <Text color="green.500">R$ {usdToBrl.toFixed(2)}</Text>
          </Box>
        </Box>
        <Button onClick={toggleColorMode} variant="ghost">
          {colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </Flex>
    </Box>
  );
};
