import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, BarChart2, Briefcase, CheckCircle2, Copy, Link2, Loader2, PieChart,
  Send, Shield, TrendingUp, X, FlaskConical, BookOpen, Cpu, Stethoscope,
} from 'lucide-react';
import { careerQuestions } from '@/data';
import {
  submitConsultation, fetchConsultationStats, saveCareerResult, fetchCareerStats,
} from '@/lib/supabase';

export function Modal({ open, onClose, title, children, size = 'lg' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClass = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[90vh] overflow-hidden flex flex-col animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-emerald-50 to-white">
          <h3 className="text-lg font-bold text-slate-800 font-cairo">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-cairo">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ============ FOOTER ============

export function DigitalClinic({ publicMode = false }: { publicMode?: boolean }) {
  const [consultationType, setConsultationType] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Analytics
  const [consultStats, setConsultStats] = useState<{ byType: Record<string, number>; byPrivacy: Record<string, number>; total: number }>({ byType: {}, byPrivacy: {}, total: 0 });
  const [careerStats, setCareerStats] = useState<{ byTrack: Record<string, number>; total: number }>({ byTrack: {}, total: 0 });

  // Career survey
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const consultationTypes = [
    'استشارة نفسية',
    'استشارة اجتماعية',
    'استشارة أكاديمية',
    'استشارة مهنية',
    'إبلاغ عن حالة',
  ];
  const privacyLevels = ['عادية', 'سرية', 'سرية تامة'];

  const shareUrl = `${window.location.origin}/?clinic=1`;

  const loadStats = useCallback(async () => {
    if (publicMode) return;
    try {
      const [cStats, crStats] = await Promise.all([
        fetchConsultationStats(),
        fetchCareerStats(),
      ]);
      setConsultStats(cStats);
      setCareerStats(crStats);
    } catch {}
  }, [publicMode]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitConsultation({
        requester_name: name || undefined,
        consultation_type: consultationType,
        privacy_level: privacyLevel,
        message,
      });
      setShowConfirm(true);
      setName('');
      setConsultationType('');
      setPrivacyLevel('');
      setMessage('');
      loadStats();
    } catch {
      setSubmitError('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (currentQ < careerQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResults(true);
      const scores = newAnswers.reduce((acc, ansIdx, qIdx) => {
        const opt = careerQuestions[qIdx]?.options[ansIdx];
        if (opt) {
          acc.scientific += opt.scores.scientific;
          acc.literary += opt.scores.literary;
          acc.technical += opt.scores.technical;
        }
        return acc;
      }, { scientific: 0, literary: 0, technical: 0 });
      const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      saveCareerResult({ answers: newAnswers, result_track: top[0], scores }).catch(() => {});
      loadStats();
    }
  };

  const resetSurvey = () => {
    setCurrentQ(0);
    setAnswers([]);
    setShowResults(false);
  };

  const careerScores = answers.reduce((acc, ansIndex, qIndex) => {
    const option = careerQuestions[qIndex]?.options[ansIndex];
    if (option) {
      acc.scientific += option.scores.scientific;
      acc.literary += option.scores.literary;
      acc.technical += option.scores.technical;
    }
    return acc;
  }, { scientific: 0, literary: 0, technical: 0 });

  const topCareer = Object.entries(careerScores).sort((a, b) => b[1] - a[1])[0];
  const careerLabels: Record<string, { label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    scientific: { label: 'المسار العلمي', desc: 'يناسبك التوجه نحو التخصصات العلمية كالطب والهندسة والعلوم', icon: FlaskConical, color: 'emerald' },
    literary: { label: 'المسار الأدبي', desc: 'يناسبك التوجه نحو التخصصات الأدبية كالقانون والإعلام واللغات', icon: BookOpen, color: 'amber' },
    technical: { label: 'المسار التقني', desc: 'يناسبك التوجه نحو التخصصات التقنية كالحاسب الآلي والبرمجة والتصميم', icon: Cpu, color: 'sky' },
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="clinic" className="py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          icon={Stethoscope}
          title="العيادة الرقمية والاستشارات السرية"
          subtitle="نموذج استشارة آمن وسري، ومقياس الميول المهنية"
        />

               <div className="grid grid-cols-1 gap-5">
          {/* Consultation form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 font-cairo">نموذج الإبلاغ الآمن والاستشارات</h4>
                  <p className="text-xs text-slate-500">جميع البيانات سرية ولن يتم الاطلاع عليها إلا من قبل الموجه الطلابي</p>
                </div>
              </div>
              {!publicMode && <button
                onClick={() => setShowShareLink(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Link2 className="w-3.5 h-3.5" />
                رابط المشاركة
              </button>}
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                <AlertCircle className="w-4 h-4" />
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">اسم الطالب / ولي الأمر (اخياري)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="يمكنك تركه فارغاً إذا رغبت في الإبلاغ بشكل مجهول"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع الاستشارة</label>
                  <select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  >
                    <option value="">اختر النوع...</option>
                    {consultationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">درجة السرية</label>
                  <select
                    value={privacyLevel}
                    onChange={(e) => setPrivacyLevel(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  >
                    <option value="">اختر الدرجة...</option>
                    {privacyLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">نص الرسالة</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="اكتب رسالتك أو استشارتك هنا بالتفصيل..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!consultationType || !privacyLevel || !message || submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-l from-emerald-600 to-teal-700 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'جاري الإرسال...' : 'إرسال الاستشارة'}
              </button>
            </div>
          </div>

        </div>

        {/* Consultation Analytics Dashboard */}
        {consultStats.total > 0 && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-cairo">إحصائيات الاستشارات حسب النوع</h4>
                  <p className="text-xs text-slate-500">إجمالي {consultStats.total} استشارة</p>
                </div>
              </div>
              <div className="space-y-3">
                {consultationTypes.map(type => {
                  const count = consultStats.byType[type] || 0;
                  const pct = consultStats.total > 0 ? (count / consultStats.total) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{type}</span>
                        <span className="font-bold text-emerald-600">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-cairo">إحصائيات درجة السرية</h4>
                  <p className="text-xs text-slate-500">توزيع الاستشارات حسب درجة السرية</p>
                </div>
              </div>
              <div className="space-y-3">
                {privacyLevels.map(level => {
                  const count = consultStats.byPrivacy[level] || 0;
                  const pct = consultStats.total > 0 ? (count / consultStats.total) * 100 : 0;
                  return (
                    <div key={level}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{level}</span>
                        <span className="font-bold text-amber-600">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Career survey */}
        <div className="mt-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-base font-bold font-cairo">مقياس الميول المهنية السريع</h4>
              <p className="text-xs text-slate-400">3 أسئلة سريعة لتحديد مسارك المهني المناسب</p>
            </div>
          </div>

          {!showResults ? (
            <div>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-4">
                {careerQuestions.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentQ ? 'bg-amber-400' : 'bg-slate-700'}`} />
                ))}
              </div>

              <div className="bg-slate-800/50 rounded-xl p-5">
                <p className="text-sm text-slate-400 mb-1">السؤال {currentQ + 1} من {careerQuestions.length}</p>
                <h5 className="text-lg font-bold mb-4 font-cairo">{careerQuestions[currentQ].question}</h5>
                <div className="space-y-2">
                  {careerQuestions[currentQ].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="w-full text-right p-3.5 bg-slate-700/50 hover:bg-amber-500/20 border border-slate-600 hover:border-amber-500/50 rounded-xl text-sm transition-all text-slate-200 hover:text-amber-300"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                {(() => {
                  const ResultIcon = careerLabels[topCareer[0]].icon;
                  return <ResultIcon className="w-10 h-10 text-amber-400" />;
                })()}
              </div>
              <h5 className="text-2xl font-bold mb-2 font-cairo">{careerLabels[topCareer[0]].label}</h5>
              <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">{careerLabels[topCareer[0]].desc}</p>

              {/* Score bars */}
              <div className="max-w-md mx-auto space-y-3 mb-5">
                {Object.entries(careerScores).map(([key, val]) => {
                  const max = Math.max(...Object.values(careerScores));
                  const pct = max > 0 ? (val / max) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300">{careerLabels[key].label}</span>
                        <span className="text-amber-400 font-bold">{val} نقطة</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={resetSurvey}
                className="px-6 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
              >
                إعادة الاختبار
              </button>
            </div>
          )}
        </div>

        {/* Career Survey Analytics */}
        {careerStats.total > 0 && (
          <div className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-cairo">تبؤءات الميول المهنية</h4>
                <p className="text-xs text-slate-500">إجمالي {careerStats.total} مشارك - توزيع المسارات</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(careerLabels).map(([key, info]) => {
                const count = careerStats.byTrack[key] || 0;
                const pct = careerStats.total > 0 ? (count / careerStats.total) * 100 : 0;
                const Icon = info.icon;
                return (
                  <div key={key} className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className={`w-10 h-10 mx-auto rounded-xl bg-${info.color}-50 flex items-center justify-center mb-2`}>
                      <Icon className={`w-5 h-5 text-${info.color}-600`} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{info.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mb-1">{count}</p>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-${info.color}-500 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct.toFixed(0)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modals */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="تم إرسال الاستشارة بنجاح" size="md">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-800 mb-2">تم استلام رسالتك بنجاح</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            سيتم مراجعة استشارتك والرد عليها في أقرب وقت ممكن. جميع بياناتك سرية ومحمية.
          </p>
        </div>
      </Modal>

      <Modal open={showShareLink} onClose={() => setShowShareLink(false)} title="رابط مشاركة النموذج" size="md">
        <div className="py-4">
          <p className="text-sm text-slate-500 mb-3">يمكنك مشاركة هذا الرابط مع ولي الأمر ليتمكن من تعبئة النموذج مباشرة:</p>
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
            />
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                copied ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'تم النسخ' : 'نسخ'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

// ============ IMPACT MEASUREMENT ============
