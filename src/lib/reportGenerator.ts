import QRCode from 'qrcode';
import type { AnalysisResult, Recommendation } from './analysis';
import { esc, logoUrl, renderHtmlToPdfBlob } from './pdfExport';
import { audienceLabel, programLabel } from './labels';
import { FOUNDER_NAME } from './brand';
import { INDICATOR_TEXT } from './autoIndicators';

/**
 * تقرير التحليل في صفحة واحدة: مؤشرات رئيسية، رسم أعمدة للأبعاد، مخططات دائرية،
 * تحليل SWOT مختصر، وأهم التوصيات مع باركود المورد بدل الرابط الطويل.
 */

const C = { navy: '#10324a', blue: '#1E88C7', teal: '#0e7490', green: '#2e9e5b', amber: '#d97706', red: '#dc2626', ink: '#1b2a38', muted: '#3a4c5c', line: '#dde6ee' };

function fmt(n: number, d = 2): string { return Number.isFinite(n) ? n.toFixed(d) : '—'; }
function barColor(mean: number): string { return mean >= 4 ? C.green : mean >= 3 ? C.blue : C.red; }
function priorityColor(p: string): string { return p === 'مرتفعة' ? C.red : p === 'متوسطة' ? C.amber : C.green; }

function donut(pct: number, color: string, size = 96, stroke = 13): string {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#e6eef4" stroke-width="${stroke}"/>
    ${v > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${(v / 100) * c} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ''}</svg>`;
}

function donutBlock(pct: number, color: string, center: string, label: string): string {
  return `<div style="text-align:center;">
    <div style="position:relative; width:96px; height:96px; margin:0 auto;">${donut(pct, color)}
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:800; color:${C.navy};">${center}</div>
    </div>
    <div style="font-size:11.5px; font-weight:700; color:${C.muted}; margin-top:4px;">${label}</div>
  </div>`;
}

async function qr(url: string): Promise<string> {
  try { return await QRCode.toDataURL(url, { width: 160, margin: 0 }); } catch { return ''; }
}

export async function generateAnalysisPdf(result: AnalysisResult): Promise<Blob> {
  return renderHtmlToPdfBlob(await buildReportHtml(result));
}

export async function buildReportHtml(r: AnalysisResult): Promise<string> {
  const s = r.survey;
  const date = new Date().toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' });
  const negAvg = r.dimensions.length ? r.dimensions.reduce((a, d) => a + d.negativeRatio, 0) / r.dimensions.length : 0;
  const recs = [...r.recommendations].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
  const qrs = await Promise.all(recs.map(rec => (rec.resourceQrUrl || rec.resourceUrl) ? qr(rec.resourceQrUrl || rec.resourceUrl || '') : Promise.resolve('')));
  const count = (t: string) => r.swot.filter(e => e.swotType === t).length;

  const header = `
    <div data-pdf-block style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:6px 0 10px; border-bottom:3px solid ${C.teal};">
      <div style="text-align:center;">
        <img src="${logoUrl()}" style="height:52px; display:block;" />
        <div style="font-size:10.5px; font-weight:800; color:${C.navy}; margin-top:2px;">${esc(FOUNDER_NAME)}</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:11px; color:${C.teal}; font-weight:700;">تقرير تحليل استبيان</div>
        <div style="font-size:17px; font-weight:800; color:${C.navy}; line-height:1.5;">${esc(s.title)}</div>
        <div style="font-size:10.5px; color:${C.muted};">${esc(audienceLabel(s.audience))} — ${esc(date)}</div>
      </div>
    </div>`;

  const kpi = (v: string, l: string, color: string) =>
    `<td style="background:${color}12; border:1px solid ${color}33; border-radius:10px; padding:8px 6px; text-align:center;">
      <div style="font-size:20px; font-weight:800; color:${color}; line-height:1.3;">${v}</div>
      <div style="font-size:10.5px; font-weight:700; color:${C.muted};">${l}</div></td>`;
  const kpis = `
    <table data-pdf-block style="border-collapse:separate; border-spacing:6px 0; margin:10px -6px 10px; width:calc(100% + 12px);"><tr>
      ${kpi(String(r.totalResponses), 'مستجيب', C.blue)}
      ${kpi(fmt(r.overallMean), 'المتوسط العام من 5', barColor(r.overallMean))}
      ${kpi(fmt(r.cronbachAlpha), 'ثبات الأداة (ألفا)', r.cronbachAlpha >= 0.6 ? C.green : C.red)}
      ${kpi(String(count('strength')), 'نقاط قوة', C.green)}
      ${kpi(String(count('weakness')), 'نقاط تحتاج تحسين', C.red)}
    </tr></table>`;

  const bars = r.dimensions.map(d => `
    <div style="margin-bottom:7px;">
      <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; color:${C.ink};">
        <span>${esc(d.sectionName)}</span><span style="color:${barColor(d.mean)};">${fmt(d.mean)}</span>
      </div>
      <div style="height:11px; background:#eef3f7; border-radius:99px; overflow:hidden; margin-top:3px;">
        <div style="height:11px; width:${Math.max(4, (d.mean / 5) * 100)}%; background:${barColor(d.mean)}; border-radius:99px;"></div>
      </div>
      <div style="font-size:9.5px; color:${C.muted}; margin-top:1px;">سلبية ${(d.negativeRatio * 100).toFixed(0)}% · ${esc(d.band)} · ثقة ${esc(d.confidenceLevel)}</div>
    </div>`).join('');

  const charts = `
    <table data-pdf-block style="width:100%; border-collapse:separate; border-spacing:0 0; margin-bottom:10px;"><tr>
      <td style="width:62%; vertical-align:top; border:1px solid ${C.line}; border-radius:12px; padding:10px 12px;">
        <div style="font-size:12.5px; font-weight:800; color:${C.navy}; margin-bottom:8px;">متوسط كل بُعد (من 5)</div>
        ${bars}
      </td>
      <td style="width:2%;"></td>
      <td style="width:36%; vertical-align:top; border:1px solid ${C.line}; border-radius:12px; padding:10px 8px;">
        <div style="font-size:12.5px; font-weight:800; color:${C.navy}; margin-bottom:8px; text-align:center;">مؤشرات عامة</div>
        <table style="width:100%;"><tr>
          <td>${donutBlock((r.overallMean / 5) * 100, barColor(r.overallMean), `${Math.round((r.overallMean / 5) * 100)}%`, 'الرضا العام')}</td>
          <td>${donutBlock(negAvg * 100, negAvg >= 0.3 ? C.red : C.amber, `${Math.round(negAvg * 100)}%`, 'إجابات سلبية')}</td>
        </tr></table>
        <div style="margin-top:8px; font-size:10.5px; color:${C.muted}; line-height:1.7; text-align:center;">
          ${r.sufficientData ? 'حجم العينة كافٍ للتحليل' : 'العينة أقل من 5 — النتائج استرشادية'}
        </div>
      </td>
    </tr></table>`;

  const swotBox = (t: string, label: string, color: string) => {
    const list = r.swot.filter(e => e.swotType === t);
    return `<td style="width:25%; vertical-align:top; background:${color}0d; border:1px solid ${color}40; border-radius:10px; padding:8px;">
      <div style="font-size:11.5px; font-weight:800; color:${color};">${label} (${list.length})</div>
      <div style="font-size:10.5px; color:${C.ink}; line-height:1.6; margin-top:3px;">${list.length ? list.map(e => `• ${esc(e.dimension)}`).join('<br/>') : '<span style="color:#94a3b8;">لا يوجد</span>'}</div></td>`;
  };
  const swot = `
    <table data-pdf-block style="border-collapse:separate; border-spacing:6px 0; margin:0 -6px 10px; width:calc(100% + 12px);"><tr>
      ${swotBox('strength', 'القوة', C.green)}${swotBox('weakness', 'الضعف', C.red)}${swotBox('opportunity', 'الفرص', C.blue)}${swotBox('threat', 'التهديدات', C.amber)}
    </tr></table>`;

  const recCard = (rec: Recommendation, i: number) => `
    <td style="width:50%; vertical-align:top; padding:0;">
      <div style="border:1px solid ${C.line}; border-right:4px solid ${priorityColor(rec.priority)}; border-radius:10px; padding:8px 10px; height:100%;">
        <table style="width:100%;"><tr>
          <td style="vertical-align:top;">
            <div style="font-size:12px; font-weight:800; color:${C.ink}; line-height:1.6;">${i + 1}. ${esc(rec.ifLowText)}</div>
            <div style="font-size:10.5px; color:${C.muted}; line-height:1.7; margin-top:2px;">
              البعد: ${esc(rec.dimension)}<br/>
              ${rec.programName ? `البرنامج: ${esc(programLabel(rec.programName))}<br/>` : ''}
              المسؤول: ${esc(rec.responsibility)} · ${esc(rec.timeframe)}<br/>
              <span style="color:${priorityColor(rec.priority)}; font-weight:800;">أولوية ${esc(rec.priority)}</span>
            </div>
          </td>
          ${qrs[i] ? `<td style="width:70px; vertical-align:top; text-align:center;"><img src="${qrs[i]}" style="width:64px; height:64px; display:block; margin:0 auto;"/><div style="font-size:8.5px; color:${C.muted}; margin-top:2px;">امسح للمورد</div></td>` : ''}
        </tr></table>
      </div>
    </td>`;
  const recRows: string[] = [];
  for (let i = 0; i < recs.length; i += 2) {
    recRows.push(`<tr data-pdf-block>${recCard(recs[i], i)}${recs[i + 1] ? recCard(recs[i + 1], i + 1) : '<td></td>'}</tr>`);
  }
  const recommendations = recs.length ? `
    <div data-pdf-block style="font-size:13px; font-weight:800; color:${C.navy}; margin:4px 0 6px;">أهم التوصيات</div>
    <table style="border-collapse:separate; border-spacing:6px; margin:-6px -6px 4px; width:calc(100% + 12px);">${recRows.join('')}</table>`
    : `<p data-pdf-block style="font-size:12px; color:${C.muted};">لا توجد توصيات محددة بناءً على النتائج الحالية.</p>`;

  const indicators = s.indicators.length ? `
    <div data-pdf-block style="font-size:10.5px; color:${C.muted}; line-height:1.7; margin-top:4px;">
      <b style="color:${C.navy};">مؤشرات الاعتماد:</b> ${s.indicators.map(c => `<span class="ltr">${esc(c)}</span>${INDICATOR_TEXT[c] ? ` ${esc(INDICATOR_TEXT[c].slice(0, 48))}…` : ''}`).join(' · ')}
    </div>` : '';

  const footer = `
    <div data-pdf-block style="margin-top:10px; padding:8px 0 18px; border-top:1px solid ${C.line}; text-align:center; font-size:10.5px; color:${C.muted}; line-height:1.9;">
      ${esc(r.warning)}<br/>
      أُنشئ هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي · إعداد: <b style="color:${C.navy};">${esc(FOUNDER_NAME)}</b>
    </div>`;

  return header + kpis + charts + swot + recommendations + indicators + footer;
}
