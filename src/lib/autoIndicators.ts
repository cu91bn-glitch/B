// تحديد مؤشرات الاعتماد تلقائيًا من البرنامج أو نوع العمل، بدل اختيارها يدويًا.
// المصدر: زاد الموجه الطلابي 1448هـ (ربط البرامج بالمؤشرات)

export const PROGRAM_NAMES: Record<string, string> = {
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

export const PROGRAM_INDICATORS: Record<string, string[]> = {
  "orientation": [
    "1-2-1-1",
    "1-2-1-3",
    "1-3-1-1",
    "1-5-1-2",
    "3-2-1-1"
  ],
  "conduct": [
    "1-2-1-1",
    "1-2-1-3",
    "1-5-1-1",
    "3-2-1-5",
    "3-2-1-7"
  ],
  "positive": [
    "1-2-1-1",
    "1-2-1-3",
    "1-2-1-4",
    "1-3-1-1",
    "3-2-1-1",
    "3-2-1-2",
    "3-2-1-5",
    "3-2-1-7"
  ],
  "rifq": [
    "1-2-1-3",
    "1-3-1-1",
    "1-5-1-2",
    "3-2-1-7"
  ],
  "career": [
    "1-3-1-2",
    "2-1-1-9"
  ],
  "psychosocial": [
    "1-2-1-4",
    "1-3-1-1",
    "1-5-1-1",
    "2-1-1-8",
    "3-2-1-2"
  ],
  "family": [
    "1-2-1-1",
    "1-2-1-3",
    "1-3-1-1",
    "1-3-1-2",
    "1-5-1-1",
    "3-2-1-5"
  ],
  "special": [
    "1-2-1-3",
    "1-2-1-4",
    "1-3-1-1",
    "1-5-1-1",
    "3-2-1-2"
  ],
  "absence_lag": [
    "1-2-1-1",
    "1-2-1-3",
    "2-1-1-9",
    "3-2-1-5"
  ],
  "council": [
    "1-2-1-4",
    "1-5-1-2",
    "2-1-1-8",
    "3-2-1-1",
    "3-2-1-2",
    "3-2-1-7"
  ],
  "honor": [
    "1-2-1-4",
    "1-3-1-2"
  ],
  "prevention": [
    "1-3-1-1",
    "1-5-1-2",
    "2-1-1-8"
  ],
  "safe_net": [
    "3-2-1-1",
    "3-2-1-7"
  ],
  "motivation": [
    "2-1-1-9",
    "3-2-1-2"
  ],
  "crisis": [
    "1-2-1-3",
    "1-5-1-2",
    "2-1-1-8"
  ],
  "days": [
    "1-2-1-1",
    "1-2-1-4",
    "3-2-1-1",
    "3-2-1-2",
    "3-2-1-7"
  ],
  "excellence": [
    "2-1-1-9"
  ]
};

export const INDICATOR_TEXT: Record<string, string> = {
  "1-2-1-1": "تعزز المدرسة القيم الإسلامية والهوية الوطنية",
  "1-2-1-3": "تطبق المدرسة إجراءات محددة لدعم الانضباط المدرسي وتتابع الالتزام بها",
  "1-2-1-4": "تنفذ المدرسة برامج وأنشطة تربوية داعمة للسلوك الإيجابي لدى المتعلمين ومنهم ذوو الإعاقة والموهوبون وتتابعها",
  "1-3-1-1": "تعزز المدرسة بناء العلاقات الإيجابية والتعاون في المجتمع المدرسي",
  "1-3-1-2": "تعزز المدرسة مشاركة الأسرة في تعلم أبنائهم والتحضير لمستقبلهم",
  "1-5-1-1": "تلتزم المدرسة بالمحافظة على حقوق المتعلمين وحمايتهم",
  "1-5-1-2": "توفر المدرسة مناخا آمنا للتعلم والنمو نفسيا واجتماعيا",
  "2-1-1-8": "تنمي المدرسة المهارات العاطفية والاجتماعية لدى المتعلمين",
  "2-1-1-9": "تعزز المدرسة دافعية المتعلمين للتعلم والاستمتاع به",
  "3-2-1-1": "يظهر المتعلمون الاعتزاز بالقيم والهوية الوطنية",
  "3-2-1-2": "يظهر المتعلمون اتجاهات إيجابية نحو ذواتهم",
  "3-2-1-5": "يلتزم المتعلمون بقواعد السلوك والانضباط المدرسي",
  "3-2-1-7": "يظهر المتعلمون اعتزازا بثقافتهم واحترامًا للتنوع الثقافي في المجتمع"
};

export function indicatorsForPrograms(programIds: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const id of programIds) if (id) for (const code of PROGRAM_INDICATORS[id] || []) set.add(code);
  return Array.from(set).sort();
}

/** البرامج المرتبطة بكل نوع عمل في المنصة */
export const CONTEXT_PROGRAMS = {
  case: {
    psychological: ['psychosocial', 'prevention'],
    social: ['family', 'psychosocial'],
    academic: ['absence_lag', 'motivation'],
    behavioral: ['conduct', 'positive', 'rifq'],
  },
  discipline: {
    late: ['absence_lag', 'conduct'],
    absence: ['absence_lag', 'conduct'],
    behavior: ['conduct', 'positive'],
    academic: ['absence_lag', 'motivation'],
    other: ['conduct'],
  },
  attendance: ['absence_lag', 'conduct'],
  talent: ['excellence', 'honor'],
  parentCouncil: ['family'],
  satisfaction: {
    program: ['orientation', 'positive'],
    service: ['orientation', 'psychosocial'],
    parent: ['family'],
    student: ['council', 'psychosocial'],
  },
  consultation: ['psychosocial', 'prevention'],
  career: ['career'],
} as const;

export function indicatorsForContext<K extends keyof typeof CONTEXT_PROGRAMS>(kind: K, sub?: string): string[] {
  const entry = CONTEXT_PROGRAMS[kind] as unknown;
  if (Array.isArray(entry)) return indicatorsForPrograms(entry as string[]);
  const map = entry as Record<string, readonly string[]>;
  return indicatorsForPrograms((sub && map[sub]) ? [...map[sub]] : []);
}
