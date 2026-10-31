import { supabase } from './supabase';
import QRCode from 'qrcode';
import { brandHeader, esc, sectionTitle, downloadHtmlAsPdf, qrCardsHtml } from './pdfExport';
import { buildPublicEvidenceUrl } from './supabase';
import { fetchProfile, fetchPerformance, PATH_LABELS, PROGRAM_STATUS_LABELS, type ProgramPath, type ProgramStatus } from './store';
import { performanceCriteria } from '@/data';
import { INDICATOR_TEXT, PROGRAM_NAMES } from './autoIndicators';
import { FOUNDER_LINE } from './brand';

/** التقرير الختامي للموجّه من البيانات الفعلية في المنصة */
export async function downloadFinalReport(): Promise<void> {
  const [ev, sv, cases, alerts, talents, council, consult, progs, scouncil, appts, profile, perf] = await Promise.all([
    supabase.from('guidance_evidence').select('title, module, category, indicator_codes, evidence_date_hijri, created_at, public_token').order('created_at'),
    supabase.from('guidance_surveys').select('id, title, status, indicators'),
    supabase.from('guidance_case_registry').select('case_type_label, status_label, classification_label'),
    supabase.from('guidance_early_alerts').select('alert_type_label, severity_label, status'),
    supabase.from('guidance_talents').select('talent_type_label'),
    supabase.from('guidance_parent_council').select('topic, meeting_date_hijri, attendees_count, status_label'),
    supabase.from('guidance_consultations').select('consultation_type, reply'),
    supabase.from('guidance_programs').select('title, path, status, beneficiaries, date_hijri'),
    supabase.from('guidance_student_council').select('topic, meeting_date_hijri, attendees_count, status_label'),
    supabase.from('guidance_appointments').select('status'),
    fetchProfile(),
    fetchPerformance(),
  ]);
  const evidence = (ev.data || []) as { title: string; module: string; category: string; indicator_codes: string[]; evidence_date_hijri: string | null; created_at: string; public_token: string }[];
  const evQrs = await Promise.all(evidence.map(e => QRCode.toDataURL(buildPublicEvidenceUrl(e.public_token), { width: 180, margin: 1 }).catch(() => '')));
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
    brandHeader('التقرير الختامي للموجّه الطلابي', `${profile.school} — ${profile.year}`),
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
    noorSection(profile.noor),
    sectionTitle('2', 'الاستبيانات'),
    table(['الاستبيان', 'الحالة', 'الإجابات'], surveys.map(s => [esc(s.title), s.status === 'published' ? 'منشور' : s.status === 'draft' ? 'مسودة' : 'مؤرشف', String(respCount[s.id] || 0)])),
    sectionTitle('3', 'البرامج الإرشادية'),
    table(['البرنامج', 'المسار', 'الحالة', 'التاريخ', 'المستفيدون'], ((progs.data || []) as { title: string; path: ProgramPath; status: ProgramStatus; beneficiaries: number; date_hijri: string | null }[]).map(p => [esc(p.title), PATH_LABELS[p.path], PROGRAM_STATUS_LABELS[p.status], esc(p.date_hijri || '—'), String(p.beneficiaries || 0)])),
    sectionTitle('4', 'الأداء الوظيفي (التقييم الذاتي)'),
    table(['المعيار', 'الوزن', 'الدرجة'], performanceCriteria.map(c => [esc(c.title), `${c.weight}%`, perf[c.id]?.score != null ? `${perf[c.id]?.score} / 10` : '—'])),
    sectionTitle('5', `الشواهد (${evidence.length}) — امسح الباركود للتحقق`),
    evidence.length ? qrCardsHtml(evidence.map((e, i) => ({
      title: e.title, subtitle: PROGRAM_NAMES[e.module] || e.category, qrDataUrl: evQrs[i] || undefined,
      url: buildPublicEvidenceUrl(e.public_token), note: e.evidence_date_hijri || new Date(e.created_at).toLocaleDateString('ar-SA'),
    }))) : '<p data-pdf-block style="font-size:12px; color:#64748b;">لا توجد شواهد مرفوعة.</p>',
    sectionTitle('6', 'الحالات والمتابعة'),
    table(['نوع الحالة', 'العدد'], groupCount(cases.data as Record<string, unknown>[], 'case_type_label').map(([k, v]) => [esc(k), String(v)])),
    table(['نوع الإنذار', 'العدد'], groupCount(alerts.data as Record<string, unknown>[], 'alert_type_label').map(([k, v]) => [esc(k), String(v)])),
    table(['المواهب', 'العدد'], groupCount(talents.data as Record<string, unknown>[], 'talent_type_label').map(([k, v]) => [esc(k), String(v)])),
    sectionTitle('7', 'العيادة الرقمية'),
    table(['البند', 'العدد'], [
      ['الاستشارات الواردة', String((consult.data || []).length)],
      ['الاستشارات التي تم الرد عليها', String(((consult.data || []) as { reply: string | null }[]).filter(c => c.reply).length)],
      ['المواعيد المحجوزة', String((appts.data || []).length)],
      ['المقابلات المنفذة', String(((appts.data || []) as { status: string }[]).filter(a => a.status === 'done').length)],
    ]),
    sectionTitle('8', 'المجلس الطلابي'),
    table(['الموضوع', 'التاريخ', 'الحضور', 'الحالة'], ((scouncil.data || []) as { topic: string; meeting_date_hijri: string; attendees_count: number; status_label: string }[]).map(m => [esc(m.topic), esc(m.meeting_date_hijri), String(m.attendees_count), esc(m.status_label)])),
    sectionTitle('9', 'مجلس الآباء والشراكة الأسرية'),
    table(['الموضوع', 'التاريخ', 'الحضور', 'الحالة'], ((council.data || []) as { topic: string; meeting_date_hijri: string; attendees_count: number; status_label: string }[]).map(m => [esc(m.topic), esc(m.meeting_date_hijri), String(m.attendees_count), esc(m.status_label)])),
    `<div data-pdf-block style="text-align:center; font-size:11px; color:#475569; margin-top:18px; padding-bottom:12px;">أُنشئ هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي<br/><b style="color:#10324a;">${esc(FOUNDER_LINE)}</b></div>`,
  ].join('');
  await downloadHtmlAsPdf(html, `التقرير-الختامي-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function noorSection(noor?: Record<string, number | string>): string {
  if (!noor || !Object.values(noor).some(v => v !== '' && v !== null && v !== undefined)) return '';
  const rows: [string, string][] = [
    ['إجمالي الجلسات الإرشادية', 'totalSessions'], ['جلسات فردية', 'individualSessions'], ['جلسات جماعية', 'groupSessions'],
    ['سجلات مرفوعة في نور', 'uploadedRecords'], ['نسبة التغطية %', 'coverage'],
  ];
  return `<div data-pdf-block style="margin:6px 0 10px; border:1px solid #dde6ee; border-radius:10px; padding:8px 12px; font-size:12px;">
    <b style="color:#10324a;">إحصاءات نظام نور:</b> ${rows.filter(([, k]) => noor[k] !== undefined && noor[k] !== '').map(([l, k]) => `${esc(l)}: <b>${esc(noor[k])}</b>`).join(' · ')}
  </div>`;
}
