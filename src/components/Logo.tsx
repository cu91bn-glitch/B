interface LogoProps {
  variant?: 'full' | 'icon' | 'mono-light' | 'mono-dark';
  size?: number;
  className?: string;
}

export function Logo({ variant = 'full', size = 44, className = '' }: LogoProps) {
  const srcMap: Record<string, string> = {
    'full': '/brand/bawsala-lockup.svg',
    'icon': '/brand/bawsala-icon.svg',
    'mono-light': '/brand/logo-mono-light.svg',
    'mono-dark': '/brand/logo-mono-dark.svg',
  };
  const src = srcMap[variant];

  if (variant === 'full') {
    return (
      <img
        src={src}
        alt="بوصلة — منصة الموجّه الطلابي"
        style={{ height: size, width: 'auto' }}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt="بوصلة"
      style={{ height: size, width: size }}
      className={`object-contain ${className}`}
    />
  );
}
