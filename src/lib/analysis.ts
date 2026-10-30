import type { SurveyDefinition, SurveyResponseRecord, SurveySection } from './supabase';
import type { ZadResource, ZadIndicator } from './supabase';
import swotRules from '../../seed/swot_rules.json';

export interface DimensionStat {
  sectionId: string;
  sectionName: string;
  swotAxis: string;
  n: number;
  mean: number;
  stdDev: number;
  ciLower: number;
  ciUpper: number;
  negativeRatio: number;
  band: string;
  confidenceLevel: string;
  itemStats: { text: string; mean: number; n: number; reverse: boolean }[];
}

export interface SwotEntry {
  dimension: string;
  sectionId: string;
  swotType: 'strength' | 'weakness' | 'opportunity' | 'threat';
  mean: number;
  n: number;
  evidence: string;
  confidenceLevel: string;
  factType: 'حقيقة' | 'استنتاج';
}

export interface ChallengeEntry {
  dimension: string;
  sectionId: string;
  importance: number;
  performance: number;
  gap: number;
  reason: string;
}

export interface Recommendation {
  sectionId: string;
  dimension: string;
  ifLowText: string;
  programId: string | null;
  programName: string | null;
  resourceSlug: string | null;
  resourceTitle: string | null;
  resourceUrl: string | null;
  resourceQrUrl: string | null;
  responsibility: string;
  timeframe: string;
  successMetric: string;
  priority: string;
  priorityScore: number;
}

export interface TopicCluster {
  topic: string;
  count: number;
  examples: string[];
}

export interface AnalysisResult {
  survey: SurveyDefinition;
  totalResponses: number;
  sufficientData: boolean;
  dimensions: DimensionStat[];
  overallMean: number;
  cronbachAlpha: number;
  swot: SwotEntry[];
  challenges: ChallengeEntry[];
  recommendations: Recommendation[];
  topicClusters: TopicCluster[];
  warning: string;
}

const SCALE_MAX = 5;
const Z_95 = 1.96;

function reverseScore(value: number, reverse: boolean): number {
  return reverse ? (SCALE_MAX + 1 - value) : value;
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[], avg: number): number {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function confidenceInterval(avg: number, sd: number, n: number): [number, number] {
  if (n < 2) return [avg, avg];
  const se = sd / Math.sqrt(n);
  return [avg - Z_95 * se, avg + Z_95 * se];
}

function bandLabel(avg: number): string {
  const bands: [number, number, string][] = (swotRules as Record<string, unknown>).likert_bands as [number, number, string][] ?? [
    [1.0, 1.8, 'منخفض جدًا'],
    [1.8, 2.6, 'منخفض'],
    [2.6, 3.4, 'متوسط'],
    [3.4, 4.2, 'مرتفع'],
    [4.2, 5.0, 'مرتفع جدًا'],
  ];
  for (const [lo, hi, label] of bands) {
    if (avg >= lo && avg < hi) return label;
  }
  return avg >= 5 ? 'مرتفع جدًا' : 'منخفض جدًا';
}

function confidenceLevel(n: number): string {
  const c = swotRules.confidence;
  if (n >= c.high.min_n) return c.high.label;
  if (n >= c.medium.min_n) return c.medium.label;
  if (n >= c.low.min_n) return c.low.label;
  return c.insufficient.label;
}

function computeCronbachAlpha(responses: SurveyResponseRecord[], section: SurveySection): number {
  const items = section.items;
  if (items.length < 2) return 0;
  const itemKeys = items.map((_, i) => `${section.id}-${i}`);
  const validResp = responses.filter(r => r.answers && itemKeys.every(k => r.answers[k] !== undefined));
  if (validResp.length < 2) return 0;
  const reversedKeys = new Set(items.map((it, i) => it.reverse ? `${section.id}-${i}` : '').filter(Boolean));
  const scored = validResp.map(r => itemKeys.map(k => reversedKeys.has(k) ? reverseScore(r.answers[k], true) : r.answers[k]));
  const k = items.length;
  const itemMeans = itemKeys.map((_, i) => mean(scored.map(s => s[i])));
  const itemVars = itemKeys.map((_, i) => {
    const vals = scored.map(s => s[i]);
    return stdDev(vals, itemMeans[i]) ** 2;
  });
  const totalVar = stdDev(scored.map(s => s.reduce((a, b) => a + b, 0)), mean(scored.map(s => s.reduce((a, b) => a + b, 0)))) ** 2;
  const sumItemVar = itemVars.reduce((a, b) => a + b, 0);
  if (totalVar === 0) return 0;
  return (k / (k - 1)) * (1 - sumItemVar / totalVar);
}

function negativeRatio(responses: SurveyResponseRecord[], section: SurveySection): number {
  const items = section.items;
  const itemKeys = items.map((_, i) => `${section.id}-${i}`);
  let total = 0;
  let negative = 0;
  for (const r of responses) {
    for (let i = 0; i < itemKeys.length; i++) {
      const val = r.answers?.[itemKeys[i]];
      if (val === undefined) continue;
      total++;
      const score = items[i].reverse ? reverseScore(val, true) : val;
      if (score <= 2) negative++;
    }
  }
  return total === 0 ? 0 : negative / total;
}

export function analyzeSurvey(
  survey: SurveyDefinition,
  responses: SurveyResponseRecord[],
  resources: ZadResource[],
  indicators: ZadIndicator[],
  readinessStats: { code: string; count: number }[],
  importanceScores?: Record<string, number>,
): AnalysisResult {
  const totalResponses = responses.length;
  const sufficientData = totalResponses >= swotRules.min_n_for_report;

  const dimensions: DimensionStat[] = survey.sections.map(section => {
    const itemKeys = section.items.map((_, i) => `${section.id}-${i}`);
    const perItemScores = itemKeys.map((key, i) => {
      const scores = responses
        .map(r => r.answers?.[key])
        .filter((v): v is number => v !== undefined)
        .map(v => reverseScore(v, section.items[i].reverse ?? false));
      return { key, scores, mean: mean(scores), n: scores.length };
    });
    // وحدة التحليل هي المستجيب: متوسط كل مستجيب في البُعد، ثم الإحصاءات على المستجيبين.
    // (حساب الانحراف وفترة الثقة على كل الإجابات الفردية يضخّم n ويعطي ثقة أعلى من الحقيقية)
    const respondentMeans = responses
      .map(r => {
        const vals = itemKeys
          .map((key, i) => {
            const v = r.answers?.[key];
            return v === undefined ? undefined : reverseScore(v, section.items[i].reverse ?? false);
          })
          .filter((v): v is number => v !== undefined);
        return vals.length ? mean(vals) : undefined;
      })
      .filter((v): v is number => v !== undefined);
    const avg = mean(respondentMeans);
    const sd = stdDev(respondentMeans, avg);
    const [ciLo, ciHi] = confidenceInterval(avg, sd, respondentMeans.length);
    return {
      sectionId: section.id,
      sectionName: section.name,
      swotAxis: section.swot_axis || 'internal',
      n: respondentMeans.length,
      mean: avg,
      stdDev: sd,
      ciLower: ciLo,
      ciUpper: ciHi,
      negativeRatio: negativeRatio(responses, section),
      band: bandLabel(avg),
      confidenceLevel: confidenceLevel(respondentMeans.length),
      itemStats: perItemScores.map((s, i) => ({
        text: section.items[i].text,
        mean: s.mean,
        n: s.n,
        reverse: section.items[i].reverse ?? false,
      })),
    };
  });

  const overallMean = mean(dimensions.map(d => d.mean));
  const avgAlpha = mean(survey.sections.map(sec => computeCronbachAlpha(responses, sec)));

  const swot: SwotEntry[] = [];
  const strengthRule = swotRules.rules.strength;
  const weaknessRule = swotRules.rules.weakness;
  const oppRule = swotRules.rules.opportunity;
  const threatRule = swotRules.rules.threat;

  for (const d of dimensions) {
    const isExternal = d.swotAxis === 'external';
    if (d.mean >= strengthRule.mean_threshold && d.ciLower >= strengthRule.ci_lower_threshold) {
      swot.push({
        dimension: d.sectionName, sectionId: d.sectionId,
        swotType: 'strength', mean: d.mean, n: d.n,
        evidence: `${d.sectionName}: متوسط ${d.mean.toFixed(2)} (n=${d.n})، حد ثقة سفلي ${d.ciLower.toFixed(2)}`,
        confidenceLevel: d.confidenceLevel, factType: 'حقيقة',
      });
    }
    if (d.mean < weaknessRule.mean_threshold || d.negativeRatio >= weaknessRule.negative_ratio_threshold) {
      swot.push({
        dimension: d.sectionName, sectionId: d.sectionId,
        swotType: 'weakness', mean: d.mean, n: d.n,
        evidence: `${d.sectionName}: متوسط ${d.mean.toFixed(2)} (n=${d.n})، نسبة سلبية ${(d.negativeRatio * 100).toFixed(0)}%`,
        confidenceLevel: d.confidenceLevel, factType: 'حقيقة',
      });
    }
    if (isExternal && d.mean >= oppRule.mean_threshold) {
      swot.push({
        dimension: d.sectionName, sectionId: d.sectionId,
        swotType: 'opportunity', mean: d.mean, n: d.n,
        evidence: `${d.sectionName} (خارجي): متوسط ${d.mean.toFixed(2)} (n=${d.n}) — أثر إيجابي يمكن البناء عليه`,
        confidenceLevel: d.confidenceLevel, factType: 'استنتاج',
      });
    }
    if (isExternal && d.mean < threatRule.mean_threshold) {
      swot.push({
        dimension: d.sectionName, sectionId: d.sectionId,
        swotType: 'threat', mean: d.mean, n: d.n,
        evidence: `${d.sectionName} (خارجي): متوسط ${d.mean.toFixed(2)} (n=${d.n}) — اتجاه سلبي`,
        confidenceLevel: d.confidenceLevel, factType: 'استنتاج',
      });
    }
  }

  const challenges: ChallengeEntry[] = [];
  if (importanceScores) {
    for (const d of dimensions) {
      const imp = importanceScores[d.sectionId];
      if (imp === undefined) continue;
      const perf = d.mean / SCALE_MAX;
      if (imp >= 4 && perf < 0.6) {
        challenges.push({
          dimension: d.sectionName, sectionId: d.sectionId,
          importance: imp, performance: perf,
          gap: imp / 5 - perf,
          reason: `أهمية مرتفعة (${imp}/5) مع أداء منخفض (${(perf * 100).toFixed(0)}%) — ربع التحدي`,
        });
      }
    }
  }

  const recommendations: Recommendation[] = [];
  const resourceMap = new Map(resources.map(r => [r.slug, r]));
  const findResource = (slug: string) => resourceMap.get(slug) || resourceMap.get(slug.replace(/_/g, '-')) || null;
  for (const d of dimensions) {
    const section = survey.sections.find(s => s.id === d.sectionId);
    if (!section?.if_low || section.if_low.length === 0) continue;
    if (d.mean >= 3.0 && d.negativeRatio < 0.3) continue;

    for (const ifLowText of section.if_low) {
      const resource = survey.resources.map(findResource).find(Boolean) || null;
      const programId = survey.programs[0] || null;
      const programName = programId;

      const severity = Math.max(0, (3.0 - d.mean) / 3.0);
      const affectedRatio = d.negativeRatio;
      const indicatorGaps = survey.indicators.map(code => {
        const stat = readinessStats.find(s => s.code === code);
        return stat ? 1 / (stat.count + 1) : 1;
      });
      const avgIndicatorGap = indicatorGaps.length > 0 ? mean(indicatorGaps) : 0.5;
      const w = swotRules.priority.weights;
      const priorityScore = w.severity * severity + w.affected_ratio * affectedRatio + w.indicator_coverage_gap * avgIndicatorGap;
      const priorityBand = swotRules.priority.bands.find(b => priorityScore <= b.max) || swotRules.priority.bands[swotRules.priority.bands.length - 1];

      recommendations.push({
        sectionId: d.sectionId,
        dimension: d.sectionName,
        ifLowText,
        programId,
        programName: programName || null,
        resourceSlug: resource?.slug || null,
        resourceTitle: resource?.title || null,
        resourceUrl: resource?.drive_url || null,
        resourceQrUrl: resource ? `${window.location.origin}${window.location.pathname}?s=${resource.slug}` : null,
        responsibility: suggestResponsibility(ifLowText),
        timeframe: suggestTimeframe(priorityBand.label),
        successMetric: `رفع متوسط بُعد «${d.sectionName}» بمقدار 0.4 في الاستبيان البعدي`,
        priority: priorityBand.label,
        priorityScore,
      });
    }
  }

  const topicClusters = clusterTopics(responses, survey);

  return {
    survey, totalResponses, sufficientData,
    dimensions, overallMean, cronbachAlpha: avgAlpha,
    swot, challenges, recommendations, topicClusters,
    warning: swotRules.report_warning,
  };
}

function suggestResponsibility(text: string): string {
  if (text.includes('معلم') || text.includes('تنسيق مع المعلم')) return 'المعلم + الموجه الطلابي';
  if (text.includes('أسرة') || text.includes('ولي')) return 'الموجه الطلابي + الأسرة';
  if (text.includes('برنامج') || text.includes('ورش')) return 'الموجه الطلابي';
  if (text.includes('متابعة') || text.includes('سجل')) return 'الموجه الطلابي + وكيل شؤون الطلاب';
  return 'الموجه الطلابي';
}

function suggestTimeframe(priority: string): string {
  if (priority === 'مرتفعة') return 'خلال أسبوعين';
  if (priority === 'متوسطة') return 'خلال شهر';
  return 'خلال الفصل الحالي';
}

const STOPWORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'أن', 'ما', 'لا', 'هو', 'هي', 'كما',
  'هذا', 'هذه', 'الذي', 'التي', 'وقد', 'كان', 'كنت', 'لكن', 'أو', 'و', 'ثم',
  'قد', 'كل', 'بعض', 'عند', 'بين', 'حتى', 'إن', 'أنا', 'نحن', 'هم', 'هؤلاء',
  'إذا', 'لكي', 'كي', 'لأن', 'حيث', 'سوف', 'سيتم', 'تم', 'يتم', 'ال', 'وأن',
]);

function clusterTopics(responses: SurveyResponseRecord[], survey: SurveyDefinition): TopicCluster[] {
  const textQuestions = survey.extra.filter(e => e.type === 'text');
  if (textQuestions.length === 0) return [];
  const allTexts: string[] = [];
  for (const r of responses) {
    for (const tq of textQuestions) {
      const val = r.text_answers?.[tq.id];
      if (val && val.trim().length > 3) allTexts.push(val.trim());
    }
  }
  if (allTexts.length === 0) return [];

  const wordFreq: Record<string, { count: number; texts: string[] }> = {};
  for (const text of allTexts) {
    const words = text.split(/[\s,،.؛!؟\n]+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
    for (const word of words) {
      if (!wordFreq[word]) wordFreq[word] = { count: 0, texts: [] };
      wordFreq[word].count++;
      if (wordFreq[word].texts.length < 3) wordFreq[word].texts.push(text);
    }
  }

  return Object.entries(wordFreq)
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([word, v]) => ({
      topic: word,
      count: v.count,
      examples: v.texts.slice(0, 2).map(t => t.length > 60 ? t.slice(0, 60) + '…' : t),
    }));
}

export function generateDemoResponses(survey: SurveyDefinition, count: number): SurveyResponseRecord[] {
  const results: SurveyResponseRecord[] = [];
  const grades = survey.demographics.find(d => d.id === 'grade')?.options || ['الأول الثانوي'];
  for (let i = 0; i < count; i++) {
    const answers: Record<string, number> = {};
    const textAnswers: Record<string, string> = {};
    const demographics: Record<string, string> = { grade: grades[i % grades.length] };
    survey.sections.forEach(sec => {
      sec.items.forEach((item, idx) => {
        const key = `${sec.id}-${idx}`;
        let base = 3 + Math.random() * 1.5;
        if (sec.id === 'efficacy') base = 2 + Math.random() * 1.5;
        if (sec.id === 'value') base = 2.5 + Math.random() * 1.5;
        if (sec.id === 'persistence') base = 2.2 + Math.random() * 1.8;
        const raw = Math.max(1, Math.min(5, Math.round(base)));
        answers[key] = raw;
      });
    });
    const textQs = survey.extra.filter(e => e.type === 'text');
    textQs.forEach((tq, idx) => {
      const samples = ['أحب المعلم الذي يشرح بأمثلة من الحياة', 'أحتاج لخطة واضحة للمذاكرة', 'أريد معرفة كيف أرتب وقتي', 'الدروس صعبة أحيانًا'];
      textAnswers[tq.id] = samples[(i + idx) % samples.length];
    });
    results.push({
      id: `demo-${i}`, survey_id: survey.id,
      demographics, answers, text_answers: textAnswers,
      submitted_at: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }
  return results;
}
