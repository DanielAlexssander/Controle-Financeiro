import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { LuSparkles } from 'react-icons/lu';
import { lazy, Suspense } from 'react';

const AiChatPanel = lazy(() =>
  import('./AiChatPanel').then((module) => ({ default: module.AiChatPanel })),
);

export const AiChat = ({ abrirAoIniciar = false }: { abrirAoIniciar?: boolean }) => {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: abrirAoIniciar });

  return (
    <>
      <button className="chat-launch" aria-label="Abrir chat com a IA" onClick={onOpen}>
        <LuSparkles />
        <span>Assistente IA</span>
      </button>
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <DrawerContent bg="var(--surface)" color="var(--ink)" maxH="100dvh">
          <DrawerCloseButton top={5} right={4} aria-label="Fechar chat" />
          <DrawerHeader borderBottom="1px solid var(--line)" py={5} pr={14}>
            <div className="chat-heading">
              <span className="chat-symbol">
                <LuSparkles />
              </span>
              Assistente de IA
            </div>
          </DrawerHeader>
          <DrawerBody py={5} minH={0}>
            {isOpen && (
              <Suspense fallback={<p role="status">Carregando conversa…</p>}>
                <AiChatPanel />
              </Suspense>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
