/**
 * Yazarlık çatısının diğer dalları: şimdilik iskelet.
 * Başlıklar, özetler, beceriler ve planlanan dersler hazır; içerik mevsim mevsim yazılacak
 * (bkz. docs/YAZARLIK_PLANI.md). Bir dalın içeriği yazılınca:
 *   1) ilgili draftUnit(...) çağrısını gerçek bir UnitDef ile değiştir (src/content/<dal>/unitNN.ts),
 *   2) dalın `available` alanını true yap.
 */
import type { BranchDef, SkillDef } from './types';
import { draftUnit } from './storytelling';

const sk = (moduleId: string, id: string, name: string, description: string, links?: string[]): SkillDef => ({
  id,
  moduleId,
  name,
  description,
  links,
});

// ————————————————————————————————————————————— D1
export const observationBranch: BranchDef = {
  id: 'gozlem',
  order: 1,
  title: 'Yazmaya Başlamak: Gözlem ve Alışkanlık',
  short: 'Gözlem',
  description: 'Gördüğünü düşündüğünden ayırmak, akışı kesmeden yazmak, nottan sahneye geçmek.',
  available: false,
  skills: [
    sk('gozlem', 'gz.gozlem', 'Gözlem', 'Bir yerde, bir insanda tek doğru ayrıntıyı fark etmek.'),
    sk('gozlem', 'gz.yargi-ayrimi', 'Gözlemi yargıdan ayırmak', '"Gördüm" ile "bundan şunu çıkardım"ı ayrı tutmak.'),
    sk('gozlem', 'gz.akis', 'Akışı kesmeden yazmak', 'Taslağı düzeltmeye kalkmadan sonuna kadar götürmek.'),
    sk('gozlem', 'gz.not-sahne', 'Nottan sahneye', 'Yol Defteri\'ndeki ham notu küçük bir sahneye dönüştürmek.'),
  ],
  units: [
    draftUnit(1, 'gz.u01', 'Gördüğün ve düşündüğün', 'Gözlemi yargıdan ayırmak; beş duyu; tek ayrıntı.', ['gz.gozlem', 'gz.yargi-ayrimi'], [
      'Gördüğünü ayır',
      'Beş duyu, üç ayrıntı',
      'Gözlem mi, yorum mu?',
    ]),
    draftUnit(2, 'gz.u02', 'Serbest yazma', 'Akışı kesmeden yazmak; düzeltmeyi sonraya bırakmak.', ['gz.akis'], [
      'İç editörü susturmak',
      'Beş dakikalık akış',
    ]),
    draftUnit(3, 'gz.u03', 'Not ve hafıza', 'Anlık nottan sahneye; olay, duygu ve yorum katmanları.', ['gz.not-sahne'], [
      'Ham not, işlenmiş not',
      'Aynı anı iki uzaklıktan',
    ]),
  ],
};

// ————————————————————————————————————————————— D2
export const languageBranch: BranchDef = {
  id: 'dil',
  order: 2,
  title: 'Dil ve Üslup',
  short: 'Dil',
  description: 'Fiilin gücü, cümle ritmi, paragraf, açıklık; imla ve noktalama.',
  available: false,
  skills: [
    sk('dil', 'dl.fiil', 'Fiil seçimi', 'Genel fiil yerine bağlama ve niyete uygun fiili bulmak.'),
    sk('dil', 'dl.ekonomi', 'Sıfat ve söz ekonomisi', 'Fazla sıfatı, dolguyu, tekrarı ayıklamak.'),
    sk('dil', 'dl.ritim', 'Cümle ritmi', 'Kısa ve uzun cümleyle tempo kurmak.'),
    sk('dil', 'dl.soz-dizimi', 'Söz dizimi', 'Devrik cümleyi ne zaman, neden kullanacağını bilmek.'),
    sk('dil', 'dl.paragraf', 'Paragraf', 'Tek odak, açık geçiş, anlamlı sıra.'),
    sk('dil', 'dl.aciklik', 'Açıklık', 'Belirsiz gönderimi, gereksiz tekrarı bulmak.'),
    sk('dil', 'dl.imla', 'İmla', 'TDK yazım kurallarını doğru uygulamak.'),
    sk('dil', 'dl.noktalama', 'Noktalama', 'Virgül, nokta, iki nokta ve konuşma çizgisini işleviyle kullanmak.'),
  ],
  units: [
    draftUnit(1, 'dl.u01', 'Fiilin gücü', 'Genel fiil yerine bağlama uygun fiil; sıfat ekonomisi.', ['dl.fiil', 'dl.ekonomi'], [
      'Fiile hareket ver',
      'Üç sıfat yerine bir fiil',
    ]),
    draftUnit(2, 'dl.u02', 'Cümle ve ritim', 'Kısa ve uzun cümle; devrik cümle ne zaman işler.', ['dl.ritim', 'dl.soz-dizimi'], [
      'Kısa cümle, uzun cümle',
      'Devrik cümle deneyi',
    ]),
    draftUnit(3, 'dl.u03', 'Paragraf', 'Odak, geçiş, sıra.', ['dl.paragraf'], ['Paragrafın tek fikri', 'Geçişler']),
    draftUnit(4, 'dl.u04', 'Açıklık ve imla', 'Tekrar, dolgu, belirsiz gönderim; yazım ve noktalama.', ['dl.aciklik', 'dl.imla', 'dl.noktalama'], [
      'Dolgu avı',
      'Sık yapılan yazım yanlışları',
      'Noktalamanın işi',
    ]),
  ],
};

// ————————————————————————————————————————————— D4
export const descriptionBranch: BranchDef = {
  id: 'betimleme',
  order: 4,
  title: 'Betimleme, İmge ve Mekân',
  short: 'Betimleme',
  description: 'Tek doğru ayrıntı, ölçülü metafor, karakterin iç dünyasını taşıyan mekân.',
  available: false,
  prerequisites: ['u01'],
  skills: [
    sk('betimleme', 'hk.imge', 'İmge ve duyusal ayrıntı', 'Tek doğru ayrıntıyı bulmak, klişe imgeden kaçmak.', ['foto.ayrinti']),
    sk('betimleme', 'bt.metafor', 'Benzetme ve metafor', 'Benzetmeyi ölçülü ve kişisel gözleme dayanarak kullanmak.'),
    sk('betimleme', 'hk.atmosfer', 'Atmosfer ve mekân', 'Mekânın karakterin iç dünyasını taşıması.', ['video.mekan']),
  ],
  units: [
    draftUnit(1, 'bt.u01', 'Tek ayrıntı', 'Seçici ayrıntı; görselin dışındaki duyular.', ['hk.imge'], [
      'Tek ayrıntı, bütün sahne',
      'Gözün dışına çıkmak',
    ]),
    draftUnit(2, 'bt.u02', 'Benzetme ve klişe', 'Ölçülü metafor; klişeyi kişisel gözlemle tazelemek.', ['bt.metafor'], [
      'Klişeyi tanımak',
      'Kendi benzetmeni bulmak',
    ]),
    draftUnit(3, 'bt.u03', 'Mekân ruh hâlidir', 'Aynı yer, iki duygu; hava, ışık, saat.', ['hk.atmosfer'], [
      'Mekân bir ruh hâlidir',
      'Aynı yer, iki göz',
      'Mekânın değişimi taşıması',
    ]),
  ],
};

// ————————————————————————————————————————————— D5
export const nonfictionBranch: BranchDef = {
  id: 'kurgu-disi',
  order: 5,
  title: 'Kurgu Dışı: Deneme, Anı, Portre',
  short: 'Deneme',
  description: 'Deneyimden düşünceye; gerçek insanları saygıyla anlatmak; okurla doğruluk sözleşmesi.',
  available: false,
  prerequisites: ['u01', 'u02'],
  skills: [
    sk('kurgu-disi', 'kd.soru', 'Merak sorusu', 'Kesin hükümden önce gerçek bir soruyla başlamak.'),
    sk('kurgu-disi', 'hk.deneme', 'Kişisel anlatı ve deneme', 'Deneyimden düşünceye geçmek.'),
    sk('kurgu-disi', 'kd.mimari', 'Denemenin mimarisi', 'Sahne ile fikri örmek; iddia, örnek, karşı görüş.'),
    sk('kurgu-disi', 'kd.portre', 'Portre', 'Bir insanı gözlem, yorum ve tahmini ayırarak anlatmak.'),
    sk('kurgu-disi', 'kd.etik', 'Saygı ve mahremiyet', 'Gerçek insanları istismar etmeden, izin ve bağlamı gözeterek yazmak.'),
    sk('kurgu-disi', 'kd.dogruluk', 'Doğruluk', 'Okurla "bu gerçekten oldu" sözleşmesini korumak.'),
  ],
  units: [
    draftUnit(1, 'kd.u01', 'Merak sorusu', 'Kesin hükümden önce soru; çalışma iddiası.', ['kd.soru'], ['Sorudan başlamak', 'Çalışma iddiası']),
    draftUnit(2, 'kd.u02', 'Deneyimden düşünceye', 'Sahne ve fikir örgüsü; denemenin mimarisi.', ['hk.deneme', 'kd.mimari'], [
      'Sahne fikri sınar',
      'Denemenin iskeleti',
      'Karşı görüşü adil kurmak',
    ]),
    draftUnit(3, 'kd.u03', 'Portre', 'Gözlem, yorum ve tahmin; saygı ve mahremiyet.', ['kd.portre', 'kd.etik'], [
      'Bir insanı görmek',
      'İzin ve bağlam',
    ]),
    draftUnit(4, 'kd.u04', 'Hafıza ve doğruluk', 'Hatırlamanın belirsizliği; doğrulama.', ['kd.dogruluk'], [
      'Hafıza bir anlatıcıdır',
      'Doğrulanabilir olanı kontrol etmek',
    ]),
  ],
};

// ————————————————————————————————————————————— D6
export const travelBranch: BranchDef = {
  id: 'gezi',
  order: 6,
  title: 'Gezi Yazısı',
  short: 'Gezi',
  description: 'Rota değil hikâye: yeri ve insanı görmek, dış yolla iç yolculuğu örmek.',
  available: false,
  prerequisites: ['u01', 'u02'],
  skills: [
    sk('gezi', 'gy.rota-hikaye', 'Rotadan hikâyeye', 'Güzergâh raporunu bir insanın yaşadığı yola dönüştürmek.'),
    sk('gezi', 'gy.yer-insan', 'Yer ve insan', 'Yabancıya egzotikleştirmeden, saygıyla bakmak.'),
    sk('gezi', 'gy.ic-dis', 'İç ve dış yolculuk', 'Dışarıdaki yol ile içerideki değişimi birlikte anlatmak.', ['hk.degisim']),
    sk('gezi', 'gy.deneme', 'Gezi denemesi', 'Bir yerden bir düşünceye varmak.'),
  ],
  units: [
    draftUnit(1, 'gy.u01', 'Rota değil hikâye', 'Güzergâh raporundan anlatıya geçmek.', ['gy.rota-hikaye'], [
      'Kilometre değil insan',
      'Günü bir ana indirmek',
    ]),
    draftUnit(2, 'gy.u02', 'Yer ve insan', 'Yabancıya bakmak; egzotikleştirmeden, istismar etmeden.', ['gy.yer-insan', 'kd.etik'], [
      'Turist bakışı, yolcu bakışı',
      'Konuk olmak, konuk yazmak',
    ]),
    draftUnit(3, 'gy.u03', 'Yolcunun iç yolculuğu', 'Dış yol ile iç değişimi örmek.', ['gy.ic-dis'], [
      'Yol ve değişim',
      'Bir yokuşun iki anlamı',
    ]),
    draftUnit(4, 'gy.u04', 'Gezi denemesi', 'Bir yerden bir düşünceye.', ['gy.deneme'], ['Yerin sorduğu soru', 'Gezi denemesinin mimarisi']),
    draftUnit(5, 'gy.u05', 'Seyahatname geleneği', 'Evliya Çelebi\'den yakın okuma.', ['ok.yakin'], ['Evliya Çelebi\'yi yazar gibi okumak']),
  ],
};

// ————————————————————————————————————————————— D7
export const readingBranch: BranchDef = {
  id: 'okuma',
  order: 7,
  title: 'Okuma, Taklit ve Eleştiri',
  short: 'Okuma',
  description: 'Yazar gibi okumak, taklitten kendi sesine, bir tercihi kanıtla gerekçelendirmek.',
  available: false,
  prerequisites: ['u01'],
  skills: [
    sk('okuma', 'ok.yakin', 'Yakın okuma', 'Bir metnin neden işlediğini sökmek.'),
    sk('okuma', 'ok.taklit', 'Taklit', 'Usta bir cümle yapısını kendi malzemenle yeniden kurmak.'),
    sk('okuma', 'ok.elestiri', 'Kısa eleştiri', 'Bir tercihi metinden kanıtla gerekçelendirmek.'),
  ],
  units: [
    draftUnit(1, 'ok.u01', 'Yazar gibi okumak', 'Okuma notu şablonu; "neden işliyor?"', ['ok.yakin'], ['Tercih, kanıt, etki', 'İlk cümleyi sökmek']),
    draftUnit(2, 'ok.u02', 'Taklitten sese', 'Franklin alıştırması: notlardan yeniden yaz, aslıyla karşılaştır.', ['ok.taklit'], [
      'Franklin yöntemi',
      'Yapıyı al, malzemeyi değiştir',
    ]),
    draftUnit(3, 'ok.u03', 'Kısa eleştiri', 'Bir tercihi metinden kanıtla gerekçelendirmek.', ['ok.elestiri'], ['Kanıtla konuşmak']),
  ],
};

// ————————————————————————————————————————————— D8
export const screenBranch: BranchDef = {
  id: 'ekran',
  order: 8,
  title: 'Görüntü ve Ses İçin Yazmak',
  short: 'Ekran',
  description: 'Görüntüyle anlatmak, kulak için yazmak; kısa video tek fikir, uzun video süreç taşır.',
  available: false,
  prerequisites: ['u01', 'u03'],
  skills: [
    sk('ekran', 'hk.ekran', 'Ekranda hikâye', 'Görüntüyle, sesle ve sessizlikle anlatmak.', ['video.plan-turleri']),
    sk('ekran', 'ek.seslendirme', 'Seslendirme metni', 'Kulak için yazmak; sessizliğe yer bırakmak.', ['video.ses']),
    sk('ekran', 'ek.uzun-yapi', 'Uzun video yapısı', 'Süreci ve deneyimi bölümlere ayırmak.'),
  ],
  units: [
    draftUnit(1, 'ek.u01', 'Görüntü cümledir', 'Plan türleriyle düşünmek; açıklamadan göstermek.', ['hk.ekran'], ['Görüntü cümledir', 'Ses ve sessizlik']),
    draftUnit(2, 'ek.u02', 'Seslendirme metni', 'Kulak için yazmak.', ['ek.seslendirme'], ['Göz için cümle, kulak için cümle']),
    draftUnit(3, 'ek.u03', 'Kısa video', 'Tek güçlü fikir; ilk 3 saniye.', ['video.ilk-uc-saniye'], ['İlk üç saniye', 'Tek fikir']),
    draftUnit(4, 'ek.u04', 'Uzun video', 'Süreç ve deneyim; bölüm yapısı.', ['ek.uzun-yapi'], ['Sürecin hikâyesi', 'Bölümler ve nefes']),
  ],
};

// ————————————————————————————————————————————— D9 (seçmeli)
export const poetryBranch: BranchDef = {
  id: 'siir',
  order: 9,
  title: 'Şiir ve Yoğunluk',
  short: 'Şiir',
  description: 'İmge ve somut nesne; ses, tekrar, dize kırılımı; sezdirmek.',
  available: false,
  elective: true,
  skills: [
    sk('siir', 'sr.imge', 'Şiirde imge', 'Soyut duyguyu somut nesneyle taşımak.'),
    sk('siir', 'sr.ses', 'Ses ve dize', 'Tekrar, ritim ve dize kırılımıyla anlam kurmak.'),
  ],
  units: [
    draftUnit(1, 'sr.u01', 'İmge ve nesne', 'Soyut duyguyu nesne ve hareketle denemek.', ['sr.imge'], ['Nesne konuşur']),
    draftUnit(2, 'sr.u02', 'Ses, tekrar, dize', 'Ritim ve dize kırılımı.', ['sr.ses'], ['Dizeyi nereden kırmalı?']),
    draftUnit(3, 'sr.u03', 'Sezdirmek', 'Açıklamak ile sezdirmenin etkisi.', ['sr.imge'], ['Bir dizeyi çıkarmak']),
  ],
};

// ————————————————————————————————————————————— D10
export const revisionBranch: BranchDef = {
  id: 'revizyon',
  order: 10,
  title: 'Revizyon ve Proje',
  short: 'Revizyon',
  description: 'Katman katman yeniden yazmak, kesmek, bir kitabın mimarisini kurmak, dosyayı yayına hazırlamak.',
  available: false,
  prerequisites: ['u01'],
  skills: [
    sk('revizyon', 'rv.katman', 'Revizyon katmanları', 'Yapı, paragraf, cümle, kelime: her geçişte tek katmana bakmak.'),
    sk('revizyon', 'rv.kesme', 'Kesmek', 'Anlamı koruyarak metni kısaltmak.'),
    sk('revizyon', 'rv.proje', 'Proje mimarisi', 'Kısa metinleri bir kitap ya da dizi hâlinde düzenlemek.'),
  ],
  units: [
    draftUnit(1, 'rv.u01', 'Revizyonun katmanları', 'Yapı → paragraf → cümle → kelime.', ['rv.katman'], [
      'Taslak ile düzeltmeyi ayırmak',
      'Yapı geçişi',
      'Cümle geçişi',
    ]),
    draftUnit(2, 'rv.u02', 'Kesmek', '%20 kısaltma; ilk paragrafı silme deneyi.', ['rv.kesme'], ['Yüzde yirmi', 'İlk paragrafı silmek']),
    draftUnit(3, 'rv.u03', 'Proje mimarisi', 'Deneme dizisi, bölüm yapısı, malzeme arşivi.', ['rv.proje'], ['Kitabın iskeleti']),
    draftUnit(4, 'rv.u04', 'Dosyalama ve yayın', 'Dergiye ve yayınevine dosya; telif sözleşmesi.', ['rv.proje'], [
      'Dosya hazırlamak',
      'Sözleşmeyi okumak',
    ]),
  ],
};
