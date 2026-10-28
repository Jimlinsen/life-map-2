import React from 'react';
import { SIHUA_SYSTEM, ZIWEI_STAR_TRAITS } from '../../core/constants/ziwei.js';

export const TraditionalZiweiBoard = ({ data, ganZhi }) => {
  if (!data || !data.fullChart || !ganZhi) return null;

  const { fullChart } = data;
  const 排盘日 = data.排盘信息?.排盘日 || '';
  const 是否晚子时 = !!data.排盘信息?.是否晚子时;
  const palaces = fullChart.palaces || []; // Array of 12 palaces (0-11 for 子-亥)

  // Mapping traditional grid (4x4) to iztro palace indices
  // Row 1: [5] [6] [7] [8] (巳 午 未 申)
  // Row 2: [4] [M] [M] [9] (辰     酉)
  // Row 3: [3] [M] [M] [10](卯     戌)
  // Row 4: [2] [1] [0] [11](寅 丑 子 亥)
  const gridPositions = [
    5, 6, 7, 8,
    4, null, null, 9,
    3, null, null, 10,
    2, 1, 0, 11
  ];

  const renderPalace = (palaceIdx) => {
    if (palaceIdx === null) return <div className="bg-transparent" />;
    const palace = palaces[palaceIdx];
    if (!palace) return null;

    const majorStars = palace.majorStars || [];
    const minorStars = palace.minorStars || [];
    const adjStars = palace.adjectiveStars || [];
    const palaceName = palace.name;
    const branch = palace.earthlyBranch;
    const stem = palace.heavenlyStem;
    const ages = palace.decadalIndex;
    const isBody = palace.isBodyPalace;

    return (
      <div className="relative h-full w-full border border-mist/80 bg-[#0f172a] hover:bg-[#1e293b] transition-colors p-2 flex flex-col justify-between group min-h-[140px]">
        <div className="flex justify-between items-start">
          {/* Major Stars (Top Left, Vertical) */}
          <div className="flex flex-row-reverse gap-0.5">
            {majorStars.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-xs font-bold leading-tight writing-mode-vertical" style={{ writingMode: 'vertical-rl', color: ZIWEI_STAR_TRAITS.mainStars[s.name]?.color || '#f43f5e' }}>
                  {s.name}
                  {palace.chuanhua?.find(c => c.star === s.name) && (
                    <span className="text-[9px] mt-0.5 font-normal" style={{ color: SIHUA_SYSTEM.types[palace.chuanhua.find(c => c.star === s.name)?.type]?.color }}>
                      {palace.chuanhua.find(c => c.star === s.name)?.type?.slice(1)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {/* Minor Stars (Top Right-ish, Smaller) */}
          <div className="flex flex-col text-[8.5px] items-end text-mist-400 space-y-0.5">
            {minorStars.slice(0, 3).map((s, i) => <span key={i}>{s.name}</span>)}
            {adjStars.slice(0, 2).map((s, i) => <span key={i} className="text-mist-500 scale-90">{s.name}</span>)}
          </div>
        </div>

        <div className="flex flex-col items-center mt-auto border-t border-mist/50 pt-1">
          <span className="text-[8.5px] text-mist-500 mb-0.5">{ages}</span>
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${isBody ? 'bg-gold/10 text-gold border-gold/30' : 'bg-ziwei/12 text-ziwei border-ziwei/10'}`}>
            {palaceName}{isBody ? <span className="text-[8px] ml-0.5">(身)</span> : ''}
          </div>
          <div className="mt-0.5 text-[9px] text-mist-500 font-mono">
            {stem}{branch}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[800px] mx-auto grid grid-cols-4 gap-px bg-ink-800 border border-mist/50 rounded-xl overflow-hidden shadow-2xl p-px">
      {gridPositions.map((idx, i) => {
        if (i === 5) { // Center Square (2x2)
          const lifePalace = Array.isArray(palaces) ? palaces.find(p => p.name === '命宫') : null;
          const bodyPalace = Array.isArray(palaces) ? palaces.find(p => p.isBodyPalace || p.name === '身宫') : null;
          const zodiac = fullChart.zodiac;
          const isMale = fullChart.gender === '男';
          // Use Year Gan from ganZhi for consistency
          const yearGan = ganZhi?.年?.[0] || '甲';
          const isYang = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
          const genderLabel = `${isYang ? '阳' : '阴'}${isMale ? '男' : '女'}`;

          // Calculate starting age (Qi Yun) from Five Elements Bureau string (e.g., "水二局")
          const bureauStr = fullChart?.fiveElementsClass || '';
          let startingAge = 2;
          if (bureauStr.includes('二')) startingAge = 2;
          else if (bureauStr.includes('三')) startingAge = 3;
          else if (bureauStr.includes('四')) startingAge = 4;
          else if (bureauStr.includes('五')) startingAge = 5;
          else if (bureauStr.includes('六')) startingAge = 6;
          else {
            const num = parseInt(bureauStr.replace(/[^0-9]/g, ''));
            if (!isNaN(num)) startingAge = num;
          }

          return (
            <div key={i} className="col-span-2 row-span-2 bg-[#020617] backdrop-blur-md flex flex-col items-center justify-between p-6 border border-mist/30 relative overflow-hidden group">
              {/* Background Ornament: Subtle Taiji Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <div className="w-56 h-56 border-8 border-mist/35 rounded-full flex items-center justify-center relative">
                  <div className="absolute top-0 w-full h-1/2 bg-mist/12 rounded-t-full" />
                  <div className="z-10 w-28 h-28 bg-mist/12 rounded-full border-4 border-[#020617]" />
                </div>
              </div>

              {/* Decorative Borders */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-gold/30" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-gold/30" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-gold/30" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gold/30" />

              {/* Header Pillar-Style */}
              <div className="w-full text-center space-y-1 z-10">
                <div className="text-[10px] text-gold/40 uppercase tracking-[0.5em] font-black">Traditional Destiny Chart</div>
                <div className="text-xl font-black text-mist-100 flex items-center justify-center gap-3">
                  <span className="text-gold">紫</span>
                  <span className="text-gold">微</span>
                  <span className="text-mist-500">·</span>
                  <span className="text-gold">命</span>
                  <span className="text-gold">盘</span>
                </div>
              </div>

              {/* Core 4-Pillar BaZi Display (High Information Density) */}
              <div className="w-full flex justify-around my-4 py-3 bg-ink-900/60 border-y border-mist/50 z-10">
                {[
                  { label: '年柱', gan: ganZhi?.年?.[0], zhi: ganZhi?.年?.[1], color: 'text-gold' },
                  { label: '月柱', gan: ganZhi?.月?.[0], zhi: ganZhi?.月?.[1], color: 'text-ziwei' },
                  { label: '日柱', gan: ganZhi?.日?.[0], zhi: ganZhi?.日?.[1], color: 'text-field' },
                  { label: '时柱', gan: ganZhi?.时?.[0], zhi: ganZhi?.时?.[1], color: 'text-fire' }
                ].map((p, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[8px] text-mist-500 mb-1 font-bold">{p.label}</span>
                    <div className={`text-lg font-black ${p.color} leading-none mb-1 font-serif`}>{p.gan}</div>
                    <div className={`text-lg font-black ${p.color} leading-none font-serif`}>{p.zhi}</div>
                  </div>
                ))}
              </div>

              {/* Identity Detail Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 w-full flex-1 items-start mt-4 z-10 px-2">
                <div className="space-y-3">
                  {/* Row 1: 命造 & 生肖 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-mist-500 font-bold px-1 border border-ink-600 rounded bg-ink-800/70">命造</span>
                      <span className="text-sm text-mist-100 font-black tracking-wider">
                        {isMale ? '乾' : '坤'}{genderLabel}
                      </span>
                      <span className="text-gold text-[10px] font-bold">({zodiac})</span>
                    </div>
                  </div>

                  {/* Row 2: 五行局 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-mist-500 font-bold px-1 border border-ink-600 rounded bg-ink-800/70">局数</span>
                      <span className="text-xs text-mist-100 font-medium">{fullChart?.fiveElementsClass || '-'}</span>
                    </div>
                  </div>

                  {/* Row 3: 起运 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-mist-500 font-bold px-1 border border-ink-600 rounded bg-ink-800/70">起运</span>
                      <span className="text-xs text-field font-bold">{startingAge}岁起大限</span>
                    </div>
                  </div>

                  {/* Row 4: 命主/身主 (Stacked) */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-mist/50">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-mist-500 font-bold mb-0.5">命主</span>
                      <span className="text-xs text-ziwei font-black">{fullChart?.soul || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-mist-500 font-bold mb-0.5">身主</span>
                      <span className="text-xs text-water font-black">{fullChart?.body || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col border-l border-mist/50 pl-4 space-y-2">
                  <span className="text-mist-500 text-[8px] uppercase tracking-widest font-bold">Natal Transmutation</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    {Object.entries(SIHUA_SYSTEM.tianganSihua[yearGan] || {}).map(([type, star]) => (
                      <div key={type} className="flex flex-col items-center p-1 bg-ink-900/60 rounded border border-mist/30">
                        <span className="text-[7px] font-bold" style={{ color: SIHUA_SYSTEM.types[type]?.color }}>{type}</span>
                        <span className="text-mist-200 text-[9px] font-bold truncate w-full text-center">{star}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[9px] text-mist-500 space-y-1">
                    <div className="flex justify-between items-center opacity-80">
                      <span>命宫在</span>
                      <span className="text-gold/80 font-bold">{lifePalace?.earthlyBranch || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-80">
                      <span>身宫在</span>
                      <span className="text-field/80 font-bold">{bodyPalace?.earthlyBranch || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Footer Footer */}
              <div className="w-full pt-4 mt-auto border-t border-mist/50 z-10">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex justify-between w-full px-2 text-[8.5px]">
                    <span className="text-mist-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gold/12 rounded-full" /> 公元 {排盘日 || fullChart.solarDate}
                      {是否晚子时 && (
                        <span className="text-gold/80">·晚子</span>
                      )}
                    </span>
                    <span className="text-mist-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-ziwei/12 rounded-full" /> 农历 {fullChart.lunarDate}
                    </span>
                  </div>
                  <div className="text-[7px] text-mist-500/70 tracking-[0.3em] font-light mt-2">© DESTINY MAP ARCHITECTURE SYSTEM V5.2</div>
                </div>
              </div>
            </div>
          );
        }
        if ([6, 9, 10].includes(i)) return null; // Skip center slots occupied by span
        return <div key={i} className="h-full">{renderPalace(idx)}</div>;
      })}
    </div>
  );
};
