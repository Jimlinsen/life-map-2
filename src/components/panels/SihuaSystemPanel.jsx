/**
 * 紫微斗数 · 四化叠层面板
 *
 * 六层四化并置：本命（生年干）· 大限宫干 · 流年干 · 流月干 · 流日干 · 流时干
 * 另含宫干自化、来因宫追溯与星曜层面的多层叠加对照。
 */
import React from 'react'
import { SectionHead, StatTile, Chip } from '../ui/index.jsx'

/**
 * 四化类型 → 语义色 class。
 * 用完整静态类名而非模板拼接：Tailwind JIT 按源码扫描，
 * `bg-${tone}/12` 这类拼接不会被识别，样式会整段失效。
 */
const SIHUA_TONE = {
  禄: { badge: 'bg-wood/12 text-wood', mark: 'text-wood' },
  权: { badge: 'bg-ziwei/12 text-ziwei', mark: 'text-ziwei' },
  科: { badge: 'bg-field/12 text-field', mark: 'text-field' },
  忌: { badge: 'bg-fire/12 text-fire', mark: 'text-fire' },
}

const SIHUA_MARK = {
  禄: '禄',
  权: '权',
  科: '科',
  忌: '忌',
}

const LAYER_LABEL = {
  本命: '本命四化',
  大限: '大限宫干',
  流年: '流年干',
  流月: '流月干',
  流日: '流日干',
  流时: '流时干',
}

function SiHuaBadge({ 类型, 星曜, 落宫 }) {
  if (!星曜) return null
  const tone = SIHUA_TONE[类型] || { badge: 'bg-ink-600 text-mist-300', mark: 'text-mist-300' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${tone.badge}`}>
      <span className="gz">{SIHUA_MARK[类型]}</span>
      <span className="text-mist-100">{星曜}</span>
      {落宫 && <span className="text-mist-500">{落宫}</span>}
    </span>
  )
}

function LayerColumn({ title, subtitle, 条目, tone = 'mist' }) {
  return (
    <div className="bg-ink-800/70 rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="text-[13px] font-semibold text-mist-100">{title}</div>
        {subtitle && <div className="text-[11px] text-mist-500">{subtitle}</div>}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {条目?.length > 0
          ? 条目.map((e, i) => <SiHuaBadge key={i} 类型={e.类型} 星曜={e.星曜} 落宫={e.落宫} />)
          : <span className="text-[12px] text-mist-500">无</span>}
      </div>
    </div>
  )
}

export function SihuaSystemPanel({ 四化体系, 排盘信息 }) {
  if (!四化体系) return null

  const {
    本命 = {},
    大限,
    流年 = {},
    流月 = {},
    流日,
    流时,
    宫干自化 = {},
    来因宫 = {},
    叠加表 = {},
  } = 四化体系

  const 自化条目 = Object.entries(宫干自化)
  const 来因条目 = Object.entries(来因宫)
  const 叠加条目 = Object.entries(叠加表)
    .filter(([, overlay]) => Object.values(overlay).filter(Boolean).length >= 2)
    .sort((a, b) => Object.values(b[1]).filter(Boolean).length - Object.values(a[1]).filter(Boolean).length)

  return (
    <div className="glass-card p-6 mb-5 border-ziwei/20">
      <SectionHead
        eyebrow="SIHUA LAYERS"
        title="🧭 四化叠层"
        sub="本命、大限、流年、流月、流日、流时六层四化并置，含宫干自化与来因宫"
        right={本命.年干 ? <Chip tone="gold">生年 {本命.年干}</Chip> : null}
      />

      {/* 排盘口径 */}
      {排盘信息 && (
        <div className="flex flex-wrap items-center gap-2 mb-5 text-[11px] text-mist-500">
          <span className="px-2 py-0.5 rounded bg-ink-800 text-mist-300">排盘日 {排盘信息.排盘日}</span>
          {排盘信息.是否晚子时 && (
            <span className="px-2 py-0.5 rounded bg-gold/12 text-gold">
              晚子时 · {排盘信息.晚子时规则 === 'next-day' ? '次日换日' : '当日不换日'}
            </span>
          )}
          {排盘信息.真太阳时?.已校正 && (
            <span className="px-2 py-0.5 rounded bg-field/12 text-field">
              真太阳时 {排盘信息.真太阳时.校正后时刻}（校正 {排盘信息.真太阳时.总校正分钟 >= 0 ? '+' : ''}{排盘信息.真太阳时.总校正分钟} 分）
            </span>
          )}
        </div>
      )}

      {/* 六层四化 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <LayerColumn title={LAYER_LABEL.本命} subtitle="生年干" 条目={本命.条目} />
        <LayerColumn
          title={LAYER_LABEL.大限}
          subtitle={大限 ? `${大限.宫位}·${大限.宫干}` : '无'}
          条目={大限?.条目}
        />
        <LayerColumn title={LAYER_LABEL.流年} subtitle={`${流年.天干 || ''}年`} 条目={流年.条目} />
        <LayerColumn title={LAYER_LABEL.流月} subtitle={`${流年.天干 || ''}年${流月.农历月 || ''}月·${流月.天干 || ''}`} 条目={流月.条目} />
        <LayerColumn title={LAYER_LABEL.流日} subtitle={流日?.天干 ? `${流日.天干}日` : '无'} 条目={流日?.条目} />
        <LayerColumn title={LAYER_LABEL.流时} subtitle={流时?.天干 ? `${流时.天干}时` : '无'} 条目={流时?.条目} />
      </div>

      {/* 星曜多层叠加 */}
      {叠加条目.length > 0 && (
        <div className="bg-ink-800/70 rounded-xl p-4 mb-5 overflow-x-auto">
          <h4 className="text-[13px] font-semibold text-mist-100 mb-1">星曜多层四化对照</h4>
          <p className="text-[11px] text-mist-500 mb-3">
            同一颗星在多层运限中被反复引化 —— 层数越多，该星在此期的主导性越强。
          </p>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-mist-500 text-[10px] uppercase tracking-wider">
                <th className="text-left font-medium pb-2">星曜</th>
                {['本命', '大限', '流年', '流月', '流日', '流时'].map(l => (
                  <th key={l} className="text-left font-medium pb-2">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {叠加条目.map(([star, overlay]) => (
                <tr key={star} className="border-t border-ink-700">
                  <td className="py-2 gz text-mist-100">{star}</td>
                  {['本命', '大限', '流年', '流月', '流日', '流时'].map(l => (
                    <td key={l} className="py-2">
                      {overlay[l] ? (
                        <span className={`gz ${(SIHUA_TONE[overlay[l]] || SIHUA_TONE.禄).mark}`}>{SIHUA_MARK[overlay[l]]}</span>
                      ) : (
                        <span className="text-mist-500">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 宫干自化 + 来因宫 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-ink-800/70 rounded-xl p-4">
          <h4 className="text-[13px] font-semibold text-mist-100 mb-1">宫干自化</h4>
          <p className="text-[11px] text-mist-500 mb-3">
            该宫宫干引发的四化，被化星恰在本宫 —— 力量由内而发，不假外求。
          </p>
          {自化条目.length > 0 ? (
            <div className="space-y-1.5">
              {自化条目.map(([palace, list]) => (
                <div key={palace} className="flex items-center justify-between gap-2 bg-ink-900/50 rounded px-2.5 py-1.5">
                  <span className="text-[12px] text-mist-200">{palace}</span>
                  <span className="flex gap-1.5">
                    {list.map((item, i) => (
                      <span key={i} className={`text-[11px] gz ${(SIHUA_TONE[item.siHua] || SIHUA_TONE.禄).mark}`}>
                        自化{item.siHua}·{item.starName}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-mist-500">本盘无宫干自化</div>
          )}
        </div>

        <div className="bg-ink-800/70 rounded-xl p-4">
          <h4 className="text-[13px] font-semibold text-mist-100 mb-1">来因宫</h4>
          <p className="text-[11px] text-mist-500 mb-3">
            某星某化由哪一宫的宫干引动 —— 那个宫位就是问题的根源所在。
          </p>
          {来因条目.length > 0 ? (
            <div className="space-y-1.5">
              {来因条目.slice(0, 10).map(([star, list]) => (
                <div key={star} className="flex items-center justify-between gap-2 bg-ink-900/50 rounded px-2.5 py-1.5">
                  <span className="text-[12px] text-mist-200 gz">{star}</span>
                  <span className="text-[11px] text-mist-400 text-right">
                    {list.map(p => `${p.宫位}${p.天干}`).join('、')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-mist-500">无来因宫</div>
          )}
        </div>
      </div>
    </div>
  )
}
