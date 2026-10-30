import { useState, useEffect, useCallback } from 'react';
import {
  Home, ClipboardList, FolderOpen, Users, Stethoscope, BarChart3,
  ClipboardCheck, HeartPulse, TrendingUp, Search, X, Calendar,
  Clock, Target, CheckCircle2, AlertCircle, FileText, Download,
  ChevronLeft, Award, MessageSquare, Phone, Mail, MapPin, GraduationCap,
  Shield, BookOpen, Lightbulb, User, Lock, Send, CalendarCheck,
  Star, ArrowUpRight, Filter, Eye, Phone as PhoneIcon, Settings,
  Database, CheckCircle, Clock3, Sparkles, Building2, Briefcase,
  FlaskConical, Palette, Cpu, Heart, Activity, Zap, Trophy, Loader2,
  Link2, Copy, BarChart2, PieChart, ShieldAlert,
} from 'lucide-react';
import { downloadHtmlAsPdf, brandHeader, sectionTitle, esc } from '@/lib/pdfExport';
import type { EvidenceRecord } from '@/lib/supabase';
import {
  counselor, kpis, programs, performanceCriteria,
  studentCouncilMeetings, parentMeetings, honorStudents,
  careerQuestions, navItems, surveyAnalytics, noorSystemData,
  type Program, type PerformanceCriterion,
} from '@/data';
import { EvidenceUploader } from '@/components/EvidenceUploader';
import { EvidenceCreator } from '@/components/EvidenceCreator';
import { FileModulesSection } from '@/components/FileModulesSection';
import { ValuesMatrixSection } from '@/components/ValuesMatrixSection';
import { ReadinessDashboard } from '@/components/ReadinessDashboard';
import { ParentCouncilSection } from '@/components/ParentCouncilSection';
import { SatisfactionSurveysSection } from '@/components/SatisfactionSurveysSection';
import { CaseRegistrySection } from '@/components/CaseRegistrySection';
import { Phase3MonitoringSection } from '@/components/Phase3MonitoringSection';
import { SurveyEngineSection, StandaloneSpecSurvey } from '@/components/SurveyEngineSection';
import { ZadLibrarySection } from '@/components/ZadLibrarySection';
import { SurveyAdminSection } from '@/components/SurveyAdminSection';
import { SurveyAnalysisSection } from '@/components/SurveyAnalysisSection';
import { CoverageMapSection } from '@/components/CoverageMapSection';
import { DataExportSection } from '@/components/DataExportSection';
import { Logo } from '@/components/Logo';
import { PublicSurveyPage } from '@/components/PublicSurveyPage';
import { AuthGate, SignOutButton } from '@/components/AuthGate';
import { MigrateDataPage } from '@/components/MigrateDataPage';
import { Plus, QrCode, FileQuestion } from 'lucide-react';
import {
  fetchEvidenceCount, fetchEvidence,
  submitConsultation, fetchConsultationStats,
  saveCareerResult, fetchCareerStats, fetchZadResources,
} from '@/lib/supabase';

// ============ MODAL COMPONENT ============
function Modal({ open, onClose, title, children, size = 'lg' }: {
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

// ============ ICON MAPPER ============
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, ClipboardList, FolderOpen, Users, Stethoscope, BarChart3,
  ClipboardCheck, HeartPulse, TrendingUp, Search, X, Calendar, Clock,
  Target, CheckCircle2, AlertCircle, FileText, Download, ChevronLeft,
  Award, MessageSquare, Phone, Mail, MapPin, GraduationCap, Shield,
  BookOpen, Lightbulb, User, Lock, Send, CalendarCheck, Star,
  ArrowUpRight, Filter, Eye, Settings, Database, CheckCircle, Clock3,
  Sparkles, Building2, Briefcase, FlaskConical, Palette, Cpu, Heart,
  Activity, Zap, Trophy, ShieldAlert, FileQuestion,
};

// ============ HEADER ============
function Header({ activeSection, setActiveSection, searchQuery, setSearchQuery }: {
  activeSection: string;
  setActiveSection: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNav = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              {counselor.region}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-400" />{counselor.year}</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-emerald-400" />{counselor.semester}</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'glass-effect shadow-lg' : 'bg-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Logo variant="full" size={46} />
              <h1 className="sr-only">بوصلة — منصة الموجّه الطلابي</h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في البرامج والمؤشرات والملفات..."
                  className="w-full pr-10 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Counselor profile */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700">{counselor.name}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                ص ب
              </div>
              <SignOutButton />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Nav menu */}
          <nav className={`${mobileMenuOpen ? 'flex' : 'hidden md:flex'} flex-col md:flex-row gap-1 pb-3 md:pb-0 md:h-12 items-center`}>
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || Home;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}

// ============ KPI BANNER ============
function KpiBanner() {
  const [animatedValues, setAnimatedValues] = useState<number[]>(kpis.map(() => 0));

  useEffect(() => {
    const timers = kpis.map((kpi, i) => {
      return setTimeout(() => {
        setAnimatedValues(prev => {
          const next = [...prev];
          next[i] = kpi.value;
          return next;
        });
      }, i * 200);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section id="home" className="py-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-emerald-600 rounded-full"></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-cairo">شريط الإحصائيات والأداء</h2>
            <p className="text-sm text-slate-500">مؤشرات الأداء الرئيسية للعام الدراسي 1448هـ</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((kpi, i) => {
            const Icon = iconMap[kpi.icon] || ClipboardCheck;
            return (
              <div
                key={kpi.id}
                className={`relative bg-gradient-to-br ${kpi.gradient} rounded-2xl p-5 text-white shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="absolute -left-4 -bottom-4 opacity-10">
                  <Icon className="w-28 h-28" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs bg-white/15 px-2 py-1 rounded-full flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-1 font-cairo">
                    {animatedValues[i].toFixed(kpi.unit === '%' ? 1 : 0)}
                    <span className="text-lg mr-1 opacity-80">{kpi.unit}</span>
                  </div>
                  <p className="text-sm text-white/80 leading-tight">{kpi.label}</p>
                  <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${kpi.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============ PROGRAMS HUB ============
function ProgramsHub({ searchQuery }: { searchQuery: string }) {
  const [filter, setFilter] = useState<'all' | 'preventive' | 'developmental' | 'remedial'>('all');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  const filtered = programs.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.etecIndicator.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.targetGroup.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { id: 'all', label: 'الكل' },
    { id: 'preventive', label: 'المسار الوقائي' },
    { id: 'developmental', label: 'المسار النمائي والمهني' },
    { id: 'remedial', label: 'المسار العلاجي والرعاية الخاصة' },
  ] as const;

  return (
    <section id="programs" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          icon={ClipboardList}
          title="مركز البرامج والخطط الإرشادية"
          subtitle="جميع البرامج الإرشادية المنفذة وفق المسارات الثلاثة للعام الدراسي 1448هـ"
        />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              {f.label}
              <span className={`mr-2 text-xs px-1.5 py-0.5 rounded-full ${
                filter === f.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {f.id === 'all' ? programs.length : programs.filter(p => p.category === f.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Program cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((program, i) => (
            <div
              key={program.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Top accent */}
              <div className={`h-1.5 ${
                program.category === 'preventive' ? 'bg-emerald-500' :
                program.category === 'developmental' ? 'bg-amber-500' : 'bg-sky-500'
              }`} />

              <div className="p-5">
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    program.category === 'preventive' ? 'bg-emerald-100 text-emerald-700' :
                    program.category === 'developmental' ? 'bg-amber-100 text-amber-700' :
                    'bg-sky-100 text-sky-700'
                  }`}>
                    {program.categoryLabel}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                    program.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {program.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                    {program.statusLabel}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-2 leading-snug font-cairo group-hover:text-emerald-700 transition-colors">
                  {program.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{program.description}</p>

                {/* Meta info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{program.targetGroup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{program.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Target className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-emerald-600 font-medium">{program.etecIndicator}</span>
                  </div>
                </div>

                {/* Beneficiaries */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-700">{program.beneficiaries}</span>
                      <span className="text-xs text-slate-400 mr-1">مستفيد</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProgram(program)}
                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد برامج مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* Program detail modal */}
      <Modal open={!!selectedProgram} onClose={() => setSelectedProgram(null)} title="تفاصيل البرنامج والشواهد" size="xl">
        {selectedProgram && (
          <div className="space-y-5">
            {/* Header */}
            <div className={`p-4 rounded-xl ${
              selectedProgram.category === 'preventive' ? 'bg-emerald-50' :
              selectedProgram.category === 'developmental' ? 'bg-amber-50' : 'bg-sky-50'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-lg font-bold text-slate-800 font-cairo">{selectedProgram.title}</h4>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedProgram.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {selectedProgram.statusLabel}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedProgram.description}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <span className="flex items-center gap-1 text-slate-500"><User className="w-3.5 h-3.5" />{selectedProgram.targetGroup}</span>
                <span className="flex items-center gap-1 text-slate-500"><Calendar className="w-3.5 h-3.5" />{selectedProgram.date}</span>
                <span className="flex items-center gap-1 text-slate-500"><Target className="w-3.5 h-3.5" />{selectedProgram.etecIndicator}</span>
                <span className="flex items-center gap-1 text-slate-500"><Users className="w-3.5 h-3.5" />{selectedProgram.beneficiaries} مستفيد</span>
              </div>
            </div>

            {/* Objectives */}
            <div>
              <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <Target className="w-4 h-4 text-emerald-600" />
                الأهداف
              </h5>
              <ul className="space-y-2">
                {selectedProgram.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* Activities */}
            <div>
              <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <Activity className="w-4 h-4 text-amber-600" />
                الأنشطة المنفذة
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProgram.activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {act}
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div>
              <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                النتائج والمخرجات
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProgram.outcomes.map((out, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
                    <Star className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    {out}
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence creator + uploader */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <FileText className="w-4 h-4 text-slate-600" />
                  الشواهد والمرفقات
                </h5>
                <button
                  onClick={() => setShowCreator(s => !s)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إنشاء شاهد
                </button>
              </div>
              {showCreator && (
                <div className="mb-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <EvidenceCreator
                    module={`program-${selectedProgram.id}`}
                    category="برامج إرشادية"
                    activityId={`program-${selectedProgram.id}`}
                    activityTitle={selectedProgram.title}
                    onClose={() => setShowCreator(false)}
                  />
                </div>
              )}
              <EvidenceUploader module={`program-${selectedProgram.id}`} category="برامج إرشادية" />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

// ============ PERFORMANCE PORTFOLIO ============
function PerformancePortfolio({ searchQuery }: { searchQuery: string }) {
  const [selectedCriterion, setSelectedCriterion] = useState<PerformanceCriterion | null>(null);
  const [evidenceCounts, setEvidenceCounts] = useState<Record<number, number>>({});
  const [showCreator, setShowCreator] = useState(false);

  const q = searchQuery.toLowerCase();
  const filtered = performanceCriteria.filter(c =>
    !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  );

  const totalScore = performanceCriteria.reduce((sum, c) => sum + (c.score * c.weight / 100), 0);
  const maxScore = performanceCriteria.reduce((sum, c) => sum + c.weight, 0);
  const overallPercentage = (totalScore / maxScore) * 100;

  const totalEvidence = Object.values(evidenceCounts).reduce((s, v) => s + v, 0);

  useEffect(() => {
    const loadCounts = async () => {
      const entries = await Promise.all(
        performanceCriteria.map(async (c) => {
          try {
            const count = await fetchEvidenceCount(`criterion-${c.id}`);
            return [c.id, count] as const;
          } catch {
            return [c.id, 0] as const;
          }
        })
      );
      setEvidenceCounts(Object.fromEntries(entries));
    };
    loadCounts();
  }, []);

  return (
    <section id="portfolio" className="py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          icon={FolderOpen}
          title="ملف الإنجاز وشواهد الأداء الوظيفي"
          subtitle="ملف الإنجاز وفق مؤشرات الأداء الوظيفي الثلاثة عشر للموجه الطلابي - 1448هـ"
        />

        {/* Overall score banner */}
        <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">التقدير الإجمالي للأداء الوظيفي</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-cairo">{totalScore.toFixed(1)}</span>
                <span className="text-lg text-slate-400">من {maxScore}</span>
                <span className="text-lg text-emerald-400 mr-2">({overallPercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-400">{performanceCriteria.length}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">إجمالي البنود</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-amber-400">{totalEvidence}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">إجمالي الشواهد</p>
              </div>
            </div>
          </div>
        </div>

        {/* Criteria grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((criterion, i) => {
            const scoreColor = criterion.score >= 9 ? 'emerald' : criterion.score >= 8 ? 'amber' : 'orange';
            const colorMap: Record<string, { bg: string; text: string; bar: string; border: string }> = {
              emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-200' },
              amber: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', border: 'border-amber-200' },
              orange: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', border: 'border-orange-200' },
            };
            const c = colorMap[scoreColor];
            return (
              <div
                key={criterion.id}
                className={`bg-white rounded-xl border ${c.border} shadow-sm hover:shadow-md transition-all p-4 animate-slide-up`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg ${c.bg} ${c.text} text-sm font-bold flex items-center justify-center`}>
                      {criterion.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight font-cairo">{criterion.title}</h4>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>الوزن: <strong className="text-slate-700">{criterion.weight}%</strong></span>
                  <span>الشواهد: <strong className="text-slate-700">{evidenceCounts[criterion.id] || 0}</strong></span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">الدرجة</span>
                    <span className={`font-bold ${c.text}`}>{criterion.score.toFixed(1)} / 10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${c.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${criterion.score * 10}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCriterion(criterion)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  استعراض الشواهد
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Criterion detail modal */}
      <Modal open={!!selectedCriterion} onClose={() => setSelectedCriterion(null)} title="تفاصيل البند والشواهد">
        {selectedCriterion && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
              <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
                {selectedCriterion.id}
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-800 font-cairo">{selectedCriterion.title}</h4>
                <p className="text-xs text-slate-500">الوزن: {selectedCriterion.weight}% | الدرجة: {selectedCriterion.score} / 10</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{selectedCriterion.description}</p>
            <div>
              <h5 className="text-sm font-bold text-slate-700 mb-3">المؤشرات الفرعية</h5>
              <div className="space-y-2">
                {selectedCriterion.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {ind}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-bold text-slate-700">الشواهد المرفقة</h5>
                <button
                  onClick={() => setShowCreator(s => !s)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إنشاء شاهد
                </button>
              </div>
              {showCreator && (
                <div className="mb-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <EvidenceCreator
                    module={`criterion-${selectedCriterion.id}`}
                    category="الأداء الوظيفي"
                    activityId={`criterion-${selectedCriterion.id}`}
                    activityTitle={selectedCriterion.title}
                    onClose={() => setShowCreator(false)}
                  />
                </div>
              )}
              <EvidenceUploader module={`criterion-${selectedCriterion.id}`} category="الأداء الوظيفي" />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

// ============ STUDENT VOICE & COMMUNITY ============
function StudentVoice() {
  const [tab, setTab] = useState<'council' | 'parents' | 'honor'>('council');

  const tabs = [
    { id: 'council', label: 'مجلس الحوار الطلابي', icon: MessageSquare },
    { id: 'parents', label: 'شراكة الأسرة والمدرسة', icon: Users },
    { id: 'honor', label: 'لوحة الشرف والتكريم', icon: Trophy },
  ] as const;

  return (
    <section id="community" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          icon={Users}
          title="صوت الطالب والشراكة المجتمعية"
          subtitle="مجلس الحوار الطلابي وشراكة الأسرة والمدرسة ولوحة الشرف والتكريم"
        />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Council tab */}
        {tab === 'council' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-right px-4 py-3 font-bold text-slate-700">التاريخ</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">الموضوع</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">الحضور</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">التوصيات</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-700">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {studentCouncilMeetings.map(m => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.topic}</td>
                      <td className="px-4 py-3 text-slate-600">{m.attendees} طالب</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">{m.recommendations}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          m.status === 'implemented' ? 'bg-green-100 text-green-700' :
                          m.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {m.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parents tab */}
        {tab === 'parents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {parentMeetings.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-cairo">{m.topic}</h4>
                      <span className="text-xs text-slate-400">{m.date}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {m.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{m.summary}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <User className="w-3.5 h-3.5" />
                  <span>{m.attendees} ولي أمر</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Honor tab */}
        {tab === 'honor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {honorStudents.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-5 text-center group">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${s.avatarColor} flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  {s.name.charAt(0)}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1 font-cairo">{s.name}</h4>
                <span className="text-xs text-slate-400 block mb-2">{s.grade}</span>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {s.category === 'academic' && <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />}
                  {s.category === 'behavioral' && <Heart className="w-3.5 h-3.5 text-amber-500" />}
                  {s.category === 'both' && <Award className="w-3.5 h-3.5 text-sky-500" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2">{s.achievement}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============ DIGITAL CLINIC ============
function DigitalClinic({ publicMode = false }: { publicMode?: boolean }) {
  const [consultationType, setConsultationType] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
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
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const slots = ['8:00 ص', '9:00 ص', '10:00 ص', '11:00 ص', '12:00 م', '1:00 م'];

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

  const handleBooking = () => {
    if (selectedDay !== null && selectedSlot !== null) {
      setShowBookingConfirm(true);
      setSelectedDay(null);
      setSelectedSlot(null);
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
          subtitle="نموذج الإبلاغ الآمن وحجز المواعيد الإرشادية ومقياس الميول المهنية مع الإحصائيات والتبؤءات"
        />

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Consultation form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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

          {/* Appointment booking */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-base font-bold text-slate-800 font-cairo">حجز موعد استشارة إرشادية</h4>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 mb-2">اختر اليوم:</p>
              <div className="grid grid-cols-5 gap-1.5">
                {days.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      selectedDay === i
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-emerald-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-slate-600 mb-2">اختر الوقت:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(i)}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      selectedSlot === i
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={selectedDay === null || selectedSlot === null}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarCheck className="w-4 h-4" />
              تأكيد الحجز
            </button>
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

      <Modal open={showBookingConfirm} onClose={() => setShowBookingConfirm(false)} title="تم حجز الموعد بنجاح" size="md">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <CalendarCheck className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-base font-bold text-slate-800 mb-2">تم تأكيد حجز موعدك</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            سيتم إرسال تذكير قبل الموعد. يرجى الحضور في الوقت المحدد.
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
/** التقرير الختامي للموجه بصيغة HTML (يحوَّل إلى PDF مع دعم كامل للعربية) */
function buildFinalReportHtml(allEvidence: EvidenceRecord[]): string {
  const cell = 'padding:6px 8px; border-bottom:1px solid #eef2f7; font-size:11.5px;';
  const head = 'padding:7px 8px; font-size:11.5px; font-weight:700; text-align:right; background:#10324a; color:#fff;';
  const table = (headers: string[], rows: string[][]) => `
    <table style="margin-bottom:10px; border:1px solid #e2e8f0;">
      <thead><tr>${headers.map(h => `<th style="${head}">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr style="background:${i % 2 ? '#f8fafc' : '#fff'};">${r.map(c => `<td style="${cell}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  return [
    brandHeader('التقرير الختامي للموجه الطلابي', `${counselor.school} — العام الدراسي 1448هـ`),
    `<div data-pdf-block style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 14px; margin-bottom:8px; font-size:12.5px;">
      <strong>${esc(counselor.name)}</strong> — ${esc(counselor.region)}
    </div>`,
    sectionTitle('1', 'مؤشرات الأداء الرئيسية'),
    table(['المؤشر', 'القيمة'], kpis.map(k => [esc(k.label), `${esc(k.value)} ${esc(k.unit)}`])),
    sectionTitle('2', 'البرامج الإرشادية المنفذة'),
    table(['البرنامج', 'التصنيف', 'الحالة', 'المؤشر', 'المستفيدون'], programs.map(p => [esc(p.title), esc(p.categoryLabel), esc(p.statusLabel), `<span class="ltr">${esc(p.etecIndicator)}</span>`, esc(p.beneficiaries)])),
    sectionTitle('3', 'مؤشرات الأداء الوظيفي (13 بندًا)'),
    table(['#', 'البند', 'الوزن', 'الدرجة'], performanceCriteria.map(c => [esc(c.id), esc(c.title), `${esc(c.weight)}%`, `${esc(c.score)} / 10`])),
    sectionTitle('4', `الشواهد المرفوعة (${allEvidence.length})`),
    allEvidence.length
      ? table(['الشاهد', 'التصنيف', 'الملف'], allEvidence.map(e => [esc(e.title), esc(e.category), `<span class="ltr" style="font-size:10.5px; color:#64748b;">${esc(e.file_name)}</span>`]))
      : '<p data-pdf-block style="font-size:12px; color:#94a3b8;">لا توجد شواهد مرفوعة بعد.</p>',
    sectionTitle('5', 'تحليلات الاستبيانات (قبل/بعد)'),
    table(['الاستبيان', 'قبل', 'بعد', 'التحسن'], surveyAnalytics.map(s => [esc(s.label), `${s.pre}%`, `${s.post}%`, `<span style="color:${s.post - s.pre >= 0 ? '#059669' : '#dc2626'}; font-weight:700;">${s.post - s.pre >= 0 ? '+' : ''}${s.post - s.pre}%</span>`])),
    sectionTitle('6', 'تكامل نظام نور'),
    table(['البند', 'القيمة'], [
      ['إجمالي الجلسات', esc(noorSystemData.totalSessions)],
      ['جلسات فردية', esc(noorSystemData.individualSessions)],
      ['جلسات جماعية', esc(noorSystemData.groupSessions)],
      ['سجلات مرفوعة', esc(noorSystemData.uploadedRecords)],
      ['نسبة التغطية', `${esc(noorSystemData.coverage)}%`],
    ]),
    `<div data-pdf-block style="text-align:center; font-size:10.5px; color:#94a3b8; margin-top:16px;">أُنشئ هذا التقرير تلقائيًا بواسطة بوصلة — منصة الموجّه الطلابي</div>`,
  ].join('');
}

function ImpactMeasurement() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [evidenceTotal, setEvidenceTotal] = useState(0);

  useEffect(() => {
    fetchEvidenceCount().then(setEvidenceTotal).catch(() => {});
  }, []);

  const generateReport = async () => {
    setExporting(true);
    try {
      const allEvidence = await fetchEvidence();
      const html = buildFinalReportHtml(allEvidence);
      await downloadHtmlAsPdf(html, `تقرير-الموجه-الطلابي-${new Date().toISOString().split('T')[0]}.pdf`);
      setShowExportModal(true);
    } catch {
      setShowExportModal(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section id="reports" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          icon={BarChart3}
          title="قياس الأثر والتقارير"
          subtitle="تحليلات ما قبل وبعد البرامج وتكامل نظام نور وتصدير التقرير الختامي"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Survey analytics */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 font-cairo">تحليلات الاستبيانات (قبل / بعد)</h4>
                <p className="text-xs text-slate-500">مقارنة نتائج الاستبيانات القبلية والبعدية للبرامج</p>
              </div>
            </div>

            <div className="space-y-4">
              {surveyAnalytics.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{s.label}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">قبل: {s.pre}%</span>
                      <span className="text-emerald-600 font-bold">بعد: {s.post}%</span>
                      <span className="text-emerald-500 font-bold">+{s.post - s.pre}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-300 rounded-full transition-all duration-700" style={{ width: `${s.pre}%` }} />
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.post}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-300 rounded-full"></span>قبل البرنامج</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span>بعد البرنامج</span>
            </div>
          </div>

          {/* Noor system */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Database className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 font-cairo">تكامل نظام نور</h4>
                <p className="text-xs text-slate-500">ملخص الجلسات المرفوعة</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">إجمالي الجلسات</span>
                <span className="text-lg font-bold text-slate-800">{noorSystemData.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">جلسات فردية</span>
                <span className="text-lg font-bold text-emerald-600">{noorSystemData.individualSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">جلسات جماعية</span>
                <span className="text-lg font-bold text-amber-600">{noorSystemData.groupSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">سجلات مرفوعة</span>
                <span className="text-lg font-bold text-sky-600">{noorSystemData.uploadedRecords}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-700">سجلات معلقة</span>
                <span className="text-lg font-bold text-orange-600">{noorSystemData.pendingRecords}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">نسبة التغطية</span>
                <span className="font-bold text-emerald-600">{noorSystemData.coverage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${noorSystemData.coverage}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">آخر تحديث: {noorSystemData.lastSync}</p>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={generateReport}
            disabled={exporting}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-l from-emerald-600 to-teal-700 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
            {exporting ? 'جاري التصدير...' : 'تصدير التقرير الختامي الشامل'}
          </button>
        </div>
      </div>

      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} title="تصدير التقرير الختامي" size="md">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-800 mb-2">تم تصدير التقرير بنجاح</p>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            تم تنزيل ملف التقرير الختامي الشامل على جهازك. يشمل التقرير جميع البرامج والشواهد ({evidenceTotal} شاهد) ومؤشرات الأداء وتحليلات الأثر وسجلات نظام نور.
          </p>
        </div>
      </Modal>
    </section>
  );
}

// ============ SECTION HEADER ============
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
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo variant="mono-light" size={32} />
              <div>
                <h3 className="text-sm font-bold text-white font-cairo">بوصلة</h3>
                <p className="text-xs text-slate-400">منصة الموجّه الطلابي</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed">{counselor.ministry} - {counselor.region}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-3">معلومات الموجه الطلابي</h4>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" />{counselor.name}</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{counselor.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{counselor.phone}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-3">العام الدراسي</h4>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{counselor.year}</p>
              <p className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" />{counselor.semester}</p>
              <p className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" />{counselor.students} طالب</p>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-800 text-center text-xs">
          <p>© 1448هـ - {counselor.school} - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}

// ============ MAIN APP ============
function CounselorProfile() {
  return (
    <section className="pt-8 pb-4 bg-slate-50" aria-label="بطاقة تعريف الموجه الطلابي">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-l from-emerald-950 via-teal-900 to-slate-900 shadow-xl">
          <div className="absolute -left-20 -top-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -right-20 -bottom-28 w-80 h-80 rounded-full bg-teal-300/10 blur-3xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-[220px_1fr] items-center gap-6 p-5 sm:p-7 md:p-8" dir="rtl">
            <div className="order-1 md:order-2 flex justify-center">
              <div className="w-full max-w-[220px] h-64 sm:h-72 md:h-64 rounded-2xl overflow-hidden border border-white/25 bg-white/10 shadow-2xl">
                <img
                  src="/images/IMG-20261019-WA0011.jpg"
                  alt="صالح بن علي البراك"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="order-2 md:order-1 text-center md:text-right text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-medium text-emerald-100 border border-emerald-300/20">
                <GraduationCap className="w-4 h-4" />
                بطاقة تعريفية
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold font-cairo">صالح بن علي البراك</h2>
              <p className="mt-2 text-base sm:text-lg text-emerald-100 font-cairo">الموجه الطلابي</p>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-8 text-slate-200">بمدرسة الإمام سعود الكبير الثانوية بالظهران</p>
              <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2 text-xs text-slate-300">
                <span className="rounded-lg bg-white/10 px-3 py-2">منصة الإرشاد الطلابي</span>
                <span className="rounded-lg bg-white/10 px-3 py-2">العام الدراسي 1448هـ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type PublicRoute =
  | { kind: 'survey'; slug: string }
  | { kind: 'spec-survey'; id: string }
  | { kind: 'zad'; slug: string }
  | { kind: 'clinic' }
  | null;

/** قراءة الرابط عند فتح المنصة: روابط الاستبيانات والموارد تفتح صفحة مستقلة بدل الصفحة الرئيسية */
function readPublicRoute(): PublicRoute {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('r');
  if (r) return { kind: 'survey', slug: r };
  const survey = params.get('survey');
  if (survey) return { kind: 'spec-survey', id: survey };
  const s = params.get('s');
  if (s) return { kind: 'zad', slug: s };
  if (params.has('clinic') || window.location.hash === '#clinic') return { kind: 'clinic' };
  return null;
}

function clearPublicRoute() {
  const url = new URL(window.location.href);
  ['r', 's', 'survey', 'clinic'].forEach(key => url.searchParams.delete(key));
  if (url.hash === '#clinic') url.hash = '';
  window.history.replaceState({}, '', url);
}

/** رابط مختصر لمورد من مكتبة زاد (?s=slug): يحوّل مباشرة إلى رابط المورد، وإن لم يوجد يجرب الاستبيانات المنشورة */
function ZadResourceRedirect({ slug, onFallback, onClose }: { slug: string; onFallback: () => void; onClose: () => void }) {
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchZadResources()
      .then(list => {
        if (cancelled) return;
        const resource = list.find(item => item.slug === slug);
        const target = resource?.drive_url || resource?.qr_url;
        if (target) window.location.replace(target);
        else onFallback();
      })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [slug, onFallback]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="max-w-md text-center">
        {notFound ? (
          <>
            <p className="text-slate-700">تعذر فتح المورد، تحقق من الاتصال ثم أعد المحاولة</p>
            <button onClick={onClose} className="mt-4 text-sm text-cyan-700 hover:underline">الذهاب إلى الصفحة الرئيسية</button>
          </>
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        )}
      </div>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [route, setRoute] = useState<PublicRoute>(() => readPublicRoute());

  const closeRoute = useCallback(() => { clearPublicRoute(); setRoute(null); }, []);
  const zadFallback = useCallback(() => {
    setRoute(current => (current?.kind === 'zad' ? { kind: 'survey', slug: current.slug } : current));
  }, []);

  useEffect(() => {
    const zadSlug = new URLSearchParams(window.location.search).get('zad');
    if (zadSlug) {
      const el = document.getElementById('zad-library');
      if (el) {
        setActiveSection('zad-library');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  if (route?.kind === 'survey') return <PublicSurveyPage slug={route.slug} onClose={closeRoute} />;
  if (route?.kind === 'spec-survey') return <StandaloneSpecSurvey surveyId={route.id} onClose={closeRoute} />;
  if (route?.kind === 'zad') return <ZadResourceRedirect slug={route.slug} onFallback={zadFallback} onClose={closeRoute} />;
  if (new URLSearchParams(window.location.search).has('migrate')) {
    return <AuthGate><MigrateDataPage onClose={() => { window.location.href = '/'; }} /></AuthGate>;
  }
  if (route?.kind === 'clinic') {
    return (
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 pt-6 flex justify-center"><Logo variant="full" size={48} /></div>
        <DigitalClinic publicMode />
      </div>
    );
  }

  return (
    <AuthGate>
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <main>
        <CounselorProfile />
        <KpiBanner />
        <ProgramsHub searchQuery={searchQuery} />
        <PerformancePortfolio searchQuery={searchQuery} />
        <ReadinessDashboard />
        <FileModulesSection />
        <ValuesMatrixSection />
        <StudentVoice />
        <ParentCouncilSection />
        <SatisfactionSurveysSection />
        <SurveyEngineSection />
        <SurveyAdminSection />
        <SurveyAnalysisSection />
        <CoverageMapSection />
        <ZadLibrarySection />
        <CaseRegistrySection />
        <Phase3MonitoringSection />
        <DigitalClinic />
        <ImpactMeasurement />
        <DataExportSection />
      </main>
      <Footer />
    </div>
    </AuthGate>
  );
}

export default App;
