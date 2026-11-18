import { useEffect, useRef } from 'react';
import { createPresenca, presencaUrl } from '../services/ai/presenca';

/** Mantém esta aba visível para o `financas` (sem token, não conecta). `onAbrir` abre o chat aqui. */
export const usePresencaIa = (token: string, onAbrir: () => void): void => {
  const onAbrirRef = useRef(onAbrir);

  useEffect(() => {
    onAbrirRef.current = onAbrir;
  }, [onAbrir]);

  useEffect(() => {
    if (!token) return;
    const presenca = createPresenca({ url: presencaUrl(token), onAbrir: () => onAbrirRef.current() });
    presenca.connect();
    return () => presenca.close();
  }, [token]);
};
