import { useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet, Loader2, Upload, UserX, Clock3, ShieldAlert, TrendingDown, Award, Save, CheckCircle2, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Panel } from '@/components/layout/AppShell';

/**
 * استيراد كشف (Excel أو Word أو CSV) من نظام نور أو من المدرسة،
 * والتعرف على الأعمدة تلقائيًا، ثم فرز الطلاب إلى فئات تحتاج متابعة أو تعزيز.
 * الملف يُقرأ داخل المتصفح فقط، ولا يُحفظ شيء إلا عند الضغط على «حفظ».
 */

type Student = { name: string; id: string; grade: string; absence: number | null; late: number | null; behavior: number | null; score: number | null; notes: string };
type CategoryId = 'absence' | 'late' | 'behavior' | 'academic' | 'gifted';

const FIELDS: Record<keyof Student, RegExp> = {
  name: /اسم/,
  id: /هوية|سجل|مدني|رقم الطالب|الرقم/,
  grade: /الصف|الفصل|الشعبة|المرحلة/,
  absence: /غياب|غائب/,
  late: /تأخر|تاخر|تأخير/,
  behavior: /مخالف|سلوك|انضباط|إنذار|انذار/,
  score: /معدل|نسبة|المجموع|الدرجة|التقدير الرقمي|النتيجة/,
  notes: /ملاحظ/,
};

const CATEGORIES: Record<CategoryId, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string; rule: string; actions: string[] }> = {
  absence: {
    label: 'متكررو الغياب', icon: UserX, tone: 'rose', rule: '5 أيام غياب فأكثر',
    actions: ['التواصل الهاتفي مع ولي الأمر ومعرفة الأسباب', 'عقد اتفاق مكتوب مع الطالب وولي الأمر', 'إدراجه في برنامج رعاية متكرري الغياب', 'متابعة أسبوعية للحضور وتعزيز التحسن'],
  },
  late: {
    label: 'متكررو التأخر الصباحي', icon: Clock3, tone: 'amber', rule: '5 مرات تأخر فأكثر',
    actions: ['تنبيه ولي الأمر بأوقات الحضور', 'تطبيق قواعد السلوك والمواظبة بالتدرج', 'جدول متابعة يومي لمدة أسبوعين', 'تحفيز الالتزام بشهادة شكر عند التحسن'],
  },
  behavior: {
    label: 'ذوو الملاحظات السلوكية', icon: ShieldAlert, tone: 'orange', rule: 'مخالفة واحدة فأكثر أو ملاحظة مسجلة',
    actions: ['جلسة إرشادية فردية لفهم السبب', 'خطة تعديل سلوك بأهداف قصيرة', 'إشراك ولي الأمر ووكيل شؤون الطلاب', 'تعزيز السلوك الإيجابي وإسناد مهام قيادية'],
  },
  academic: {
    label: 'المتأخرون دراسيًا', icon: TrendingDown, tone: 'sky', rule: 'معدل أقل من 60',
    actions: ['تشخيص المواد الضعيفة مع المعلمين', 'خطة علاجية وحصص تقوية', 'برنامج تنمية الدافعية لرفع التحصيل', 'متابعة شهرية للنتائج مع ولي الأمر'],
  },
  gifted: {
    label: 'المتفوقون والموهوبون', icon: Award, tone: 'emerald', rule: 'معدل 95 فأكثر',
    actions: ['تكريمهم وإبراز إنجازهم في الإذاعة والمنصات', 'ترشيحهم لبرامج موهبة والمسابقات', 'إشراكهم في المجلس الطلابي والأنشطة الإثرائية', 'إسناد دور الطالب المساعد لزملائه'],
  },
};

const toneClass: Record<string, string> = {
  rose: 'bg-rose-50 text-rose-700 border-rose-200', amber: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200', sky: 'bg-brand-50 text-brand-700 border-brand-200',
  emerald: 'bg-leaf-50 text-leaf-700 border-leaf-200',
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function rowsToStudents(rows: unknown[][]): { students: Student[]; mapped: Partial<Record<keyof Student, string>> } {
  let headerIdx = -1;
  let best = 0;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const hits = (rows[i] || []).filter(c => typeof c === 'string' && Object.values(FIELDS).some(re => re.test(c))).length;
    if (hits > best) { best = hits; headerIdx = i; }
  }
  if (headerIdx < 0 || best < 2) throw new Error('لم أتعرف على أعمدة الكشف. تأكد أن الصف الأول فيه عناوين مثل: اسم الطالب، الصف، الغياب...');
  const header = rows[headerIdx].map(c => String(c ?? '').trim());
  const col: Partial<Record<keyof Student, number>> = {};
  const mapped: Partial<Record<keyof Student, string>> = {};
  (Object.keys(FIELDS) as (keyof Student)[]).forEach(key => {
    const idx = header.findIndex((h, i) => FIELDS[key].test(h) && !Object.values(col).includes(i));
    if (idx >= 0) { col[key] = idx; mapped[key] = header[idx]; }
  });
  if (col.name === undefined) {
    const idx = header.findIndex((h, i) => /طالب/.test(h) && !Object.values(col).includes(i));
    if (idx >= 0) { col.name = idx; mapped.name = header[idx]; }
  }
  if (col.name === undefined) throw new Error('لم أجد عمود اسم الطالب في الكشف');
  const students: Student[] = [];
  for (const r of rows.slice(headerIdx + 1)) {
    const name = String(r[col.name] ?? '').trim();
    if (!name || name.length < 3) continue;
    const g = (k: keyof Student) => (col[k] === undefined ? undefined : r[col[k] as number]);
    students.push({
      name, id: String(g('id') ?? '').trim(), grade: String(g('grade') ?? '').trim(),
      absence: num(g('absence')), late: num(g('late')), behavior: num(g('behavior')), score: num(g('score')),
      notes: String(g('notes') ?? '').trim(),
    });
  }
  return { students, mapped };
}

export function classify(s: Student): CategoryId[] {
  const out: CategoryId[] = [];
  if ((s.absence ?? 0) >= 5) out.push('absence');
  if ((s.late ?? 0) >= 5) out.push('late');
  if ((s.behavior ?? 0) >= 1 || /مخالف|سلوك|إنذار|انذار|تنبيه/.test(s.notes)) out.push('behavior');
  if (s.score !== null && s.score > 0 && s.score < 60) out.push('academic');
  if (s.score !== null && s.score >= 95) out.push('gifted');
  return out;
}

async function readFile(file: File): Promise<unknown[][]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'docx') {
    await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
    const mammoth = (window as unknown as { mammoth: { convertToHtml: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> } }).mammoth;
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const doc = new DOMParser().parseFromString(value, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr')).map(tr => Array.from(tr.querySelectorAll('td,th')).map(td => td.textContent?.trim() || ''));
    if (!rows.length) throw new Error('ملف Word لا يحتوي على جدول');
    return rows;
  }
  if (ext === 'doc') throw new Error('صيغة Word القديمة (.doc) غير مدعومة. احفظ الملف بصيغة .docx أو Excel');
  const XLSX = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const all: unknown[][] = [];
  for (const name of wb.SheetNames) all.push(...(XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }) as unknown[][]));
  return all;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error('تعذر تحميل قارئ الملفات، تحقق من الاتصال'));
    document.head.appendChild(s);
  });
}

export function NoorImport({ onSaved }: { onSaved?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [students, setStudents] = useState<Student[] | null>(null);
  const [mapped, setMapped] = useState<Partial<Record<keyof Student, string>>>({});
  const [active, setActive] = useState<CategoryId>('absence');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const groups = useMemo(() => {
    const g: Record<CategoryId, Student[]> = { absence: [], late: [], behavior: [], academic: [], gifted: [] };
    for (const s of students || []) for (const c of classify(s)) g[c].push(s);
    g.absence.sort((a, b) => (b.absence ?? 0) - (a.absence ?? 0));
    g.late.sort((a, b) => (b.late ?? 0) - (a.late ?? 0));
    g.academic.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    g.gifted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return g;
  }, [students]);

  const onFile = async (file: File) => {
    setBusy(true); setError(''); setSaved(''); setFileName(file.name);
    try {
      const { students: list, mapped: m } = rowsToStudents(await readFile(file));
      if (!list.length) throw new Error('لم أجد أسماء طلاب في الكشف');
      setStudents(list); setMapped(m);
      const first = (Object.keys(CATEGORIES) as CategoryId[]).find(c => list.some(s => classify(s).includes(c)));
      if (first) setActive(first);
    } catch (e) { setStudents(null); setError(e instanceof Error ? e.message : 'تعذر قراءة الملف'); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!students) return;
    setSaving(true); setError('');
    try {
      const alerts = (['absence', 'late', 'behavior', 'academic'] as CategoryId[]).flatMap(cat => groups[cat].map(s => {
        const sev = cat === 'absence' && (s.absence ?? 0) >= 10 ? 'critical' : cat === 'academic' || (cat === 'behavior' && (s.behavior ?? 0) >= 3) ? 'warning' : 'watch';
        return {
          student_code: s.id || s.name, student_grade: s.grade || '—',
          alert_type: cat === 'academic' ? 'academic' : cat === 'behavior' ? 'discipline' : 'attendance',
          alert_type_label: CATEGORIES[cat].label,
          severity: sev, severity_label: sev === 'critical' ? 'حرج' : sev === 'warning' ? 'تحذير' : 'مراقبة',
          score: Math.min(100, Math.round((s.absence ?? 0) * 6 + (s.late ?? 0) * 4 + (s.behavior ?? 0) * 15 + (s.score !== null && s.score < 60 ? 60 - s.score : 0))),
          trigger_summary: `${s.name}${s.absence ? ` — غياب ${s.absence}` : ''}${s.late ? ` — تأخر ${s.late}` : ''}${s.behavior ? ` — مخالفات ${s.behavior}` : ''}${s.score !== null ? ` — معدل ${s.score}` : ''}`,
          recommended_action: CATEGORIES[cat].actions.slice(0, 2).join('، '),
          status: 'new', status_label: 'جديد',
        };
      }));
      const talents = groups.gifted.map(s => ({
        student_code: s.id || s.name, student_grade: s.grade || '—', talent_type: 'academic', talent_type_label: 'أكاديمية',
        title: `تفوق دراسي — ${s.name}`, evidence: s.score !== null ? `المعدل ${s.score}` : null,
        development_plan: CATEGORIES.gifted.actions.slice(0, 2).join('، '), status: 'identified', status_label: 'مكتشفة',
        indicator_codes: ['2-1-1-9', '1-2-1-4'],
      }));
      if (alerts.length) { const { error: e1 } = await supabase.from('guidance_early_alerts').insert(alerts); if (e1) throw e1; }
      if (talents.length) { const { error: e2 } = await supabase.from('guidance_talents').insert(talents); if (e2) throw e2; }
      setSaved(`حُفظ ${alerts.length} إنذار و${talents.length} طالب متفوق`);
      onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحفظ'); }
    finally { setSaving(false); }
  };

  const ids = Object.keys(CATEGORIES) as CategoryId[];
  const maxCount = Math.max(1, ...ids.map(c => groups[c].length));

  return (
    <Panel title="استيراد كشف الطلاب (Excel أو Word)">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <button onClick={() => input.current?.click()} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-leaf-500 text-white px-5 py-3 text-sm font-extrabold shadow-md shadow-brand-600/20 disabled:opacity-60">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} اختر الملف
        </button>
        <p className="text-sm text-slate-600 flex items-start gap-1.5"><Info className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" />
          ارفع كشف الغياب أو الدرجات أو السلوك من نور. يتعرف النظام على الأعمدة (الاسم، الصف، الغياب، التأخر، المخالفات، المعدل) ويفرز الطلاب تلقائيًا.</p>
        <input ref={input} type="file" accept=".xlsx,.xls,.csv,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      </div>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {students && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <FileSpreadsheet className="w-4 h-4 text-leaf-600" /> <b>{fileName}</b> — {students.length} طالب
            <span className="text-slate-400">|</span> الأعمدة المكتشفة: {Object.values(mapped).join('، ')}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ids.map(c => {
              const meta = CATEGORIES[c];
              return (
                <button key={c} onClick={() => setActive(c)} className={`text-right rounded-xl border p-3 transition-all ${active === c ? `${toneClass[meta.tone]} shadow-sm ring-2 ring-brand-200` : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <meta.icon className="w-5 h-5" />
                  <p className="mt-2 text-2xl font-extrabold leading-none">{groups[c].length}</p>
                  <p className="mt-1 text-xs font-bold">{meta.label}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-current opacity-60" style={{ width: `${(groups[c].length / maxCount) * 100}%` }} /></div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className={`px-4 py-2.5 text-sm font-extrabold border-b ${toneClass[CATEGORIES[active].tone]}`}>{CATEGORIES[active].label} <span className="font-medium">({CATEGORIES[active].rule})</span></div>
              {groups[active].length === 0 ? <p className="p-6 text-center text-sm text-slate-500">لا يوجد طلاب في هذه الفئة</p> : (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs sticky top-0"><tr><th className="text-right p-2.5">الطالب</th><th className="p-2.5">الصف</th><th className="p-2.5">غياب</th><th className="p-2.5">تأخر</th><th className="p-2.5">مخالفات</th><th className="p-2.5">المعدل</th></tr></thead>
                    <tbody>
                      {groups[active].map((s, i) => (
                        <tr key={i} className="border-t border-slate-100"><td className="p-2.5 font-bold text-slate-800">{s.name}</td><td className="p-2.5 text-center">{s.grade || '—'}</td><td className="p-2.5 text-center">{s.absence ?? '—'}</td><td className="p-2.5 text-center">{s.late ?? '—'}</td><td className="p-2.5 text-center">{s.behavior ?? '—'}</td><td className="p-2.5 text-center">{s.score ?? '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-extrabold text-brand-900 mb-2">{active === 'gifted' ? 'طرق التعزيز المقترحة' : 'طرق المعالجة المقترحة'}</p>
              <ol className="space-y-2 text-sm text-slate-700 list-decimal pr-5">
                {CATEGORIES[active].actions.map(a => <li key={a}>{a}</li>)}
              </ol>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-brand-700 text-white px-5 py-2.5 text-sm font-extrabold disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ في الإنذار المبكر والمواهب
            </button>
            {saved && <span className="text-sm text-leaf-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{saved}</span>}
          </div>
        </div>
      )}
    </Panel>
  );
}
