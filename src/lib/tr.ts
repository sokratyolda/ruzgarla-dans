/**
 * Türkçe yardımcıları. Büyük/küçük harf dönüşümü HER ZAMAN tr-TR yereliyle yapılır;
 * böylece "i → İ" ve "ı → I" doğru çalışır ("istanbul" → "İSTANBUL", "IRMAK" → "ırmak").
 */
export const LOCALE = 'tr-TR';

export const upper = (s: string) => s.toLocaleUpperCase(LOCALE);
export const lower = (s: string) => s.toLocaleLowerCase(LOCALE);
/** İlk harfi büyüt (Türkçe kurallarıyla) */
export const capitalize = (s: string) => (s ? upper(s[0]) + s.slice(1) : s);

/** Arama ve karşılaştırma için: küçük harfe çevirir, boşlukları sadeleştirir */
export const normalize = (s: string) => lower(s).replace(/\s+/g, ' ').trim();

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Yerel saatle YYYY-MM-DD */
export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return today(dt);
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** Haftanın pazartesisi (YYYY-MM-DD) */
export function weekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // pazartesi = 0
  dt.setDate(dt.getDate() - dow);
  return today(dt);
}

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString(LOCALE, opts);

export const DAY_NAMES_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Günün saatine göre sakin bir selam */
export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Gece yarısı';
  if (h < 11) return 'Günaydın';
  if (h < 17) return 'İyi günler';
  if (h < 21) return 'İyi akşamlar';
  return 'İyi geceler';
}

/**
 * Sayıya tamlayan (-in) eki: 1'in, 2'nin, 3'ün, 6'nın, 9'un, 10'un…
 * Sayının okunuşunun son ünlüsüne ve son sesine göre seçilir.
 */
export function genitive(n: number): string {
  const ones = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  const word = n % 10 ? ones[n % 10] : n % 100 ? tens[Math.floor(n / 10) % 10] : n === 0 ? 'sıfır' : 'yüz';
  const vowel = [...word].reverse().find((c) => 'aeıioöuü'.includes(c)) ?? 'e';
  const harmony: Record<string, string> = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' };
  const v = harmony[vowel];
  const endsWithVowel = 'aeıioöuü'.includes(word[word.length - 1]);
  return `${n}'${endsWithVowel ? 'n' : ''}${v}n`;
}
