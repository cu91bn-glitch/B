// منصة الموجه الطلابي - بيانات شاملة للعام الدراسي 1448هـ

export interface Program {
  id: number;
  title: string;
  category: 'preventive' | 'developmental' | 'remedial';
  categoryLabel: string;
  targetGroup: string;
  date: string;
  status: 'completed' | 'in-progress';
  statusLabel: string;
  etecIndicator: string;
  description: string;
  objectives: string[];
  activities: string[];
  outcomes: string[];
  beneficiaries: number;
}

export interface PerformanceCriterion {
  id: number;
  title: string;
  weight: number;
  score: number;
  evidenceCount: number;
  description: string;
  indicators: string[];
}

export interface StudentCouncilMeeting {
  id: number;
  date: string;
  topic: string;
  attendees: number;
  recommendations: string;
  status: 'implemented' | 'in-progress' | 'planned';
  statusLabel: string;
}

export interface ParentMeeting {
  id: number;
  date: string;
  topic: string;
  attendees: number;
  summary: string;
  status: 'completed' | 'scheduled';
  statusLabel: string;
}

export interface HonorStudent {
  id: number;
  name: string;
  grade: string;
  achievement: string;
  category: 'academic' | 'behavioral' | 'both';
  avatarColor: string;
}

export interface CareerQuestion {
  id: number;
  question: string;
  options: { text: string; scores: { scientific: number; literary: number; technical: number } }[];
}

export const counselor = {
  name: 'أ. صالح بن علي البراك',
  id: '1042387',
  school: 'مدرسة الإمام سعود الكبير الثانوية بالظهران',
  ministry: 'وزارة التعليم',
  region: 'الإدارة العامة للتعليم بالمنطقة الشرقية',
  year: '1448هـ - 2026/2027م',
  semester: 'العام الدراسي',
  email: 'cu91bn@gmail.com',
  phone: '0555809885',
  experience: '12 عاماً',
  students: 780,
};

export const kpis = [
  {
    id: 1,
    label: 'إجمالي البرامج المنفذة',
    value: 24,
    unit: 'برنامج',
    icon: 'ClipboardCheck',
    gradient: 'from-emerald-600 to-teal-700',
    trend: '+3 عن العام الدراسي الماضي',
    trendUp: true,
    progress: 85,
  },
  {
    id: 2,
    label: 'الحالات النفسية والاجتماعية المتابعة',
    value: 18,
    unit: 'حالة',
    icon: 'HeartPulse',
    gradient: 'from-amber-500 to-orange-600',
    trend: '+5 حالات جديدة',
    trendUp: true,
    progress: 72,
  },
  {
    id: 3,
    label: 'اللقاءات والشراكات الأسرية',
    value: 12,
    unit: 'لقاء',
    icon: 'Users',
    gradient: 'from-sky-600 to-blue-700',
    trend: '+2 لقاء هذا الشهر',
    trendUp: true,
    progress: 90,
  },
  {
    id: 4,
    label: 'نسبة الانضباط والسلوك الإيجابي',
    value: 96.5,
    unit: '%',
    icon: 'TrendingUp',
    gradient: 'from-emerald-600 to-green-700',
    trend: '+1.2% عن المستهدف',
    trendUp: true,
    progress: 97,
  },
];

export const programs: Program[] = [
  {
    id: 1,
    title: 'البرنامج الوقائي للتنمر الإلكتروني',
    category: 'preventive',
    categoryLabel: 'المسار الوقائي',
    targetGroup: 'طلاب المرحلة الثانوية',
    date: '15 صفر 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 1-2-1-4',
    description: 'برنامج توعوي شامل يستهدف الوقاية من ظاهرة التنمر الإلكتروني عبر ورش تفاعلية ومحاضرات توعوية ونشاطات جماعية تعزز السلوك الإيجابي.',
    objectives: [
      'تعريف الطلاب بمفهوم التنمر الإلكتروني وأشكاله',
      'تنمية مهارات التعامل مع المواقف التنمرية',
      'بناء بيئة مدرسية آمنة خالية من العنف',
      'تعزيز قيم التسامح والاحترام المتبادل',
    ],
    activities: [
      'ورشة عمل تفاعلية بعنوان "أنا لست متنمراً"',
      'محاضرة توعوية بالتعاون مع الأمن السيبراني',
      'مسابقة أفضل ملصق إلكتروني للوقاية من التنمر',
      'حلقة نقاش طلابية حول آثار التنمر النفسية',
    ],
    outcomes: [
      'انخفاض بلاغات التنمر بنسبة 80% خلال شهرين',
      'مشاركة 340 طالباً في الأنشطة',
      'إنتاج 45 ملصقاً إبداعياً للوقاية',
      'تكوين لجنة طلابية للسلام المدرسي',
    ],
    beneficiaries: 340,
  },
  {
    id: 2,
    title: 'البرنامج النمائي للتوجيه المهني',
    category: 'developmental',
    categoryLabel: 'المسار النمائي والمهني',
    targetGroup: 'طلاب الصف الثالث ثانوي',
    date: '8 ربيع الأول 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 2-3-1-1',
    description: 'برنامج إرشادي مهني يهدف إلى مساعدة طلاب الثانوية على اكتشاف ميولهم وقدراتهم وربطها بالتخصصات الجامعية والمسارات المهنية المناسبة.',
    objectives: [
      'مساعدة الطلاب على اكتشاف الميول المهنية',
      'تعريف الطلاب بمسارات الجامعات والكليات',
      'تنمية مهارات اتخاذ القرار المهني',
      'ربط القدرات الذاتية بالتخصصات المتاحة',
    ],
    activities: [
      'تطبيق مقياس الميول المهني على 180 طالباً',
      'زيارة ميدانية لجامعة الملك سعود',
      'لقاء مع مدربين من معهد الإدارة العامة',
      'ورشة "كيف تكتب خطة مهنية شخصية"',
    ],
    outcomes: [
      'توجيه 180 طالباً نحو مسارات مناسبة',
      'ارتفاع نسبة الرضا عن التخصصات المختارة إلى 89%',
      'إعداد 180 خطة مهنية فردية',
      'خفض نسبة تغيير التخصص المتوقع إلى 12%',
    ],
    beneficiaries: 180,
  },
  {
    id: 3,
    title: 'البرنامج العلاجي للصعوبات التعليمية',
    category: 'remedial',
    categoryLabel: 'المسار العلاجي والرعاية الخاصة',
    targetGroup: 'طلاب يعانون من تأخر دراسي',
    date: '22 ربيع الآخر 1448هـ',
    status: 'in-progress',
    statusLabel: 'قيد التنفيذ',
    etecIndicator: 'مؤشر 3-1-2-3',
    description: 'برنامج علاجي متخصص يستهدف الطلاب الذين يعانون من صعوبات تعليمية وتأخر دراسي عبر خطط تدخل فردي ومتابعة مستمرة بالتعاون مع المعلمين وأولياء الأمور.',
    objectives: [
      'تشخيص الصعوبات التعليمية بدقة',
      'تصميم خطط تدخل فردي مخصصة',
      'متابعة تقدم الطلاب بشكل دوري',
      'تعزيز الثقة بالنفس والدافعية للتعلم',
    ],
    activities: [
      'تطبيق اختبارات تشخيصية لـ 45 طالباً',
      'تصميم 30 خطة تدخل فردي',
      'جلسات دعم فردي أسبوعية',
      'ورشة تدريبية للمعلمين حول التدخلات العلاجية',
    ],
    outcomes: [
      'تحسن نتائج 28 طالباً من أصل 45',
      'ارتفاع معدلات الإنجاز في الرياضيات بنسبة 35%',
      'خفض نسبة الغياب لدى المستهدفين بنسبة 40%',
      'تحسن مؤشرات الثقة بالنفس في استبيان ما بعد البرنامج',
    ],
    beneficiaries: 45,
  },
  {
    id: 4,
    title: 'برنامج تعزيز القيم والسلوكيات الإيجابية',
    category: 'preventive',
    categoryLabel: 'المسار الوقائي',
    targetGroup: 'جميع طلاب المرحلة الثانوية',
    date: '5 جمادى الأولى 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 1-1-3-2',
    description: 'برنامج شامل لتعزيز القيم الإسلامية والسلوكيات الإيجابية لدى الطلاب من خلال أنشطة متنوعة تحفز على الأخلاق الحميدة والسلوك المسؤول.',
    objectives: [
      'غرس القيم الإسلامية الأصيلة في سلوك الطلاب',
      'تعزيز السلوكيات الإيجابية في البيئة المدرسية',
      'تنمية المسؤولية الاجتماعية',
      'خفض المخالفات السلوكية',
    ],
    activities: [
      'حملة "أخلاقنا قيمتنا" الإذاعية الصباحية',
      'مسابقة "الطالب المثالي أخلاقاً"',
      'ورشة عمل "فن التعامل مع الآخرين"',
      'مشروع خدمة المجتمع التطوعي',
    ],
    outcomes: [
      'انخفاض المخالفات السلوكية بنسبة 65%',
      'مشاركة 847 طالباً في الأنشطة',
      'تنفيذ 5 مشاريع تطوعية مجتمعية',
      'تكريم 60 طالباً للسلوك المتميز',
    ],
    beneficiaries: 847,
  },
  {
    id: 5,
    title: 'برنامج التوعية بقواعد السلوك والمواظبة',
    category: 'preventive',
    categoryLabel: 'المسار الوقائي',
    targetGroup: 'طلاب المرحلة الثانوية',
    date: '18 جمادى الثانية 1448هـ',
    status: 'in-progress',
    statusLabel: 'قيد التنفيذ',
    etecIndicator: 'مؤشر 1-4-1-5',
    description: 'برنامج توعوي يركز على تعريف الطلاب بلائحة قواعد السلوك والمواظبة المعدلة وتعزيز الالتزام بها عبر أنشطة تفاعلية وحوارات بناءة.',
    objectives: [
      'تعريف الطلاب بلائحة قواعد السلوك والمواظبة',
      'تعزيز الالتزام بالنظام المدرسي',
      'تنمية الوعي بحقوق وواجبات الطالب',
      'خفض معدلات التأخر والغياب',
    ],
    activities: [
      'ملتقى توعوي بعنوان "قواعدي وازني"',
      'إصدار دليل إلكتروني مبسط للائحة السلوك',
      'حلقات نقاش صفية حول المواطبة',
      'نظام نقاط إيجابية للمنضبطين',
    ],
    outcomes: [
      'ارتفاع نسبة المواظبة إلى 96.5%',
      'خفض التأخر الصباحي بنسبة 70%',
      'مشاركة 520 طالباً في الملتفى',
      'توزيع 847 نسخة من الدليل الإلكتروني',
    ],
    beneficiaries: 520,
  },
  {
    id: 6,
    title: 'برنامج معالجة التأخر الدراسي في الرياضيات',
    category: 'remedial',
    categoryLabel: 'المسار العلاجي والرعاية الخاصة',
    targetGroup: 'طلاب الصف الثاني الثانوي',
    date: '12 رجب 1448هـ',
    status: 'in-progress',
    statusLabel: 'قيد التنفيذ',
    etecIndicator: 'مؤشر 3-2-1-4',
    description: 'برنامج علاجي مكثف يستهدف الطلاب المتأخرين دراسياً في مادة الرياضيات عبر جلسات دعم إضافية وخطط تعلم فردية ومتابعة قريبة.',
    objectives: [
      'رفع المستوى التحصيلي في الرياضيات',
      'معالجة الفجوات في المهارات الأساسية',
      'تعزيز الثقة في القدرة على التعلم',
      'تدريب المعلمين على استراتيجيات التدخل',
    ],
    activities: [
      'جلسات دعم إضافية بعد الدوام (3 جلسات أسبوعياً)',
      'تطبيق اختبارات تشخيصية قبلية وبعدية',
      'استخدام منصات رقمية للتعلم الذاتي',
      'مجلس أسبوعي لمتابعة التقدم',
    ],
    outcomes: [
      'تحسن 22 طالباً من أصل 35 في الاختبار البعدي',
      'ارتفاع المتوسط من 45% إلى 68%',
      'مشاركة 35 طالباً في البرنامج',
      'رضا أولياء الأمور بنسبة 91%',
    ],
    beneficiaries: 35,
  },
  {
    id: 7,
    title: 'برنامج التخطيط المهني لطلاب الصف الأول ثانوي',
    category: 'developmental',
    categoryLabel: 'المسار النمائي والمهني',
    targetGroup: 'طلاب الصف الأول ثانوي',
    date: '3 شعبان 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 2-3-2-1',
    description: 'برنامج إرشادي مبكر يستهدف طلاب الصف الأول ثانوي لمساعدتهم على فهم المسارات الأكاديمية والتخطيط المبكر للمستقبل المهني.',
    objectives: [
      'تعريف الطلاب بمسارات الثانوية العامة',
      'مساعدة الطلاب على اختيار المسار المناسب',
      'ربط الميول بالمسارات المتاحة',
      'بناء خطة أكاديمية شخصية',
    ],
    activities: [
      'ورشة "مساري أكاديمي"',
      'تطبيق مقياس الميول المهني المبكر',
      'لقاء مع خريجين ملهمين',
      'إعداد خطة أكاديمية فردية لكل طالب',
    ],
    outcomes: [
      'إرشاد 210 طلاب نحو المسارات المناسبة',
      'إعداد 210 خطة أكاديمية فردية',
      'رضا الطلاب عن المسارات المختارة بنسبة 87%',
      'خفض نسبة الرغبة في تغيير المسار إلى 8%',
    ],
    beneficiaries: 210,
  },
  {
    id: 8,
    title: 'برنامج تعزيز الدافعية والانضباط',
    category: 'preventive',
    categoryLabel: 'المسار الوقائي',
    targetGroup: 'طلاب المرحلة الثانوية',
    date: '27 شعبان 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 1-3-1-2',
    description: 'برنامج تحفيزي يهدف إلى رفع مستوى الدافعية الدراسية والانضباط لدى الطلاب من خلال نظام مكافآت وأنشطة تحفيزية وحملات توعية.',
    objectives: [
      'رفع مستوى الدافعية للتعلم',
      'تعزيز الانضباط الصباحي',
      'بناء نظام حوافز إيجابي',
      'تكريم المتميزين بانضباطهم',
    ],
    activities: [
      'حملة "الانضباط أولاً" الصباحية',
      'نظام نقاط الالتزام الإلكتروني',
      'تكريم أسبوعي للمنضبطين',
      'ورشة "دافعيتي قوة نجاحي"',
    ],
    outcomes: [
      'ارتفاع نسبة الانضباط إلى 96.5%',
      'مشاركة 847 طالباً في نظام النقاط',
      'تكريم 120 طالباً متميزاً',
      'تحسن الدافعية في الاستبيان بنسبة 34%',
    ],
    beneficiaries: 847,
  },
  {
    id: 9,
    title: 'برنامج التدخلات النفسية والاجتماعية',
    category: 'remedial',
    categoryLabel: 'المسار العلاجي والرعاية الخاصة',
    targetGroup: 'طلاب يحتاجون دعم نفسي',
    date: '10 رمضان 1448هـ',
    status: 'in-progress',
    statusLabel: 'قيد التنفيذ',
    etecIndicator: 'مؤشر 3-1-1-1',
    description: 'برنامج علاجي متخصص يقدم الدعم النفسي والاجتماعي للطلاب الذين يعانون من ضغوط نفسية أو مشكلات اجتماعية عبر جلسات إرشادية فردية وجماعية.',
    objectives: [
      'تقديم الدعم النفسي للطلاب المحتاجين',
      'معالجة المشكلات الاجتماعية المبكرة',
      'بناء مهارات التكيف لدى الطلاب',
      'التحويل المبكر للحالات التي تحتاج مختص',
    ],
    activities: [
      'جلسات إرشادية فردية (18 حالة)',
      'جلسات جماعية للتكيف الاجتماعي',
      'ورشة "إدارة الضغوط النفسية"',
      'التحويل لـ 4 حالات لمختص خارجي',
    ],
    outcomes: [
      'متابعة 18 حالة نفسية واجتماعية',
      'تحسن 14 حالة من أصل 18',
      'إجراء 56 جلسة إرشادية',
      'تحويل 4 حالات لمختص خارجي',
    ],
    beneficiaries: 18,
  },
  {
    id: 10,
    title: 'برنامج تعزيز التفوق والتميز الدراسي',
    category: 'developmental',
    categoryLabel: 'المسار النمائي والمهني',
    targetGroup: 'الطلاب المتفوقون',
    date: '25 رمضان 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 2-2-1-3',
    description: 'برنامج نوعي يستهدف الطلاب المتفوقين لتعزيز تفوقهم وتطوير مهاراتهم الأكاديمية والقيادية وتوفير بيئة محفزة للتميز المستمر.',
    objectives: [
      'تعزيز ثقافة التميز والتفوق',
      'تطوير مهارات القيادة لدى المتفوقين',
      'توفير فرص إثراء أكاديمي',
      'تكريم وتحفيز المتفوقين',
    ],
    activities: [
      'نادي المتفوقين الأكاديمي',
      'ورشة "مهارات القيادة الطلابية"',
      'زيارة لمعرض العلوم والهندسة',
      'حفل تكريم المتفوقين الفصلي',
    ],
    outcomes: [
      'تكريم 95 طالباً متفوقاً',
      'تأسيس نادي المتفوقين بـ 60 عضواً',
      'إنتاج 12 مشروعاً علمياً إبداعياً',
      'ارتفاع معدلات التفوق بنسبة 18%',
    ],
    beneficiaries: 95,
  },
  {
    id: 11,
    title: 'برنامج تصنيف الحالات والدعم المبكر',
    category: 'remedial',
    categoryLabel: 'المسار العلاجي والرعاية الخاصة',
    targetGroup: 'جميع الطلاب',
    date: '7 شوال 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 3-1-1-2',
    description: 'برنامج منهجي لتصنيف الحالات الطلابية وتقديم الدعم المبكر للطلاب الذين يحتاجون تدخلاً إرشادياً أو علاجياً.',
    objectives: [
      'حصر وتصنيف الحالات الطلابية بدقة',
      'تقديم الدعم المبكر للحالات المستهدفة',
      'بناء قاعدة بيانات للحالات',
      'تنسيق التدخلات مع المعلمين والإدارة',
    ],
    activities: [
      'استبيان مسحي شامل لجميع الطلاب',
      'تصنيف الحالات إلى 4 فئات',
      'إعداد قاعدة بيانات إلكترونية',
      'جلسات تنسيق مع المعلمين',
    ],
    outcomes: [
      'تصنيف 847 حالة طلابية',
      'تحديد 62 حالة تحتاج متابعة',
      'تقديم دعم مبكر لـ 45 حالة',
      'بناء قاعدة بيانات محدثة',
    ],
    beneficiaries: 847,
  },
  {
    id: 12,
    title: 'برنامج خطة التوجيه الطلابي الشاملة',
    category: 'developmental',
    categoryLabel: 'المسار النمائي والمهني',
    targetGroup: 'الموجه الطلابي والفريق المدرسي',
    date: '1 محرم 1448هـ',
    status: 'completed',
    statusLabel: 'مكتمل',
    etecIndicator: 'مؤشر 2-1-1-1',
    description: 'الخطة الشاملة للتوجيه الطلابي للعام 1448هـ التي تحدد الأهداف والبرامج والمؤشرات والمسارات الإرشادية الثلاثة بشكل متكامل.',
    objectives: [
      'وضع خطة إرشادية شاملة للعام 1448هـ',
      'تحديد المؤشرات والأهداف بوضوح',
      'تنظيم المسارات الإرشادية الثلاثة',
      'متابعة التنفيذ والتقويم المستمر',
    ],
    activities: [
      'إعداد الخطة الإرشادية السنوية',
      'اعتماد الخطة من مدير المدرسة',
      'نشر الخطة على المنصة الإلكترونية',
      'جلسات متابعة شهرية للتنفيذ',
    ],
    outcomes: [
      'اعتماد الخطة الشاملة في وقتها',
      'تحقيق 85% من الأهداف المحددة',
      'تنفيذ 24 برنامجاً من الخطة',
      'متابعة شهرية منتظمة',
    ],
    beneficiaries: 847,
  },
];

export const performanceCriteria: PerformanceCriterion[] = [
  {
    id: 1,
    title: 'أداء الواجبات الوظيفية',
    weight: 10,
    score: 9.2,
    evidenceCount: 8,
    description: 'الالتزام بأداء الواجبات الوظيفية المناطة بالمرشد الطلابي والانتظام في الدوام وتنفيذ المهام الإدارية بدقة.',
    indicators: ['الحضور والانصراف', 'إنجاز التقارير الدورية', 'تنفيذ المهام الإدارية', 'حضور الاجتماعات'],
  },
  {
    id: 2,
    title: 'التفاعل مع المجتمع المهني',
    weight: 8,
    score: 8.5,
    evidenceCount: 6,
    description: 'المشاركة الفاعلة في المجتمع المهني للمرشدين الطلابيين والتفاعل مع الزملاء والمختصين.',
    indicators: ['المشاركة في اللقاءات المهنية', 'تبادل الخبرات مع الزملاء', 'المساهمة في البحوث التربوية', 'حضور الدورات التدريبية'],
  },
  {
    id: 3,
    title: 'التفاعل مع أولياء الأمور',
    weight: 8,
    score: 8.8,
    evidenceCount: 7,
    description: 'بناء شراكة فاعلة مع أولياء الأمور وتفعيل التواصل المستمر حول المسار التعليمي والسلوكي لأبنائهم.',
    indicators: ['تنظيم اللقاءات الأسرية', 'التواصل الدوري مع أولياء الأمور', 'تقديم الاستشارات الأسرية', 'تفعيل مجالس الآباء'],
  },
  {
    id: 4,
    title: 'تعزيز الانضباط',
    weight: 8,
    score: 9.5,
    evidenceCount: 9,
    description: 'بذل الجهد في تعزيز الانضباط الصففي والمدرسي لدى الطلاب وغرس قيمة الالتزام بالنظام.',
    indicators: ['متابعة الانضباط الصباحي', 'متابعة الغياب والتأخر', 'برامج تحفيز المنضبطين', 'خفض معدلات المخالفات'],
  },
  {
    id: 5,
    title: 'تعزيز الدافعية',
    weight: 8,
    score: 8.7,
    evidenceCount: 6,
    description: 'العمل على رفع مستوى الدافعية الدراسية لدى الطلاب وتنمية الرغبة في التعلم والإنجاز.',
    indicators: ['برامج تحفيزية متنوعة', 'نظام حوافز إيجابي', 'تكريم المتميزين', 'ورش تطوير الدافعية'],
  },
  {
    id: 6,
    title: 'خطة التوجيه الطلابي',
    weight: 10,
    score: 9.0,
    evidenceCount: 8,
    description: 'إعداد وتنفيذ خطة التوجيه الطلابي الشاملة وفق المسارات الإرشادية الثلاثة ومتابعة تنفيذها.',
    indicators: ['إعداد الخطة السنوية', 'تنفيذ البرامج المجدولة', 'متابعة التنفيذ دورياً', 'تقويم الأثر'],
  },
  {
    id: 7,
    title: 'تصنيف الحالات والدعم',
    weight: 8,
    score: 8.3,
    evidenceCount: 7,
    description: 'حصر وتصنيف الحالات الطلابية وتقديم الدعم المناسب لكل فئة وفق احتياجاتها.',
    indicators: ['حصر شامل للحالات', 'تصنيف الحالات إلى فئات', 'خطط دعم فردية', 'متابعة دورية للحالات'],
  },
  {
    id: 8,
    title: 'تعزيز القيم والسلوكيات',
    weight: 8,
    score: 9.1,
    evidenceCount: 8,
    description: 'تعزيز القيم الإسلامية والسلوكيات الإيجابية لدى الطلاب وغرس الأخلاق الحميدة.',
    indicators: ['برامج قيمية متنوعة', 'حملات توعية سلوكية', 'تكريم السلوك الإيجابي', 'خفض المخالفات السلوكية'],
  },
  {
    id: 9,
    title: 'التدخلات النفسية والاجتماعية',
    weight: 8,
    score: 8.6,
    evidenceCount: 7,
    description: 'تقديم التدخلات النفسية والاجتماعية المناسبة للطلاب المحتاجين ومتابعة حالاتهم.',
    indicators: ['جلسات إرشادية فردية', 'جلسات جماعية', 'ورش مهارات اجتماعية', 'التحويل للحالات المتخصصة'],
  },
  {
    id: 10,
    title: 'التخطيط المهني',
    weight: 8,
    score: 8.9,
    evidenceCount: 7,
    description: 'مساعدة الطلاب في التخطيط المهني واكتشاف الميول والقدرات وربطها بالمسارات الأكاديمية.',
    indicators: ['مقاييس الميول المهنية', 'ورش التخطيط المهني', 'زيارات للجامعات', 'خطط مهنية فردية'],
  },
  {
    id: 11,
    title: 'تعزيز التفوق',
    weight: 8,
    score: 9.3,
    evidenceCount: 8,
    description: 'تعزيز ثقافة التميز والتفوق الدراسي وتوفير بيئة محفزة للطلاب المتفوقين.',
    indicators: ['نادي المتفوقين', 'برامج إثراء أكاديمي', 'تكريم المتفوقين', 'مشاريع علمية إبداعية'],
  },
  {
    id: 12,
    title: 'معالجة التأخر الدراسي',
    weight: 10,
    score: 8.4,
    evidenceCount: 9,
    description: 'تصميم وتنفيذ برامج علاجية لمعالجة التأخر الدراسي ومتابعة تقدم الطلاب المتأخرين.',
    indicators: ['تشخيص الطلاب المتأخرين', 'خطط تدخل فردي', 'جلسات دعم إضافية', 'متابعة التقدم'],
  },
  {
    id: 13,
    title: 'التوعية بقواعد السلوك والمواظبة',
    weight: 8,
    score: 9.0,
    evidenceCount: 7,
    description: 'تعريف الطلاب بلائحة قواعد السلوك والمواظبة وتعزيز الالتزام بها.',
    indicators: ['ملتقيات توعوية', 'دليل إلكتروني للائحة', 'حلقات نقاش صفية', 'نظام نقاط إيجابية'],
  },
];

export const studentCouncilMeetings: StudentCouncilMeeting[] = [
  {
    id: 1,
    date: '12 صفر 1448هـ',
    topic: 'تطوير البيئة المدرسية والمقصف',
    attendees: 24,
    recommendations: 'تشكيل لجنة طلابية لتطوير المقصف المدرسي واقتراح تحسينات على المرافق',
    status: 'implemented',
    statusLabel: 'تم التنفيذ',
  },
  {
    id: 2,
    date: '5 ربيع الأول 1448هـ',
    topic: 'تفعيل الأنشطة اللاصفية',
    attendees: 28,
    recommendations: 'إقامة مسابقة رياضية بين الصفوف وتنظيم يوم مفتوح للأنشطة',
    status: 'implemented',
    statusLabel: 'تم التنفيذ',
  },
  {
    id: 3,
    date: '20 ربيع الآخر 1448هـ',
    topic: 'الوقاية من التنمر الإلكتروني',
    attendees: 32,
    recommendations: 'تكوين لجنة السلام المدرسي وإطلاق حملة توعوية ضد التنمر',
    status: 'in-progress',
    statusLabel: 'قيد التنفيذ',
  },
  {
    id: 4,
    date: '8 جمادى الأولى 1448هـ',
    topic: 'تطوير مهارات القيادة الطلابية',
    attendees: 26,
    recommendations: 'تنظيم ورشة عمل لتطوير مهارات القيادة وانتخاب ممثلي الفصول',
    status: 'in-progress',
    statusLabel: 'قيد التنفيذ',
  },
  {
    id: 5,
    date: '22 جمادى الثانية 1448هـ',
    topic: 'تحسين العلاقات بين الطلاب',
    attendees: 30,
    recommendations: 'إطلاق مبادرة "أخي وأخي" لتعزيز روح الأخوة والمودة بين الطلاب',
    status: 'planned',
    statusLabel: 'مخطط',
  },
  {
    id: 6,
    date: '15 رجب 1448هـ',
    topic: 'المشاركة في خدمة المجتمع',
    attendees: 27,
    recommendations: 'تنظيم زيارة لمركز ذوي الاحتياجات الخاصة وتنفيذ مشروع تطوعي',
    status: 'planned',
    statusLabel: 'مخطط',
  },
];

export const parentMeetings: ParentMeeting[] = [
  {
    id: 1,
    date: '18 صفر 1448هـ',
    topic: 'اللقاء التعريفي الأول للآباء',
    attendees: 340,
    summary: 'لقاء تعريفي بأهداف الخطة الإرشادية ومسارات التوجيه الطلابي وآليات التواصل مع المدرسة.',
    status: 'completed',
    statusLabel: 'منعقد',
  },
  {
    id: 2,
    date: '10 ربيع الأول 1448هـ',
    topic: 'ورشة أولياء أمور طلاب الصف الثالث ثانوي',
    attendees: 165,
    summary: 'ورشة حول التوجيه المهني ومسارات القبول الجامعي وكيفية دعم الأبناء في اختيار التخصص.',
    status: 'completed',
    statusLabel: 'منعقد',
  },
  {
    id: 3,
    date: '25 ربيع الآخر 1448هـ',
    topic: 'لقاء أولياء أمور الطلاب المتأخرين دراسياً',
    attendees: 42,
    summary: 'لقاء فردي مع أولياء أمور الطلاب المتأخرين لمناقشة خطة التدخل وآليات المتابعة المنزلية.',
    status: 'completed',
    statusLabel: 'منعقد',
  },
  {
    id: 4,
    date: '12 جمادى الأولى 1448هـ',
    topic: 'ملتقى الشراكة الأسرية المدرسية',
    attendees: 520,
    summary: 'ملتقى موسع لتعزيز الشراكة بين الأسرة والمدرسة وتفعيل دور مجالس الآباء في دعم العملية التعليمية.',
    status: 'completed',
    statusLabel: 'منعقد',
  },
  {
    id: 5,
    date: '5 شعبان 1448هـ',
    topic: 'لقاء أولياء أمور طلاب المرحلة الثانوية',
    attendees: 280,
    summary: 'لقاء حول مرحلة المراهقة وكيفية التعامل مع التغيرات السلوكية ودعم الاستقلالية المسؤولة.',
    status: 'scheduled',
    statusLabel: 'مجدول',
  },
  {
    id: 6,
    date: '20 شعبان 1448هـ',
    topic: 'ورشة أولياء أمور الطلاب المتميزين',
    attendees: 95,
    summary: 'ورشة حول كيفية دعم التفوق المستمر وتوفير بيئة منزلية محفزة للتميز الأكاديمي.',
    status: 'scheduled',
    statusLabel: 'مجدول',
  },
];

export const honorStudents: HonorStudent[] = [
  { id: 1, name: 'عبدالرحمن السالم', grade: 'الثالث ثانوي', achievement: 'المركز الأول في مسابقة الرياضيات على مستوى المنطقة', category: 'academic', avatarColor: 'from-emerald-500 to-teal-600' },
  { id: 2, name: 'فيصل العتيبي', grade: 'الثاني ثانوي', achievement: 'المركز الأول في مسابقة الإلقاء والخطابة', category: 'behavioral', avatarColor: 'from-amber-500 to-orange-600' },
  { id: 3, name: 'سعود الدوسري', grade: 'الثالث ثانوي', achievement: 'الطالب المثالي أخلاقاً للفصل الأول', category: 'both', avatarColor: 'from-sky-500 to-blue-600' },
  { id: 4, name: 'ماجد القحطاني', grade: 'الأول ثانوي', achievement: 'المركز الثاني في معرض العلوم والهندسة', category: 'academic', avatarColor: 'from-emerald-500 to-teal-600' },
  { id: 5, name: 'تركي الشمري', grade: 'الثاني ثانوي', achievement: 'أفضل قائد طلابي في مجلس الحوار', category: 'behavioral', avatarColor: 'from-amber-500 to-orange-600' },
  { id: 6, name: 'نواف الحربي', grade: 'الثالث ثانوي', achievement: 'المركز الأول في مسابقة الإبداع العلمي', category: 'academic', avatarColor: 'from-sky-500 to-blue-600' },
  { id: 7, name: 'بدر الحربي', grade: 'الأول ثانوي', achievement: 'أكثر الطلاب انضباطاً ومواظبة', category: 'behavioral', avatarColor: 'from-emerald-500 to-teal-600' },
  { id: 8, name: 'فهد الغامدي', grade: 'الثاني ثانوي', achievement: 'المركز الأول في مسابقة حفظ القرآن الكريم', category: 'both', avatarColor: 'from-amber-500 to-orange-600' },
];

export const careerQuestions: CareerQuestion[] = [
  {
    id: 1,
    question: 'أي المواد الدراسية تستمتع بدراستها أكثر من غيرها؟',
    options: [
      { text: 'الرياضيات والفيزياء والكيمياء', scores: { scientific: 3, literary: 0, technical: 1 } },
      { text: 'اللغة العربية والتاريخ والتربية الإسلامية', scores: { scientific: 0, literary: 3, technical: 0 } },
      { text: 'الحاسب الآلي والتصميم والبرمجة', scores: { scientific: 1, literary: 0, technical: 3 } },
      { text: 'أكثر من مادة من مسارات مختلفة', scores: { scientific: 1, literary: 1, technical: 1 } },
    ],
  },
  {
    id: 2,
    question: 'أي الأنشطة تفضل في وقت فراغك؟',
    options: [
      { text: 'إجراء التجارب العلمية وقراءة الكتب العلمية', scores: { scientific: 3, literary: 0, technical: 1 } },
      { text: 'كتابة المقالات والقصص والمشاركة في النقاشات الأدبية', scores: { scientific: 0, literary: 3, technical: 0 } },
      { text: 'تفكيك الأجهزة وتصميم البرامج وإصلاح الأشياء', scores: { scientific: 1, literary: 0, technical: 3 } },
      { text: 'العمل التطوعي وتنظيم الفعاليات الاجتماعية', scores: { scientific: 0, literary: 2, technical: 0 } },
    ],
  },
  {
    id: 3,
    question: 'ما هو نوع الوظيفة التي تحلم بها في المستقبل؟',
    options: [
      { text: 'طبيب أو مهندس أو باحث علمي', scores: { scientific: 3, literary: 0, technical: 1 } },
      { text: 'محامي أو إعلامي أو معلم لغة', scores: { scientific: 0, literary: 3, technical: 0 } },
      { text: 'مبرمج أو مصمم أو فني مختص', scores: { scientific: 1, literary: 0, technical: 3 } },
      { text: 'أعمل في مجال الإدارة أو ريادة الأعمال', scores: { scientific: 1, literary: 1, technical: 2 } },
    ],
  },
];

export const navItems = [
  { id: 'home', label: 'الرئيسية', icon: 'Home' },
  { id: 'programs', label: 'البرامج والخطط', icon: 'ClipboardList' },
  { id: 'portfolio', label: 'ملف الإنجاز', icon: 'FolderOpen' },
  { id: 'readiness', label: 'جاهزية الاعتماد', icon: 'Target' },
  { id: 'files', label: 'الملفات والشواهد', icon: 'FileText' },
  { id: 'values', label: 'مصفوفة القيم', icon: 'Target' },
  { id: 'community', label: 'صوت الطالب والمجتمع', icon: 'Users' },
  { id: 'parent-council', label: 'مجلس الآباء', icon: 'Users' },
  { id: 'satisfaction', label: 'استبيانات الرضا', icon: 'BarChart3' },
  { id: 'surveys', label: 'محرك الاستبيانات', icon: 'FileQuestion' },
  { id: 'survey-admin', label: 'إدارة الاستبيانات', icon: 'FileQuestion' },
  { id: 'survey-analysis', label: 'تحليل النتائج', icon: 'BarChart3' },
  { id: 'coverage-map', label: 'خريطة التغطية', icon: 'Grid3x3' },
  { id: 'zad-library', label: 'رفّ زاد الموجه', icon: 'BookOpen' },
  { id: 'case-registry', label: 'سجل الحالات', icon: 'ClipboardList' },
  { id: 'monitoring', label: 'المتابعة والإنذار المبكر', icon: 'ShieldAlert' },
  { id: 'clinic', label: 'العيادة الرقمية', icon: 'Stethoscope' },
  { id: 'reports', label: 'قياس الأثر', icon: 'BarChart3' },
  { id: 'data-export', label: 'النسخ الاحتياطي', icon: 'Database' },
];

export interface FileModule {
  id: string;
  title: string;
  category: 'career' | 'self_eval' | 'community' | 'documents';
  categoryLabel: string;
  description: string;
  icon: string;
}

export const fileModules: FileModule[] = [
  // التوجيه المهني
  { id: 'career-motivation', title: 'تنمية الدافعية', category: 'career', categoryLabel: 'التوجيه المهني', description: 'برامج وخطط تنمية الدافعية الدراسية والمهنية لدى الطلاب', icon: 'Zap' },
  { id: 'career-preparation', title: 'التهيئة الإرشادية', category: 'career', categoryLabel: 'التوجيه المهني', description: 'برامج التهيئة الإرشادية للطلاب المستجدين والمنتقلين', icon: 'Sparkles' },
  { id: 'career-international', title: 'الاختبارات الدولية', category: 'career', categoryLabel: 'التوجيه المهني', description: 'متابعة وتأهيل الطلاب للاختبارات الدولية (PISA, TIMSS, PIRLS)', icon: 'Globe' },
  { id: 'career-sports-uniform', title: 'الزي المدرسي الرياضي', category: 'career', categoryLabel: 'التوجيه المهني', description: 'متابعة الزي المدرسي الرياضي وتعزيز الهوية والانضباط', icon: 'Shirt' },
  { id: 'career-crisis', title: 'التوجيه وقت الأزمات', category: 'career', categoryLabel: 'التوجيه المهني', description: 'خطة التدخل الإرشادي وقت الأزمات والحوادث الطارئة', icon: 'ShieldAlert' },
  { id: 'career-family-relation', title: 'العلاقة بين الأسرة والمدرسة', category: 'career', categoryLabel: 'التوجيه المهني', description: 'تعزيز الشراكة بين الأسرة والمدرسة وآليات التواصل', icon: 'HeartHandshake' },
  { id: 'career-problems', title: 'قائمة المشكلات الطلابية', category: 'career', categoryLabel: 'التوجيه المهني', description: 'قائمة المشكلات الطلابية الشائعة وآليات التعامل معها', icon: 'ListChecks' },
  // التقويم الذاتي
  { id: 'selfeval-student-rights', title: 'حقوق المتعلمين', category: 'self_eval', categoryLabel: 'التقويم الذاتي', description: 'ملف حقوق المتعلمين والالتزام بتطبيقها', icon: 'Scale' },
  { id: 'selfeval-volunteer', title: 'العمل التطوعي', category: 'self_eval', categoryLabel: 'التقويم الذاتي', description: 'برامج ومشاريع العمل التطوعي للطلاب', icon: 'HandHeart' },
  { id: 'selfeval-behavior-compliance', title: 'نسبة الملتزمين بقواعد السلوك', category: 'self_eval', categoryLabel: 'التقويم الذاتي', description: 'متابعة نسبة الطلاب الملتزمين بقواعد السلوك والمواظبة', icon: 'ClipboardCheck' },
  { id: 'selfeval-incentives', title: 'التحفيز والتكريم', category: 'self_eval', categoryLabel: 'التقويم الذاتي', description: 'برامج التحفيز والتكريم للطلاب المتميزين', icon: 'Award' },
  { id: 'selfeval-activities', title: 'البرامج والأنشطة', category: 'self_eval', categoryLabel: 'التقويم الذاتي', description: 'سجل البرامج والأنشطة الإرشادية المنفذة', icon: 'CalendarDays' },
  { id: 'selfeval-positive-behavior', title: 'تعزيز السلوك الإيجابي', category: 'self_eval', categoryLabel: 'التقويم الذاتي', description: 'برامج تعزيز السلوك الإيجابي والقيم', icon: 'Smile' },
  // المجتمع والزيارات
  { id: 'community-parent-visits', title: 'زيارات ومجالس أولياء الأمور', category: 'community', categoryLabel: 'المجتمع', description: 'سجل زيارات ومجالس أولياء الأمور واللقاءات الأسرية', icon: 'Users' },
  { id: 'community-top-students', title: 'الطلاب المتميزون دراسياً', category: 'community', categoryLabel: 'المجتمع', description: 'سجل الطلاب المتميزين دراسياً وتكريمهم', icon: 'GraduationCap' },
  { id: 'community-absentees', title: 'متكرري الغياب والأولى بالرعاية', category: 'community', categoryLabel: 'المجتمع', description: 'سجل متكرري الغياب والطلاب الأولى بالرعاية وخطط التدخل', icon: 'UserX' },
  // الوثائق
  { id: 'doc-cv', title: 'السيرة الذاتية', category: 'documents', categoryLabel: 'الوثائق', description: 'السيرة الذاتية للموجه الطلابي', icon: 'FileUser' },
  { id: 'doc-certificates', title: 'شهادات الشكر', category: 'documents', categoryLabel: 'الوثائق', description: 'شهادات الشكر والتقدير والدورات التدريبية', icon: 'Award' },
];

export interface FrequentAbsentee {
  id: number;
  name: string;
  grade: string;
  absenceDays: number;
  reason: string;
  interventionPlan: string;
  status: 'under-followup' | 'improved' | 'referred';
  statusLabel: string;
}

export const frequentAbsentees: FrequentAbsentee[] = [
  { id: 1, name: 'محمد العنزي', grade: 'الأول ثانوي', absenceDays: 12, reason: 'ظروف أسرية', interventionPlan: 'لقاء مع ولي الأمر وخطة حضور مرنة', status: 'under-followup', statusLabel: 'تحت المتابعة' },
  { id: 2, name: 'عبدالله الشمري', grade: 'الثاني ثانوي', absenceDays: 8, reason: 'صعوبة في مادة الرياضيات', interventionPlan: 'جلسات دعم إضافية ومتابعة أسبوعية', status: 'improved', statusLabel: 'تحسن' },
  { id: 3, name: 'خالد الدوسري', grade: 'الثالث ثانوي', absenceDays: 15, reason: 'مشكلات صحية', interventionPlan: 'تحويل للوحدة الصحية وخطة تعليم منزلي', status: 'referred', statusLabel: 'محول' },
  { id: 4, name: 'سultan الحربي', grade: 'الأول ثانوي', absenceDays: 6, reason: 'تأخر صباحي متكرر', interventionPlan: 'خطة انضباط صباحي ومتابعة يومية', status: 'improved', statusLabel: 'تحسن' },
  { id: 5, name: 'راكان القحطاني', grade: 'الثاني ثانوي', absenceDays: 10, reason: 'ضغوط نفسية', interventionPlan: 'جلسات إرشادية فردية وتواصل مع الأسرة', status: 'under-followup', statusLabel: 'تحت المتابعة' },
];

export interface TopStudent {
  id: number;
  name: string;
  grade: string;
  gpa: number;
  rank: number;
  notes: string;
}

export const topStudents: TopStudent[] = [
  { id: 1, name: 'عبدالرحمن السالم', grade: 'الثالث ثانوي', gpa: 99.8, rank: 1, notes: 'الأول على دفعه - مشارك في مسابقة الرياضيات' },
  { id: 2, name: 'ماجد القحطاني', grade: 'الأول ثانوي', gpa: 98.5, rank: 1, notes: 'الأول على دفعه - مشروع علمي متميز' },
  { id: 3, name: 'نواف الحربي', grade: 'الثاني ثانوي', gpa: 97.2, rank: 2, notes: 'الثاني على دفعه - مسابقة الإبداع العلمي' },
  { id: 4, name: 'فهد الغامدي', grade: 'الثالث ثانوي', gpa: 96.8, rank: 3, notes: 'الثالث على دفعه - حفظ القرآن الكريم' },
  { id: 5, name: 'عبدالعزيز المطيري', grade: 'الأول ثانوي', gpa: 96.0, rank: 2, notes: 'الثاني على دفعه - نشاط قيادي متميز' },
  { id: 6, name: 'بدر العنزي', grade: 'الثاني ثانوي', gpa: 95.5, rank: 4, notes: 'الرابع على دفعه - انضباط وسلوك إيجابي' },
];

export const surveyAnalytics = [
  { label: 'الرضا عن البرامج الإرشادية', pre: 62, post: 89, color: 'bg-emerald-500' },
  { label: 'الوعي بالمسارات المهنية', pre: 45, post: 84, color: 'bg-amber-500' },
  { label: 'الثقة بالنفس والتكيف', pre: 58, post: 81, color: 'bg-sky-500' },
  { label: 'الالتزام بقواعد السلوك', pre: 72, post: 96, color: 'bg-emerald-500' },
  { label: 'الدافعية الدراسية', pre: 55, post: 78, color: 'bg-amber-500' },
];

export const noorSystemData = {
  totalSessions: 156,
  individualSessions: 98,
  groupSessions: 58,
  uploadedRecords: 142,
  pendingRecords: 14,
  lastSync: '20 شعبان 1448هـ - 10:30 صباحاً',
  coverage: 91,
};

export interface ValueItem {
  id: number;
  value: string;
  definition: string;
  behavioralIndicators: string[];
  evaluationMethods: string[];
  programs: string[];
}

export const valuesMatrix: ValueItem[] = [
  {
    id: 1,
    value: 'الانتماء للوطن',
    definition: 'الارتباط العميق بالوطن والاعتزاز به والحرص على خدمته والمحافظة على منجزاته',
    behavioralIndicators: [
      'المشاركة في الفعاليات الوطنية والمناسبات الرسمية',
      'الاعتزاز بالهوية الوطنية والثقافة السعودية',
      'المساهمة في خدمة المجتمع والمشاركة التطوعية',
      'المحافظة على المرافق العامة والممتلكات الوطنية',
    ],
    evaluationMethods: [
      'ملاحظة سلوك الطلاب خلال الفعاليات الوطنية',
      'استبيان الانتماء الوطني قبل/بعد البرامج',
      'سجل المشاركات في الأنشطة الوطنية',
      'تقارير المعلمين عن سلوك الانتماء',
    ],
    programs: [
      'برنامج يوم الوطن السعودي',
      'مسابقة "وطني المعرفة" الثقافية',
      'زيارة المتحف الوطني والمعالم التراثية',
      'مشروع "خادم الحرمين الشريفين في عيوننا"',
    ],
  },
  {
    id: 2,
    value: 'التسامح',
    definition: 'قبول الآخرين والتعامل معهم باحترام وتفهم رغم اختلاف وجهات النظر',
    behavioralIndicators: [
      'احترام آراء الزملاء المختلفة',
      'الابتعاد عن التعصب والتحيز',
      'حل الخلافات بالحوار والتفاهم',
      'التعامل بلطف مع جميع الطلاب',
    ],
    evaluationMethods: [
      'ملاحظة التفاعل بين الطلاب',
      'استبيان السلوك التعاملي',
      'سجل حوادث التنمر والمقارنة قبل/بعد',
      'تقارير المرشد الطلابي',
    ],
    programs: [
      'برنامج "السلام يبدأ مني"',
      'ورشة "فن الحوار والتسامح"',
      'حملة "اختلافي لا يفسد ودنا"',
      'نشاط "أنا أتقبل الآخر"',
    ],
  },
  {
    id: 3,
    value: 'الوسطية والاعتدال',
    definition: 'الالتزام بالمنهج الوسطي المعتدل وتجنب الغلو والتطرف في الأفكار والسلوك',
    behavioralIndicators: [
      'الابتعاد عن الأفكار المتطرفة',
      'الالتزام بالمنهج المعتدل في الدين',
      'التعامل بحكمة وروية',
      'رفض التطرف والغلو',
    ],
    evaluationMethods: [
      'استبيان القيم الإسلامية',
      'ملاحظة سلوك الطلاب اليومي',
      'لقاءات الحوار المفتوح',
      'تقارير المعلمين والمرشد',
    ],
    programs: [
      'برنامج "وسطية الإسلام"',
      'محاضرة "أمن الفكر"',
      'ورشة "كيف نحمي أنفسنا من الأفكار المتطرفة"',
      'نشاط "قيمي إسلامي"',
    ],
  },
  {
    id: 4,
    value: 'المبادرة',
    definition: 'الإيجابية في طرح الأفكار والمسارعة في تقديم المساعدة واقتراح الحلول',
    behavioralIndicators: [
      'المسارعة في تقديم المساعدة للزملاء',
      'اقتراح أفكار وحلول جديدة',
      'المشاركة الطوعية في الأنشطة',
      'تحمل المسؤولية دون انتظار التكليف',
    ],
    evaluationMethods: [
      'ملاحظة المبادرات الطلابية',
      'سجل المشاركات التطوعية',
      'استبيان روح المبادرة',
      'تقارير المعلمين',
    ],
    programs: [
      'برنامج "مبادر وفخر"',
      'نادي المبادرات الطلابية',
      'مسابقة "أفضل مبادرة طلابية"',
      'نشاط "أنا أقود التغيير"',
    ],
  },
  {
    id: 5,
    value: 'الإتقان',
    definition: 'بذل الجهد والاهتمام بأداء العمل على أكمل وجه والحرص على الجودة',
    behavioralIndicators: [
      'الاهتمام بجودة الواجبات والمشاريع',
      'الحرص على الإنجاز في الوقت المحدد',
      'تنظيم العمل والمظهر',
      'السعي للتطوير والتحسين المستمر',
    ],
    evaluationMethods: [
      'تقييم جودة الأعمال الطلابية',
      'استبيان الإتقان',
      'متابعة الإنجاز في الوقت',
      'تقارير المعلمين',
    ],
    programs: [
      'برنامج "الإتقان في كل شيء"',
      'مسابقة "أفضل مشروع طلابي"',
      'ورشة "إدارة الوقت والجودة"',
      'نشاط "أنا أتقن عملي"',
    ],
  },
  {
    id: 6,
    value: 'الانضباط',
    definition: 'الالتزام بالنظام والقوانين والحرص على المواعيد والحضور',
    behavioralIndicators: [
      'الحضور المنتظم وعدم التأخر',
      'الالتزام بلبس الزي المدرسي',
      'احترام النظام المدرسي',
      'الالتزام بقواعد السلوك والمواظبة',
    ],
    evaluationMethods: [
      'متابعة سجل الحضور والغياب',
      'ملاحظة الالتزام بالزي',
      'استبيان الانضباط',
      'نسبة الالتزام بقواعد السلوك',
    ],
    programs: [
      'برنامج "الانضباط أولاً"',
      'نظام النقاط الإيجابية للمنضبطين',
      'حملة "نظافتي وانضباطي"',
      'تكريم أسبوعي للمنضبطين',
    ],
  },
  {
    id: 7,
    value: 'المرونة',
    definition: 'القدرة على التكيف مع المتغيرات والتعامل مع الظروف الجديدة بمرونة وإيجابية',
    behavioralIndicators: [
      'التكيف مع المتغيرات الدراسية',
      'التعامل بهدوء مع المواقف الضاغطة',
      'القدرة على تغيير الخطط عند الحاجة',
      'التعامل مع الآراء المختلفة بمرونة',
    ],
    evaluationMethods: [
      'استبيان المرونة النفسية',
      'ملاحظة سلوك الطلاب في المواقف الضاغطة',
      'تقارير المرشد الطلابي',
      'مقياس التكيف الدراسي',
    ],
    programs: [
      'برنامج "أنا مرن وأتأقلم"',
      'ورشة "إدارة الضغوط النفسية"',
      'نشاط "كيف أتعامل مع التغيير"',
      'جلسات إرشادية جماعية للتكيف',
    ],
  },
  {
    id: 8,
    value: 'الإيجابية',
    definition: 'النظرة المتفائلة للحياة والتركيز على الجوانب الإيجابية ونشر الأمل',
    behavioralIndicators: [
      'النظرة المتفائلة للمستقبل',
      'نشر الأمل والإيجابية بين الزملاء',
      'التركيز على الحلول لا المشاكل',
      'الابتسامة والتعامل بلطف',
    ],
    evaluationMethods: [
      'استبيان الإيجابية والأمل',
      'ملاحظة سلوك الطلاب اليومي',
      'تقارير المعلمين',
      'مقياس التفاؤل',
    ],
    programs: [
      'برنامج "إيجابية من حولي"',
      'حملة "ابتسم"',
      'ورشة "فن الإيجابية"',
      'نشاط "أنا أمل الأمة"',
    ],
  },
  {
    id: 9,
    value: 'العزيمة',
    definition: 'الإصرار على تحقيق الأهداف والسعي الدؤوب للنجاح وعدم الاستسلام للصعوبات',
    behavioralIndicators: [
      'الإصرار على تحقيق الأهداف',
      'عدم الاستسلام للصعوبات',
      'السعي الدؤوب للنجاح',
      'التحمل والصبر على المتاعب',
    ],
    evaluationMethods: [
      'استبيان العزيمة والإصرار',
      'متابعة إنجاز الطلاب في المهام الصعبة',
      'تقارير المعلمين',
      'مقياس الدافعية',
    ],
    programs: [
      'برنامج "عزيمتي قوة نجاحي"',
      'ورشة "كيف أتجاوز الصعوبات"',
      'نشاط "أنا أصمد"',
      'لقاء مع شخصيات ملهمة',
    ],
  },
];
