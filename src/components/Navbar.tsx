import { useRef } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import {
  LuBitcoin,
  LuChartNoAxesCombined,
  LuChevronRight,
  LuDollarSign,
  LuLayoutDashboard,
  LuMenu,
  LuMoon,
  LuSettings2,
  LuSun,
  LuWallet,
} from 'react-icons/lu';
import { useCurrencyRates } from '../hooks/useCurrencyRates';

const pages = [
  { id: 'dashboard', label: 'Visão geral', icon: LuLayoutDashboard },
  { id: 'manage', label: 'Gerenciar ativos', icon: LuWallet },
  { id: 'growth', label: 'Crescimento', icon: LuChartNoAxesCombined },
  { id: 'config', label: 'Configurações', icon: LuSettings2 },
];

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { btcPrice, usdToBrl, loading } = useCurrencyRates();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigate = (page: string) => {
    onNavigate(page);
    onClose();
  };
  const brand = (
    <div className="brand">
      <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="" />
      <span>Finance Control</span>
    </div>
  );
  const sidebar = (
    <>
      {brand}
      <nav className="main-nav" aria-label="Navegação principal">
        {pages.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={currentPage === id ? 'page' : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="market">
        <h2>Cotações</h2>
        <div>
          <span className="quote-icon bitcoin">
            <LuBitcoin />
          </span>
          <span>BTC/USD</span>
          <strong>
            {loading || btcPrice <= 0
              ? '—'
              : btcPrice.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
          </strong>
        </div>
        <div>
          <span className="quote-icon dollar">
            <LuDollarSign />
          </span>
          <span>USD/BRL</span>
          <strong>
            {loading
              ? '—'
              : usdToBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
        </div>
      </div>
    </>
  );
  const themeLabel = colorMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  return (
    <>
      <aside className="sidebar">{sidebar}</aside>
      <header className="topbar">
        <button
          ref={menuButton}
          className="icon-control menu-toggle"
          aria-label="Abrir navegação"
          onClick={onOpen}
        >
          <LuMenu />
        </button>
        <div className="breadcrumb">
          <img className="mobile-mark" alt="" src={import.meta.env.BASE_URL + 'logo.svg'} />
          <span>Finance Control</span>
          <LuChevronRight size={13} />
          <strong>{pages.find((p) => p.id === currentPage)?.label}</strong>
        </div>
        <div className="top-actions">
          <span className="today">
            {new Intl.DateTimeFormat('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </span>
          <button
            className="icon-control"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={toggleColorMode}
          >
            {colorMode === 'dark' ? <LuSun /> : <LuMoon />}
          </button>
        </div>
      </header>
      <Drawer placement="left" isOpen={isOpen} onClose={onClose} finalFocusRef={menuButton}>
        <DrawerOverlay />
        <DrawerContent aria-label="Navegação principal" maxW="285px" bg="var(--surface)">
          <DrawerCloseButton />
          <DrawerBody className="mobile-sidebar">{sidebar}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
