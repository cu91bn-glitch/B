import { supabase } from './supabase';
import { brandHeader, esc, sectionTitle, downloadHtmlAsPdf } from './pdfExport';
import { INDICATOR_TEXT, PROGRAM_NAMES } from './autoIndicators';
import { FOUNDER_LINE } from './brand';

/** التقرير الختامي للموجّه من البيانات الفعلية في المنصة */
export async function downloadFinalReport(): Promise<void> {
  const [ev, sv, cases, alerts, talents, council, consult] = await Promise.all([
    supabase.from('guidance_evidence').select('title, module, category, indicator_codes, evidence_date_hijri, created_at').order('created_at'),
    supabase.from('guidance_surveys').select('id, title, status, indicators'),
    supabase.from('guidance_case_registry').select('case_type_label, status_label, classification_label'),
    supabase.from('guidance_early_alerts').select('alert_type_label, severity_label, status'),
    supabase.from('guidance_talents').select('talent_type_label'),
    supabase.from('guidance_parent_council').select('topic, meeting_date_hijri, attendees_count, status_label'),
    supabase.from('guidance_consultations').select('consultation_type'),
  ]);
  const evidence = (ev.data || []) as { title: string; module: string; category: string; indicator_codes: string[]; evidence_date_hijri: string | null; created_at: string }[];
  const surveys = (sv.data || []) as { id: string; title: string; status: string; indicators: string[] | null }[];

  const { data: respRows } = await supabase.from('guidance_survey_public_responses').select('survey_id');
  const respCount: Record<string, number> = {};
  for (const r of (respRows || []) as { survey_id: string }[]) respCount[r.survey_id] = (respCount[r.survey_id] || 0) + 1;

  const coverage: Record<string, number> = Object.fromEntries(Object.keys(INDICATOR_TEXT).map(c => [c, 0]));
  evidence.forEach(e => (e.indicator_codes || []).forEach(c => { if (c in coverage) coverage[c]++; }));
  surveys.filter(s => s.status === 'published').forEach(s => (s.indicators || []).forEach(c => { if (c in coverage) coverage[c]++; }));

  const groupCount = (rows: Record<string, unknown>[] | null, key: string) => {
    const m: Record<string, number> = {};
    for (const r of rows || []) { const k = String(r[key] ?? '—'); m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };

  const cell = 'padding:6px 8px; border-bottom:1px solid #eef2f7; font-size:11.5px;';
  const head = 'padding:7px 8px; font-size:11.5px; font-weight:800; text-align:right; background:#10324a; color:#fff;';
  const table = (headers: string[], rows: string[][]) => rows.length ? `
    <table style="margin-bottom:10px; border:1px solid #e2e8f0;">
      <thead><tr>${headers.map(h => `<th style="${head}">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'};">${r.map(c => `<td style="${cell}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>` : '<p data-pdf-block style="font-size:12px; color:#64748b;">لا توجد بيانات مسجلة.</p>';

  const kpi = (label: string, value: number | string, color: string) =>
    `<td style="width:16.6%; background:${color}14; border-radius:10px; padding:10px; text-align:center;"><div style="font-size:22px; font-weight:800; color:${color};">${value}</div><div style="font-size:11px; font-weight:700; color:#334155;">${label}</div></td>`;

  const html = [
    brandHeader('التقرير الختامي للموجّه الطلابي', 'العام الدراسي 1448هـ'),
    `<table data-pdf-block style="border-collapse:separate; border-spacing:6px 0; margin:0 -6px 14px; width:calc(100% + 12px);"><tr>
      ${kpi('شاهد', evidence.length, '#1E88C7')}${kpi('استبيان منشور', surveys.filter(s => s.status === 'published').length, '#2e9e5b')}
      ${kpi('إجابة طالب', Object.values(respCount).reduce((a, b) => a + b, 0), '#0e7490')}${kpi('حالة فردية', (cases.data || []).length, '#dc2626')}
      ${kpi('إنذار مبكر', (alerts.data || []).length, '#d97706')}${kpi('استشارة', (consult.data || []).length, '#10324a')}
    </tr></table>`,
    sectionTitle('1', 'تغطية مؤشرات الاعتماد'),
    table(['الرمز', 'المؤشر', 'الشواهد والاستبيانات', 'الحالة'], Object.entries(coverage).map(([c, n]) => [
      `<span class="ltr">${c}</span>`, esc(INDICATOR_TEXT[c]), String(n),
      `<b style="color:${n >= 3 ? '#2e9e5b' : n > 0 ? '#d97706' : '#dc2626'}">${n >= 3 ? 'مكتمل' : n > 0 ? 'جزئي' : 'يحتاج شواهد'}</b>`,
    ])),
    sectionTitle('2', 'الاستبيانات'),
    table(['الاستبيان', 'الحالة', 'الإجابات'], surveys.map(s => [esc(s.title), s.status === 'published' ? 'منشور' : s.status === 'draft' ? 'مسودة' : 'مؤرشف', String(respCount[s.id] || 0)])),
    sectionTitle('3', `الشواهد (${evidence.length})`),
    table(['الشاهد', 'البرنامج', 'التاريخ'], evidence.map(e => [esc(e.title), esc(PROGRAM_NAMES[e.module] || e.category), esc(e.evidence_date_hijri || new Date(e.created_at).toLocaleDateString('ar-SA'))])),
    sectionTitle('4', 'الحالات والمتابعة'),
    table(['نوع الحالة', 'العدد'], groupCount(cases.data as Record<string, unknown>[], 'case_type_label').map(([k, v]) => [esc(k), String(v)])),
    table(['نوع الإنذار', 'العدد'], groupCount(alerts.data as Record<string, unknown>[], 'alert_type_label').map(([k, v]) => [esc(k), String(v)])),
    table(['المواهب', 'العدد'], groupCount(talents.data as Record<string, unknown>[], 'talent_type_label').map(([k, v]) => [esc(k), String(v)])),
    sectionTitle('5', 'مجلس الآباء والشراكة الأسرية'),
    table(['الموضوع', 'التاريخ', 'الحضور', 'الحالة'], ((council.data || []) as { topic: string; meeting_date_hijri: string; attendees_count: number; status_label: string }[]).map(m => [esc(m.topic), esc(m.meeting_date_hijri), String(m.attendees_count), esc(m.status_label)])),
    `<div data-pdf-block style="text-align:center; font-size:11px; color:#475569; margin-top:18px; padding-bottom:12px;">أُنشئ هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي<br/><b style="color:#10324a;">${esc(FOUNDER_LINE)}</b></div>`,
  ].join('');
  await downloadHtmlAsPdf(html, `التقرير-الختامي-${new Date().toISOString().slice(0, 10)}.pdf`);
}
