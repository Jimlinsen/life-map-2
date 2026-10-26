/**
 * 觉醒测评面板 —— 可打分的问卷
 *
 * 五维四选一：觉察 / 边界 / 延迟 / 承担 / 长期
 * 答完即出分，并与命盘推演出的觉醒层级对照；
 * 再叠加该命格专属的觉醒课题、注意事项与行动清单。
 */
import React, { useMemo, useState } from 'react'
import { SectionHead, StatTile, Chip, CountUp, DataRow } from '../ui/index.jsx'
import {
  AWAKENING_DIMENSIONS,
  buildAwakeningReport,
  resolvePatternGuide,
} from '../../core/awakening.js'

const TONE_BY_LEVEL = {
  L1: 'fire',
  L2: 'fire',
  L3: 'gold',
  L4: 'wood',
  L5: 'ziwei',
}

export function AwakeningQuizPanel({
  patternName = '',
  shishen = '',
  derivedLevel = null,
  derivedLevelName = '',
}) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const report = useMemo(
    () => buildAwakeningReport({ answers, patternName, shishen, derivedLevel, derivedLevelName }),
    [answers, patternName, shishen, derivedLevel, derivedLevelName],
  )

  const guide = useMemo(() => resolvePatternGuide(patternName, shishen), [patternName, shishen])
  const answered = report.answeredCount
  const total = report.dimensionTotal
  const progress = Math.round((answered / total) * 100)

  const pick = (dimKey, idx) => {
    setAnswers(prev => ({ ...prev, [dimKey]: idx }))
    setSubmitted(false)
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="space-y-6">
      {/* ── 问卷 ── */}
      <div className="glass-card p-6 border-gold/20">
        <SectionHead
          eyebrow="AWAKENING ASSESSMENT"
          title="🧘 觉醒测评"
          sub="五个维度，每个选一个最接近你日常状态的描述——没有对错，只有当下真实的样子"
          right={
            <div className="text-right">
              <div className="gz text-[13px] text-gold">
                {answered} / {total}
              </div>
              <div className="text-[10px] text-mist-500 mt-0.5">已作答</div>
            </div>
          }
        />

        {/* 进度条 */}
        <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden mb-6">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, rgba(217,187,132,.5), #d9bb84)' }}
          />
        </div>

        <div className="space-y-5">
          {AWAKENING_DIMENSIONS.map(dim => (
            <div key={dim.key} className="bg-ink-800/60 rounded-xl p-4">
              <div className="flex items-baseline gap-2.5 mb-3">
                <span className="gz text-[13px] text-gold">{dim.key}</span>
                <span className="text-[11px] text-mist-500">{dim.desc}</span>
              </div>
              <div className="space-y-2">
                {dim.statements.map((st, idx) => {
                  const selected = answers[dim.key] === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => pick(dim.key, idx)}
                      className={`w-full text-left flex items-start gap-3 px-3.5 py-2.5 rounded-lg border transition-all ${
                        selected
                          ? 'bg-gold/12 border-gold/45'
                          : 'bg-ink-900/40 border-ink-600 hover:border-ink-400 hover:bg-ink-900/70'
                      }`}
                    >
                      <span
                        className={`mt-[3px] w-3.5 h-3.5 rounded-full border flex-none transition-colors ${
                          selected ? 'border-gold bg-gold' : 'border-ink-400'
                        }`}
                      >
                        {selected && <span className="block w-1.5 h-1.5 m-auto rounded-full bg-ink-900" />}
                      </span>
                      <span className={`text-[12.5px] leading-relaxed ${selected ? 'text-mist-100' : 'text-mist-300'}`}>
                        {st.text}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-ink-700">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!report.complete}
            className={`px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              report.complete
                ? 'bg-gold text-ink-900 hover:shadow-[0_4px_18px_rgba(217,187,132,.28)]'
                : 'bg-ink-700 text-mist-500 cursor-not-allowed'
            }`}
          >
            {report.complete ? '查看觉醒报告' : `还需完成 ${total - answered} 项`}
          </button>
          {answered > 0 && (
            <button onClick={reset} className="text-[12px] text-mist-500 hover:text-mist-200 transition-colors">
              重新作答
            </button>
          )}
        </div>
      </div>

      {/* ── 报告 ── */}
      {submitted && report.complete && (
        <>
          <div className="glass-card p-6 border-gold/25">
            <SectionHead
              eyebrow="RESULT"
              title="觉醒报告"
              sub={`你的觉醒层级为 ${report.level} ${report.levelName}`}
              right={<Chip tone={TONE_BY_LEVEL[report.level] || 'gold'}>{report.level} {report.levelName}</Chip>}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatTile
                label="测评得分"
                value={<><CountUp value={report.total} decimals={0} /><span className="stat-unit">/ {report.max}</span></>}
                tone="gold"
              />
              <StatTile
                label="觉醒指数"
                value={<><CountUp value={report.index} decimals={2} /><span className="stat-unit">/ 5.0</span></>}
                tone="ziwei"
                hint={`落在 ${report.level} ${report.levelName}`}
              />
              <StatTile
                label="命格"
                value={report.命格}
                tone="field"
                hint={`匹配方式：${report.匹配方式}`}
              />
              <StatTile
                label="最短板"
                value={report.weakest ? report.weakest.name : '—'}
                tone="fire"
                hint={report.weakest ? report.weakest.desc : ''}
              />
            </div>

            {/* 画像 */}
            <div className="bg-gold/8 border border-gold/20 rounded-xl p-4 mb-5">
              <div className="eyebrow mb-2">觉醒画像</div>
              <p className="text-[13px] text-mist-200 leading-relaxed">{report.画像}</p>
            </div>

            {/* 维度条 */}
            <div className="bg-ink-800/70 rounded-xl p-4 mb-5">
              <h4 className="text-[13px] font-semibold text-mist-100 mb-4">五维明细</h4>
              <div className="space-y-3">
                {report.dimensionScores.map(d => {
                  const isWeak = report.weakest && d.key === report.weakest.key
                  return (
                    <div key={d.key}>
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className={`text-[12px] ${isWeak ? 'text-fire' : 'text-mist-200'}`}>
                          {d.name}
                          {isWeak && <span className="text-[10px] text-mist-500 ml-1.5">最短板</span>}
                        </span>
                        <span className={`gz text-[12px] ${isWeak ? 'text-fire' : 'text-gold'}`}>
                          {d.score} / {d.max}
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(d.score / d.max) * 100}%`,
                            background: isWeak
                              ? 'linear-gradient(90deg, rgba(226,96,79,.5), #e2604f)'
                              : 'linear-gradient(90deg, rgba(217,187,132,.45), #d9bb84)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 与命盘推演对照 */}
            {report.对照 && (
              <div className="bg-ziwei/8 border border-ziwei/25 rounded-xl p-4 mb-5">
                <div className="eyebrow mb-2" style={{ color: '#9d8cf0' }}>与命盘推演对照</div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Chip tone="ziwei">自评 {report.对照.自评层级}</Chip>
                  <span className="text-mist-500 text-[12px]">vs</span>
                  <Chip tone="gold">命盘推演 {report.对照.命盘推演}</Chip>
                  <span className="gz text-[12px] text-mist-300 ml-1">差值 {report.对照.差值 > 0 ? '+' : ''}{report.对照.差值}</span>
                </div>
                <p className="text-[12.5px] text-mist-200 leading-relaxed">{report.对照.判断}</p>
              </div>
            )}
          </div>

          {/* ── 命格觉醒课题 ── */}
          <div className="glass-card p-6 border-ziwei/20">
            <SectionHead
              eyebrow="PATTERN ASSIGNMENT"
              title={`🔮 ${report.命格} · 觉醒课题`}
              sub="同一张命盘，觉醒课题各不相同——这是命格给你的功课，不是你的性格标签"
              right={<Chip tone="ziwei">命格</Chip>}
            />

            <div className="bg-ziwei/8 border border-ziwei/25 rounded-xl p-4 mb-5">
              <div className="eyebrow mb-2" style={{ color: '#9d8cf0' }}>核心课题</div>
              <p className="text-[13.5px] text-mist-100 leading-relaxed">{report.核心课题}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="bg-ink-800/70 rounded-xl p-4">
                <div className="text-[12px] font-semibold text-fire mb-2">盲区</div>
                <p className="text-[12.5px] text-mist-300 leading-relaxed">{report.盲区}</p>
              </div>
              <div className="bg-ink-800/70 rounded-xl p-4">
                <div className="text-[12px] font-semibold text-field mb-2">在关系里的表现</div>
                <p className="text-[12.5px] text-mist-300 leading-relaxed">{report.关系表现}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="bg-ink-800/70 rounded-xl p-4">
                <div className="text-[12px] font-semibold text-wood mb-2.5">觉醒标志</div>
                <ul className="space-y-1.5">
                  {report.觉醒标志.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] text-mist-300 leading-relaxed">
                      <span className="text-wood">✓</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-ink-800/70 rounded-xl p-4">
                <div className="text-[12px] font-semibold text-fire mb-2.5">需要注意的事项</div>
                <ul className="space-y-1.5">
                  {report.注意事项.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] text-mist-300 leading-relaxed">
                      <span className="text-fire">!</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {report.大忌 && (
              <div className="bg-fire/8 border border-fire/25 rounded-xl p-4 mb-5">
                <div className="eyebrow mb-2" style={{ color: '#e2604f' }}>大忌</div>
                <p className="text-[13px] text-mist-100 leading-relaxed">{report.大忌}</p>
              </div>
            )}

            <div>
              <div className="eyebrow mb-3">行动清单</div>
              <div className="grid md:grid-cols-2 gap-2.5">
                {report.actions.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 rounded-lg p-3 border ${
                      a.类型 === '练习'
                        ? 'bg-wood/8 border-wood/20'
                        : 'bg-fire/8 border-fire/20'
                    }`}
                  >
                    <span className={`text-[12px] leading-none mt-0.5 ${a.类型 === '练习' ? 'text-wood' : 'text-fire'}`}>
                      {a.类型 === '练习' ? '▶' : '!'}
                    </span>
                    <div>
                      <div className={`text-[10px] mb-0.5 ${a.类型 === '练习' ? 'text-wood' : 'text-fire'}`}>{a.类型}</div>
                      <span className="text-[12.5px] text-mist-200 leading-relaxed">{a.内容}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 未作答时也能查看的命格课题速览 ── */}
      {!submitted && (
        <div className="glass-card p-6 border-ziwei/15">
          <SectionHead
            eyebrow="PATTERN ASSIGNMENT"
            title={`🔮 ${guide.命格} · 觉醒课题速览`}
            sub="先看看这张命盘给你的功课，再决定要不要做测评"
            right={<Chip tone="ziwei">{guide.匹配方式}</Chip>}
          />
          <div className="bg-ziwei/8 border border-ziwei/20 rounded-xl p-4 mb-4">
            <div className="eyebrow mb-2" style={{ color: '#9d8cf0' }}>核心课题</div>
            <p className="text-[13px] text-mist-100 leading-relaxed">{guide.核心课题}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-[12px] font-semibold text-fire mb-2">需要注意的事项</div>
              <ul className="space-y-1.5">
                {(guide.注意事项 || []).map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-mist-300 leading-relaxed">
                    <span className="text-fire">!</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-wood mb-2">觉醒标志</div>
              <ul className="space-y-1.5">
                {(guide.觉醒标志 || []).map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-mist-300 leading-relaxed">
                    <span className="text-wood">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
