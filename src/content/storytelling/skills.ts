import type { SkillDef } from '../types';

const m = 'hikaye';

/**
 * Hikâye Anlatımı modülünün beceri ağacı.
 * Alt beceriler (parent alanı olanlar) zorlanıldığında motorun indiği "küçük adımlar"dır.
 * `links`, gelecekteki modüllerdeki akraba becerileri gösterir (henüz tanımlı olmasa da olur).
 */
export const storytellingSkills: SkillDef[] = [
  // Ünite 1 — Olay ve hikâye
  { id: 'hk.olay-hikaye', moduleId: m, name: 'Olay ile hikâyeyi ayırmak', description: '"Ne oldu" ile "bu kişiye ne oldu ve onu nasıl değiştirdi" arasındaki farkı görmek.' },
  { id: 'hk.istek', moduleId: m, name: 'İsteği kurmak', description: 'Karakterin o an somut olarak ne istediğini okura hissettirmek.' },
  { id: 'hk.engel', moduleId: m, name: 'Engeli kurmak', description: 'İsteğin önüne gerçek, hissedilir bir direnç koymak.' },
  { id: 'hk.degisim-yapi', moduleId: m, name: 'Değişimi yapıya koymak', description: 'Hikâyenin, başta olmayan bir şeyle bitmesi.' },

  // Ünite 2 — Değişimi görünür kılmak
  { id: 'hk.degisim', moduleId: m, name: 'Değişimi görünür kılmak', description: 'Karakterin içindeki değişimi okurun gözü önünde gerçekleştirmek.', links: ['video.oncesi-sonrasi'] },
  { id: 'hk.degisim.onceki', moduleId: m, parent: 'hk.degisim', name: 'Önceki hâli göstermek', description: 'Değişimden önceki hâli (sabırsızlık, öfke, korku) sahnede görünür kılmak.' },
  { id: 'hk.degisim.kirilma', moduleId: m, parent: 'hk.degisim', name: 'Kırılma anını kurmak', description: 'Değişimin olduğu küçük, somut anı yakalamak.' },
  { id: 'hk.degisim.sonraki', moduleId: m, parent: 'hk.degisim', name: 'Sonraki hâli göstermek', description: 'Yeni hâli bir sonuç cümlesiyle değil, farklı bir davranışla göstermek.' },
  { id: 'hk.degisim.davranis', moduleId: m, parent: 'hk.degisim', name: 'İç değişimi davranışa çevirmek', description: 'Duygudaki kaymayı ellerin, adımların, seçimlerin kaymasıyla anlatmak.' },

  // Ünite 3 — Göster, anlatma
  { id: 'hk.goster', moduleId: m, name: 'Göster, anlatma', description: 'Duyguyu adlandırmak yerine okura yaşatmak.', links: ['foto.an'] },
  { id: 'hk.goster.adlandirma', moduleId: m, parent: 'hk.goster', name: 'Duygu adlarını fark etmek', description: 'Metindeki "üzgündüm, mutluydum" türü etiketleri yakalamak.' },
  { id: 'hk.goster.beden', moduleId: m, parent: 'hk.goster', name: 'Duyguyu bedene yüklemek', description: 'Duyguyu nefese, ellere, mideye, sese taşımak.' },
  { id: 'hk.goster.nesne', moduleId: m, parent: 'hk.goster', name: 'Duyguyu nesneye ve eyleme yüklemek', description: 'Duyguyu bir eşyanın, bir hareketin, bir seçimin taşımasını sağlamak.' },

  // Ünite 4–13 — yapısı hazır, içerik sonraki aşamada
  { id: 'hk.imge', moduleId: m, name: 'İmge ve duyusal ayrıntı', description: 'Tek doğru ayrıntıyı bulmak, klişe imgeden kaçmak.', links: ['foto.ayrinti'] },
  { id: 'hk.atmosfer', moduleId: m, name: 'Atmosfer ve mekân', description: 'Mekânın karakterin iç dünyasını taşıması.', links: ['video.mekan'] },
  { id: 'hk.karakter', moduleId: m, name: 'Karakter', description: 'Arzu, korku ve çelişkiyle canlı insanlar kurmak.' },
  { id: 'hk.merak', moduleId: m, name: 'Merak ve gerilim', description: 'Soru açmak, cevabı geciktirmek.' },
  { id: 'hk.bakis', moduleId: m, name: 'Bakış açısı ve anlatıcı', description: 'Kimin gözünden, hangi sesle anlatıldığını bilinçle seçmek.' },
  { id: 'hk.ritim', moduleId: m, name: 'Zaman ve ritim', description: 'Sahne ile özet arasında geçiş, cümle uzunluğuyla tempo.', links: ['video.kurgu-ritmi'] },
  { id: 'hk.diyalog', moduleId: m, name: 'Diyalog', description: 'Az konuşan ama çok şey söyleyen diyalog; alt metin.' },
  { id: 'hk.acilis', moduleId: m, name: 'Açılış ve kapanış', description: 'İlk cümlenin vaadi, kapanışın yankısı.', links: ['video.ilk-uc-saniye'] },
  { id: 'hk.deneme', moduleId: m, name: 'Kişisel anlatı ve deneme', description: 'Deneyimden düşünceye geçmek.' },
  { id: 'hk.ekran', moduleId: m, name: 'Ekranda hikâye', description: 'Görüntüyle, sesle ve sessizlikle anlatmak.', links: ['video.plan-turleri'] },
];
