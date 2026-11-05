/**
 * "Yardım Al": o anki ders bağlamıyla hazır bir istem (prompt) üretir.
 * Uygulama hiçbir şey göndermez; istemi sen görür, istersen düzenler, kopyalar ya da paylaşırsın
 * ve kendi seçtiğin araca (ChatGPT, Claude, başka bir yapay zekâ ya da bir öğretmen) taşırsın.
 *
 * Bütün istemler aynı ilkeyi taşır: yardım eden senin yerine yazmaz; yol gösterir.
 */
import { skillById } from '../content';
import type { RubricItem } from '../content/types';

export type HelpMode = 'degerlendir' | 'acikla' | 'fikir';

export const HELP_MODES: { id: HelpMode; label: string; desc: string }[] = [
  { id: 'degerlendir', label: 'Metnimi değerlendir', desc: 'Neyin işlediğini, tek bir zayıf yeri ve bir sonraki adımı sor.' },
  { id: 'acikla', label: 'Konuyu açıkla', desc: 'Kavramı başka bir örnekle, sade bir dille anlatmasını iste.' },
  { id: 'fikir', label: 'Fikir geliştirmeme yardım et', desc: 'Senin yerine yazmadan, sorularla düşünmeni açsın.' },
];

export interface HelpContext {
  /** Ders, alıştırma ya da taslak başlığı */
  title?: string;
  /** Görev ya da soru metni */
  task?: string;
  /** Kavramın kısa anlatımı (kavram kartı, açıklama) */
  concept?: string;
  /** Senin metnin (varsa) */
  text?: string;
  /** Güçlendirilecek kaynak metin (yeniden yazma alıştırması) */
  source?: string;
  rubric?: RubricItem[];
  skills?: string[];
}

const RULES = `Kurallar:
- Türkçe yaz; sade ve sıcak ol ama pohpohlama. "Harika!" gibi boş övgüler kullanma.
- Benim yerime metin yazma ve metnimi baştan yeniden yazma. Yol göster, gerekirse soru sor.
- Kısa tut. Bir kerede en fazla bir iki öneri.`;

const skillNames = (ids?: string[]) =>
  (ids ?? []).map((s) => skillById.get(s)?.name).filter(Boolean).join(', ');

export function buildHelpPrompt(mode: HelpMode, c: HelpContext): string {
  const head = `Hikâye anlatımı ve yazarlık öğreniyorum. Bisikletle, çadırla yolculuk ediyor; yol, doğa ve insanlar üzerine yazıyorum.`;
  const ctx: string[] = [];
  if (c.title) ctx.push(`Konu: ${c.title}`);
  if (c.skills?.length) ctx.push(`Çalıştığım beceriler: ${skillNames(c.skills)}`);
  if (c.task) ctx.push(`Görev: ${c.task}`);
  if (c.concept) ctx.push(`Kavram (uygulamadaki anlatım): ${c.concept}`);
  if (c.source) ctx.push(`Güçlendirmem istenen zayıf metin:\n"""${c.source}"""`);

  if (mode === 'degerlendir') {
    const rubric = c.rubric?.length
      ? `\nŞu ölçütlere göre bak:\n${c.rubric.map((r) => `- ${r.criterion}`).join('\n')}`
      : '';
    return `${head}

${ctx.join('\n')}
${rubric}

Metnim:
"""${c.text ?? ''}"""

Lütfen:
1. Metinde gerçekten işleyen bir şeyi, metinden somut bir parçaya dayanarak söyle.
2. Tek bir zayıf yeri göster: ilgili kelimeyi ya da cümleyi alıntıla, neden işlemediğini açıkla.
3. Bir sonraki adım olarak bu metne özgü, kısa bir yeniden yazma görevi ver.

${RULES}`;
  }

  if (mode === 'acikla') {
    return `${head}

${ctx.join('\n')}

Bu konuyu bana açıklar mısın?
- Önce bağlamı, sonra işleyişini anlat; tek bir fikir, tek bir örnek.
- Örneği benim dünyamdan seç: yol, çadır, köy kahvesi, yokuş, yabancıyla karşılaşma.
- Sonunda, anlayıp anlamadığımı sınamam için bana tek bir kısa soru sor.

${RULES}`;
  }

  return `${head}

${ctx.join('\n')}
${c.text ? `\nŞu ana kadar yazdığım ya da düşündüğüm:\n"""${c.text}"""\n` : ''}
Bu konuda fikrimi geliştirmeme yardım eder misin?
- Bana yazacağım şeyi söyleme; bunun yerine düşünmemi açacak üç soru sor.
- Sorular somut olsun: bir an, bir nesne, bir beden hareketi, bir ses üzerine.
- Cevaplarımı bekle; ben cevap verince bir sonraki adımı öner.

${RULES}`;
}
