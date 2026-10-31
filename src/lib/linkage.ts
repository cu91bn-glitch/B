// الربط التلقائي لكل ما يُرفع في المنصة: البرنامج ← مؤشرات الاعتماد ← معايير الأداء الوظيفي
import { PROGRAM_NAMES, indicatorsForPrograms } from './autoIndicators';

/** برامج زاد المقابلة للبرامج الجاهزة القديمة (program-1 … program-12) */
export const TEMPLATE_ZAD = ['safe_net', 'career', 'absence_lag', 'positive', 'conduct', 'absence_lag', 'career', 'motivation', 'psychosocial', 'excellence', 'prevention', 'orientation'];

/** ملفات الموجّه وربطها ببرامج زاد */
export const FILE_MODULE_PROGRAM: Record<string, string[]> = {
  'career-motivation': ['motivation'], 'career-preparation': ['orientation'], 'career-international': ['motivation'],
  'career-sports-uniform': ['conduct'], 'career-crisis': ['crisis'], 'career-family-relation': ['family'], 'career-problems': ['psychosocial'],
  'selfeval-student-rights': ['conduct', 'special'], 'selfeval-volunteer': ['psychosocial', 'council'], 'selfeval-behavior-compliance': ['conduct'],
  'selfeval-incentives': ['honor'], 'selfeval-activities': ['orientation'], 'selfeval-positive-behavior': ['positive'],
  'community-parent-visits': ['family'], 'community-top-students': ['excellence'], 'community-absentees': ['absence_lag'],
};

/** معايير الأداء الوظيفي (1-13) المرتبطة بكل برنامج */
export const PROGRAM_CRITERIA: Record<string, number[]> = {
  family: [3], conduct: [4, 13], absence_lag: [4, 12], motivation: [5], orientation: [6], special: [7],
  psychosocial: [9], prevention: [9], crisis: [9], rifq: [8, 9], positive: [8], days: [8], council: [8],
  safe_net: [8], career: [10], excellence: [11], honor: [11],
};

const MODULE_CRITERIA_EXTRA: Record<string, number[]> = {
  'doc-cv': [1], 'doc-certificates': [2], 'selfeval-activities': [1, 6], 'cases': [7, 9], 'survey-analysis': [6],
};

export function programsForModule(module: string): string[] {
  if (!module) return [];
  if (PROGRAM_NAMES[module]) return [module];
  if (FILE_MODULE_PROGRAM[module]) return FILE_MODULE_PROGRAM[module];
  const old = module.match(/^program-(\d+)$/);
  if (old) return TEMPLATE_ZAD[Number(old[1]) - 1] ? [TEMPLATE_ZAD[Number(old[1]) - 1]] : [];
  const crit = module.match(/^criterion-(\d+)$/);
  if (crit) return programsForCriterion(Number(crit[1]));
  return [];
}

export function programsForCriterion(id: number): string[] {
  return Object.entries(PROGRAM_CRITERIA).filter(([, list]) => list.includes(id)).map(([p]) => p);
}

export function criteriaForModule(module: string): number[] {
  const crit = module.match(/^criterion-(\d+)$/);
  if (crit) return [Number(crit[1])];
  const set = new Set<number>(MODULE_CRITERIA_EXTRA[module] || []);
  for (const p of programsForModule(module)) for (const c of PROGRAM_CRITERIA[p] || []) set.add(c);
  return Array.from(set).sort((a, b) => a - b);
}

export function indicatorsForModule(module: string): string[] {
  return indicatorsForPrograms(programsForModule(module));
}
