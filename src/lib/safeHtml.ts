export function safeHtml(val: any, fallback: string = ''): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && 'stringValue' in val) return val.stringValue || fallback;
  return String(val);
}
