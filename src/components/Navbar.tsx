import { Box, Flex, Button, useColorMode, HStack, Text, IconButton, Menu, MenuButton, MenuList, MenuItem, VStack } from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useCurrencyRates } from '../hooks/useCurrencyRates';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar = ({ currentPage, onNavigate }: NavbarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { btcPrice, usdToBrl } = useCurrencyRates();

  return (
    <Box bg={colorMode === 'dark' ? 'gray.800' : 'white'} px={4} py={3} shadow="md">
      <Flex justify="space-between" align="center" maxW="1400px" mx="auto">
        {/* Desktop Menu */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
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

        {/* Mobile Menu */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<HamburgerIcon />}
            variant="ghost"
            display={{ base: 'flex', md: 'none' }}
          />
          <MenuList>
            <MenuItem onClick={() => onNavigate('dashboard')}>Dashboard</MenuItem>
            <MenuItem onClick={() => onNavigate('manage')}>Gerenciar</MenuItem>
            <MenuItem onClick={() => onNavigate('growth')}>Crescimento</MenuItem>
            <MenuItem onClick={() => onNavigate('config')}>Configurações</MenuItem>
          </MenuList>
        </Menu>

        {/* Quotes */}
        <HStack spacing={{ base: 2, md: 6 }} display={{ base: 'none', sm: 'flex' }}>
          <Box bg="black" color="white" px={{ base: 2, md: 3 }} py={1} borderRadius="md">
            <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>BTC/USD:</Text>
            <Text color="orange.500" fontSize={{ base: 'xs', md: 'sm' }}>${btcPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </Box>
          <Box bg="black" color="white" px={{ base: 2, md: 3 }} py={1} borderRadius="md">
            <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }}>USD/BRL:</Text>
            <Text color="green.500" fontSize={{ base: 'xs', md: 'sm' }}>R$ {usdToBrl.toFixed(2)}</Text>
          </Box>
        </HStack>

        <IconButton
          icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle theme"
        />
      </Flex>
    </Box>
  );
};
