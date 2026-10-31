/// <reference types="vite/client" />

// مكتبات تُحمّل وقت الاستخدام من CDN (قراءة ملفات Excel)
declare module 'https://cdn.sheetjs.com/*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any;
  export = mod;
}
