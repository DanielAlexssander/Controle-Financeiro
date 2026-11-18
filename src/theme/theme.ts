import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { darkColors, lightColors } from './colors';

const config: ThemeConfig = { initialColorMode: 'light', useSystemColorMode: false };
type Mode = { colorMode: 'light' | 'dark' };
const palette = ({ colorMode }: Mode) => (colorMode === 'dark' ? darkColors : lightColors);
const sans = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default extendTheme({
  config,
  fonts: { body: sans, heading: 'var(--heading)' },
  colors: {
    brand: {
      50: '#eef6ee',
      100: '#dcebdd',
      200: '#bddac6',
      300: '#9bc7aa',
      400: '#73ac8c',
      500: '#326b55',
      600: '#245540',
      700: '#1a4637',
      800: '#15392e',
      900: '#102d24',
    },
  },
  styles: {
    global: (mode: Mode) => {
      const c = palette(mode);
      return {
        body: {
          bg: c.bg,
          color: c.text,
          '--surface': c.bgCard,
          '--canvas': c.bg,
          '--quiet': c.bgInput,
          '--hover': c.bgCardHover,
          '--ink': c.text,
          '--muted': c.textMuted,
          '--accent': c.primary,
          '--line': c.border,
        },
      };
    },
  },
  shadows: { outline: '0 0 0 3px rgba(100,165,127,.45)' },
  components: {
    Heading: { baseStyle: { fontWeight: 650, letterSpacing: '-.035em' } },
    Card: {
      variants: {
        elevated: (mode: Mode) => ({
          container: {
            bg: palette(mode).bgCard,
            color: palette(mode).text,
            minW: 0,
            border: '1px solid',
            borderColor: palette(mode).border,
            borderRadius: '16px',
            boxShadow: '0 2px 5px rgba(23,49,33,.025)',
          },
        }),
      },
    },
    Button: {
      baseStyle: { borderRadius: '9px', fontWeight: 600 },
      defaultProps: { colorScheme: 'brand' },
    },
    Input: { defaultProps: { focusBorderColor: 'brand.400' } },
    Select: { defaultProps: { focusBorderColor: 'brand.400' } },
    NumberInput: { defaultProps: { focusBorderColor: 'brand.400' } },
    Tabs: {
      variants: {
        'soft-rounded': (mode: Mode) => ({
          tablist: { gap: 1, borderBottom: '1px solid', borderColor: palette(mode).border, pb: 2 },
          tab: {
            color: palette(mode).textSecondary,
            borderRadius: '8px',
            fontSize: 'sm',
            _selected: { bg: palette(mode).bgCardHover, color: palette(mode).primary },
          },
        }),
      },
    },
  },
});
