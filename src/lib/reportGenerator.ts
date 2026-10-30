import type { AnalysisResult } from './analysis';
import { brandHeader, esc, renderHtmlToPdfBlob, sectionTitle } from './pdfExport';
import { audienceLabel, programLabel } from './labels';

const SWOT_META = {
  strength: { label: 'نقاط القوة', short: 'قوة', color: '#059669', bg: '#ecfdf5' },
  weakness: { label: 'نقاط الضعف', short: 'ضعف', color: '#dc2626', bg: '#fef2f2' },
  opportunity: { label: 'الفرص', short: 'فرصة', color: '#2563eb', bg: '#eff6ff' },
  threat: { label: 'التهديدات', short: 'تهديد', color: '#d97706', bg: '#fffbeb' },
} as const;

function priorityColor(p: string): string {
  if (p === 'مرتفعة') return '#dc2626';
  if (p === 'متوسطة') return '#d97706';
  return '#059669';
}

function fmt(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

const td = 'padding:7px 8px; border-bottom:1px solid #eef2f7;';
const labelCell = `${td} color:#64748b; width:22%; white-space:nowrap;`;

export async function generateAnalysisPdf(result: AnalysisResult): Promise<Blob> {
  return renderHtmlToPdfBlob(buildReportHtml(result), { footerLatin: 'Bawsala' });
}

export function buildReportHtml(r: AnalysisResult): string {
  return [
    brandHeader(`تقرير تحليل: ${r.survey.title}`, 'تقرير تحليل استبيان'),
    execSummary(r),
    descriptionSection(r),
    evidenceSection(r),
    swotSection(r),
    recommendationsSection(r),
    topicClustersSection(r),
    methodologyAppendix(r),
    warningFooter(r),
  ].join('');
}

function execSummary(r: AnalysisResult): string {
  const s = r.survey;
  const count = (t: keyof typeof SWOT_META) => r.swot.filter(e => e.swotType === t).length;
  const kv = (k: string, v: string, color = '#0f172a') =>
    `<td style="${labelCell}">${k}</td><td style="${td} font-weight:700; color:${color};">${v}</td>`;

  return `
    ${sectionTitle('1', 'الملخص التنفيذي')}
    <div data-pdf-block style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:6px 14px; margin-bottom:12px;">
      <table style="font-size:12.5px;">
        <tr>${kv('الاستبيان', esc(s.title))}${kv('عدد الاستجابات', String(r.totalResponses))}</tr>
        <tr>${kv('الفئة المستهدفة', esc(audienceLabel(s.audience)))}${kv('المتوسط الكلي', `${fmt(r.overallMean)} من 5`)}</tr>
        <tr>${kv('عدد الأبعاد', String(r.dimensions.length))}${kv('معامل كرونباخ ألفا', fmt(r.cronbachAlpha), r.cronbachAlpha >= 0.6 ? '#059669' : '#dc2626')}</tr>
      </table>
    </div>
    <table data-pdf-block style="border-collapse:separate; border-spacing:8px 0; margin:0 -8px 12px; width:calc(100% + 16px);">
      <tr>
        ${(Object.keys(SWOT_META) as (keyof typeof SWOT_META)[]).map(t => `
          <td style="background:${SWOT_META[t].bg}; border-radius:10px; padding:10px; text-align:center; width:25%;">
            <div style="font-size:24px; font-weight:800; color:${SWOT_META[t].color}; line-height:1.3;">${count(t)}</div>
            <div style="font-size:12px; font-weight:700; color:${SWOT_META[t].color};">${SWOT_META[t].short}</div>
          </td>`).join('')}
      </tr>
    </table>
    ${r.recommendations.length > 0 ? `
      <div data-pdf-block style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:12px 14px; margin-bottom:12px;">
        <div style="font-weight:800; color:#9a3412; margin-bottom:6px; font-size:13px;">أبرز التوصيات</div>
        <div style="font-size:12px; color:#7c2d12; line-height:1.9;">
          ${r.recommendations.slice(0, 3).map((rec, i) => `
            <div>${i + 1}. <strong>${esc(rec.ifLowText)}</strong> — ${esc(rec.responsibility)} (${esc(rec.timeframe)}) <span style="color:${priorityColor(rec.priority)};">— أولوية ${esc(rec.priority)}</span></div>`).join('')}
        </div>
      </div>` : ''}
  `;
}

function descriptionSection(r: AnalysisResult): string {
  const s = r.survey;
  const items = s.sections.reduce((a, sec) => a + sec.items.length, 0);
  const programs = s.programs.length ? s.programs.map(p => esc(programLabel(p))).join('، ') : '—';
  const indicators = s.indicators.length ? s.indicators.map(c => `<span class="ltr num">${esc(c)}</span>`).join('، ') : '—';
  return `
    ${sectionTitle('2', 'وصف الاستبيان')}
    <p data-pdf-block style="font-size:12.5px; line-height:1.9; margin:0 0 10px;">${esc(s.intro)}</p>
    <table data-pdf-block style="font-size:12px; margin-bottom:12px; border:1px solid #e2e8f0;">
      <tr style="background:#f8fafc;"><td style="${labelCell}">الفئة المستهدفة</td><td style="${td}">${esc(audienceLabel(s.audience))}</td><td style="${labelCell}">عدد الفقرات</td><td style="${td}">${items}</td></tr>
      <tr><td style="${labelCell}">البرامج المرتبطة</td><td style="${td}" colspan="3">${programs}</td></tr>
      <tr style="background:#f8fafc;"><td style="${labelCell}">مؤشرات الاعتماد</td><td style="${td}" colspan="3">${indicators}</td></tr>
    </table>
  `;
}

function evidenceSection(r: AnalysisResult): string {
  const th = 'padding:8px 6px; font-weight:700; font-size:11.5px; text-align:center; white-space:nowrap;';
  return `
    ${sectionTitle('3', 'النتائج الإحصائية لكل بُعد')}
    <table style="font-size:12px; margin-bottom:6px; border:1px solid #e2e8f0;">
      <thead>
        <tr style="background:#10324a; color:#fff;">
          <th style="${th} text-align:right;">البُعد</th>
          <th style="${th}">المتوسط</th>
          <th style="${th}">الانحراف المعياري</th>
          <th style="${th}">فترة الثقة 95%</th>
          <th style="${th}">نسبة الإجابات السلبية</th>
          <th style="${th}">عدد المستجيبين</th>
          <th style="${th}">الثقة</th>
          <th style="${th}">المستوى</th>
        </tr>
      </thead>
      <tbody>
        ${r.dimensions.map((d, i) => `
          <tr style="background:${i % 2 ? '#f8fafc' : '#fff'};">
            <td style="${td} font-weight:700;">${esc(d.sectionName)}</td>
            <td style="${td} text-align:center; font-weight:800; color:${d.mean >= 4 ? '#059669' : d.mean < 3 ? '#dc2626' : '#334155'};">${fmt(d.mean)}</td>
            <td style="${td} text-align:center;">${fmt(d.stdDev)}</td>
            <td style="${td} text-align:center;"><span class="ltr num">${fmt(d.ciLower)} – ${fmt(d.ciUpper)}</span></td>
            <td style="${td} text-align:center; color:${d.negativeRatio >= 0.3 ? '#dc2626' : '#334155'};">${(d.negativeRatio * 100).toFixed(0)}%</td>
            <td style="${td} text-align:center;">${d.n}</td>
            <td style="${td} text-align:center;">${esc(d.confidenceLevel)}</td>
            <td style="${td} text-align:center;">${esc(d.band)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p data-pdf-block style="font-size:10.5px; color:#94a3b8; margin:0 0 12px;">المتوسط من 5. الإجابة السلبية = درجة 2 أو أقل بعد عكس العبارات السالبة.</p>
  `;
}

function swotSection(r: AnalysisResult): string {
  const types = Object.keys(SWOT_META) as (keyof typeof SWOT_META)[];
  const box = (t: keyof typeof SWOT_META) => {
    const meta = SWOT_META[t];
    const entries = r.swot.filter(e => e.swotType === t);
    return `
      <td style="width:50%; vertical-align:top; padding:0;">
        <div style="border:1.5px solid ${meta.color}33; background:${meta.bg}; border-radius:12px; padding:12px 14px; min-height:90px;">
          <div style="font-weight:800; color:${meta.color}; font-size:13px; border-bottom:1px solid ${meta.color}33; padding-bottom:6px; margin-bottom:8px;">${meta.label} (${entries.length})</div>
          ${entries.length === 0
            ? '<div style="font-size:12px; color:#94a3b8;">لا يوجد</div>'
            : entries.map(e => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px; font-weight:700;">${esc(e.dimension)}</div>
                <div style="font-size:11.5px; color:#475569; line-height:1.7;">المتوسط ${fmt(e.mean)} من 5 — عدد المستجيبين ${e.n}</div>
                <div style="font-size:10.5px; color:#94a3b8;">الثقة: ${esc(e.confidenceLevel)} · ${esc(e.factType)}</div>
              </div>`).join('')}
        </div>
      </td>`;
  };
  return `
    ${sectionTitle('4', 'تحليل SWOT')}
    <table style="border-collapse:separate; border-spacing:8px; margin:0 -8px 8px; width:calc(100% + 16px);">
      <tr data-pdf-block>${box(types[0])}${box(types[1])}</tr>
      <tr data-pdf-block>${box(types[2])}${box(types[3])}</tr>
    </table>
    ${r.challenges.length > 0 ? `
      <div data-pdf-block style="background:#fef3c7; border:1px solid #fcd34d; border-radius:10px; padding:12px 14px; margin-bottom:12px;">
        <div style="font-weight:800; color:#92400e; margin-bottom:6px; font-size:13px;">التحديات</div>
        ${r.challenges.map(c => `<div style="font-size:12px; margin-bottom:4px;"><strong>${esc(c.dimension)}</strong>: ${esc(c.reason)}</div>`).join('')}
      </div>` : ''}
  `;
}

function recommendationsSection(r: AnalysisResult): string {
  if (r.recommendations.length === 0) {
    return `${sectionTitle('5', 'التوصيات')}<p data-pdf-block style="font-size:12.5px; color:#94a3b8;">لا توجد توصيات محددة بناءً على النتائج الحالية.</p>`;
  }
  const sorted = [...r.recommendations].sort((a, b) => b.priorityScore - a.priorityScore);
  return `
    ${sectionTitle('5', 'التوصيات والإجراءات المقترحة')}
    ${sorted.map((rec, i) => {
      const color = priorityColor(rec.priority);
      const resource = rec.resourceTitle
        ? `${esc(rec.resourceTitle)}${rec.resourceUrl ? `<div style="font-size:10px; color:#2563eb; direction:ltr; text-align:left; word-break:break-all; line-height:1.5; margin-top:2px;">${esc(rec.resourceUrl)}</div>` : ''}`
        : '—';
      return `
      <div data-pdf-block style="border:1px solid #e2e8f0; border-right:4px solid ${color}; border-radius:10px; padding:12px 14px; margin-bottom:10px;">
        <table style="margin-bottom:6px;"><tr>
          <td style="font-weight:800; font-size:13px; color:#0f172a;">${i + 1}. ${esc(rec.ifLowText)}</td>
          <td style="width:80px; text-align:left;"><span style="display:inline-block; font-size:11px; font-weight:700; padding:2px 10px; border-radius:99px; background:${color}1a; color:${color};">${esc(rec.priority)}</span></td>
        </tr></table>
        <table style="font-size:12px;">
          <tr><td style="${labelCell}">البُعد</td><td style="${td}">${esc(rec.dimension)}</td><td style="${labelCell}">المسؤول المقترح</td><td style="${td}">${esc(rec.responsibility)}</td></tr>
          <tr><td style="${labelCell}">البرنامج</td><td style="${td}">${esc(rec.programName ? programLabel(rec.programName) : '—')}</td><td style="${labelCell}">الموعد</td><td style="${td}">${esc(rec.timeframe)}</td></tr>
          <tr><td style="${labelCell}">المورد</td><td style="${td}" colspan="3">${resource}</td></tr>
          <tr><td style="${labelCell} border-bottom:none;">مؤشر النجاح</td><td style="${td} border-bottom:none;" colspan="3">${esc(rec.successMetric)}</td></tr>
        </table>
      </div>`;
    }).join('')}
  `;
}

function topicClustersSection(r: AnalysisResult): string {
  if (r.topicClusters.length === 0) return '';
  return `
    ${sectionTitle('6', 'موضوعات النصوص الحرة')}
    <div data-pdf-block style="margin-bottom:12px; line-height:2.6;">
      ${r.topicClusters.map(c => `
        <span style="display:inline-block; background:#eff6ff; border:1px solid #bfdbfe; border-radius:99px; padding:2px 14px; font-size:12px; margin-left:6px;">
          <strong style="color:#1e40af;">${esc(c.topic)}</strong> <span style="color:#64748b;">(${c.count})</span>
        </span>`).join('')}
    </div>
  `;
}

function methodologyAppendix(r: AnalysisResult): string {
  const p = (title: string, body: string) =>
    `<p data-pdf-block style="margin:0 0 8px;"><strong style="color:#334155;">${title}:</strong> ${body}</p>`;
  return `
    ${sectionTitle(r.topicClusters.length ? '7' : '6', 'الملحق المنهجي')}
    <div style="font-size:12px; line-height:1.9; color:#475569;">
      ${p('الاختبارات الإحصائية', 'حُسب متوسط كل مستجيب في كل بُعد، ثم المتوسط والانحراف المعياري وفترة الثقة 95% (Z = 1.96) على مستوى المستجيبين. نسبة الإجابات السلبية = نسبة الإجابات بدرجة 2 أو أقل من 5.')}
      ${p('معامل كرونباخ ألفا', `المتوسط = ${fmt(r.cronbachAlpha)}. ${r.cronbachAlpha >= 0.6 ? 'الاتساق الداخلي مقبول.' : 'الاتساق الداخلي منخفض — ينبغي مراجعة الفقرات.'}`)}
      ${p('قواعد التصنيف', 'القوة: متوسط 4.0 فأكثر وحد ثقة أدنى 3.5 فأكثر. الضعف: متوسط أقل من 3.0 أو نسبة سلبية 30% فأكثر. الفرص والتهديدات: أبعاد خارجية بعتبة 3.8 و3.0. التحدي: أهمية مرتفعة مع أداء منخفض.')}
      ${p('الأولوية', 'الشدة × نسبة المتأثرين × الارتباط بمؤشر اعتماد منخفض التغطية.')}
      ${r.topicClusters.length ? p('الموضوعات', 'تجميع محلي للكلمات المتكررة في النصوص الحرة بعد إزالة كلمات الربط، دون إرسال النصوص لأي جهة خارجية.') : ''}
      ${p('حجم العينة', `${r.totalResponses} مستجيبًا. ${r.sufficientData ? 'كافٍ للتحليل.' : 'أقل من 5 — النتائج استرشادية فقط.'}`)}
    </div>
  `;
}

function warningFooter(r: AnalysisResult): string {
  return `
    <div data-pdf-block style="margin-top:18px; background:#fef2f2; border:1.5px solid #fecaca; border-radius:12px; padding:12px 16px; text-align:center;">
      <div style="font-size:13px; font-weight:800; color:#991b1b; margin-bottom:4px;">تنبيه</div>
      <div style="font-size:12px; color:#7f1d1d; line-height:1.8;">${esc(r.warning)}</div>
    </div>
    <div data-pdf-block style="text-align:center; font-size:10.5px; color:#94a3b8; margin-top:14px;">
      أُنشئ هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي
    </div>
  `;
}
