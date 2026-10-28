/**
 * 紫微斗数 · 十二神面板
 *
 * 本命态（将前 / 岁前 / 博士）与运限跟随层（大限 / 流年 / 流月 / 流日 / 流时）。
 * 运限跟随的起点是【该运限的地支】，这是主流排盘的完整口径 ——
 * 每一步运限，都会重起一组岁前与将前十二神。
 */
import React, { useState } from 'react'
import { SectionHead, StatTile, Chip } from '../ui/index.jsx'

const LAYER_ORDER = ['大限', '流年', '流月', '流日', '流时']

/** 三类神 → 语义色 class（静态类名，避免 Tailwind JIT 漏扫拼接） */
const SHEN_GROUP = {
  将前: 'text-ziwei',
  岁前: 'text-field',
  博士: 'text-gold',
}

export function ShierShenPanel({ 十二神 }) {
  const [activeLayer, setActiveLayer] = useState('本命态')

  if (!十二神) return null

  const {
    年干,
    年支,
    本命态 = [],
    运限跟随 = {},
    含义 = {},
  } = 十二神

  const layers = LAYER_ORDER.filter(l => 运限跟随[l])
  const active = activeLayer === '本命态'
    ? { 宫位: 本命态 }
    : { 宫位: Object.values(运限跟随[activeLayer]?.宫位 || {}) }

  return (
    <div className="glass-card p-6 mb-5 border-ziwei/20">
      <SectionHead
        eyebrow="TWELVE SPIRITS"
        title="🪷 十二神"
        sub="将前 · 岁前 · 博士；每一步运限重起一组，起点为该运限地支"
        right={年干 ? <Chip tone="gold">{年干}{年支}年</Chip> : null}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile label="生年" value={`${年干 || ''}${年支 || ''}`} tone="gold" hint="十二神本命态的起算依据" />
        <StatTile label="将星落宫" value={将星落宫名(年支)} tone="ziwei" hint="三合帝旺位：申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯" />
        <StatTile label="博士起点" value={博士起点名(年干, 十二神)} tone="gold" hint="生年禄存，阳男阴女顺行、阴男阳女逆行" />
        <StatTile label="运限层" value={`${layers.length} 层`} tone="field" hint="大限 / 流年 / 流月 / 流日 / 流时各自起一组" />
      </div>

      {/* 层选择 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {['本命态', ...layers].map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setActiveLayer(l)}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              activeLayer === l
                ? 'bg-gold/15 text-gold border border-gold/30'
                : 'bg-ink-800 text-mist-400 border border-ink-700 hover:text-mist-200'
            }`}
          >
            {l === '本命态' ? '本命态' : `${l}（${运限跟随[l].起支地支}起）`}
          </button>
        ))}
      </div>

      {/* 十二宫神名表 */}
      <div className="bg-ink-800/70 rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-mist-500 text-[10px] uppercase tracking-wider">
              <th className="text-left font-medium pb-2">宫位</th>
              <th className="text-left font-medium pb-2">地支</th>
              <th className="text-left font-medium pb-2">将前</th>
              <th className="text-left font-medium pb-2">岁前</th>
              <th className="text-left font-medium pb-2">博士</th>
            </tr>
          </thead>
          <tbody>
            {active.宫位.map((p, i) => {
              const rows = activeLayer === '本命态'
                ? [p]
                : [{
                    宫位: p.宫位,
                    地支: p.地支,
                    将前: p.将前,
                    岁前: p.岁前,
                    博士: '',
                  }]
              return rows.map((row, j) => (
                <tr key={`${row.宫位}-${j}`} className="border-t border-ink-700">
                  <td className="py-2 text-mist-100">{row.宫位}</td>
                  <td className="py-2 gz text-mist-300">{row.地支}</td>
                  <td className={`py-2 gz ${SHEN_GROUP.将前}`}>{row.将前}</td>
                  <td className={`py-2 gz ${SHEN_GROUP.岁前}`}>{row.岁前}</td>
                  <td className={`py-2 gz ${SHEN_GROUP.博士}`}>{row.博士 || '—'}</td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>

      {/* 神义速查 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
        {Object.entries(含义).slice(0, 24).map(([name, desc]) => (
          <div key={name} className="flex items-baseline gap-2 text-[11px]">
            <span className="gz text-mist-200 shrink-0 w-12">{name}</span>
            <span className="text-mist-500">{desc}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-mist-500 leading-relaxed">
        博士十二神自生年禄存起，不随运限变动；岁前与将前则每层重起 ——
        这是主流排盘软件与旧式只排本命态的关键差别。
      </p>
    </div>
  )
}

/** 将星落宫名（三合帝旺位） */
function 将星落宫名(yearZhi) {
  const map = { 子: '子', 辰: '子', 申: '子', 丑: '酉', 巳: '酉', 酉: '酉', 寅: '午', 午: '午', 戌: '午', 卯: '卯', 未: '卯', 亥: '卯' }
  return map[yearZhi] || '—'
}

/** 博士十二神起点（生年禄存） */
function 博士起点名(yearGan, data) {
  const hit = (data.本命态 || []).find(p => p.博士 === '博士')
  if (!hit) return '—'
  const lucunMap = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' }
  return `${lucunMap[yearGan] || '—'}（${hit.地支}宫）`
}
