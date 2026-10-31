import { supabase, createEvidence, type EvidenceRecord } from './supabase';
import { counselor } from '@/data';

/* ============ ملف الموجّه ============ */
export interface CounselorProfile {
  name: string; title: string; school: string; ministry: string; region: string; year: string;
  email: string; phone: string; experience: string; students: number; bio: string;
}

export const DEFAULT_PROFILE: CounselorProfile = {
  name: counselor.name, title: 'الموجّه الطلابي', school: counselor.school, ministry: counselor.ministry,
  region: counselor.region, year: counselor.year, email: counselor.email, phone: counselor.phone,
  experience: counselor.experience, students: counselor.students, bio: '',
};

export async function fetchProfile(): Promise<CounselorProfile> {
  const { data } = await supabase.from('guidance_profile').select('data').eq('id', 1).maybeSingle();
  return { ...DEFAULT_PROFILE, ...((data?.data as Partial<CounselorProfile>) || {}) };
}

export async function saveProfile(profile: CounselorProfile): Promise<void> {
  const { error } = await supabase.from('guidance_profile').upsert({ id: 1, data: profile, updated_at: new Date().toISOString() });
  if (error) throw new Error('تعذر حفظ الملف');
}

/* ============ البرامج الإرشادية ============ */
export type ProgramPath = 'preventive' | 'developmental' | 'remedial';
export type ProgramStatus = 'planned' | 'in_progress' | 'completed';
export interface ProgramRecord {
  id: string; title: string; path: ProgramPath; zad_program: string | null; target_group: string | null;
  date_gregorian: string | null; date_hijri: string | null; status: ProgramStatus; description: string | null;
  objectives: string[]; activities: string[]; outcomes: string[]; beneficiaries: number; indicator_codes: string[]; created_at: string;
}
export const PATH_LABELS: Record<ProgramPath, string> = { preventive: 'المسار الوقائي', developmental: 'المسار النمائي', remedial: 'المسار العلاجي' };
export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = { planned: 'مخطط', in_progress: 'قيد التنفيذ', completed: 'مكتمل' };

export async function fetchPrograms(): Promise<ProgramRecord[]> {
  const { data, error } = await supabase.from('guidance_programs').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('تعذر تحميل البرامج');
  return (data || []) as ProgramRecord[];
}
export async function saveProgram(p: Partial<ProgramRecord> & { title: string }): Promise<void> {
  const row = { ...p };
  delete (row as Record<string, unknown>).created_at;
  const { error } = p.id
    ? await supabase.from('guidance_programs').update(row).eq('id', p.id)
    : await supabase.from('guidance_programs').insert(row);
  if (error) throw new Error('تعذر حفظ البرنامج');
}
export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_programs').delete().eq('id', id);
  if (error) throw new Error('تعذر حذف البرنامج');
}

/* ============ الأداء الوظيفي ============ */
export interface PerformanceRow { criterion_id: number; score: number | null; notes: string | null }
export async function fetchPerformance(): Promise<Record<number, PerformanceRow>> {
  const { data } = await supabase.from('guidance_performance').select('*');
  return Object.fromEntries(((data || []) as PerformanceRow[]).map(r => [r.criterion_id, r]));
}
export async function savePerformance(row: PerformanceRow): Promise<void> {
  const { error } = await supabase.from('guidance_performance').upsert({ ...row, updated_at: new Date().toISOString() });
  if (error) throw new Error('تعذر حفظ التقييم');
}

/* ============ اجتماعات المجالس (الآباء / الطلاب) ============ */
export type CouncilTable = 'guidance_parent_council' | 'guidance_student_council';
export interface CouncilMeeting {
  id: string; meeting_date_hijri: string; meeting_date_gregorian: string | null; topic: string; attendees_count: number;
  recommendations: string | null; status: string; status_label: string; report_evidence_id: string | null; indicator_codes: string[]; created_at: string;
}
export async function fetchMeetings(table: CouncilTable): Promise<CouncilMeeting[]> {
  const { data, error } = await supabase.from(table).select('*').order('meeting_date_gregorian', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  if (error) throw new Error('تعذر تحميل الاجتماعات');
  return (data || []) as CouncilMeeting[];
}
export async function saveMeeting(table: CouncilTable, m: Partial<CouncilMeeting>): Promise<void> {
  const row = { ...m };
  delete (row as Record<string, unknown>).created_at;
  const { error } = m.id ? await supabase.from(table).update(row).eq('id', m.id) : await supabase.from(table).insert(row);
  if (error) throw new Error(`تعذر حفظ الاجتماع: ${error.message}`);
}
export async function deleteMeeting(table: CouncilTable, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error('تعذر حذف الاجتماع');
}

/** رفع تقرير PDF يُحفظ شاهدًا مرتبطًا بالمؤشرات، ويعيد سجل الشاهد */
export async function uploadReport(file: File, title: string, module: string, indicatorCodes: string[], dateHijri?: string): Promise<EvidenceRecord> {
  return createEvidence({ file, title, module, category: title, activityTitle: title, indicatorCodes, dateHijri });
}

export async function fetchEvidenceByIds(ids: string[]): Promise<Record<string, EvidenceRecord>> {
  if (!ids.length) return {};
  const { data } = await supabase.from('guidance_evidence').select('*').in('id', ids);
  return Object.fromEntries(((data || []) as EvidenceRecord[]).map(e => [e.id, e]));
}
