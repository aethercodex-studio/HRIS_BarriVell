import { GROUP_COLORS } from '@/config/constants';

/** Colours for a group index. Unknown/no group → neutral grey. */
export function groupPalette(colorIndex) {
  const c = GROUP_COLORS[colorIndex];
  return c ? { dot: c[0], bg: c[1] } : { dot: '#9a9da0', bg: '#efece5' };
}
