import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { lightColors, darkColors } from './colors';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    accent: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
  },
  styles: {
    global: (props: { colorMode: 'light' | 'dark' }) => ({
      'html, body': {
        bg: props.colorMode === 'dark' ? darkColors.bg : lightColors.bg,
        color: props.colorMode === 'dark' ? darkColors.text : lightColors.text,
        scrollBehavior: 'smooth',
      },
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        bg: props.colorMode === 'dark' ? darkColors.bgCard : lightColors.bgCard,
      },
      '::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? darkColors.border : lightColors.border,
        borderRadius: 'full',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: props.colorMode === 'dark' ? darkColors.borderLight : lightColors.textMuted,
      },
    }),
  },
  components: {
    Card: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        container: {
          bg: props.colorMode === 'dark' ? darkColors.bgCard : lightColors.bgCard,
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? darkColors.border : lightColors.border,
          boxShadow: props.colorMode === 'dark' ? darkColors.shadow : lightColors.shadow,
          transition: 'all 0.2s ease-in-out',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: props.colorMode === 'dark' ? darkColors.shadowLg : lightColors.shadowLg,
          },
        },
      }),
    },
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        transition: 'all 0.2s ease-in-out',
      },
      variants: {
        solid: (props: { colorScheme: string; colorMode: 'light' | 'dark' }) => ({
          bg: props.colorScheme === 'brand' 
            ? (props.colorMode === 'dark' ? 'brand.500' : 'brand.500')
            : undefined,
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        ghost: {
          _hover: {
            bg: 'whiteAlpha.100',
          },
        },
        glass: (props: { colorMode: 'light' | 'dark' }) => ({
          bg: props.colorMode === 'dark' ? darkColors.bgGlass : lightColors.bgGlass,
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? darkColors.border : lightColors.border,
          _hover: {
            bg: props.colorMode === 'dark' ? darkColors.bgCardHover : lightColors.bgCardHover,
          },
        }),
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Input: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        field: {
          borderRadius: 'lg',
          bg: props.colorMode === 'dark' ? darkColors.bgInput : lightColors.bgInput,
          borderColor: props.colorMode === 'dark' ? darkColors.border : lightColors.border,
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      }),
    },
    Select: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        field: {
          borderRadius: 'lg',
          bg: props.colorMode === 'dark' ? darkColors.bgInput : lightColors.bgInput,
        },
      }),
    },
    Tabs: {
      variants: {
        'soft-rounded': (props: { colorMode: 'light' | 'dark' }) => ({
          tab: {
            fontWeight: '600',
            borderRadius: 'lg',
            _selected: {
              bg: 'brand.500',
              color: 'white',
            },
          },
          tablist: {
            bg: props.colorMode === 'dark' ? darkColors.bgCard : lightColors.bgInput,
            borderRadius: 'xl',
            p: 1,
          },
        }),
      },
      defaultProps: {
        variant: 'soft-rounded',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '700',
        letterSpacing: '-0.02em',
      },
    },
    Stat: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        label: {
          color: props.colorMode === 'dark' ? darkColors.textSecondary : lightColors.textSecondary,
          fontWeight: '500',
          fontSize: 'sm',
        },
        number: {
          fontWeight: '700',
          fontSize: '2xl',
        },
        helpText: {
          color: props.colorMode === 'dark' ? darkColors.textMuted : lightColors.textMuted,
          fontSize: 'xs',
        },
      }),
    },
    Menu: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        list: {
          bg: props.colorMode === 'dark' ? darkColors.bgCard : lightColors.bgCard,
          borderColor: props.colorMode === 'dark' ? darkColors.border : lightColors.border,
          borderRadius: 'xl',
          boxShadow: props.colorMode === 'dark' ? darkColors.shadowLg : lightColors.shadowLg,
          p: 2,
        },
        item: {
          borderRadius: 'lg',
          _hover: {
            bg: props.colorMode === 'dark' ? darkColors.bgCardHover : lightColors.bgCardHover,
          },
          _focus: {
            bg: props.colorMode === 'dark' ? darkColors.bgCardHover : lightColors.bgCardHover,
          },
        },
      }),
    },
    Modal: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? darkColors.bgCard : lightColors.bgCard,
          borderRadius: '2xl',
        },
      }),
    },
    Tooltip: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        bg: props.colorMode === 'dark' ? darkColors.bgCard : lightColors.text,
        color: props.colorMode === 'dark' ? darkColors.text : lightColors.bgCard,
        borderRadius: 'lg',
        px: 3,
        py: 2,
        fontSize: 'sm',
        fontWeight: '500',
      }),
    },
  },
  shadows: {
    outline: '0 0 0 3px rgba(99, 102, 241, 0.4)',
  },
  radii: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
  },
});

export default theme;
