import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const GOLD_LIGHT = '#CDB478';
const GOLD_DARK = '#8C7440';
const CREAM = '#F4EBD3';
const INK = '#1F2020';

/**
 * Persodict mark: two overlapping speech bubbles (translation) on a gold
 * badge. The front bubble carries the "P"; the back one holds the
 * "translated" text lines.
 */
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Persodict logo">
      <Defs>
        <LinearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GOLD_LIGHT} />
          <Stop offset="1" stopColor={GOLD_DARK} />
        </LinearGradient>
      </Defs>

      {/* Badge */}
      <Rect x={4} y={4} width={112} height={112} rx={28} fill="url(#badge)" />

      {/* Back bubble: the translation */}
      <Rect x={54} y={24} width={54} height={40} rx={14} fill={CREAM} />
      <Path d="M96 64 L102 78 L82 64 Z" fill={CREAM} />
      <Rect x={66} y={33} width={30} height={5} rx={2.5} fill={GOLD_DARK} />
      <Rect x={66} y={41} width={20} height={5} rx={2.5} fill={GOLD_DARK} opacity={0.55} />

      {/* Front bubble: the original phrase */}
      <Rect x={14} y={48} width={58} height={46} rx={15} fill={INK} />
      <Path d="M26 94 L20 108 L42 94 Z" fill={INK} />

      {/* "P" */}
      <Path
        d="M34 83 V59 H44 a9.5 9.5 0 0 1 0 19 H34"
        fill="none"
        stroke={CREAM}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
