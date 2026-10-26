/**
 * 影响立场面板
 *
 * 回答三个问题：
 *   1. 什么样的人对我影响大（被影响）
 *   2. 我容易对什么样的人影响大（施影响）
 *   3. 觉醒度如何改变这个不对称
 */
import React from 'react'
import { SectionHead, StatTile, Chip, CountUp, Readout } from '../ui/index.jsx'

const POSTURE_TONE = {
  被牵引: 'fire',
  相互平衡: 'mist',
  主导者: 'wood',
}

const STANCE_TONE = {
  易受影响: 'fire',
  双向平衡: 'gold',
  主导他人: 'wood',
}

function InfluenceBars({ items, valueKey, emptyText }) {
  if (!items || items.length === 0) {
    return <div className="text-mist-500 text-[12px] py-4">{emptyText}</div>
  }
  const max = Math.max(...items.map(i => Math.abs(i[valueKey] || 0)), 0.001)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-[13px] text-mist-200 truncate">
              {item.名称 || item.类型}
              {item.关系数 > 1 && (
                <span className="text-[11px] text-mist-500 ml-1.5">{item.关系数} 条</span>
              )}
            </span>
            <span className="gz text-[12px] text-gold shrink-0">
              <CountUp value={Math.abs(item[valueKey] || 0)} decimals={2} />
            </span>
          </div>
          <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(3, (Math.abs(item[valueKey] || 0) / max) * 100)}%`,
                background: 'linear-gradient(90deg, rgba(217,187,132,.45), #d9bb84)',
              }}
            />
          </div>
          {item.说明 && (
            <div className="text-[11px] text-mist-500 mt-1 leading-relaxed">{item.说明}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export function InfluencePosturePanel({ analysis }) {
  if (!analysis) return null

  const {
    觉醒层级 = {},
    立场,
    净立场差,
    净主导差,
    对我影响最大 = [],
    我影响最大 = [],
    关系明细 = [],
    觉醒对照 = [],
    结论,
    建议 = [],
  } = analysis

  const stanceTone = STANCE_TONE[立场] || 'gold'

  return (
    <div className="glass-card p-6 mb-5 border-gold/20">
      <SectionHead
        eyebrow="INFLUENCE POSTURE"
        title="🧭 影响立场"
        sub="区分「别人对我的作用」与「我对别人的作用」——觉醒层级决定这个不对称的强弱"
        right={
          <Chip tone={stanceTone}>
            {觉醒层级.key} {觉醒层级.name} · {立场}
          </Chip>
        }
      />

      {/* 三项读数 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile
          label="当前觉醒层级"
          value={`${觉醒层级.key || ''} ${觉醒层级.name || ''}`}
          tone="gold"
          hint={`事件影响倍率 ×${觉醒层级.multiplier ?? '—'}`}
        />
        <StatTile
          label="影响立场"
          value={立场 || '—'}
          tone={stanceTone}
          hint={立场 === '易受影响' ? '他人动你，你被动接收' : 立场 === '主导他人' ? '你动他人，他人被动接收' : '彼此影响大体相当'}
        />
        <StatTile
          label="净立场差"
          value={<CountUp value={Number(净立场差 || 0)} decimals={2} />}
          unit=""
          tone={Number(净立场差) > 0 ? 'wood' : Number(净立场差) < 0 ? 'fire' : 'gold'}
          hint={
            Number(净主导差) !== undefined && Number(净主导差) !== Number(净立场差)
              ? `极性定向后 ${净主导差}（已把阻力型关系计为负）`
              : Number(净立场差) > 0
                ? '你对关系有主导权'
                : Number(净立场差) < 0
                  ? '关系在牵引你'
                  : '进出力量均衡'
          }
        />
        <StatTile
          label="已标记关系"
          value={关系明细.length}
          unit="条"
          tone="field"
          hint="影响立场基于这些关系推算"
        />
      </div>

      {/* 两个方向 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-ink-800/70 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-fire">◀</span>
            <h4 className="text-[13px] font-semibold text-mist-100">什么样的人对我影响大</h4>
          </div>
          <InfluenceBars
            items={对我影响最大}
            valueKey="影响"
            emptyText="尚未标记关系。标记配偶、父母、子女或贵人后，这里会指出谁在塑造你。"
          />
        </div>

        <div className="bg-ink-800/70 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-wood">▶</span>
            <h4 className="text-[13px] font-semibold text-mist-100">我容易对什么样的人影响大</h4>
          </div>
          <InfluenceBars
            items={我影响最大}
            valueKey="影响"
            emptyText="尚未标记关系。标记后这里会指出你更容易施加影响的对象。"
          />
        </div>
      </div>

      {/* 觉醒对照 */}
      {觉醒对照.length > 0 && (
        <div className="bg-ink-800/70 rounded-xl p-4 mb-6">
          <h4 className="text-[13px] font-semibold text-mist-100 mb-3">觉醒度对立场的影响</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {觉醒对照.map(lv => {
              const isCurrent = lv.key === 觉醒层级.key
              const gap = Number(lv.净立场差 || 0)
              return (
                <div
                  key={lv.key}
                  className={`rounded-lg p-3 border transition-colors ${
                    isCurrent ? 'bg-gold/12 border-gold/40' : 'bg-ink-900/40 border-ink-600'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={`text-[12px] font-semibold ${isCurrent ? 'text-gold' : 'text-mist-300'}`}>
                      {lv.key} {lv.name}
                    </span>
                    {isCurrent && <Chip tone="gold">当前</Chip>}
                  </div>
                  <div className={`gz text-[15px] ${gap > 0 ? 'text-wood' : gap < 0 ? 'text-fire' : 'text-mist-300'}`}>
                    <CountUp value={gap} decimals={2} />
                  </div>
                  <div className="text-[11px] text-mist-500 mt-1">{lv.倾向}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 关系明细 */}
      {关系明细.length > 0 && (
        <div className="bg-ink-800/70 rounded-xl p-4 mb-6 overflow-x-auto">
          <h4 className="text-[13px] font-semibold text-mist-100 mb-3">逐条立场</h4>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-mist-500 text-[10px] uppercase tracking-wider">
                <th className="text-left font-medium pb-2">关系</th>
                <th className="text-left font-medium pb-2">类型</th>
                <th className="text-right font-medium pb-2">对我的影响</th>
                <th className="text-right font-medium pb-2">我对它的影响</th>
                <th className="text-right font-medium pb-2">立场差</th>
                <th className="text-right font-medium pb-2">立场</th>
              </tr>
            </thead>
            <tbody>
              {关系明细.map((r, i) => (
                <tr key={i} className="border-t border-ink-700">
                  <td className="py-2 text-mist-100">{r.名称 || '—'}</td>
                  <td className="py-2 text-mist-400">{r.类型}</td>
                  <td className="py-2 text-right gz text-fire">
                    <CountUp value={Number(r.incoming || 0)} decimals={2} />
                  </td>
                  <td className="py-2 text-right gz text-wood">
                    <CountUp value={Number(r.outgoing || 0)} decimals={2} />
                  </td>
                  <td className="py-2 text-right gz text-mist-200">
                    <CountUp value={Number(r.postureGap || 0)} decimals={2} />
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        POSTURE_TONE[r.posture] === 'fire'
                          ? 'bg-fire/12 text-fire'
                          : POSTURE_TONE[r.posture] === 'wood'
                            ? 'bg-wood/12 text-wood'
                            : 'bg-ink-600 text-mist-300'
                      }`}
                    >
                      {r.posture}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 结论与建议 */}
      {结论 && (
        <div className="bg-gold/8 border border-gold/20 rounded-xl p-4 mb-4">
          <div className="eyebrow mb-2">立场结论</div>
          <p className="text-[13px] text-mist-200 leading-relaxed">{结论}</p>
        </div>
      )}

      {建议.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {建议.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-ink-800/70 rounded-lg p-3">
              <span className="text-gold text-[13px] leading-none mt-0.5">▸</span>
              <span className="text-[12px] text-mist-300 leading-relaxed">{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
