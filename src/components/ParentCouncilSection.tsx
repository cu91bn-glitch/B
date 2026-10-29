import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, X, Calendar, CheckCircle2, Clock3, Trash2,
  Loader2, Target, UserCheck, TrendingUp,
} from 'lucide-react';
import {
  fetchParentCouncil, createParentCouncilMeeting, updateParentCouncilMeeting,
  deleteParentCouncilMeeting, type ParentCouncilRecord,
} from '@/lib/supabase';
import {
  accreditationDomains, indicatorColorMap,
} from '@/data/accreditationIndicators';

export function ParentCouncilSection() {
  const [meetings, setMeetings] = useState<ParentCouncilRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const [form, setForm] = useState({
    meeting_date_hijri: '',
    meeting_date_gregorian: '',
    topic: '',
    attendees_count: 0,
    recommendations: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  });

  const statusLabels: Record<string, string> = {
    scheduled: 'مجدول',
    completed: 'منعقد',
    cancelled: 'ملغى',
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchParentCouncil();
      setMeetings(data);
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
    if (!form.topic.trim() || !form.meeting_date_hijri.trim()) return;
    try {
      await createParentCouncilMeeting({
        meeting_date_hijri: form.meeting_date_hijri,
        meeting_date_gregorian: form.meeting_date_gregorian || undefined,
        topic: form.topic,
        attendees_count: form.attendees_count,
        recommendations: form.recommendations || undefined,
        status: form.status,
        status_label: statusLabels[form.status],
        indicator_codes: selectedCodes,
      });
      setForm({ meeting_date_hijri: '', meeting_date_gregorian: '', topic: '', attendees_count: 0, recommendations: '', status: 'scheduled' });
      setSelectedCodes([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإضافة');
    }
  };

  const handleStatusChange = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await updateParentCouncilMeeting(id, { status, status_label: statusLabels[status] });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التحديث');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteParentCouncilMeeting(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحذف');
    }
  };

  const totalAttendees = meetings.reduce((s, m) => s + m.attendees_count, 0);
  const completedCount = meetings.filter(m => m.status === 'completed').length;

  return (
    <section id="parent-council" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">مجلس الآباء والشراكة الأسرية</h2>
              <p className="text-sm text-slate-500">سجل اجتماعات مجلس الآباء والتوصيات والحضور</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة اجتماع
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span className="text-xs text-slate-500">إجمالي الاجتماعات</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-cairo">{meetings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">اجتماعات منعقدة</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-cairo">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">إجمالي الحضور</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-cairo">{totalAttendees}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            <X className="w-4 h-4" />{error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-5 mb-6 animate-scale-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">الموضوع</label>
                <input
                  value={form.topic}
                  onChange={e => setForm({ ...form, topic: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">التاريخ الهجري</label>
                <input
                  value={form.meeting_date_hijri}
                  onChange={e => setForm({ ...form, meeting_date_hijri: e.target.value })}
                  placeholder="مثال: 15 شعبان 1448هـ"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">التاريخ الميلادي</label>
                <input
                  type="date"
                  value={form.meeting_date_gregorian}
                  onChange={e => setForm({ ...form, meeting_date_gregorian: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">عدد الحضور</label>
                <input
                  type="number"
                  value={form.attendees_count}
                  onChange={e => setForm({ ...form, attendees_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">التوصيات</label>
                <textarea
                  value={form.recommendations}
                  onChange={e => setForm({ ...form, recommendations: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">الحالة</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as 'scheduled' | 'completed' | 'cancelled' })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                >
                  <option value="scheduled">مجدول</option>
                  <option value="completed">منعقد</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  مؤشرات الاعتماد المرتبطة
                </label>
                <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {accreditationDomains.map(domain => {
                    const colors = indicatorColorMap[domain.color];
                    return (
                      <div key={domain.id}>
                        <p className={`text-xs font-bold ${colors.text} px-1`}>{domain.title}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {domain.indicators.map(ind => {
                            const active = selectedCodes.includes(ind.code);
                            return (
                              <button
                                key={ind.code}
                                onClick={() => toggleCode(ind.code)}
                                className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                                  active ? `${colors.bg} ${colors.text} ${colors.border} font-medium` : 'bg-white text-slate-500 border-slate-200'
                                }`}
                              >
                                {ind.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors">
                حفظ الاجتماع
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Meeting list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد اجتماعات مسجلة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-cairo">{m.topic}</h4>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{m.meeting_date_hijri}
                      </span>
                    </div>
                  </div>
                  <select
                    value={m.status}
                    onChange={e => handleStatusChange(m.id, e.target.value as 'scheduled' | 'completed' | 'cancelled')}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${
                      m.status === 'completed' ? 'bg-green-100 text-green-700' :
                      m.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <option value="scheduled">مجدول</option>
                    <option value="completed">منعقد</option>
                    <option value="cancelled">ملغى</option>
                  </select>
                </div>
                {m.recommendations && (
                  <p className="text-sm text-slate-600 leading-relaxed mb-3 bg-slate-50 rounded-lg p-3">{m.recommendations}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <UserCheck className="w-3.5 h-3.5" />
                    {m.attendees_count} ولي أمر
                  </div>
                  <div className="flex items-center gap-2">
                    {m.indicator_codes.length > 0 && (
                      <span className="text-xs text-sky-600 font-medium">{m.indicator_codes.length} مؤشر</span>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
