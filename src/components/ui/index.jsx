/**
 * 共享 UI 原语 —— 全站唯一的呈现语言
 *
 * 所有面板、章节标题、数据读数都从这里派生，
 * 保证七个视图在视觉上是一套系统而不是七张拼贴。
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ── 分段导航：滑动指示器 ────────────────────────────────────────────────── */

export function SegmentedNav({ items, value, onChange, className = '' }) {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const refs = useRef({})

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value]
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [value, items.length])

  return (
    <div className={`nav-seg ${className}`} role="tablist">
      <div
        className="nav-seg-indicator"
        style={{ transform: `translateX(${indicator.left - 4}px)`, width: indicator.width }}
        aria-hidden="true"
      />
      {items.map(it => (
        <button
          key={it.id}
          ref={el => { refs.current[it.id] = el }}
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={`nav-seg-btn ${value === it.id ? 'is-active' : ''}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

/* ── 面板 ────────────────────────────────────────────────────────────────── */

export function Panel({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`panel ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/* ── 章节标题 ────────────────────────────────────────────────────────────── */

export function SectionHead({ title, sub, eyebrow, right, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-5 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
        {sub && <p className="text-[13px] text-mist-400 mt-1.5 leading-relaxed">{sub}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  )
}

/* ── 统计块 ──────────────────────────────────────────────────────────────── */

export function StatTile({ label, value, unit, tone = 'default', hint, className = '' }) {
  const toneColor = {
    default: 'text-mist-100',
    gold: 'text-gold',
    ziwei: 'text-ziwei',
    field: 'text-field',
    wood: 'text-wood',
    fire: 'text-fire',
    water: 'text-water',
    metal: 'text-metal',
  }[tone] || 'text-mist-100'

  return (
    <div className={`stat-tile ${className}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value mt-1 ${toneColor}`}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-mist-500 mt-1">{hint}</div>}
    </div>
  )
}

/* ── 数据行 ──────────────────────────────────────────────────────────────── */

export function DataRow({ label, value, tone = 'default', sub, className = '' }) {
  const toneColor = {
    default: 'text-mist-100',
    gold: 'text-gold',
    ziwei: 'text-ziwei',
    field: 'text-field',
    wood: 'text-wood',
    fire: 'text-fire',
    water: 'text-water',
    metal: 'text-metal',
  }[tone] || 'text-mist-100'

  return (
    <div className={`data-row ${className}`}>
      <div className="min-w-0">
        <div className="text-[13px] text-mist-300 truncate">{label}</div>
        {sub && <div className="text-[11px] text-mist-500 mt-0.5">{sub}</div>}
      </div>
      <div className={`gz text-[13px] font-medium shrink-0 ${toneColor}`}>{value}</div>
    </div>
  )
}

/* ── 徽标 ────────────────────────────────────────────────────────────────── */

export function Chip({ children, tone = 'default', className = '' }) {
  const cls = {
    default: '',
    gold: 'chip-gold',
    ziwei: 'chip-ziwei',
    field: 'chip-field',
    wood: 'chip-wood',
    fire: 'chip-fire',
    water: 'chip-water',
    metal: 'chip-metal',
  }[tone] || ''
  return <span className={`chip ${cls} ${className}`}>{children}</span>
}

/* ── 揭示：子元素依次浮现 ────────────────────────────────────────────────── */

export function Reveal({ children, className = '', delay = 0 }) {
  return (
    <div className={`reveal ${className}`} style={delay ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </div>
  )
}

/* ── 数字滚动 ────────────────────────────────────────────────────────────── */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function CountUp({ value, decimals = 0, duration = 900, className = '' }) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const raf = useRef(null)

  useEffect(() => {
    if (reduced) { setDisplay(value); return }
    const start = performance.now()
    const from = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(from + (value - from) * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration, reduced])

  const text = typeof value === 'number'
    ? display.toFixed(decimals)
    : String(display)

  return <span className={`tnum ${className}`}>{text}</span>
}

/* ── 表单字段 ────────────────────────────────────────────────────────────── */

export function Field({ label, children, hint, className = '' }) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-mist-500 mt-1.5">{hint}</div>}
    </div>
  )
}

/* ── 空态 ────────────────────────────────────────────────────────────────── */

export function EmptyState({ title, hint, action }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="text-mist-500 text-[13px]">{title}</div>
      {hint && <div className="text-mist-500/70 text-[12px] mt-1.5">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── 读数：带语义色的小读数 ─────────────────────────────────────────────── */

export function Readout({ label, value, tone = 'gold', decimals = 1, className = '' }) {
  const toneColor = {
    gold: 'text-gold',
    ziwei: 'text-ziwei',
    field: 'text-field',
    wood: 'text-wood',
    fire: 'text-fire',
    water: 'text-water',
    metal: 'text-metal',
    mist: 'text-mist-100',
  }[tone] || 'text-gold'

  return (
    <div className={className}>
      <div className="text-[10px] tracking-[0.16em] uppercase text-mist-500">{label}</div>
      <div className={`gz text-[15px] mt-1 ${toneColor}`}>
        <CountUp value={value} decimals={decimals} />
      </div>
    </div>
  )
}
