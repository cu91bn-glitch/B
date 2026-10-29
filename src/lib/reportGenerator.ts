import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisResult } from './analysis';

function swotColor(type: string): string {
  switch (type) {
    case 'strength': return '#059669';
    case 'weakness': return '#dc2626';
    case 'opportunity': return '#2563eb';
    case 'threat': return '#d97706';
    default: return '#64748b';
  }
}

function swotLabel(type: string): string {
  const map: Record<string, string> = {
    strength: 'قوة', weakness: 'ضعف', opportunity: 'فرصة', threat: 'تهديد',
  };
  return map[type] || type;
}

function priorityColor(p: string): string {
  if (p === 'مرتفعة') return '#dc2626';
  if (p === 'متوسطة') return '#d97706';
  return '#059669';
}

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits);
}

export async function generateAnalysisPdf(result: AnalysisResult): Promise<Blob> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; right: -9999px; top: 0; width: 794px; padding: 40px;
    background: #ffffff; font-family: 'Cairo', 'Tajawal', sans-serif;
    direction: rtl; color: #1e293b; font-size: 14px; line-height: 1.7;
  `;
  container.innerHTML = buildReportHtml(result);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff',
      windowWidth: 794,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210, pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

function buildReportHtml(r: AnalysisResult): string {
  const s = r.survey;
  const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
    ${reportHeader(s.title, dateStr)}
    ${execSummary(r)}
    ${descriptionSection(s)}
    ${evidenceSection(r)}
    ${swotSection(r)}
    ${recommendationsSection(r)}
    ${topicClustersSection(r)}
    ${methodologyAppendix(r)}
    ${warningFooter(r)}
  `;
}

function reportHeader(title: string, dateStr: string): string {
  return `
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #1e40af; padding-bottom:16px; margin-bottom:28px;">
      <div>
        <div style="font-size:22px; font-weight:800; color:#10324a;">بوصلة</div>
        <div style="font-size:13px; color:#0e7490; margin-top:4px;">منصة الموجّه الطلابي</div>
        <div style="font-size:13px; color:#64748b; margin-top:4px;">تقرير تحليل استبيان</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:16px; font-weight:700; color:#334155;">${title}</div>
        <div style="font-size:12px; color:#94a3b8; margin-top:4px;">${dateStr}</div>
      </div>
    </div>
  `;
}

function sectionTitle(num: string, title: string): string {
  return `<h2 style="font-size:16px; font-weight:700; color:#1e3a8a; border-right:4px solid #3b82f6; padding-right:12px; margin:24px 0 12px;">${num}. ${title}</h2>`;
}

function execSummary(r: AnalysisResult): string {
  const s = r.survey;
  const strengths = r.swot.filter(e => e.swotType === 'strength');
  const weaknesses = r.swot.filter(e => e.swotType === 'weakness');
  const opportunities = r.swot.filter(e => e.swotType === 'opportunity');
  const threats = r.swot.filter(e => e.swotType === 'threat');

  return `
    ${sectionTitle('١', 'الملخص التنفيذي')}
    <div style="background:#f8fafc; border-radius:12px; padding:20px; margin-bottom:12px;">
      <table style="width:100%; font-size:13px; border-collapse:collapse;">
        <tr>
          <td style="padding:6px; width:30%; color:#64748b;">الاستبيان</td><td style="padding:6px; font-weight:600;">${s.title}</td>
          <td style="padding:6px; width:30%; color:#64748b;">عدد الاستجابات</td><td style="padding:6px; font-weight:600;">${r.totalResponses}</td>
        </tr>
        <tr>
          <td style="padding:6px; color:#64748b;">الفئة المستهدفة</td><td style="padding:6px;">${s.audience}</td>
          <td style="padding:6px; color:#64748b;">المتوسط الكلي</td><td style="padding:6px; font-weight:600;">${fmt(r.overallMean)}</td>
        </tr>
        <tr>
          <td style="padding:6px; color:#64748b;">عدد الأبعاد</td><td style="padding:6px;">${r.dimensions.length}</td>
          <td style="padding:6px; color:#64748b;">معامل كرونباخ (متوسط)</td>
          <td style="padding:6px; font-weight:600; color:${r.cronbachAlpha >= 0.6 ? '#059669' : '#dc2626'};">${fmt(r.cronbachAlpha)}</td>
        </tr>
      </table>
    </div>
    <div style="display:flex; gap:8px; margin-bottom:12px;">
      <div style="flex:1; background:#ecfdf5; border-radius:10px; padding:12px; text-align:center;">
        <div style="font-size:24px; font-weight:800; color:#059669;">${strengths.length}</div><div style="font-size:11px; color:#059669;">قوة</div>
      </div>
      <div style="flex:1; background:#fef2f2; border-radius:10px; padding:12px; text-align:center;">
        <div style="font-size:24px; font-weight:800; color:#dc2626;">${weaknesses.length}</div><div style="font-size:11px; color:#dc2626;">ضعف</div>
      </div>
      <div style="flex:1; background:#eff6ff; border-radius:10px; padding:12px; text-align:center;">
        <div style="font-size:24px; font-weight:800; color:#2563eb;">${opportunities.length}</div><div style="font-size:11px; color:#2563eb;">فرصة</div>
      </div>
      <div style="flex:1; background:#fffbeb; border-radius:10px; padding:12px; text-align:center;">
        <div style="font-size:24px; font-weight:800; color:#d97706;">${threats.length}</div><div style="font-size:11px; color:#d97706;">تهديد</div>
      </div>
    </div>
    ${r.recommendations.length > 0 ? `
      <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:14px; margin-bottom:12px;">
        <div style="font-weight:700; color:#9a3412; margin-bottom:6px;">أبرز التوصيات</div>
        ${r.recommendations.slice(0, 3).map(rec => `
          <div style="font-size:12px; margin-bottom:4px; color:#7c2d12;">
            <span style="font-weight:600;">[${rec.priority}]</span> ${rec.ifLowText} — ${rec.responsibility} (${rec.timeframe})
          </div>
        `).join('')}
      </div>` : ''}
  `;
}

function descriptionSection(s: { title: string; intro: string; audience: string; indicators: string[]; programs: string[]; sections: { items: unknown[] }[] }): string {
  return `
    ${sectionTitle('٢', 'وصف الاستبيان')}
    <div style="font-size:13px; line-height:1.8; margin-bottom:12px;">${s.intro}</div>
    <table style="width:100%; font-size:12px; border-collapse:collapse; margin-bottom:12px;">
      <tr style="background:#f1f5f9;">
        <td style="padding:8px; color:#64748b;">الفئة</td><td style="padding:8px;">${s.audience}</td>
        <td style="padding:8px; color:#64748b;">المؤشرات المرتبطة</td><td style="padding:8px;" dir="ltr">${s.indicators.join('، ')}</td>
      </tr>
      <tr>
        <td style="padding:8px; color:#64748b;">البرامج</td><td style="padding:8px;" dir="ltr">${s.programs.join('، ')}</td>
        <td style="padding:8px; color:#64748b;">عدد الفقرات</td><td style="padding:8px;">${s.sections.reduce((a: number, sec: { items: unknown[] }) => a + sec.items.length, 0)}</td>
      </tr>
    </table>
  `;
}

function evidenceSection(r: AnalysisResult): string {
  return `
    ${sectionTitle('٣', 'الاستدلال والإحصاءات')}
    <table style="width:100%; font-size:12px; border-collapse:collapse; margin-bottom:12px;">
      <thead>
        <tr style="background:#1e3a8a; color:#fff;">
          <th style="padding:8px; text-align:right;">البُعد</th>
          <th style="padding:8px;">المتوسط</th>
          <th style="padding:8px;">الانحراف</th>
          <th style="padding:8px;">حد ثقة سفلي</th>
          <th style="padding:8px;">حد ثقة علوي</th>
          <th style="padding:8px;">نسبة سلبية</th>
          <th style="padding:8px;">n</th>
          <th style="padding:8px;">الثقة</th>
          <th style="padding:8px;">المستوى</th>
        </tr>
      </thead>
      <tbody>
        ${r.dimensions.map((d, i) => `
          <tr style="background:${i % 2 ? '#f8fafc' : '#fff'};">
            <td style="padding:7px; font-weight:600;">${d.sectionName}</td>
            <td style="padding:7px; text-align:center; font-weight:700; color:${d.mean >= 4 ? '#059669' : d.mean < 3 ? '#dc2626' : '#64748b'};">${fmt(d.mean)}</td>
            <td style="padding:7px; text-align:center;">${fmt(d.stdDev)}</td>
            <td style="padding:7px; text-align:center;">${fmt(d.ciLower)}</td>
            <td style="padding:7px; text-align:center;">${fmt(d.ciUpper)}</td>
            <td style="padding:7px; text-align:center; color:${d.negativeRatio >= 0.3 ? '#dc2626' : '#64748b'};">${(d.negativeRatio * 100).toFixed(0)}%</td>
            <td style="padding:7px; text-align:center;">${d.n}</td>
            <td style="padding:7px; text-align:center;">${d.confidenceLevel}</td>
            <td style="padding:7px; text-align:center;">${d.band}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function swotSection(r: AnalysisResult): string {
  const types = ['strength', 'weakness', 'opportunity', 'threat'] as const;
  return `
    ${sectionTitle('٤', 'تحليل SWOT')}
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
      ${types.map(type => {
        const entries = r.swot.filter(e => e.swotType === type);
        const color = swotColor(type);
        return `
          <div style="flex:1; min-width:180px; border:2px solid ${color}20; border-radius:12px; padding:14px; background:${color}08;">
            <div style="font-weight:800; color:${color}; font-size:14px; margin-bottom:8px; border-bottom:1px solid ${color}30; padding-bottom:6px;">
              ${swotLabel(type)} (${entries.length})
            </div>
            ${entries.length === 0
              ? '<div style="font-size:12px; color:#94a3b8;">لا يوجد</div>'
              : entries.map(e => `
                <div style="margin-bottom:8px;">
                  <div style="font-size:12px; font-weight:600;">${e.dimension}</div>
                  <div style="font-size:11px; color:#64748b; line-height:1.5;">${e.evidence}</div>
                  <div style="font-size:10px; color:#94a3b8; margin-top:2px;">الثقة: ${e.confidenceLevel} · ${e.factType}</div>
                </div>
              `).join('')}
          </div>
        `;
      }).join('')}
    </div>
    ${r.challenges.length > 0 ? `
      <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:10px; padding:14px; margin-bottom:12px;">
        <div style="font-weight:700; color:#92400e; margin-bottom:8px;">تحديات (Challenge)</div>
        ${r.challenges.map(c => `
          <div style="font-size:12px; margin-bottom:6px;">
            <span style="font-weight:600;">${c.dimension}</span>: ${c.reason}
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function recommendationsSection(r: AnalysisResult): string {
  if (r.recommendations.length === 0) {
    return `${sectionTitle('٥', 'التوصيات')}<p style="font-size:13px; color:#94a3b8;">لا توجد توصيات محددة بناءً على النتائج الحالية.</p>`;
  }
  const sorted = [...r.recommendations].sort((a, b) => b.priorityScore - a.priorityScore);
  return `
    ${sectionTitle('٥', 'التوصيات والإجراءات المقترحة')}
    ${sorted.map((rec, i) => `
      <div style="border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:10px; border-right:4px solid ${priorityColor(rec.priority)};">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
          <div style="font-weight:700; font-size:13px;">${i + 1}. ${rec.ifLowText}</div>
          <span style="font-size:11px; font-weight:700; padding:2px 10px; border-radius:99px; background:${priorityColor(rec.priority)}15; color:${priorityColor(rec.priority)};">${rec.priority}</span>
        </div>
        <table style="width:100%; font-size:12px;">
          <tr>
            <td style="padding:4px; color:#64748b; width:20%;">البُعد</td><td style="padding:4px;">${rec.dimension}</td>
            <td style="padding:4px; color:#64748b; width:20%;">المسؤول المقترح</td><td style="padding:4px;">${rec.responsibility}</td>
          </tr>
          <tr>
            <td style="padding:4px; color:#64748b;">البرنامج</td><td style="padding:4px;" dir="ltr">${rec.programName || '—'}</td>
            <td style="padding:4px; color:#64748b;">الموعد</td><td style="padding:4px;">${rec.timeframe}</td>
          </tr>
          <tr>
            <td style="padding:4px; color:#64748b;">المورد</td>
            <td style="padding:4px;" colspan="3">${rec.resourceTitle ? `${rec.resourceTitle}${rec.resourceUrl ? ` (<span dir="ltr" style="color:#2563eb;">${rec.resourceUrl}</span>)` : ''}` : '—'}</td>
          </tr>
          <tr>
            <td style="padding:4px; color:#64748b;">مؤشر النجاح</td><td style="padding:4px;" colspan="3">${rec.successMetric}</td>
          </tr>
        </table>
      </div>
    `).join('')}
  `;
}

function topicClustersSection(r: AnalysisResult): string {
  if (r.topicClusters.length === 0) return '';
  return `
    ${sectionTitle('٦', 'موضوعات النصوص الحرة')}
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
      ${r.topicClusters.map(c => `
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:99px; padding:6px 14px; font-size:12px;">
          <span style="font-weight:700; color:#1e40af;">${c.topic}</span>
          <span style="color:#64748b; margin-right:6px;">(${c.count})</span>
        </div>
      `).join('')}
    </div>
  `;
}

function methodologyAppendix(r: AnalysisResult): string {
  return `
    ${sectionTitle('٧', 'الملحق المنهجي')}
    <div style="font-size:12px; line-height:1.8; color:#475569;">
      <p style="margin-bottom:8px;"><span style="font-weight:700;">الاختبارات الإحصائية:</span> تم حساب المتوسطات والانحراف المعياري وفترات الثقة 95% (Z=1.96) لكل بُعد. نسبة الإجابات السلبية = نسبة الإجابات بدرجة ≤ 2 من 5.</p>
      <p style="margin-bottom:8px;"><span style="font-weight:700;">معامل كرونباخ:</span> متوسط α = ${fmt(r.cronbachAlpha)}. ${r.cronbachAlpha >= 0.6 ? 'الاتساق مقبول.' : 'الاتساق منخفض — ينبغي تحكيم الفقرات.'}</p>
      <p style="margin-bottom:8px;"><span style="font-weight:700;">قواعد التصنيف:</span> القوة: متوسط ≥ 4.0 وحد ثقة سفلي ≥ 3.5. الضعف: متوسط < 3.0 أو نسبة سلبية ≥ 30%. الفرصة/التهديد: أبعاد خارجية بعتبة 3.8/3.0. التحدّي: أهمية مرتفعة + أداء منخفض.</p>
      <p style="margin-bottom:8px;"><span style="font-weight:700;">الأولوية:</span> الشدة × نسبة المتأثرين × ارتباط بمؤشر اعتماد منخفض التغطية.</p>
      <p style="margin-bottom:8px;"><span style="font-weight:700;">الموضوعات:</span> تجميع محلي للكلمات المتكررة في النصوص الحرة بعد إزالة كلمات الوقف، دون استخدام نموذج لغوي خارجي.</p>
      <p style="margin-bottom:8px;"><span style="font-weight:700;">حجم العينة:</span> n=${r.totalResponses}. ${r.sufficientData ? 'كافٍ للتحليل.' : 'أقل من 5 — نتائج استرشادية فقط.'}</p>
    </div>
  `;
}

function warningFooter(r: AnalysisResult): string {
  return `
    <div style="margin-top:24px; background:#fef2f2; border:2px solid #fecaca; border-radius:12px; padding:16px; text-align:center;">
      <div style="font-size:13px; font-weight:700; color:#991b1b; margin-bottom:6px;">تنبيه</div>
      <div style="font-size:12px; color:#7f1d1d; line-height:1.8;">${r.warning}</div>
    </div>
    <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">
      تم إنشاء هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي — ${new Date().toLocaleString('ar-SA')}
    </div>
  `;
}
