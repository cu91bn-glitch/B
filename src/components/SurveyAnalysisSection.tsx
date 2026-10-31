import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, Loader2, AlertCircle, Download, FlaskConical,
  TrendingUp, TrendingDown, Target, Lightbulb, FileText, CheckCircle2,
  Minus, Zap, ShieldAlert, X,
} from 'lucide-react';
import {
  fetchSurveys, fetchSurveyResponses, fetchZadResources, fetchZadIndicators,
  fetchReadinessStats, createEvidence,
  type SurveyDefinition, type SurveyResponseRecord, type ZadResource, type ZadIndicator,
} from '@/lib/supabase';
import {
  analyzeSurvey, generateDemoResponses,
  type AnalysisResult, type DimensionStat, type SwotEntry, type Recommendation,
} from '@/lib/analysis';
import { generateAnalysisPdf } from '@/lib/reportGenerator';

const SCALE_MAX = 5;

export function SurveyAnalysisSection() {
  const [surveys, setSurveys] = useState<SurveyDefinition[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const useDemo = false;
  const [evidenceSaved, setEvidenceSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSurveys();
      setSurveys(data.filter(s => s.status !== 'archived'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الاستبيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = surveys.find(s => s.id === selectedId);

  const runAnalysis = async () => {
    if (!selected) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const [responses, resources, indicators, readinessStats] = await Promise.all([
        useDemo ? Promise.resolve(generateDemoResponses(selected, 20)) : fetchSurveyResponses(selected.id),
        fetchZadResources(),
        fetchZadIndicators(),
        fetchReadinessStats(),
      ]);
      const analysis = analyzeSurvey(selected, responses, resources, indicators, readinessStats);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التحليل');
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await generateAnalysisPdf(result);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${result.survey.slug || result.survey.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfDone(true);
      setTimeout(() => setPdfDone(false), 3000);
      if (!useDemo && result.survey.indicators.length > 0) {
        try {
          const file = new File([blob], `analysis-${result.survey.slug || result.survey.id}.pdf`, { type: 'application/pdf' });
          await createEvidence({
            file, title: `تقرير تحليل: ${result.survey.title}`,
            category: 'تحليل أثر', module: 'survey-analysis',
            activityTitle: result.survey.title,
            indicatorCodes: result.survey.indicators,
          });
          setEvidenceSaved(true);
          setTimeout(() => setEvidenceSaved(false), 4000);
        } catch { /* evidence upload is best-effort */ }
      }
    } catch (err) {
      setError('فشل إنشاء ملف PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <section id="survey-analysis" className="py-12 bg-slate-50 scroll-mt-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-cairo">تحليل النتائج وتقارير الأثر</h2>
            <p className="text-sm text-slate-500">تحليل SWOT، توصيات مرتبطة بدليل زاد، وتقرير PDF عربي</p>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4" />{error}<button onClick={() => setError('')} className="mr-auto"><X className="w-4 h-4" /></button></div>}

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <label className="flex-1 w-full text-sm font-medium text-slate-700">اختر الاستبيان
              <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setResult(null); }} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <option value="">— اختر —</option>
                {surveys.map(s => <option key={s.id} value={s.id}>{s.title} ({s.status === 'draft' ? 'مسودة' : s.status === 'published' ? 'منشور' : s.status})</option>)}
              </select>
            </label>
            <button onClick={runAnalysis} disabled={!selected || analyzing} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />} تحليل
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* Action bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button onClick={downloadPdf} disabled={pdfLoading} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors">
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pdfDone ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {pdfLoading ? 'جاري الإنشاء...' : pdfDone ? 'تم التنزيل' : 'تنزيل تقرير PDF'}
              </button>
              <span className="text-xs text-slate-400">{result.totalResponses} استجابة · متوسط كلي {result.overallMean.toFixed(2)} · α={result.cronbachAlpha.toFixed(2)}</span>
              {evidenceSaved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> تم حفظ الشاهد تلقائيًا</span>}
            </div>

            {!result.sufficientData && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
                <ShieldAlert className="w-5 h-5" />
                عدد الاستجابات أقل من 5 — النتائج استرشادية فقط ولا تعمّم.
              </div>
            )}

            {/* Results */}
            <DimensionCards dimensions={result.dimensions} />
            <SwotGrid swot={result.swot} challenges={result.challenges} />
            <RecommendationsList recommendations={result.recommendations} />
            {result.topicClusters.length > 0 && <TopicClustersSection clusters={result.topicClusters} />}
            <WarningBanner warning={result.warning} />
          </>
        )}

        {!result && !analyzing && !loading && surveys.length > 0 && (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>اختر استبيانًا واضغط «تحليل» لعرض النتائج.</p>
          </div>
        )}

        {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}
      </div>
    </section>
  );
}

function DimensionCards({ dimensions }: { dimensions: DimensionStat[] }) {
  const cardColor = (d: DimensionStat) => {
    if (d.mean >= 4.0) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: TrendingUp };
    if (d.mean < 3.0) return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: TrendingDown };
    return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', icon: Minus };
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-blue-600" /> الأبعاد والإحصاءات</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {dimensions.map(d => {
          const c = cardColor(d);
          const Icon = c.icon;
          return (
            <div key={d.sectionId} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800">{d.sectionName}</h4>
                <Icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <div className="flex items-end gap-3 mb-2">
                <span className={`text-3xl font-extrabold ${c.text}`}>{d.mean.toFixed(2)}</span>
                <span className="text-xs text-slate-400 pb-1">/ {SCALE_MAX}</span>
                <span className="text-xs text-slate-500 pb-1 mr-auto">{d.band}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                <span>الانحراف: {d.stdDev.toFixed(2)}</span>
                <span>ثقة 95%: [{d.ciLower.toFixed(1)}, {d.ciUpper.toFixed(1)}]</span>
                <span>نسبة سلبية: {(d.negativeRatio * 100).toFixed(0)}%</span>
                <span>n = {d.n} · {d.confidenceLevel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SwotGrid({ swot, challenges }: { swot: SwotEntry[]; challenges: AnalysisResult['challenges'] }) {
  const types = [
    { type: 'strength' as const, label: 'قوة', icon: TrendingUp, cardCls: 'border-emerald-200 bg-emerald-50', headCls: 'border-emerald-200', iconCls: 'text-emerald-600', textCls: 'text-emerald-700', countCls: 'text-emerald-400' },
    { type: 'weakness' as const, label: 'ضعف', icon: TrendingDown, cardCls: 'border-rose-200 bg-rose-50', headCls: 'border-rose-200', iconCls: 'text-rose-600', textCls: 'text-rose-700', countCls: 'text-rose-400' },
    { type: 'opportunity' as const, label: 'فرصة', icon: Lightbulb, cardCls: 'border-blue-200 bg-blue-50', headCls: 'border-blue-200', iconCls: 'text-blue-600', textCls: 'text-blue-700', countCls: 'text-blue-400' },
    { type: 'threat' as const, label: 'تهديد', icon: ShieldAlert, cardCls: 'border-amber-200 bg-amber-50', headCls: 'border-amber-200', iconCls: 'text-amber-600', textCls: 'text-amber-700', countCls: 'text-amber-400' },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" /> تحليل SWOT</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map(({ type, label, icon: Icon, cardCls, headCls, iconCls, textCls, countCls }) => {
          const entries = swot.filter(e => e.swotType === type);
          return (
            <div key={type} className={`rounded-xl border ${cardCls} p-4`}>
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${headCls}`}>
                <Icon className={`w-4 h-4 ${iconCls}`} />
                <span className={`text-sm font-bold ${textCls}`}>{label}</span>
                <span className={`text-xs ${countCls} mr-auto`}>{entries.length}</span>
              </div>
              {entries.length === 0 ? (
                <p className="text-xs text-slate-400">لا يوجد</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((e, i) => (
                    <div key={i}>
                      <div className="text-xs font-semibold text-slate-800">{e.dimension}</div>
                      <div className="text-[11px] text-slate-500 leading-5">{e.evidence}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">الثقة: {e.confidenceLevel} · {e.factType}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {challenges.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-600" /><span className="text-sm font-bold text-amber-800">تحديات (Challenge)</span></div>
          {challenges.map((c, i) => (
            <div key={i} className="text-xs text-amber-900 mb-1.5">
              <span className="font-semibold">{c.dimension}</span>: {c.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  const sorted = [...recommendations].sort((a, b) => b.priorityScore - a.priorityScore);
  const priorityClasses = (p: string): { border: string; badge: string } => {
    if (p === 'مرتفعة') return { border: 'border-rose-500', badge: 'bg-rose-50 text-rose-700' };
    if (p === 'متوسطة') return { border: 'border-amber-500', badge: 'bg-amber-50 text-amber-700' };
    return { border: 'border-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> التوصيات والإجراءات ({sorted.length})</h3>
      {sorted.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm"><CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />لا توجد توصيات — الأبعاد ضمن المعدل.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((rec, i) => (
            <div key={i} className={`rounded-xl border-r-4 ${priorityClasses(rec.priority).border} bg-white border border-slate-200 p-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-bold text-slate-800 flex-1">{i + 1}. {rec.ifLowText}</div>
                <span className={`text-[11px] font-bold rounded-full px-3 py-1 ${priorityClasses(rec.priority).badge}`}>{rec.priority}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div><span className="text-slate-400">البُعد:</span> {rec.dimension}</div>
                <div><span className="text-slate-400">المسؤول:</span> {rec.responsibility}</div>
                <div><span className="text-slate-400">البرنامج:</span> <span dir="ltr">{rec.programName || '—'}</span></div>
                <div><span className="text-slate-400">الموعد:</span> {rec.timeframe}</div>
                {rec.resourceTitle && <div className="col-span-2"><span className="text-slate-400">المورد:</span> {rec.resourceTitle} {rec.resourceUrl && <a href={rec.resourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline" dir="ltr">رابط</a>}</div>}
                <div className="col-span-2"><span className="text-slate-400">مؤشر النجاح:</span> {rec.successMetric}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicClustersSection({ clusters }: { clusters: AnalysisResult['topicClusters'] }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> موضوعات النصوص الحرة</h3>
      <div className="flex flex-wrap gap-2">
        {clusters.map((c, i) => (
          <div key={i} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 text-xs">
            <span className="font-bold text-blue-700">{c.topic}</span>
            <span className="text-slate-500 mr-2">({c.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WarningBanner({ warning }: { warning: string }) {
  return (
    <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-center mt-6">
      <div className="text-sm font-bold text-rose-800 mb-1">تنبيه</div>
      <div className="text-xs text-rose-700 leading-6">{warning}</div>
    </div>
  );
}
