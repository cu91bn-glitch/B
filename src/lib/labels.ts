// تسميات عربية للرموز المخزنة في قاعدة البيانات
export const PROGRAM_LABELS: Record<string, string> = {
  "orientation": "التهيئة الإرشادية",
  "conduct": "قواعد السلوك والمواظبة",
  "positive": "تعزيز السلوك الإيجابي",
  "rifq": "رفق (خفض العنف)",
  "career": "التوجيه المهني",
  "psychosocial": "تعزيز المهارات النفسية والاجتماعية",
  "family": "إطار توثيق العلاقة بين الأسرة والمدرسة",
  "special": "رعاية ودعم الفئات الخاصة",
  "absence_lag": "رعاية متكرري الغياب والمتأخرين دراسيا",
  "council": "المجلس الطلابي",
  "honor": "إطار الاحتفاء والتكريم",
  "prevention": "الوقاية النفسية في البيئة التعليمية",
  "safe_net": "الاستخدام الآمن للإنترنت والألعاب الإلكترونية",
  "motivation": "تنمية الدافعية لرفع مستوى التحصيل",
  "crisis": "التوجيه وقت الأزمات",
  "days": "تفعيل الأيام والمناسبات العالمية والمحلية",
  "excellence": "تكريم الطلبة المتفوقين"
};

export const AUDIENCE_LABELS: Record<string, string> = {
  student: 'الطلاب',
  students: 'الطلاب',
  parent: 'أولياء الأمور',
  parents: 'أولياء الأمور',
  teacher: 'المعلمون',
  teachers: 'المعلمون',
  staff: 'منسوبو المدرسة',
  leader: 'قائد المدرسة',
};

export function programLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return PROGRAM_LABELS[code] || code;
}

export function audienceLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return AUDIENCE_LABELS[code] || code;
}
