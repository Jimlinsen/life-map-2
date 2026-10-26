/**
 * 格局透出分析面板
 *
 * 三命通会取格以月令为纲，看月支藏干是否透出天干；
 * 若不透，则可由你主动经营的关系与事件间接引出——
 * 也就是「关系网络参与了你的命格成立」。
 */
import React from 'react'
import { SectionHead, StatTile, Chip, Readout } from '../ui/index.jsx'

const WAY_TONE = {
  直透: 'gold',
  借势引出: 'ziwei',
  杂气: 'mist',
}

const WAY_HINT = {
  直透: '天干直接透出月令藏干——这个格局是命里自带的，不依赖他人',
  借势引出: '月令藏干并未透出，由你标记的关系/事件把它引了出来——关系网络直接参与了这个格局的成立',
  杂气: '月令藏干混杂且未透干，成格需要大运与关系共同促成',
}

export function PatternTransparencyPanel({ analysis }) {
  if (!analysis) return null

  const {
    月令 = {},
    直透格局,
    间接引出,
    最终格局 = {},
    透出分析 = [],
    结论,
    建议 = [],
  } = analysis

  const way = 最终格局.成格方式 || '杂气'

  return (
    <div className="glass-card p-6 mb-5 border-ziwei/20">
      <SectionHead
        eyebrow="PATTERN TRANSPARENCY"
        title="🔍 格局透出分析"
        sub="月令藏干是否透出天干；不透时，如何由他人的关系间接引出"
        right={<Chip tone={WAY_TONE[way] || 'mist'}>{way}</Chip>}
      />

      {/* 最终格局 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile
          label="最终格局"
          value={最终格局.名称 || '—'}
          tone="gold"
          hint={最终格局.强度 ? `强度：${最终格局.强度}` : undefined}
        />
        <StatTile label="成格方式" value={way} tone={way === '直透' ? 'gold' : way === '借势引出' ? 'ziwei' : 'mist'} hint={WAY_HINT[way]} />
        <StatTile
          label="月令"
          value={`${月令.地支 || '—'}月`}
          tone="field"
          hint={`藏干 ${月令.藏干?.length || 0} 位`}
        />
        <StatTile
          label="透出情况"
          value={`${月令.藏干?.filter(c => c.透出).length || 0} / ${月令.藏干?.length || 0}`}
          tone="wood"
          hint="直接透出 / 藏干总数"
        />
      </div>

      {/* 藏干透出表 */}
      {透出分析.length > 0 && (
        <div className="bg-ink-800/70 rounded-xl p-4 mb-5 overflow-x-auto">
          <h4 className="text-[13px] font-semibold text-mist-100 mb-3">月令藏干透出逐位核对</h4>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-mist-500 text-[10px] uppercase tracking-wider">
                <th className="text-left font-medium pb-2">藏干</th>
                <th className="text-left font-medium pb-2">十神</th>
                <th className="text-left font-medium pb-2">层级</th>
                <th className="text-left font-medium pb-2">是否透出</th>
                <th className="text-left font-medium pb-2">透出位置</th>
                <th className="text-left font-medium pb-2">关系可引出</th>
              </tr>
            </thead>
            <tbody>
              {透出分析.map((c, i) => {
                const pull = c.间接引出 || {}
                const pos = pull.正面依据 || []
                const neg = pull.负面依据 || []
                return (
                  <tr key={i} className="border-t border-ink-700">
                    <td className="py-2 gz text-mist-100">{c.天干}</td>
                    <td className="py-2 text-mist-200">{c.十神}</td>
                    <td className="py-2 text-mist-500">{c.层级}</td>
                    <td className="py-2">
                      {c.透出 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-wood/12 text-wood">已透出</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-ink-600 text-mist-400">未透</span>
                      )}
                    </td>
                    <td className="py-2 text-mist-400">
                      {(c.透出位置 || []).join('、') || '—'}
                    </td>
                    <td className="py-2">
                      {c.透出 ? (
                        <span className="text-mist-500 text-[11px]">已自带</span>
                      ) : pos.length > 0 || neg.length > 0 ? (
                        <span className="text-[11px]">
                          {pos.length > 0 && <span className="text-wood">可引出 {pos.length} 条</span>}
                          {pos.length > 0 && neg.length > 0 && <span className="text-mist-500"> · </span>}
                          {neg.length > 0 && <span className="text-fire">激出 {neg.length} 条</span>}
                        </span>
                      ) : (
                        <span className="text-mist-500 text-[11px]">无关系可引</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {直透格局 && (
            <p className="text-[11px] text-mist-500 mt-3 leading-relaxed">
              格局既已直透，关系不参与「成格」；但未透出的藏干仍会被你的关系网络引动或激出，
              影响的是这份格局的显现强度。
            </p>
          )}
        </div>
      )}

      {/* 直透 */}
      {直透格局 && (
        <div className="bg-gold/8 border border-gold/20 rounded-xl p-4 mb-4">
          <div className="eyebrow mb-2">直透格局</div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="gz text-xl text-gold">{直透格局.格局名}</span>
            <Chip tone="gold">{直透格局.层级}</Chip>
          </div>
          <p className="text-[12px] text-mist-300 leading-relaxed">{直透格局.依据}</p>
        </div>
      )}

      {/* 间接引出 */}
      {间接引出?.是否成立 && (
        <div className="bg-ziwei/8 border border-ziwei/25 rounded-xl p-4 mb-4">
          <div className="eyebrow mb-2" style={{ color: '#9d8cf0' }}>借他人之力引出</div>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="gz text-xl text-ziwei">
              {间接引出.引出藏干?.十神 || '—'}格
            </span>
            <span className="text-[12px] text-mist-400">
              引出藏干 {间接引出.引出藏干?.天干 || ''}（{间接引出.引出藏干?.层级 || ''}）
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-[11px] text-mist-500 mb-2">正面依据</div>
              {间接引出.正面依据?.length > 0 ? (
                <div className="space-y-1.5">
                  {间接引出.正面依据.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-ink-900/50 rounded px-2.5 py-1.5">
                      <span className="text-[12px] text-mist-200">
                        {r.类型} {r.名称 && <span className="text-mist-400">· {r.名称}</span>}
                      </span>
                      <span className="text-[11px] text-wood shrink-0">{r.十神}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-mist-500">无</div>
              )}
            </div>
            <div>
              <div className="text-[11px] text-mist-500 mb-2">负面依据（激出）</div>
              {间接引出.负面依据?.length > 0 ? (
                <div className="space-y-1.5">
                  {间接引出.负面依据.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-ink-900/50 rounded px-2.5 py-1.5">
                      <span className="text-[12px] text-mist-200">
                        {r.类型} {r.名称 && <span className="text-mist-400">· {r.名称}</span>}
                      </span>
                      <span className="text-[11px] text-fire shrink-0">{r.十神}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-mist-500">无</div>
              )}
            </div>
          </div>

          {间接引出.说明 && (
            <p className="text-[12px] text-mist-300 leading-relaxed">{间接引出.说明}</p>
          )}
        </div>
      )}

      {/* 最终格局说明 */}
      {最终格局.说明 && (
        <div className="bg-ink-800/70 rounded-xl p-4 mb-4">
          <div className="eyebrow mb-2">格局说明</div>
          <p className="text-[13px] text-mist-200 leading-relaxed">{最终格局.说明}</p>
        </div>
      )}

      {结论 && (
        <div className="bg-gold/8 border border-gold/20 rounded-xl p-4 mb-4">
          <div className="eyebrow mb-2">透出结论</div>
          <p className="text-[13px] text-mist-200 leading-relaxed">{结论}</p>
        </div>
      )}

      {建议.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {建议.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-ink-800/70 rounded-lg p-3">
              <span className="text-ziwei text-[13px] leading-none mt-0.5">▸</span>
              <span className="text-[12px] text-mist-300 leading-relaxed">{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
