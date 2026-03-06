import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { lightColors, darkColors } from './colors';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? darkColors.bg : lightColors.bg,
        color: props.colorMode === 'dark' ? darkColors.text : lightColors.text,
      },
    }),
  },
  components: {
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
        },
      }),
    },
  },
});

export default theme;
