import { indicatorsForContext } from '@/lib/autoIndicators';
import { DateField } from '@/components/ui/DateField';
import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Activity, AlertTriangle, Award, BarChart3, BookOpen, CheckCircle2,
  ClipboardCheck, Clock3, HeartPulse, Loader2, Plus, ShieldAlert, Trash2,
  TrendingUp, Users, X,
} from 'lucide-react';
import {
  createAttendance, createDiscipline, createTalent, deleteDiscipline, deleteTalent,
  deleteEarlyAlert, deleteAllEarlyAlerts, deleteAttendance,
  fetchAttendance, fetchDiscipline, fetchEarlyAlerts, fetchTalents, updateDiscipline,
  updateTalent, type AttendanceRecord, type DisciplineRecord, type EarlyAlertRecord,
  type TalentRecord,
} from '@/lib/supabase';

const attendanceLabels = { present: 'حاضر', late: 'متأخر', absent: 'غائب', excused: 'بعذر' } as const;
const disciplineLabels = { late: 'تأخر', absence: 'غياب', behavior: 'سلوك', academic: 'أكاديمي', other: 'أخرى' } as const;
const severityLabels = { low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة' } as const;
const talentLabels = { academic: 'أكاديمية', artistic: 'فنية', sport: 'رياضية', technical: 'تقنية', leadership: 'قيادية', other: 'أخرى' } as const;
const talentStatusLabels = { identified: 'مكتشفة', developing: 'قيد التطوير', showcased: 'تم إبرازها', referred: 'محولة' } as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</span>{children}</label>;
}

const inputClass = 'w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400';

export function Phase3MonitoringSection() {
  const [tab, setTab] = useState<'alerts' | 'attendance' | 'discipline' | 'talents'>('alerts');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [discipline, setDiscipline] = useState<DisciplineRecord[]>([]);
  const [talents, setTalents] = useState<TalentRecord[]>([]);
  const [storedAlerts, setStoredAlerts] = useState<EarlyAlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [attDate, setAttDate] = useState('');
  const [incDate, setIncDate] = useState('');
  const [error, setError] = useState('');

  const [attendanceForm, setAttendanceForm] = useState({ student_code: '', student_grade: '', attendance_date_hijri: '', status: 'present' as keyof typeof attendanceLabels, minutes_late: 0, notes: '' });
  const [disciplineForm, setDisciplineForm] = useState({ student_code: '', student_grade: '', incident_date_hijri: '', incident_type: 'behavior' as keyof typeof disciplineLabels, severity: 'low' as keyof typeof severityLabels, action_taken: '', notes: '' });
  const [talentForm, setTalentForm] = useState({ student_code: '', student_grade: '', talent_type: 'academic' as keyof typeof talentLabels, title: '', evidence: '', development_plan: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [a, d, t, alerts] = await Promise.all([fetchAttendance(), fetchDiscipline(), fetchTalents(), fetchEarlyAlerts()]);
      setAttendance(a); setDiscipline(d); setTalents(t); setStoredAlerts(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل بيانات المتابعة');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const computedAlerts = attendance.reduce<Array<{ student_code: string; student_grade: string; severity: string; score: number; summary: string; type: string }>>((result, record) => {
    const studentAttendance = attendance.filter(item => item.student_code === record.student_code);
    const absences = studentAttendance.filter(item => item.status === 'absent').length;
    const lates = studentAttendance.filter(item => item.status === 'late').length;
    const incidents = discipline.filter(item => item.student_code === record.student_code && item.status !== 'resolved').length;
    if (absences >= 3 || lates >= 4 || incidents >= 2) {
      const score = Math.min(100, absences * 18 + lates * 10 + incidents * 20);
      result.push({
        student_code: record.student_code,
        student_grade: record.student_grade,
        severity: score >= 70 ? 'critical' : score >= 40 ? 'warning' : 'watch',
        score,
        summary: `${absences} غياب، ${lates} تأخر، ${incidents} ملاحظة سلوكية غير مغلقة`,
        type: incidents > 0 && (absences > 0 || lates > 0) ? 'combined' : incidents > 0 ? 'discipline' : 'attendance',
      });
    }
    return result;
  }, []).filter((alert, index, list) => list.findIndex(item => item.student_code === alert.student_code) === index);

  const alerts = [...storedAlerts.map(alert => ({ ...alert, source: 'stored' as const })), ...computedAlerts.filter(alert => !storedAlerts.some(item => item.student_code === alert.student_code)).map(alert => ({
    id: `computed-${alert.student_code}`, student_code: alert.student_code, student_grade: alert.student_grade,
    alert_type: alert.type, alert_type_label: alert.type === 'combined' ? 'مشترك' : alert.type === 'discipline' ? 'انضباط' : 'حضور',
    severity: alert.severity, severity_label: alert.severity === 'critical' ? 'حرجة' : alert.severity === 'warning' ? 'تحذير' : 'مراقبة',
    score: alert.score, trigger_summary: alert.summary, recommended_action: 'التواصل مع الطالب والأسرة ووضع خطة متابعة', status: 'new', status_label: 'جديد', source: 'computed' as const,
  }))];

  const removeAlert = async (id: string) => {
    if (!confirm('حذف هذا الإنذار؟')) return;
    try { await deleteEarlyAlert(id); setStoredAlerts(prev => prev.filter(a => a.id !== id)); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };
  const removeAllAlerts = async () => {
    if (!confirm(`حذف كل الإنذارات المحفوظة (${storedAlerts.length})؟`)) return;
    try { await deleteAllEarlyAlerts(); setStoredAlerts([]); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };
  const removeAttendance = async (id: string) => {
    if (!confirm('حذف سجل الحضور؟')) return;
    try { await deleteAttendance(id); setAttendance(prev => prev.filter(a => a.id !== id)); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };

  const submitAttendance = async (event: FormEvent) => {
    event.preventDefault();
    if (!attendanceForm.attendance_date_hijri) { setError('اختر تاريخ الحضور'); return; }
    try {
      await createAttendance({ ...attendanceForm, status_label: attendanceLabels[attendanceForm.status], attendance_date_gregorian: attDate || null, indicator_codes: indicatorsForContext('attendance') });
      setAttendanceForm({ student_code: '', student_grade: '', attendance_date_hijri: '', status: 'present', minutes_late: 0, notes: '' }); setShowForm(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل حفظ الحضور'); }
  };

  const submitDiscipline = async (event: FormEvent) => {
    event.preventDefault();
    if (!disciplineForm.incident_date_hijri) { setError('اختر تاريخ الملاحظة'); return; }
    try {
      await createDiscipline({ ...disciplineForm, incident_type_label: disciplineLabels[disciplineForm.incident_type], severity_label: severityLabels[disciplineForm.severity], status: 'open', status_label: 'مفتوحة', incident_date_gregorian: incDate || null, indicator_codes: indicatorsForContext('discipline', disciplineForm.incident_type) });
      setDisciplineForm({ student_code: '', student_grade: '', incident_date_hijri: '', incident_type: 'behavior', severity: 'low', action_taken: '', notes: '' }); setShowForm(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل حفظ الملاحظة'); }
  };

  const submitTalent = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createTalent({ ...talentForm, talent_type_label: talentLabels[talentForm.talent_type], status: 'identified', status_label: 'مكتشفة', indicator_codes: indicatorsForContext('talent') });
      setTalentForm({ student_code: '', student_grade: '', talent_type: 'academic', title: '', evidence: '', development_plan: '' }); setShowForm(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل حفظ الموهبة'); }
  };

  const updateTalentStatus = async (record: TalentRecord, status: keyof typeof talentStatusLabels) => { await updateTalent(record.id, { status, status_label: talentStatusLabels[status] }); load(); };
  const updateDisciplineStatus = async (record: DisciplineRecord, status: string, label: string) => { await updateDiscipline(record.id, { status, status_label: label }); load(); };

  const tabs = [
    { id: 'alerts' as const, label: 'الإنذار المبكر', icon: ShieldAlert },
    { id: 'attendance' as const, label: 'الحضور والمواظبة', icon: ClipboardCheck },
    { id: 'discipline' as const, label: 'الانضباط والسلوك', icon: Activity },
    { id: 'talents' as const, label: 'المواهب', icon: Award },
  ];
  const statusClass = (severity: string) => severity === 'critical' ? 'bg-rose-100 text-rose-700' : severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700';

  return (
    <section id="monitoring" className="py-12 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20"><ShieldAlert className="w-6 h-6 text-white" /></div>
            <div><h2 className="text-xl font-bold text-slate-800 font-cairo">المتابعة والإنذار المبكر</h2><p className="text-sm text-slate-500">رصد الحضور والانضباط واكتشاف المواهب قبل تفاقم الفجوات</p></div>
          </div>
          {tab !== 'alerts' && <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"><Plus className="w-4 h-4" /> إضافة سجل</button>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs text-rose-700 mb-1">تنبيهات نشطة</p><p className="text-2xl font-bold text-rose-700">{alerts.filter(a => a.status !== 'resolved').length}</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-700 mb-1">حالات تأخر وغياب</p><p className="text-2xl font-bold text-amber-700">{attendance.filter(a => a.status === 'late' || a.status === 'absent').length}</p></div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4"><p className="text-xs text-sky-700 mb-1">ملاحظات سلوكية</p><p className="text-2xl font-bold text-sky-700">{discipline.length}</p></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs text-emerald-700 mb-1">مواهب مكتشفة</p><p className="text-2xl font-bold text-emerald-700">{talents.length}</p></div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2"><X className="w-4 h-4" />{error}</div>}
        <div className="flex flex-wrap gap-2 mb-6">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => { setTab(item.id); setShowForm(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === item.id ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Icon className="w-4 h-4" />{item.label}</button>; })}</div>

        {showForm && tab === 'attendance' && <form onSubmit={submitAttendance} className="mb-6 p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 grid grid-cols-1 md:grid-cols-3 gap-4"><Field label="رمز الطالب"><input required value={attendanceForm.student_code} onChange={e => setAttendanceForm({ ...attendanceForm, student_code: e.target.value })} className={inputClass} placeholder="مثال: ط-001" /></Field><Field label="الصف"><input required value={attendanceForm.student_grade} onChange={e => setAttendanceForm({ ...attendanceForm, student_grade: e.target.value })} className={inputClass} /></Field><DateField label="تاريخ الحضور" required value={attDate} onChange={(g, h) => { setAttDate(g); setAttendanceForm({ ...attendanceForm, attendance_date_hijri: h }); }} /><Field label="الحالة"><select value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value as keyof typeof attendanceLabels })} className={inputClass}>{Object.entries(attendanceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="دقائق التأخر"><input type="number" min="0" value={attendanceForm.minutes_late} onChange={e => setAttendanceForm({ ...attendanceForm, minutes_late: Number(e.target.value) })} className={inputClass} /></Field><Field label="ملاحظات"><input value={attendanceForm.notes} onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} className={inputClass} /></Field><button className="md:col-span-3 py-2.5 rounded-lg bg-emerald-600 text-white font-bold">حفظ سجل الحضور</button></form>}

        {showForm && tab === 'discipline' && <form onSubmit={submitDiscipline} className="mb-6 p-5 rounded-2xl border border-sky-200 bg-sky-50/40 grid grid-cols-1 md:grid-cols-3 gap-4"><Field label="رمز الطالب"><input required value={disciplineForm.student_code} onChange={e => setDisciplineForm({ ...disciplineForm, student_code: e.target.value })} className={inputClass} /></Field><Field label="الصف"><input required value={disciplineForm.student_grade} onChange={e => setDisciplineForm({ ...disciplineForm, student_grade: e.target.value })} className={inputClass} /></Field><DateField label="تاريخ الملاحظة" required value={incDate} onChange={(g, h) => { setIncDate(g); setDisciplineForm({ ...disciplineForm, incident_date_hijri: h }); }} /><Field label="نوع الملاحظة"><select value={disciplineForm.incident_type} onChange={e => setDisciplineForm({ ...disciplineForm, incident_type: e.target.value as keyof typeof disciplineLabels })} className={inputClass}>{Object.entries(disciplineLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="درجة الخطورة"><select value={disciplineForm.severity} onChange={e => setDisciplineForm({ ...disciplineForm, severity: e.target.value as keyof typeof severityLabels })} className={inputClass}>{Object.entries(severityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="الإجراء المتخذ"><input value={disciplineForm.action_taken} onChange={e => setDisciplineForm({ ...disciplineForm, action_taken: e.target.value })} className={inputClass} /></Field><Field label="ملاحظات"><input value={disciplineForm.notes} onChange={e => setDisciplineForm({ ...disciplineForm, notes: e.target.value })} className={inputClass} /></Field><button className="md:col-span-3 py-2.5 rounded-lg bg-sky-600 text-white font-bold">حفظ الملاحظة</button></form>}

        {showForm && tab === 'talents' && <form onSubmit={submitTalent} className="mb-6 p-5 rounded-2xl border border-amber-200 bg-amber-50/40 grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="رمز الطالب"><input required value={talentForm.student_code} onChange={e => setTalentForm({ ...talentForm, student_code: e.target.value })} className={inputClass} /></Field><Field label="الصف"><input required value={talentForm.student_grade} onChange={e => setTalentForm({ ...talentForm, student_grade: e.target.value })} className={inputClass} /></Field><Field label="مجال الموهبة"><select value={talentForm.talent_type} onChange={e => setTalentForm({ ...talentForm, talent_type: e.target.value as keyof typeof talentLabels })} className={inputClass}>{Object.entries(talentLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="اسم الموهبة"><input required value={talentForm.title} onChange={e => setTalentForm({ ...talentForm, title: e.target.value })} className={inputClass} /></Field><Field label="الشاهد أو الإنجاز"><input value={talentForm.evidence} onChange={e => setTalentForm({ ...talentForm, evidence: e.target.value })} className={inputClass} /></Field><Field label="خطة التطوير"><input value={talentForm.development_plan} onChange={e => setTalentForm({ ...talentForm, development_plan: e.target.value })} className={inputClass} /></Field><button className="md:col-span-2 py-2.5 rounded-lg bg-amber-600 text-white font-bold">حفظ الموهبة</button></form>}

        {loading ? <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div> : tab === 'alerts' ? <div className="space-y-3">{alerts.length === 0 ? <EmptyState icon={ShieldAlert} text="لا توجد تنبيهات نشطة حالياً" /> : alerts.map(alert => <div key={alert.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center gap-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${alert.severity === 'critical' ? 'bg-rose-100 text-rose-600' : alert.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'}`}><AlertTriangle className="w-5 h-5" /></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2 mb-1"><strong className="text-slate-800">{alert.student_code}</strong><span className="text-xs text-slate-400">{alert.student_grade}</span><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass(alert.severity)}`}>{alert.severity_label}</span></div><p className="text-sm text-slate-600">{alert.trigger_summary}</p><p className="text-xs text-slate-400 mt-1">الإجراء المقترح: {alert.recommended_action}</p></div><div className="text-center"><p className="text-xl font-bold text-slate-800">{alert.score}</p><p className="text-xs text-slate-400">درجة الخطر</p></div>{alert.source === 'stored' && <button onClick={() => removeAlert(alert.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="حذف"><Trash2 className="w-4 h-4" /></button>}</div>)}{storedAlerts.length > 1 && <button onClick={removeAllAlerts} className="text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg px-3 py-2"><Trash2 className="inline w-3.5 h-3.5 ml-1" />حذف كل الإنذارات المحفوظة ({storedAlerts.length})</button>}</div> : tab === 'attendance' ? <AttendanceList records={attendance} onDelete={removeAttendance} /> : tab === 'discipline' ? <DisciplineList records={discipline} onStatusChange={updateDisciplineStatus} onDelete={deleteDiscipline} /> : <TalentList records={talents} onStatusChange={updateTalentStatus} onDelete={deleteTalent} />}
      </div>
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof ShieldAlert; text: string }) { return <div className="py-12 text-center text-slate-400"><Icon className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{text}</p></div>; }

function AttendanceList({ records, onDelete }: { records: AttendanceRecord[]; onDelete: (id: string) => void }) {
  if (!records.length) return <EmptyState icon={ClipboardCheck} text="لا توجد سجلات حضور بعد" />;
  return <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-right px-4 py-3">الطالب</th><th className="text-right px-4 py-3">الصف</th><th className="text-right px-4 py-3">التاريخ</th><th className="text-right px-4 py-3">الحالة</th><th className="text-right px-4 py-3">التأخر</th><th className="px-2 py-3"></th></tr></thead><tbody>{records.map(record => <tr key={record.id} className="border-b border-slate-100"><td className="px-4 py-3 font-medium">{record.student_code}</td><td className="px-4 py-3 text-slate-600">{record.student_grade}</td><td className="px-4 py-3 text-slate-600">{record.attendance_date_hijri}</td><td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : record.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{record.status_label}</span></td><td className="px-4 py-3 text-slate-600">{record.minutes_late} دقيقة</td><td className="px-2"><button onClick={() => onDelete(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600" title="حذف"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table></div></div>;
}

function DisciplineList({ records, onStatusChange, onDelete }: { records: DisciplineRecord[]; onStatusChange: (record: DisciplineRecord, status: string, label: string) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  if (!records.length) return <EmptyState icon={Activity} text="لا توجد ملاحظات سلوكية بعد" />;
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{records.map(record => <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><div className="flex justify-between gap-3"><div><p className="font-bold text-slate-800">{record.student_code} <span className="text-xs font-normal text-slate-400">{record.student_grade}</span></p><p className="text-sm text-slate-600 mt-1">{record.incident_type_label} · {record.incident_date_hijri}</p></div><span className={`text-xs px-2 py-1 rounded-full h-fit ${record.severity === 'high' ? 'bg-rose-100 text-rose-700' : record.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{record.severity_label}</span></div>{record.action_taken && <p className="text-xs text-slate-500 mt-3">الإجراء: {record.action_taken}</p>}<div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100"><select value={record.status} onChange={e => onStatusChange(record, e.target.value, e.target.options[e.target.selectedIndex].text)} className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200"><option value="open">مفتوحة</option><option value="monitoring">قيد المتابعة</option><option value="resolved">تمت المعالجة</option><option value="referred">محولة</option></select><button onClick={() => onDelete(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>;
}

function TalentList({ records, onStatusChange, onDelete }: { records: TalentRecord[]; onStatusChange: (record: TalentRecord, status: keyof typeof talentStatusLabels) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  if (!records.length) return <EmptyState icon={Award} text="لا توجد مواهب مسجلة بعد" />;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{records.map(record => <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><div className="flex items-start justify-between"><div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><Award className="w-5 h-5" /></div><button onClick={() => onDelete(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></div><p className="text-xs text-slate-400 mt-3">{record.student_code} · {record.student_grade}</p><h4 className="font-bold text-slate-800 mt-1">{record.title}</h4><span className="inline-block text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 mt-2">{record.talent_type_label}</span>{record.evidence && <p className="text-sm text-slate-600 mt-3">{record.evidence}</p>}<select value={record.status} onChange={e => onStatusChange(record, e.target.value as keyof typeof talentStatusLabels)} className="w-full mt-4 text-xs px-2 py-1.5 rounded-lg border border-slate-200">{Object.entries(talentStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>)}</div>;
}
