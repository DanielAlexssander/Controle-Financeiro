import { useState } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ManagePage } from './pages/ManagePage';
import { GrowthPage } from './pages/GrowthPage';
import { ConfigPage } from './pages/ConfigPage';
import { AiChat } from './components/AiChat/AiChat';
import theme from './theme/theme';

function App({ abrirChatAoIniciar = false }: { abrirChatAoIniciar?: boolean }) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'manage':
        return <ManagePage />;
      case 'growth':
        return <GrowthPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <Dashboard onManage={() => navigate('manage')} />;
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <FinanceProvider>
        <Navbar currentPage={currentPage} onNavigate={navigate} />
        <main className="workspace" key={currentPage}>{renderPage()}</main>
        <AiChat abrirAoIniciar={abrirChatAoIniciar} />
      </FinanceProvider>
    </ChakraProvider>
  );
}

export default App;
