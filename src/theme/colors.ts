export const lightColors = {
  bg: '#f6f7f3',
  bgCard: '#ffffff',
  bgCardHover: '#eef2ec',
  bgInput: '#f4f6f2',
  text: '#172d29',
  textSecondary: '#53655e',
  textMuted: '#697770',
  primary: '#286451',
  accent: '#526b84',
  success: '#287153',
  warning: '#96601d',
  danger: '#b04644',
  border: '#dce3db',
};

export const darkColors: typeof lightColors = {
  bg: '#111c19',
  bgCard: '#192723',
  bgCardHover: '#263b33',
  bgInput: '#1f302a',
  text: '#e9f1e9',
  textSecondary: '#c0cdc3',
  textMuted: '#a1b2a7',
  primary: '#9cd8b1',
  accent: '#a6c2d6',
  success: '#98dcae',
  warning: '#e4bb7f',
  danger: '#f69c95',
  border: '#35483e',
};

export function getChartColors(dark: boolean) {
  return dark
    ? ['#8ac7a6', '#e2b572', '#94b9d5', '#c7a3cd', '#b9c775', '#dd9f8c', '#81c9c9']
    : ['#3c7860', '#c89d53', '#688fae', '#a384ad', '#9ca85f', '#c78470', '#60a1a2'];
}
