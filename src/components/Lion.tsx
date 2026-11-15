import { useId } from 'react'
import type { LionMood, Outfit } from '../types'

const RED = '#C8102E'
const YELLOW = '#FDB913'
const FACE = '#FFE08A'
const MUZZLE = '#FFF4D6'
const BROWN = '#5A2E12'

const PETALS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 - Math.PI / 2
  return { x: 100 + Math.cos(a) * 58, y: 104 + Math.sin(a) * 58, fill: i % 2 ? RED : YELLOW }
})

interface Props {
  mood?: LionMood
  outfit?: Outfit
  size?: number
  className?: string
  animate?: boolean
}

export function Lion({ mood = 'happy', outfit = 'none', size = 160, className = '', animate = true }: Props) {
  const id = useId().replace(/:/g, '')
  const motion = !animate
    ? ''
    : mood === 'cheer'
      ? 'animate-jump'
      : mood === 'think'
        ? 'animate-wiggle'
        : 'animate-float'

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`${motion} ${className}`}
      role="img"
      aria-label="Aslan"
    >
      <defs>
        <pattern id={`stripes-${id}`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
          <rect width="8" height="16" fill={RED} />
          <rect x="8" width="8" height="16" fill={YELLOW} />
        </pattern>
      </defs>

      <ellipse cx="100" cy="190" rx="52" ry="7" fill="#4A2C16" opacity="0.12" />

      {/* mane */}
      <circle cx="100" cy="104" r="64" fill="#E8590C" />
      {PETALS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="25" fill={p.fill} />
      ))}

      {/* ears */}
      <circle cx="64" cy="66" r="15" fill={FACE} />
      <circle cx="64" cy="66" r="8" fill="#F7A8A8" />
      <circle cx="136" cy="66" r="15" fill={FACE} />
      <circle cx="136" cy="66" r="8" fill="#F7A8A8" />

      {/* face */}
      <circle cx="100" cy="108" r="48" fill={FACE} />
      <path d="M92 64 Q100 74 108 64" stroke={RED} strokeWidth="5" fill="none" strokeLinecap="round" />

      <Eyes mood={mood} />

      <circle cx="69" cy="121" r="7.5" fill="#FF8A8A" opacity="0.55" />
      <circle cx="131" cy="121" r="7.5" fill="#FF8A8A" opacity="0.55" />

      <ellipse cx="100" cy="128" rx="21" ry="15" fill={MUZZLE} />
      {[[87, 129], [84, 124], [113, 129], [116, 124]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill={BROWN} opacity="0.6" />
      ))}
      <path d="M91 116 Q100 111 109 116 Q105 124 100 124 Q95 124 91 116 Z" fill={BROWN} />

      <Mouth mood={mood} />

      {outfit === 'scarf' && (
        <g>
          <path d="M58 150 Q100 170 142 150 L144 165 Q100 186 56 165 Z" fill={`url(#stripes-${id})`} />
          <path d="M118 160 L136 158 L140 194 L122 196 Z" fill={`url(#stripes-${id})`} />
          <path d="M122 196 l2 -4 M128 195 l1 -4 M134 194 l1 -4" stroke={RED} strokeWidth="2" />
        </g>
      )}

      {outfit === 'crown' && (
        <g>
          <path
            d="M70 46 L76 14 L90 32 L100 6 L110 32 L124 14 L130 46 Z"
            fill="#FFD43B"
            stroke="#E0A800"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="70" y="40" width="60" height="10" rx="4" fill="#FFC107" stroke="#E0A800" strokeWidth="2" />
          <circle cx="100" cy="28" r="5" fill={RED} />
          <circle cx="84" cy="36" r="3.5" fill={RED} />
          <circle cx="116" cy="36" r="3.5" fill={RED} />
        </g>
      )}

      {outfit === 'glasses' && (
        <g>
          <path d="M66 96 L54 90 M134 96 L146 90" stroke={BROWN} strokeWidth="4" strokeLinecap="round" />
          <path d="M96 98 Q100 93 104 98" stroke={BROWN} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="81" cy="101" r="15" fill="#2B1A10" stroke={BROWN} strokeWidth="4" />
          <circle cx="119" cy="101" r="15" fill="#2B1A10" stroke={BROWN} strokeWidth="4" />
          <path d="M73 95 L79 91 M111 95 L117 91" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        </g>
      )}

      {outfit === 'bowtie' && (
        <g stroke="#2A8AD6" strokeWidth="2" strokeLinejoin="round">
          <path d="M100 162 L78 150 L78 174 Z" fill="#4CB4FF" />
          <path d="M100 162 L122 150 L122 174 Z" fill="#4CB4FF" />
          <circle cx="100" cy="162" r="6" fill="#2A8AD6" />
        </g>
      )}

      {outfit === 'party' && (
        <g>
          <path d="M100 8 L72 62 L128 62 Z" fill="#9B6BFF" stroke="#7246D6" strokeWidth="3" strokeLinejoin="round" />
          <path d="M88 32 L112 32 M81 47 L119 47" stroke={YELLOW} strokeWidth="5" strokeLinecap="round" />
          <circle cx="100" cy="8" r="8" fill="#FF6B6B" />
        </g>
      )}

      {outfit === 'wizard' && (
        <g>
          <path d="M76 52 L106 0 L126 52 Z" fill="#4B3BAA" stroke="#2E2270" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="104" cy="34" r="3.5" fill={YELLOW} />
          <circle cx="112" cy="20" r="2.5" fill={YELLOW} />
          <circle cx="94" cy="44" r="2" fill={YELLOW} />
          <path d="M62 52 Q100 38 138 52 Q100 64 62 52 Z" fill="#3B2A8A" stroke="#2E2270" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}

function Eyes({ mood }: { mood: LionMood }) {
  if (mood === 'cheer') {
    return (
      <g stroke={BROWN} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M73 103 Q81 92 89 103" />
        <path d="M111 103 Q119 92 127 103" />
      </g>
    )
  }
  const dy = mood === 'think' ? -4 : 0
  const dx = mood === 'think' ? 3 : 0
  return (
    <g>
      {mood === 'sad' && (
        <g stroke={BROWN} strokeWidth="3.5" strokeLinecap="round">
          <path d="M72 88 L88 84" />
          <path d="M112 84 L128 88" />
        </g>
      )}
      <ellipse cx={81 + dx} cy={101 + dy} rx="7.5" ry="9.5" fill={BROWN} />
      <ellipse cx={119 + dx} cy={101 + dy} rx="7.5" ry="9.5" fill={BROWN} />
      <circle cx={84 + dx} cy={97 + dy} r="3" fill="white" />
      <circle cx={122 + dx} cy={97 + dy} r="3" fill="white" />
      <circle cx={79 + dx} cy={105 + dy} r="1.4" fill="white" />
      <circle cx={117 + dx} cy={105 + dy} r="1.4" fill="white" />
    </g>
  )
}

function Mouth({ mood }: { mood: LionMood }) {
  const line = { stroke: BROWN, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const }
  switch (mood) {
    case 'cheer':
      return (
        <g>
          <path d="M100 124 L100 128" {...line} />
          <path d="M87 130 Q100 152 113 130 Z" fill="#7A1F1F" />
          <ellipse cx="100" cy="141" rx="6.5" ry="4.5" fill="#FF7A8A" />
        </g>
      )
    case 'think':
      return <path d="M100 124 L100 130 M94 135 Q100 132 106 135" {...line} />
    case 'sad':
      return <path d="M100 124 L100 130 M90 137 Q100 129 110 137" {...line} />
    default:
      return <path d="M100 124 L100 129 Q93 137 86 131 M100 129 Q107 137 114 131" {...line} />
  }
}
