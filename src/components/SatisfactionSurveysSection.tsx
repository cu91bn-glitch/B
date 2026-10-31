import { AutoIndicators } from '@/components/AutoIndicators';
import { indicatorsForContext } from '@/lib/autoIndicators';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Plus, X, Trash2, Loader2, TrendingUp, Users, Award,
  Target,
} from 'lucide-react';
import {
  fetchSatisfactionSurveys, createSatisfactionSurvey, deleteSatisfactionSurvey,
  type SatisfactionSurveyRecord, type SatisfactionSurveyArea,
} from '@/lib/supabase';
import {
  accreditationDomains, indicatorColorMap,
} from '@/data/accreditationIndicators';

export function SatisfactionSurveysSection() {
  const [surveys, setSurveys] = useState<SatisfactionSurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const [form, setForm] = useState({
    survey_type: 'program' as 'program' | 'service' | 'parent' | 'student',
    target_group: '',
    total_responses: 0,
    satisfaction_score: 0,
    conducted_date_hijri: '',
  });
  const [areas, setAreas] = useState<SatisfactionSurveyArea[]>([
    { area: '', score: 0 },
  ]);

  const surveyTypeLabels: Record<string, string> = {
    program: 'رضا عن البرامج',
    service: 'رضا عن الخدمات',
    parent: 'رضا أولياء الأمور',
    student: 'رضا الطلاب',
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSatisfactionSurveys();
      setSurveys(data);
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

  const updateArea = (i: number, field: keyof SatisfactionSurveyArea, value: string | number) => {
    setAreas(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const addArea = () => setAreas(prev => [...prev, { area: '', score: 0 }]);
  const removeArea = (i: number) => setAreas(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.target_group.trim()) return;
    const validAreas = areas.filter(a => a.area.trim());
    try {
      await createSatisfactionSurvey({
        survey_type: form.survey_type,
        survey_type_label: surveyTypeLabels[form.survey_type],
        target_group: form.target_group,
        total_responses: form.total_responses,
        satisfaction_score: form.satisfaction_score,
        areas: validAreas,
        indicator_codes: indicatorsForContext('satisfaction', form.survey_type),
        conducted_date_hijri: form.conducted_date_hijri || undefined,
      });
      setForm({ survey_type: 'program', target_group: '', total_responses: 0, satisfaction_score: 0, conducted_date_hijri: '' });
      setAreas([{ area: '', score: 0 }]);
      setSelectedCodes([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإضافة');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSatisfactionSurvey(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف');
    }
  };

  const avgScore = surveys.length > 0
    ? surveys.reduce((s, r) => s + r.satisfaction_score, 0) / surveys.length
    : 0;
  const totalResponses = surveys.reduce((s, r) => s + r.total_responses, 0);

  const scoreColor = (score: number) =>
    score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600';
  const scoreBar = (score: number) =>
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <section id="satisfaction" className="py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">استبيانات قياس الرضا</h2>
              <p className="text-sm text-slate-500">قياس رضا المستفيدين عن البرامج والخدمات الإرشادية</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة استبيان
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">متوسط الرضا</span>
            </div>
            <p className={`text-2xl font-bold font-cairo ${scoreColor(avgScore)}`}>{avgScore.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span className="text-xs text-slate-500">عدد الاستبيانات</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-cairo">{surveys.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">إجمالي المستجيبين</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-cairo">{totalResponses}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            <X className="w-4 h-4" />{error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 mb-6 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">نوع الاستبيان</label>
                <select
                  value={form.survey_type}
                  onChange={e => setForm({ ...form, survey_type: e.target.value as 'program' | 'service' | 'parent' | 'student' })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                >
                  <option value="program">رضا عن البرامج</option>
                  <option value="service">رضا عن الخدمات</option>
                  <option value="parent">رضا أولياء الأمور</option>
                  <option value="student">رضا الطلاب</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">الفئة المستهدفة</label>
                <input
                  value={form.target_group}
                  onChange={e => setForm({ ...form, target_group: e.target.value })}
                  placeholder="مثال: طلاب الصف الثالث ثانوي"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">عدد المستجيبين</label>
                <input
                  type="number"
                  value={form.total_responses}
                  onChange={e => setForm({ ...form, total_responses: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">نسبة الرضا الإجمالية (%)</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={form.satisfaction_score}
                  onChange={e => setForm({ ...form, satisfaction_score: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">التاريخ الهجري</label>
                <input
                  value={form.conducted_date_hijri}
                  onChange={e => setForm({ ...form, conducted_date_hijri: e.target.value })}
                  placeholder="مثال: 10 رجب 1448هـ"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
            </div>

            {/* Areas */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">محاور القياس</label>
                <button onClick={addArea} className="text-xs text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Plus className="w-3 h-3" /> إضافة محور
                </button>
              </div>
              <div className="space-y-2">
                {areas.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={a.area}
                      onChange={e => updateArea(i, 'area', e.target.value)}
                      placeholder="اسم المحور"
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <input
                      type="number" min="0" max="100"
                      value={a.score}
                      onChange={e => updateArea(i, 'score', parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="text-xs text-slate-400">%</span>
                    {areas.length > 1 && (
                      <button onClick={() => removeArea(i)} className="p-1 text-slate-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <AutoIndicators codes={indicatorsForContext('satisfaction', form.survey_type)} />

            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
                حفظ الاستبيان
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Survey cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد استبيانات مسجلة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-cairo">{s.survey_type_label}</h4>
                      <span className="text-xs text-slate-400">{s.target_group}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">نسبة الرضا</span>
                      <span className={`font-bold ${scoreColor(s.satisfaction_score)}`}>{s.satisfaction_score}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${scoreBar(s.satisfaction_score)}`} style={{ width: `${s.satisfaction_score}%` }} />
                    </div>
                  </div>
                </div>

                {s.areas && s.areas.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {s.areas.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600 flex-1">{a.area}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBar(a.score)}`} style={{ width: `${a.score}%` }} />
                        </div>
                        <span className={`font-medium ${scoreColor(a.score)}`}>{a.score}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{s.total_responses} مستجيب</span>
                  {s.conducted_date_hijri && <span>{s.conducted_date_hijri}</span>}
                  {s.indicator_codes.length > 0 && <span className="text-amber-600 font-medium">{s.indicator_codes.length} مؤشر</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
