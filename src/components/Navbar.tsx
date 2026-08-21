import { 
  Box, Flex, Button, useColorMode, HStack, Text, IconButton, Menu, MenuButton, 
  MenuList, MenuItem, Tooltip
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon } from '@chakra-ui/icons';
import { FaChartPie, FaCog, FaChartLine, FaLayerGroup, FaBitcoin } from 'react-icons/fa';
import { useCurrencyRates } from '../hooks/useCurrencyRates';
import { lightColors, darkColors } from '../theme/colors';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  page: string;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NavItem = ({ icon: Icon, label, page, currentPage, onNavigate }: NavItemProps) => {
  const { colorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const isActive = currentPage === page;
  
  return (
    <Button
      variant="ghost"
      leftIcon={<Icon />}
      onClick={() => onNavigate(page)}
      position="relative"
      fontWeight={isActive ? '700' : '500'}
      color={isActive ? colors.primary : colors.textSecondary}
      bg={isActive ? `${colors.primary}15` : 'transparent'}
      _hover={{
        bg: isActive ? `${colors.primary}20` : colors.bgCardHover,
        color: isActive ? colors.primary : colors.text,
      }}
      _after={isActive ? {
        content: '""',
        position: 'absolute',
        bottom: '-2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '3px',
        bg: colors.primary,
        borderRadius: 'full',
      } : undefined}
      borderRadius="lg"
      px={4}
      transition="all 0.2s"
    >
      {label}
    </Button>
  );
};

export const Navbar = ({ currentPage, onNavigate }: NavbarProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const colors = colorMode === 'dark' ? darkColors : lightColors;
  const { btcPrice, usdToBrl } = useCurrencyRates();

  const navItems = [
    { icon: FaChartPie, label: 'Dashboard', page: 'dashboard' },
    { icon: FaLayerGroup, label: 'Gerenciar', page: 'manage' },
    { icon: FaChartLine, label: 'Crescimento', page: 'growth' },
    { icon: FaCog, label: 'Configurações', page: 'config' },
  ];

  return (
    <Box 
      bg={colors.bgCard}
      px={{ base: 4, md: 6 }}
      py={3}
      borderBottomWidth={1}
      borderColor={colors.border}
      position="sticky"
      top={0}
      zIndex={100}
      backdropFilter="blur(10px)"
      backgroundColor={`${colors.bgCard}ee`}
    >
      <Flex justify="space-between" align="center" maxW="1400px" mx="auto">
        {/* Logo/Brand */}
        <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
          <Box
            w={8}
            h={8}
            borderRadius="lg"
            bg={colors.gradientPrimary}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontWeight="800" color="white" fontSize="sm">FC</Text>
          </Box>
          <Text fontWeight="700" fontSize="lg" letterSpacing="-0.02em" display={{ base: 'none', lg: 'block' }}>
            Finance Control
          </Text>
        </HStack>

        {/* Desktop Navigation */}
        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
          {navItems.map(item => (
            <NavItem 
              key={item.page}
              {...item}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
          ))}
        </HStack>

        {/* Mobile Menu */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<HamburgerIcon />}
            variant="ghost"
            display={{ base: 'flex', md: 'none' }}
            aria-label="Menu"
          />
          <MenuList bg={colors.bgCard} borderColor={colors.border}>
            {navItems.map(item => (
              <MenuItem 
                key={item.page}
                icon={<item.icon />}
                onClick={() => onNavigate(item.page)}
                bg={currentPage === item.page ? `${colors.primary}15` : 'transparent'}
                color={currentPage === item.page ? colors.primary : colors.text}
                fontWeight={currentPage === item.page ? '600' : '400'}
              >
                {item.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Right Side - Quotes & Theme Toggle */}
        <HStack spacing={{ base: 2, md: 4 }}>
          {/* Crypto Quotes */}
          <HStack spacing={2} display={{ base: 'none', sm: 'flex' }}>
            <Tooltip label="Bitcoin/USD" hasArrow>
              <Box 
                px={3} 
                py={2} 
                borderRadius="lg"
                bg={colors.bgInput}
                borderWidth={1}
                borderColor={colors.border}
                transition="all 0.2s"
                _hover={{ borderColor: colors.warning }}
              >
                <HStack spacing={2}>
                  <FaBitcoin color={colors.warning} />
                  <Box>
                    <Text fontSize="xs" color={colors.textMuted} lineHeight={1}>BTC/USD</Text>
                    <Text fontSize="sm" fontWeight="700" color={colors.warning} lineHeight={1.2}>
                      ${btcPrice.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Tooltip>

            <Tooltip label="Dólar/Real" hasArrow>
              <Box 
                px={3} 
                py={2} 
                borderRadius="lg"
                bg={colors.bgInput}
                borderWidth={1}
                borderColor={colors.border}
                transition="all 0.2s"
                _hover={{ borderColor: colors.success }}
              >
                <HStack spacing={2}>
                  <Text fontSize="lg">💵</Text>
                  <Box>
                    <Text fontSize="xs" color={colors.textMuted} lineHeight={1}>USD/BRL</Text>
                    <Text fontSize="sm" fontWeight="700" color={colors.success} lineHeight={1.2}>
                      R$ {usdToBrl.toFixed(2)}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Tooltip>
          </HStack>

          {/* Theme Toggle */}
          <Tooltip label={colorMode === 'dark' ? 'Modo claro' : 'Modo escuro'} hasArrow>
            <IconButton
              icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Alternar tema"
              borderRadius="lg"
              bg={colors.bgInput}
              _hover={{ bg: colors.bgCardHover }}
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );
};
