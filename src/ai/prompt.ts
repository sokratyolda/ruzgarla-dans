/**
 * Yapay zekâ değerlendirmesinin sistem talimatı ve istek metni.
 * Aynı metin "Metni ve rubriği kopyala" düğmesinde de kullanılır; böylece elle
 * başka bir yapay zekâya yapıştırıldığında da aynı ölçütlerle değerlendirilir.
 */
import { skillById } from '../content';
import type { WritingExercise } from '../content/types';

export const SYSTEM_PROMPT = `Sen Türkçe yazan genç bir yazarın hikâye anlatımı öğretmenisin. Öğrencin Muhammed: 2024'ten beri bisikletle, çadırla, yalnız başına yolculuk ediyor; yol, doğa, insan karşılaşmaları ve düşünce üzerine yazıyor ve video hazırlıyor. Ana dili Türkçe.

Görevin, bir alıştırmaya yazdığı metni verilen ölçütlere göre değerlendirmek.

Tutumun:
- Sıcak ama dürüst ve derin ol. Pohpohlama. "Harika!", "Muhteşem!" gibi boş övgüler ve klişe kişisel gelişim cümleleri kullanma.
- Önce gerçekten iyi işleyen bir şeyi, metinden somut bir parçaya dayanarak söyle.
- Zayıf yeri açıkça göster: metindeki ilgili kelimeyi ya da cümleyi alıntıla, neden işlemediğini bir iki cümleyle açıkla.
- Yalnızca TEK bir somut öneri ver. Birden fazla şey varsa en önemlisini seç.
- Her zaman bir sonraki adımı ver: kısa, yapılabilir bir yeniden yazma görevi. Görev metnin kendisine özgü olsun (genel "daha iyi yaz" değil).
- Metni senin yerine yeniden yazma; yol göster.
- Puanlarken cömert olma ama acımasız da olma: 0–39 henüz yok, 40–59 sezgisel/yarım, 60–79 bilinçli ve işliyor, 80–100 ustaca.
- Yazım ve noktalama hatalarına yalnızca anlamı bozuyorsa değin.
- Türkçe yaz; doğal, edebî ama sade bir dil kullan. Kısa tut.

Çıktı yalnızca istenen JSON yapısında olmalı.`;

/** Değerlendirilecek metni ve ölçütleri tek bir mesajda toplar */
export function buildUserMessage(ex: WritingExercise, response: string | Record<string, string>, previous?: string): string {
  const lines: string[] = [];
  lines.push(`ALIŞTIRMA TÜRÜ: ${ex.type === 'rewrite' ? 'Yeniden yaz' : ex.type === 'video' ? 'Video düşüncesi (yazılı plan)' : 'Kendi malzemenle yaz'}`);
  lines.push(`GÖREV: ${ex.prompt}`);
  if (ex.type === 'rewrite') lines.push(`\nGÜÇLENDİRİLECEK ZAYIF METİN:\n"""${ex.source}"""`);
  lines.push('\nÖLÇÜTLER (beceri kimliği → ölçüt):');
  for (const r of ex.rubric) lines.push(`- [${r.skill}] ${skillById.get(r.skill)?.name ?? r.skill}: ${r.criterion}`);
  if (previous) lines.push(`\nÖĞRENCİNİN BİR ÖNCEKİ HÂLİ (karşılaştır, gelişimi fark et):\n"""${previous}"""`);
  lines.push('\nÖĞRENCİNİN METNİ:');
  lines.push(`"""${formatResponse(response)}"""`);
  lines.push(
    `\nHer beceri kimliği için 0–100 arası bir puan ve tek cümlelik not ver. Beceri kimlikleri: ${uniqueSkills(ex).join(', ')}.`,
  );
  return lines.join('\n');
}

export function formatResponse(response: string | Record<string, string>): string {
  if (typeof response === 'string') return response;
  return Object.entries(response)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

export const uniqueSkills = (ex: WritingExercise) => [...new Set(ex.rubric.map((r) => r.skill))];

/** Değerlendirme çıktısının JSON şeması (yapılandırılmış çıktı) */
export function feedbackSchema(ex: WritingExercise) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['skills', 'strength', 'comment', 'suggestion', 'rewriteTask'],
    properties: {
      skills: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['skill', 'score', 'note'],
          properties: {
            skill: { type: 'string', enum: uniqueSkills(ex) },
            score: { type: 'integer', description: '0–100 arası puan' },
            note: { type: 'string', description: 'Tek cümlelik gerekçe' },
          },
        },
      },
      strength: { type: 'string', description: 'Metinde gerçekten işleyen bir şey, somut alıntıyla (1–2 cümle).' },
      comment: { type: 'string', description: 'Zayıf yer: alıntıla ve neden işlemediğini açıkla (2–3 cümle).' },
      suggestion: { type: 'string', description: 'Tek bir somut öneri (1–2 cümle).' },
      rewriteTask: { type: 'string', description: 'Bu metne özgü, kısa ve yapılabilir bir yeniden yazma görevi.' },
    },
  } as const;
}

/** Elle başka bir yapay zekâya yapıştırmak için tam metin */
export function buildCopyText(ex: WritingExercise, response: string | Record<string, string>): string {
  return `${SYSTEM_PROMPT}

---

${buildUserMessage(ex, response)}

Lütfen şu biçimde cevap ver:
- Her beceri için puan (0–100) ve tek cümlelik not
- İyi işleyen şey
- Zayıf yer
- Tek somut öneri
- Yeniden yazma görevi`;
}
