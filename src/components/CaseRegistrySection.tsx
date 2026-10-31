import { AutoIndicators } from '@/components/AutoIndicators';
import { indicatorsForContext } from '@/lib/autoIndicators';
import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Plus, X, Trash2, Loader2, Heart, Users,
  BookOpen, AlertTriangle, Target, Activity,
} from 'lucide-react';
import {
  fetchCaseRegistry, createCase, updateCase, deleteCase,
  type CaseRegistryRecord,
} from '@/lib/supabase';
import {
  accreditationDomains, indicatorColorMap,
} from '@/data/accreditationIndicators';

const caseTypeConfig: Record<string, { label: string; icon: typeof Heart; color: string; bg: string; text: string; border: string }> = {
  psychological: { label: 'نفسية', icon: Heart, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  social: { label: 'اجتماعية', icon: Users, color: 'sky', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  academic: { label: 'أكاديمية', icon: BookOpen, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  behavioral: { label: 'سلوكية', icon: Activity, color: 'violet', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

const classificationLabels: Record<string, string> = {
  mild: 'بسيطة',
  moderate: 'متوسطة',
  severe: 'شديدة',
};

const statusLabels: Record<string, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المتابعة',
  improved: 'تحسنت',
  referred: 'محولة',
  closed: 'مغلقة',
};

const statusColors: Record<string, string> = {
  open: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-amber-100 text-amber-700',
  improved: 'bg-emerald-100 text-emerald-700',
  referred: 'bg-sky-100 text-sky-700',
  closed: 'bg-slate-100 text-slate-600',
};

export function CaseRegistrySection() {
  const [cases, setCases] = useState<CaseRegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const [form, setForm] = useState({
    case_number: '',
    student_grade: '',
    case_type: 'psychological' as 'psychological' | 'social' | 'academic' | 'behavioral',
    classification: 'mild' as 'mild' | 'moderate' | 'severe',
    intervention_plan: '',
    sessions_count: 0,
    status: 'open' as 'open' | 'in_progress' | 'improved' | 'referred' | 'closed',
    open_date_hijri: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCaseRegistry();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCode = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (!form.case_number.trim() || !form.student_grade.trim()) return;
    try {
      await createCase({
        case_number: form.case_number,
        student_grade: form.student_grade,
        case_type: form.case_type,
        case_type_label: caseTypeConfig[form.case_type].label,
        classification: form.classification,
        classification_label: classificationLabels[form.classification],
        intervention_plan: form.intervention_plan || undefined,
        sessions_count: form.sessions_count,
        status: form.status,
        status_label: statusLabels[form.status],
        open_date_hijri: form.open_date_hijri || undefined,
        indicator_codes: indicatorsForContext('case', form.case_type),
      });
      setForm({ case_number: '', student_grade: '', case_type: 'psychological', classification: 'mild', intervention_plan: '', sessions_count: 0, status: 'open', open_date_hijri: '' });
      setSelectedCodes([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإضافة');
    }
  };

  const handleStatusChange = async (id: string, status: 'open' | 'in_progress' | 'improved' | 'referred' | 'closed') => {
    try {
      await updateCase(id, { status, status_label: statusLabels[status] });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التحديث');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCase(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف');
    }
  };

  const filtered = cases.filter(c =>
    (filterType === 'all' || c.case_type === filterType) &&
    (filterStatus === 'all' || c.status === filterStatus)
  );

  const openCount = cases.filter(c => c.status === 'open' || c.status === 'in_progress').length;
  const improvedCount = cases.filter(c => c.status === 'improved').length;
  const referredCount = cases.filter(c => c.status === 'referred').length;

  return (
    <section id="case-registry" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">سجل الحالات الطلابية</h2>
              <p className="text-sm text-slate-500">حصر وتصنيف ومتابعة الحالات النفسية والاجتماعية والأكاديمية والسلوكية</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة حالة
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500">إجمالي الحالات</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-cairo">{cases.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">حالات مفتوحة</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 font-cairo">{openCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">حالات تحسنت</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 font-cairo">{improvedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-sky-600" />
              <span className="text-xs text-slate-500">حالات محولة</span>
            </div>
            <p className="text-2xl font-bold text-sky-600 font-cairo">{referredCount}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            <X className="w-4 h-4" />{error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 mb-6 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">رقم الحالة</label>
                <input
                  value={form.case_number}
                  onChange={e => setForm({ ...form, case_number: e.target.value })}
                  placeholder="مثال: 1448-001"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">الصف الدراسي</label>
                <input
                  value={form.student_grade}
                  onChange={e => setForm({ ...form, student_grade: e.target.value })}
                  placeholder="مثال: الثاني ثانوي"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">نوع الحالة</label>
                <select
                  value={form.case_type}
                  onChange={e => setForm({ ...form, case_type: e.target.value as 'psychological' | 'social' | 'academic' | 'behavioral' })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                >
                  <option value="psychological">نفسية</option>
                  <option value="social">اجتماعية</option>
                  <option value="academic">أكاديمية</option>
                  <option value="behavioral">سلوكية</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">التصنيف</label>
                <select
                  value={form.classification}
                  onChange={e => setForm({ ...form, classification: e.target.value as 'mild' | 'moderate' | 'severe' })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                >
                  <option value="mild">بسيطة</option>
                  <option value="moderate">متوسطة</option>
                  <option value="severe">شديدة</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">الحالة</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as 'open' | 'in_progress' | 'improved' | 'referred' | 'closed' })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد المتابعة</option>
                  <option value="improved">تحسنت</option>
                  <option value="referred">محولة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">عدد الجلسات</label>
                <input
                  type="number"
                  value={form.sessions_count}
                  onChange={e => setForm({ ...form, sessions_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">تاريخ الفتح (هجري)</label>
                <input
                  value={form.open_date_hijri}
                  onChange={e => setForm({ ...form, open_date_hijri: e.target.value })}
                  placeholder="مثال: 1 محرم 1448هـ"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">خطة التدخل</label>
                <textarea
                  value={form.intervention_plan}
                  onChange={e => setForm({ ...form, intervention_plan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <div className="md:col-span-2"><AutoIndicators codes={indicatorsForContext('case', form.case_type)} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
                حفظ الحالة
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium ${filterType === 'all' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            كل الأنواع
          </button>
          {Object.entries(caseTypeConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium ${filterType === key ? `${cfg.bg} ${cfg.text} ${cfg.border} border` : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              {cfg.label}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium ${filterStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            كل الحالات
          </button>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium ${filterStatus === key ? statusColors[key] : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Case list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد حالات مسجلة</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-right px-4 py-3 font-bold text-slate-700">رقم الحالة</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">الصف</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">النوع</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">التصنيف</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">الجلسات</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">الحالة</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const cfg = caseTypeConfig[c.case_type];
                    const Icon = cfg.icon;
                    return (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.case_number}</td>
                        <td className="px-4 py-3 text-slate-600">{c.student_grade}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <Icon className="w-3 h-3" />
                            {c.case_type_label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            c.classification === 'severe' ? 'bg-red-100 text-red-700' :
                            c.classification === 'moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {c.classification_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.sessions_count}</td>
                        <td className="px-4 py-3">
                          <select
                            value={c.status}
                            onChange={e => handleStatusChange(c.id, e.target.value as 'open' | 'in_progress' | 'improved' | 'referred' | 'closed')}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[c.status]}`}
                          >
                            <option value="open">مفتوحة</option>
                            <option value="in_progress">قيد المتابعة</option>
                            <option value="improved">تحسنت</option>
                            <option value="referred">محولة</option>
                            <option value="closed">مغلقة</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
