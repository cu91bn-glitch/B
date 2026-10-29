// مؤشرات الاعتماد المدرسي (إيدياد) - ملف إعداد لربط الشواهد
// كل مؤشر يربط بالشواهد المخزنة في guidance_evidence.indicator_codes

export interface AccreditationDomain {
  id: string;
  code: number;
  title: string;
  color: string;
  indicators: AccreditationIndicator[];
}

export interface AccreditationIndicator {
  code: string;
  title: string;
  domain: string;
  description: string;
  requiredEvidence: number;
}

export const accreditationDomains: AccreditationDomain[] = [
  {
    id: 'student',
    code: 1,
    title: 'المتعلم والمتعلمة',
    color: 'emerald',
    indicators: [
      { code: '1-1-1-1', domain: 'student', title: 'التحصيل الدراسي', description: 'مستوى التحصيل الأكاديمي للطلاب في المواد الدراسية', requiredEvidence: 3 },
      { code: '1-1-3-2', domain: 'student', title: 'تعزيز القيم والسلوكيات الإيجابية', description: 'غرس القيم الإسلامية وتعزيز السلوكيات الإيجابية', requiredEvidence: 3 },
      { code: '1-2-1-3', domain: 'student', title: 'الانضباط والمواظبة', description: 'متابعة الانضباط الصباحي والغياب والتأخر', requiredEvidence: 3 },
      { code: '1-2-1-4', domain: 'student', title: 'الوقاية من التنمر والعنف', description: 'برامج الوقاية من التنمر الإلكتروني والعنف المدرسي', requiredEvidence: 2 },
      { code: '1-3-1-2', domain: 'student', title: 'الدافعية الدراسية', description: 'رفع مستوى الدافعية للتعلم وتعزيز الانضباط', requiredEvidence: 3 },
      { code: '1-4-1-5', domain: 'student', title: 'قواعد السلوك والمواظبة', description: 'تعريف الطلاب بلائحة قواعد السلوك وتعزيز الالتزام', requiredEvidence: 2 },
    ],
  },
  {
    id: 'career',
    code: 2,
    title: 'التوجيه المهني والنمائي',
    color: 'amber',
    indicators: [
      { code: '2-1-1-1', domain: 'career', title: 'الإرشاد الأكاديمي', description: 'إرشاد الطلاب نحو المسارات الأكاديمية المناسبة', requiredEvidence: 2 },
      { code: '2-2-1-3', domain: 'career', title: 'تعزيز التفوق والتميز', description: 'برامج تعزيز ثقافة التميز والتفوق الدراسي', requiredEvidence: 3 },
      { code: '2-3-1-1', domain: 'career', title: 'التوجيه المهني', description: 'مساعدة الطلاب على اكتشاف الميول وربطها بالتخصصات', requiredEvidence: 3 },
      { code: '2-3-2-1', domain: 'career', title: 'التخطيط المهني المبكر', description: 'التخطيط المهني لطلاب الصف الأول ثانوي', requiredEvidence: 2 },
    ],
  },
  {
    id: 'remedial',
    code: 3,
    title: 'التدخل العلاجي والرعاية الخاصة',
    color: 'sky',
    indicators: [
      { code: '3-1-1-1', domain: 'remedial', title: 'التدخلات النفسية والاجتماعية', description: 'تقديم الدعم النفسي والاجتماعي للطلاب المحتاجين', requiredEvidence: 3 },
      { code: '3-1-1-2', domain: 'remedial', title: 'المتابعة الفردية للحالات', description: 'متابعة الحالات الفردية وخطط التدخل', requiredEvidence: 2 },
      { code: '3-1-2-3', domain: 'remedial', title: 'الصعوبات التعليمية', description: 'تشخيص وعلاج الصعوبات التعليمية والتأخر الدراسي', requiredEvidence: 3 },
      { code: '3-2-1-4', domain: 'remedial', title: 'معالجة التأخر الدراسي', description: 'برامج علاجية مكثفة للطلاب المتأخرين دراسياً', requiredEvidence: 3 },
    ],
  },
  {
    id: 'partnership',
    code: 4,
    title: 'الشراكة المجتمعية والأسرية',
    color: 'violet',
    indicators: [
      { code: '4-1-1-1', domain: 'partnership', title: 'مشاركة الأسرة', description: 'تفعيل دور الأسرة في العملية التعليمية والتربوية', requiredEvidence: 3 },
      { code: '4-1-1-2', domain: 'partnership', title: 'مجالس الآباء', description: 'تنظيم مجالس الآباء واللقاءات الأسرية', requiredEvidence: 2 },
      { code: '4-2-1-1', domain: 'partnership', title: 'الشراكة المجتمعية', description: 'الشراكة مع المؤسسات المجتمعية والتطوع', requiredEvidence: 2 },
    ],
  },
  {
    id: 'planning',
    code: 5,
    title: 'التخطيط والتقويم',
    color: 'rose',
    indicators: [
      { code: '5-1-1-1', domain: 'planning', title: 'الخطة الإرشادية السنوية', description: 'إعداد وتنفيذ الخطة الإرشادية الشاملة', requiredEvidence: 2 },
      { code: '5-2-1-1', domain: 'planning', title: 'التقويم الذاتي', description: 'التقويم الذاتي للأداء وتقارير الإنجاز', requiredEvidence: 2 },
      { code: '5-3-1-1', domain: 'planning', title: 'قياس الأثر', description: 'قياس أثر البرامج الإرشادية وآثارها على الطلاب', requiredEvidence: 3 },
    ],
  },
];

export const allIndicators: AccreditationIndicator[] = accreditationDomains.flatMap(d => d.indicators);

export function findIndicator(code: string): AccreditationIndicator | undefined {
  return allIndicators.find(i => i.code === code);
}

export const indicatorColorMap: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', bar: 'bg-sky-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: 'bg-violet-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-500' },
};
