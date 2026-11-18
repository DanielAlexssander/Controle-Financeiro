import {
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, IconButton, useDisclosure,
} from '@chakra-ui/react';
import { FaRobot } from 'react-icons/fa';
import { AiChatPanel } from './AiChatPanel';

export const AiChat = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <IconButton
        aria-label="Abrir chat com a IA"
        icon={<FaRobot />}
        onClick={onOpen}
        colorScheme="brand"
        size="lg"
        isRound
        position="fixed"
        bottom={6}
        right={6}
        zIndex="sticky"
        boxShadow="lg"
      />
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Assistente de IA</DrawerHeader>
          <DrawerBody pb={4}>{isOpen && <AiChatPanel />}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
