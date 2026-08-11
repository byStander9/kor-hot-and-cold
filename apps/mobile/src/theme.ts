export const colors = {
  paper: '#F5F2EB',
  surface: '#FFFEFA',
  ink: '#17191F',
  inkSoft: '#353943',
  muted: '#686D78',
  line: '#DEDBD3',
  hot: '#E2442F',
  hotDark: '#B92A1A',
  warm: '#ED8A21',
  cold: '#2376D2',
  coldDark: '#175A9E',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export function getGutter(width: number) {
  return width >= 400 ? spacing.xl : spacing.lg;
}
