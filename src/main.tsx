import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { consumirTokenDaUrl } from './services/ai/tokenDaUrl';
import './index.css';

// Aberto pelo comando `financas` (#ia=<token>): salva o token e já abre o chat.
const abrirChatAoIniciar = (() => {
  try {
    return consumirTokenDaUrl(window.location, window.history, window.localStorage);
  } catch {
    return false;
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App abrirChatAoIniciar={abrirChatAoIniciar} />
  </StrictMode>,
);
