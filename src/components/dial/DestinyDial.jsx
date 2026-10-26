/**
 * 命盘罗盘 —— 全站标志性元素
 *
 * 把理论变成一张可读的图：
 *   外环十二宫  = 紫微命盘（人所处的环境与格局）
 *   内核日柱    = 初始速度 v₀（自我）
 *   环绕节点    = 关系引力场 Mⱼ（越大越靠近内核 = 作用力越强）
 *   四柱锚点    = 年/月/日/时 四个引力源，把内外连起来
 *
 *   人生轨迹 = 初始速度 + ∫关系引力场 dt
 */
import React, { useMemo, useState } from 'react'

const CX = 210
const CY = 210
const R_TICK_OUT = 190
const R_TICK_IN = 186
const R_PALACE_OUT = 182
const R_PALACE_IN = 104
const R_ANCHOR = 96
const R_CORE = 88
const R_BRANCH = 197

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 地支 → 角度（子居正上，顺时针）。真太阳盘的方位关系因此在视觉上成立。 */
const branchAngle = (branch) => {
  const i = BRANCHES.indexOf(branch)
  return i < 0 ? 0 : (i / 12) * 360
}

const polar = (angleDeg, r) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

/** 环形扇区路径 */
function sectorPath(startDeg, endDeg, rIn, rOut) {
  const [x1, y1] = polar(startDeg, rOut)
  const [x2, y2] = polar(endDeg, rOut)
  const [x3, y3] = polar(endDeg, rIn)
  const [x4, y4] = polar(startDeg, rIn)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${x1} ${y1}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ')
}

/** 四柱锚点方位：年 N / 月 E / 日 S / 时 W（落在宫与宫之间的空档，不压宫名） */
const ANCHOR_SLOTS = [
  { key: '年柱', angle: 0, short: '年' },
  { key: '月柱', angle: 90, short: '月' },
  { key: '日柱', angle: 180, short: '日' },
  { key: '时柱', angle: 270, short: '时' },
]

const REL_TONE = {
  配偶: 'gold',
  父母: 'metal',
  子女: 'wood',
  贵人: 'field',
  恩师: 'ziwei',
  挚友: 'water',
  兄弟姐妹: 'metal',
  仇人: 'fire',
}

const TONE_COLOR = {
  gold: '#d9bb84',
  metal: '#c8d2de',
  wood: '#3fb98f',
  field: '#45b8c9',
  ziwei: '#9d8cf0',
  water: '#5b8ff0',
  fire: '#e2604f',
}

export function DestinyDial({ palaces = [], ganZhi, relationships = [], onSelectPalace }) {
  const [hover, setHover] = useState(null)

  /* 十二宫按地支定位 */
  const sectors = useMemo(() => {
    return palaces
      .filter(p => p && p.地支)
      .map(p => {
        const start = branchAngle(p.地支)
        return { ...p, start, end: start + 30, angle: start + 15 }
      })
      .sort((a, b) => a.start - b.start)
  }, [palaces])

  /* 关系节点：角度按序分配，半径由质量决定（越强越靠近内核） */
  const nodes = useMemo(() => {
    const list = relationships.filter(r => r && r.name)
    if (!list.length) return []
    return list.map((rel, i) => {
      const quality = typeof rel.quality === 'number' ? rel.quality : 0.8
      const angle = (i / list.length) * 360 + (i * 47) % 19
      const radius = 80 - quality * 32
      const tone = REL_TONE[rel.type] || 'field'
      return {
        ...rel,
        angle,
        radius,
        tone,
        color: TONE_COLOR[tone] || TONE_COLOR.field,
        mass: quality,
        [0]: 'x', [1]: 'y',
        cx: polar(angle, radius)[0],
        cy: polar(angle, radius)[1],
      }
    })
  }, [relationships])

  /* 关系轨迹：串起引力节点的一条游丝 */
  const trajectory = useMemo(() => {
    if (nodes.length < 2) return ''
    const pts = nodes.map(n => `${n.cx.toFixed(1)} ${n.cy.toFixed(1)}`)
    return `M ${pts.join(' L ')}`
  }, [nodes])

  const hovered = hover ? sectors.find(s => s.宫位 === hover) : null

  const coreGz = ganZhi?.日 || '—'

  return (
    <div className="dial-shell">
      <svg className="dial-svg" viewBox="0 0 420 420" role="img" aria-label="命盘罗盘">
        <defs>
          <radialGradient id="dialCore" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#171b21" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#0c0e11" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#08090b" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id="dialAnchorLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9bb84" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#9d8cf0" stopOpacity="0.14" />
          </linearGradient>
        </defs>

        {/* 刻度环：六十甲子位 */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * 360
          const major = i % 5 === 0
          const [x1, y1] = polar(a, R_TICK_IN)
          const [x2, y2] = polar(a, major ? R_TICK_OUT : R_TICK_IN + 2)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className={major ? 'dial-tick-major' : 'dial-tick'}
            />
          )
        })}

        {/* 结构环 */}
        <circle className="dial-ring" cx={CX} cy={CY} r={R_PALACE_OUT} />
        <circle className="dial-ring" cx={CX} cy={CY} r={R_PALACE_IN} />

        {/* 地支外环 */}
        {sectors.map(s => {
          const [bx, by] = polar(s.angle, R_BRANCH)
          return (
            <text key={`b-${s.宫位}`} x={bx} y={by} className="dial-branch">
              {s.地支}
            </text>
          )
        })}

        {/* 十二宫扇区 */}
        {sectors.map(s => {
          // 宫名与主星沿半径拉开足够间距：水平方向的扇区（命宫、父母宫一带）
          // 径向间距即横向间距，间距不足会让两行字直接撞在一起
          const [lx, ly] = polar(s.angle, R_PALACE_IN + 18)
          const [sx, sy] = polar(s.angle, R_PALACE_OUT - 14)
          const isHover = hover === s.宫位
          return (
            <g
              key={s.宫位}
              onMouseEnter={() => setHover(s.宫位)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectPalace && onSelectPalace(s)}
              style={{ cursor: onSelectPalace ? 'pointer' : 'default' }}
            >
              <path
                d={sectorPath(s.start, s.end, R_PALACE_IN, R_PALACE_OUT)}
                className="dial-sector"
                style={isHover ? { fill: 'rgba(52,45,32,0.96)', stroke: 'rgba(217,187,132,0.6)' } : undefined}
              />
              <text x={lx} y={ly} className="dial-sector-label" style={{ fill: isHover ? '#f0dcb4' : undefined }}>
                {s.宫位}
              </text>
              <text x={sx} y={sy} className="dial-sector-stars">
                {(s.主星 || [])[0] || '—'}
              </text>
            </g>
          )
        })}

        {/* 四柱锚点：落在核心与宫位环之间的空档，标出四个引力源的位置 */}
        {ANCHOR_SLOTS.map(slot => {
          const [ax, ay] = polar(slot.angle, R_ANCHOR)
          const [lx, ly] = polar(slot.angle, R_ANCHOR)
          const [ix, iy] = polar(slot.angle, R_CORE)
          const [ox, oy] = polar(slot.angle, R_PALACE_IN)
          return (
            <g key={slot.key}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="url(#dialAnchorLine)" strokeWidth="1" />
              <text
                x={lx} y={ly}
                className="dial-anchor-label"
              >
                {slot.short}
              </text>
            </g>
          )
        })}

        {/* 内核：自我 + 引力场 */}
        <circle cx={CX} cy={CY} r={R_CORE} fill="url(#dialCore)" stroke="rgba(217,187,132,0.22)" strokeWidth="1" />

        {/* 引力轨道 */}
        <ellipse className="dial-orbit" cx={CX} cy={CY} rx={72} ry={52} />
        <ellipse className="dial-orbit dial-orbit-spin" cx={CX} cy={CY} rx={86} ry={64} />
        <ellipse className="dial-orbit dial-orbit-spin-rev" cx={CX} cy={CY} rx={60} ry={44} />

        {/* 关系轨迹游丝 */}
        {trajectory && (
          <path
            d={trajectory}
            fill="none"
            stroke="#45b8c9"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.5"
          />
        )}

        {/* 关系节点 */}
        {nodes.map((n, i) => (
          <g key={i} className="dial-node">
            <circle cx={n.cx} cy={n.cy} r={3 + n.mass * 3.4} fill={n.color} opacity="0.9" />
            <circle cx={n.cx} cy={n.cy} r={3 + n.mass * 3.4} fill="none" stroke={n.color} strokeWidth="0.6" opacity="0.4" />
            <text x={n.cx} y={n.cy - 9} className="dial-node-label" style={{ fill: n.color }}>
              {n.name}
            </text>
          </g>
        ))}

        {/* 核心读数：日柱为自我（初始速度） */}
        <text x={CX} y={CY - 14} className="dial-core-gz" style={{ fontSize: 28 }}>
          {coreGz}
        </text>
        <text x={CX} y={CY + 6} className="dial-core-sub">
          {hovered ? `${hovered.宫位} · ${hovered.地支}` : '日柱 · 自我'}
        </text>
        {hovered && (
          <>
            <text x={CX} y={CY + 24} className="dial-core-stars">
              {(hovered.主星 || []).join('·') || '无主星'}
            </text>
            <text x={CX} y={CY + 40} className="dial-core-stars" style={{ opacity: 0.7 }}>
              {(hovered.辅星 || []).slice(0, 4).join(' ') || '无辅星'}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
