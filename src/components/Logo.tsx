import { FOUNDER_NAME } from '@/lib/brand';

interface LogoProps {
  variant?: 'full' | 'icon' | 'mono-light' | 'mono-dark';
  size?: number;
  className?: string;
  /** يعرض اسم المؤسس تحت الشعار */
  withFounder?: boolean;
  founderClassName?: string;
}

const srcMap: Record<string, string> = {
  full: '/brand/bawsala-lockup.png',
  icon: '/brand/bawsala-icon.svg',
  'mono-light': '/brand/logo-mono-light.svg',
  'mono-dark': '/brand/logo-mono-dark.svg',
};

export function Logo({ variant = 'full', size = 44, className = '', withFounder = false, founderClassName = '' }: LogoProps) {
  const img = variant === 'full'
    ? <img src={srcMap.full} alt="بوصلة — منصة الموجّه الطلابي" style={{ height: size, width: 'auto' }} className="object-contain mix-blend-multiply" />
    : <img src={srcMap[variant]} alt="بوصلة" style={{ height: size, width: size }} className="object-contain" />;
  if (!withFounder) return <span className={`inline-flex ${className}`}>{img}</span>;
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      {img}
      <span className={`mt-1 text-[12px] font-bold text-brand-800 tracking-normal ${founderClassName}`}>{FOUNDER_NAME}</span>
    </span>
  );
}
