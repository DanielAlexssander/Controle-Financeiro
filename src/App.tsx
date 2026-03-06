import { useState } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ManagePage } from './pages/ManagePage';
import { GrowthPage } from './pages/GrowthPage';
import { ConfigPage } from './pages/ConfigPage';
import theme from './theme/theme';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'manage':
        return <ManagePage />;
      case 'growth':
        return <GrowthPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <FinanceProvider>
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        {renderPage()}
      </FinanceProvider>
    </ChakraProvider>
  );
}

export default App;
