import { useEffect, useState, useCallback } from 'react';
import {
  Grid3x3, Loader2, AlertCircle, Download,
  CheckCircle2, Clock, Lightbulb, X,
  ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  fetchEvidence, fetchReadinessStats,
  fetchZadIndicators, fetchZadPrograms, fetchZadProgramIndicators,
  fetchSurveys, fetchSurveyResponses,
  type EvidenceRecord, type ZadIndicator, type ZadProgram,
  type SurveyDefinition, type SurveyResponseRecord,
} from '@/lib/supabase';
import {
  accreditationDomains, indicatorColorMap, type AccreditationIndicator,
} from '@/data/accreditationIndicators';

interface ProgramIndicator {
  program_id: string;
  indicator_code: string;
}

interface IndicatorCoverage {
  indicator: ZadIndicator;
  evidenceCount: number;
  lastUpdate: string | null;
  linkedPrograms: { id: string; name: string }[];
  surveyReports: number;
  totalCoverage: number;
  gap: number;
  proposedAction: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

const REQUIRED_EVIDENCE = 3;

export function CoverageMapSection() {
  const [indicators, setIndicators] = useState<ZadIndicator[]>([]);
  const [programs, setPrograms] = useState<ZadProgram[]>([]);
  const [programIndicators, setProgramIndicators] = useState<ProgramIndicator[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [readinessStats, setReadinessStats] = useState<Record<string, number>>({});
  const [surveys, setSurveys] = useState<SurveyDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [inds, progs, pi, ev, rs, surv] = await Promise.all([
        fetchZadIndicators(),
        fetchZadPrograms(),
        fetchZadProgramIndicators(),
        fetchEvidence(),
        fetchReadinessStats(),
        fetchSurveys(),
      ]);
      setIndicators(inds);
      setPrograms(progs);
      setProgramIndicators(pi as ProgramIndicator[]);
      setEvidence(ev);
      const statMap: Record<string, number> = {};
      for (const r of rs) statMap[r.code] = r.count;
      setReadinessStats(statMap);
      setSurveys(surv.filter(s => s.status !== 'archived'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات التغطية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build coverage data
  const evidenceByIndicator: Record<string, EvidenceRecord[]> = {};
  for (const ev of evidence) {
    for (const code of ev.indicator_codes || []) {
      if (!evidenceByIndicator[code]) evidenceByIndicator[code] = [];
      evidenceByIndicator[code].push(ev);
    }
  }

  const programsByIndicator: Record<string, { id: string; name: string }[]> = {};
  for (const pi of programIndicators) {
    const prog = programs.find(p => p.id === pi.program_id);
    if (prog) {
      if (!programsByIndicator[pi.indicator_code]) programsByIndicator[pi.indicator_code] = [];
      programsByIndicator[pi.indicator_code].push({ id: prog.id, name: prog.name });
    }
  }

  const surveyReportsByIndicator: Record<string, number> = {};
  for (const s of surveys) {
    for (const code of s.indicators || []) {
      surveyReportsByIndicator[code] = (surveyReportsByIndicator[code] || 0) + 1;
    }
  }

  const coverageData: IndicatorCoverage[] = indicators.map(ind => {
    const evList = evidenceByIndicator[ind.code] || [];
    const lastUpdate = evList.length > 0
      ? evList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;
    const linkedPrograms = programsByIndicator[ind.code] || [];
    const surveyReports = surveyReportsByIndicator[ind.code] || 0;
    const totalCoverage = evList.length + surveyReports;
    const gap = Math.max(0, REQUIRED_EVIDENCE - totalCoverage);
    const proposedAction = gap > 0 && linkedPrograms.length > 0
      ? `تفعيل برنامج «${linkedPrograms[0].name}» وتوثيق مخرجاته كشاهد`
      : gap > 0
        ? 'إنشاء شاهد جديد مرتبط بهذا المؤشر'
        : null;
    return {
      indicator: ind, evidenceCount: evList.length, lastUpdate,
      linkedPrograms, surveyReports, totalCoverage, gap, proposedAction,
    };
  });

  // Coverage matrix: indicator × program
  const matrixPrograms = programs.slice(0, 12);
  const matrixCell = (indCode: string, progId: string): number => {
    const linked = programIndicators.some(pi => pi.indicator_code === indCode && pi.program_id === progId);
    if (!linked) return -1;
    const evCount = (evidenceByIndicator[indCode] || []).filter(ev =>
      ev.indicator_codes?.includes(indCode)
    ).length;
    const srCount = surveyReportsByIndicator[indCode] || 0;
    return evCount + (linked ? srCount > 0 ? 1 : 0 : 0);
  };

  // Summary stats
  const totalReady = coverageData.filter(c => c.totalCoverage >= REQUIRED_EVIDENCE).length;
  const totalGaps = coverageData.reduce((s, c) => s + c.gap, 0);
  const totalEvidence = coverageData.reduce((s, c) => s + c.evidenceCount + c.surveyReports, 0);
  const overallPct = coverageData.length > 0 ? (totalReady / coverageData.length) * 100 : 0;

  const downloadReport = async () => {
    setPdfLoading(true);
    try {
      const html = buildReportHtml(coverageData, matrixPrograms, programIndicators, {
        totalReady, totalGaps, totalEvidence, overallPct, indicatorsCount: indicators.length,
      });
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;right:-9999px;top:0;width:794px;padding:40px;background:#fff;font-family:Cairo,sans-serif;direction:rtl;color:#1e293b;font-size:14px;line-height:1.7;';
      container.innerHTML = html;
      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#fff', windowWidth: 794 });
      document.body.removeChild(container);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210, pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;
      let heightLeft = imgH;
      let pos = 0;
      pdf.addImage(imgData, 'PNG', 0, pos, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        pos -= pageH; pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, pos, pageW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`quarterly-coverage-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      setError('فشل إنشاء التقرير');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return (
    <section id="coverage-map" className="py-12 bg-slate-50 scroll-mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </section>
  );

  return (
    <section id="coverage-map" className="py-12 bg-slate-50 scroll-mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <Grid3x3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">خريطة تغطية المؤشرات</h2>
              <p className="text-sm text-slate-500">13 مؤشرًا × البرامج · الشواهد والفجوات والإجراءات المقترحة</p>
            </div>
          </div>
          <button onClick={downloadReport} disabled={pdfLoading} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors">
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} تقرير فصلي PDF
          </button>
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4" />{error}<button onClick={() => setError('')} className="mr-auto"><X className="w-4 h-4" /></button></div>}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="نسبة التغطية" value={`${overallPct.toFixed(0)}%`} color="emerald" />
          <SummaryCard label="مؤشرات مكتملة" value={`${totalReady} / ${indicators.length}`} color="sky" />
          <SummaryCard label="إجمالي الشواهد" value={String(totalEvidence)} color="amber" />
          <SummaryCard label="فجوات متبقية" value={String(totalGaps)} color="rose" />
        </div>

        {/* Coverage matrix heatmap */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Grid3x3 className="w-4 h-4 text-blue-600" /> خريطة التغطية: المؤشرات × البرامج</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="sticky right-0 bg-white p-2 text-right text-slate-500 font-medium border-b border-slate-100 min-w-[120px]">المؤشر</th>
                  {matrixPrograms.map(p => (
                    <th key={p.id} className="p-2 text-center text-slate-400 font-medium border-b border-slate-100" title={p.name}
                      style={{ writingMode: 'vertical-rl', minHeight: '80px', maxWidth: '40px' }}>
                      <span className="truncate inline-block max-w-[80px]">{p.name.slice(0, 12)}</span>
                    </th>
                  ))}
                  <th className="p-2 text-center text-slate-600 font-bold border-b border-slate-100">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {coverageData.map(cov => (
                  <tr key={cov.indicator.code} className="hover:bg-slate-50/50">
                    <td className="sticky right-0 bg-white p-2 text-right border-b border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">{cov.indicator.code}</span>
                        <span className="text-slate-700 truncate max-w-[100px]">{cov.indicator.text.slice(0, 30)}…</span>
                      </div>
                    </td>
                    {matrixPrograms.map(p => {
                      const val = matrixCell(cov.indicator.code, p.id);
                      return (
                        <td key={p.id} className="p-1 text-center border-b border-slate-50">
                          {val === -1 ? (
                            <span className="block w-6 h-6 mx-auto rounded bg-slate-50" />
                          ) : val === 0 ? (
                            <span className="block w-6 h-6 mx-auto rounded bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center leading-6">0</span>
                          ) : (
                            <span className="block w-6 h-6 mx-auto rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center leading-6">{val}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center border-b border-slate-50">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        cov.totalCoverage >= REQUIRED_EVIDENCE ? 'bg-emerald-100 text-emerald-700'
                        : cov.totalCoverage > 0 ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                      }`}>{cov.totalCoverage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-50" /> غير مرتبط</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100" /> مرتبط بدون شواهد</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100" /> مرتبط بشواهد</span>
          </div>
        </div>

        {/* Quarterly comparison: indicator coverage trends */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> المقارنة الفصلية: اتجاه المؤشرات</h3>
          <QuarterlyTrendChart coverageData={coverageData} />
        </div>

        {/* Quarterly comparison: survey dimension trends */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> المقارنة الفصلية: أبعاد الاستبيانات</h3>
          <SurveyDimensionTrends surveys={surveys} />
        </div>

        {/* Per-indicator detail cards */}
        <div className="space-y-3">
          {coverageData.map(cov => {
            const isExpanded = expandedIndicator === cov.indicator.code;
            const ready = cov.totalCoverage >= REQUIRED_EVIDENCE;
            const accInd = findAccreditationIndicator(cov.indicator.code);
            const colors = accInd ? indicatorColorMap[getDomainColor(accInd.domain)] : indicatorColorMap.emerald;
            return (
              <div key={cov.indicator.code} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedIndicator(isExpanded ? null : cov.indicator.code)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors text-right"
                >
                  <div className="flex-shrink-0">
                    {ready ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : cov.totalCoverage > 0 ? <Clock className="w-5 h-5 text-amber-500" />
                    : <AlertCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{cov.indicator.code}</span>
                      <p className="text-sm font-medium text-slate-800 truncate">{cov.indicator.text}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{cov.indicator.domain} · {cov.indicator.standard}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cov.surveyReports > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">{cov.surveyReports} استبيان</span>
                    )}
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ready ? 'bg-emerald-500' : cov.totalCoverage > 0 ? 'bg-amber-400' : 'bg-rose-300'}`}
                        style={{ width: `${Math.min(100, (cov.totalCoverage / REQUIRED_EVIDENCE) * 100)}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${ready ? 'text-emerald-600' : cov.totalCoverage > 0 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {cov.totalCoverage}/{REQUIRED_EVIDENCE}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-[11px] text-slate-400 mb-1">الشواهد المرفقة</div>
                        <div className="text-lg font-bold text-slate-800">{cov.evidenceCount}</div>
                        <div className="text-[11px] text-slate-400 mt-1">آخر تحديث: {fmtDate(cov.lastUpdate)}</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-[11px] text-slate-400 mb-1">تقارير الاستبيانات</div>
                        <div className="text-lg font-bold text-blue-600">{cov.surveyReports}</div>
                        <div className="text-[11px] text-slate-400 mt-1">مرفقة تلقائيًا من تحليلات الاستبيانات</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-[11px] text-slate-400 mb-1">الفجوة</div>
                        <div className={`text-lg font-bold ${cov.gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {cov.gap > 0 ? `${cov.gap} شواهد` : 'مكتمل'}
                        </div>
                        {cov.proposedAction && (
                          <div className="text-[11px] text-amber-600 mt-1 flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" /> {cov.proposedAction}
                          </div>
                        )}
                      </div>
                    </div>
                    {cov.linkedPrograms.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-400 mb-1.5">البرامج المرتبطة:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {cov.linkedPrograms.map(p => (
                            <span key={p.id} className={`text-[11px] rounded-full px-2.5 py-1 ${colors.bg} ${colors.text}`}>
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    sky: 'text-sky-600 bg-sky-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className={`text-xs ${colorMap[color]?.split(' ')[1] || ''} mb-1`}>{label}</div>
      <div className={`text-2xl font-bold ${colorMap[color]?.split(' ')[0] || 'text-slate-800'} font-cairo`}>{value}</div>
    </div>
  );
}

function findAccreditationIndicator(code: string): AccreditationIndicator | undefined {
  return accreditationDomains.flatMap(d => d.indicators).find(i => i.code === code);
}

function getDomainColor(domain: string): string {
  const dom = accreditationDomains.find(d => d.id === domain);
  return dom?.color || 'emerald';
}

// ============ QUARTERLY TREND: INDICATOR COVERAGE ============

function QuarterlyTrendChart({ coverageData }: { coverageData: IndicatorCoverage[] }) {
  const sorted = [...coverageData].sort((a, b) => b.totalCoverage - a.totalCoverage);
  const maxVal = Math.max(REQUIRED_EVIDENCE, ...coverageData.map(c => c.totalCoverage));
  return (
    <div className="space-y-1.5">
      {sorted.map(cov => {
        const pct = maxVal > 0 ? (cov.totalCoverage / maxVal) * 100 : 0;
        const ready = cov.totalCoverage >= REQUIRED_EVIDENCE;
        return (
          <div key={cov.indicator.code} className="flex items-center gap-2 text-xs">
            <div className="w-28 flex-shrink-0 truncate text-slate-600" title={cov.indicator.text}>
              <span className="font-mono text-[10px] text-slate-400 ml-1">{cov.indicator.code}</span>
              {cov.indicator.text.slice(0, 18)}
            </div>
            <div className="flex-1 h-6 bg-slate-50 rounded-md overflow-hidden relative">
              <div
                className={`h-full rounded-md transition-all duration-500 ${
                  ready ? 'bg-gradient-to-l from-emerald-500 to-emerald-400'
                  : cov.totalCoverage > 0 ? 'bg-gradient-to-l from-amber-400 to-amber-300'
                  : 'bg-rose-200'
                }`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-slate-700">
                {cov.totalCoverage}/{REQUIRED_EVIDENCE}
              </span>
            </div>
            <div className="w-16 flex-shrink-0 text-left">
              {cov.gap > 0 ? (
                <span className="text-[10px] text-rose-500">+{cov.gap} فجوة</span>
              ) : (
                <span className="text-[10px] text-emerald-600">مكتمل</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ QUARTERLY TREND: SURVEY DIMENSIONS ============

function SurveyDimensionTrends({ surveys }: { surveys: SurveyDefinition[] }) {
  const [trendData, setTrendData] = useState<Record<string, { dim: string; mean: number; n: number }[]>>({});
  const [loadingTrends, setLoadingTrends] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTrends(true);
      const result: Record<string, { dim: string; mean: number; n: number }[]> = {};
      for (const s of surveys) {
        try {
          const responses = await fetchSurveyResponses(s.id);
          if (responses.length === 0) continue;
          const dims: { dim: string; mean: number; n: number }[] = [];
          for (const sec of s.sections) {
            let sum = 0, count = 0;
            for (const resp of responses) {
              for (let i = 0; i < sec.items.length; i++) {
                const key = `${sec.id}-${i}`;
                const v = resp.answers?.[key];
                if (typeof v === 'number' && v > 0) {
                  sum += sec.items[i].reverse ? (6 - v) : v;
                  count++;
                }
              }
            }
            if (count > 0) dims.push({ dim: sec.name, mean: sum / count, n: responses.length });
          }
          if (dims.length > 0) result[s.title] = dims;
        } catch { /* skip survey on error */ }
      }
      if (!cancelled) { setTrendData(result); setLoadingTrends(false); }
    })();
    return () => { cancelled = true; };
  }, [surveys]);

  if (loadingTrends) return (
    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
  );

  const surveyEntries = Object.entries(trendData);
  if (surveyEntries.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        لا توجد استجابات استبيانات لعرض الاتجاهات بعد. سيتم عرض المقارنة الفصلية تلقائيًا عند توفر البيانات.
      </div>
    );
  }

  const allDims = new Set<string>();
  surveyEntries.forEach(([, dims]) => dims.forEach(d => allDims.add(d.dim)));

  return (
    <div className="space-y-4">
      {surveyEntries.map(([surveyTitle, dims]) => (
        <div key={surveyTitle} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
          <div className="text-xs font-bold text-slate-700 mb-2">{surveyTitle}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {dims.map(d => (
              <div key={d.dim} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-600 truncate">{d.dim}</div>
                  <div className="text-[10px] text-slate-400">{d.n} مستجيب</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.mean >= 4 ? 'bg-emerald-500' : d.mean >= 3 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${(d.mean / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${
                    d.mean >= 4 ? 'text-emerald-600' : d.mean >= 3 ? 'text-amber-600' : 'text-rose-500'
                  }`}>{d.mean.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ PDF REPORT ============

function buildReportHtml(
  coverage: IndicatorCoverage[],
  matrixPrograms: ZadProgram[],
  programIndicators: ProgramIndicator[],
  summary: { totalReady: number; totalGaps: number; totalEvidence: number; overallPct: number; indicatorsCount: number },
): string {
  const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const readyCount = summary.totalReady;
  const gapIndicators = coverage.filter(c => c.gap > 0);

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #1e40af; padding-bottom:16px; margin-bottom:24px;">
      <div>
        <div style="font-size:22px; font-weight:800; color:#10324a;">بوصلة</div>
        <div style="font-size:13px; color:#0e7490; margin-top:4px;">منصة الموجّه الطلابي</div>
        <div style="font-size:13px; color:#64748b; margin-top:4px;">التقرير الفصلي لخريطة تغطية المؤشرات</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:14px; color:#94a3b8;">${dateStr}</div>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-bottom:20px;">
      <div style="flex:1; background:#ecfdf5; border-radius:10px; padding:14px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:#059669;">${summary.overallPct.toFixed(0)}%</div><div style="font-size:11px; color:#059669;">نسبة التغطية</div>
      </div>
      <div style="flex:1; background:#eff6ff; border-radius:10px; padding:14px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:#2563eb;">${readyCount}/${summary.indicatorsCount}</div><div style="font-size:11px; color:#2563eb;">مؤشرات مكتملة</div>
      </div>
      <div style="flex:1; background:#fffbeb; border-radius:10px; padding:14px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:#d97706;">${summary.totalEvidence}</div><div style="font-size:11px; color:#d97706;">إجمالي الشواهد</div>
      </div>
      <div style="flex:1; background:#fef2f2; border-radius:10px; padding:14px; text-align:center;">
        <div style="font-size:28px; font-weight:800; color:#dc2626;">${summary.totalGaps}</div><div style="font-size:11px; color:#dc2626;">فجوات متبقية</div>
      </div>
    </div>

    <h2 style="font-size:16px; font-weight:700; color:#1e3a8a; border-right:4px solid #3b82f6; padding-right:12px; margin:20px 0 12px;">تفصيل المؤشرات</h2>
    <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:16px;">
      <thead>
        <tr style="background:#1e3a8a; color:#fff;">
          <th style="padding:6px; text-align:right;">الرمز</th>
          <th style="padding:6px; text-align:right;">المؤشر</th>
          <th style="padding:6px;">الشواهد</th>
          <th style="padding:6px;">استبيانات</th>
          <th style="padding:6px;">المجموع</th>
          <th style="padding:6px;">الفجوة</th>
          <th style="padding:6px; text-align:right;">الإجراء المقترح</th>
        </tr>
      </thead>
      <tbody>
        ${coverage.map((c, i) => `
          <tr style="background:${i % 2 ? '#f8fafc' : '#fff'};">
            <td style="padding:5px; font-family:monospace; color:#94a3b8;">${c.indicator.code}</td>
            <td style="padding:5px;">${c.indicator.text}</td>
            <td style="padding:5px; text-align:center;">${c.evidenceCount}</td>
            <td style="padding:5px; text-align:center; color:#2563eb;">${c.surveyReports}</td>
            <td style="padding:5px; text-align:center; font-weight:700; color:${c.totalCoverage >= REQUIRED_EVIDENCE ? '#059669' : c.totalCoverage > 0 ? '#d97706' : '#dc2626'};">${c.totalCoverage}</td>
            <td style="padding:5px; text-align:center; color:${c.gap > 0 ? '#dc2626' : '#059669'};">${c.gap > 0 ? c.gap : '✓'}</td>
            <td style="padding:5px; font-size:10px; color:#64748b;">${c.proposedAction || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${gapIndicators.length > 0 ? `
      <h2 style="font-size:16px; font-weight:700; color:#1e3a8a; border-right:4px solid #f59e0b; padding-right:12px; margin:20px 0 12px;">الفجوات والإجراءات المقترحة</h2>
      ${gapIndicators.map(c => `
        <div style="border:1px solid #fed7aa; border-radius:10px; padding:12px; margin-bottom:8px; background:#fffbeb;">
          <div style="font-weight:700; font-size:12px; color:#92400e;">${c.indicator.code} — ${c.indicator.text}</div>
          <div style="font-size:11px; color:#78716c; margin-top:4px;">
            <span style="font-weight:600;">الفجوة:</span> ${c.gap} شواهد ·
            <span style="font-weight:600;">الإجراء:</span> ${c.proposedAction || 'إنشاء شاهد جديد'}
          </div>
        </div>
      `).join('')}
    ` : ''}

    <div style="margin-top:24px; text-align:center; font-size:11px; color:#cbd5e1;">
      تم إنشاء هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي — ${new Date().toLocaleString('ar-SA')}
    </div>
  `;
}
