import type { ModuleDef, UnitDef } from '../types';
import { storytellingSkills } from './skills';
import { unit01 } from './unit01';
import { unit02 } from './unit02';
import { unit03 } from './unit03';

/** Ünite 4–13: başlık, özet, temel beceri ve planlanan dersler hazır; içerik sonraki aşamada. */
const draft = (
  number: number,
  id: string,
  title: string,
  summary: string,
  keySkill: string,
  plannedLessons: string[],
): UnitDef => ({ id, number, title, summary, keySkills: [keySkill], lessons: [], practice: [], draft: true, plannedLessons });

const futureUnits: UnitDef[] = [
  draft(4, 'u04', 'İmge ve duyusal ayrıntı', 'Tek doğru ayrıntının gücü. Herkesin göreceği yerine yalnızca senin gördüğün.', 'hk.imge', [
    'Tek ayrıntı, bütün sahne',
    'Beş duyu: gözün dışına çıkmak',
    'Klişe imgeyi tanımak ve tazelemek',
    'İmgeyi duyguya bağlamak',
  ]),
  draft(5, 'u05', 'Atmosfer ve mekân', 'Mekân dekor değil, karakterin iç dünyasının dışarıdaki yansıması. Tanpınar\'daki mekân-ruh ilişkisi gibi.', 'hk.atmosfer', [
    'Mekân bir ruh hâlidir',
    'Hava, ışık, saat',
    'Aynı mekân, iki farklı göz',
    'Mekânın değişimi taşıması',
  ]),
  draft(6, 'u06', 'Karakter', 'Arzu, korku, çelişki. Yolda karşılaştığın insanları istismar etmeden karaktere dönüştürmek.', 'hk.karakter', [
    'Arzu ve korku',
    'Çelişki: insanı canlı kılan',
    'Gerçek insandan karaktere',
    'Saygı ve mahremiyet',
  ]),
  draft(7, 'u07', 'Merak ve gerilim', 'Soru açmak, cevabı geciktirmek, beklenti kurmak.', 'hk.merak', [
    'Okurun kafasındaki soru',
    'Geciktirmenin sanatı',
    'Küçük gerilimler: yokuş, akşam, su',
  ]),
  draft(8, 'u08', 'Bakış açısı ve anlatıcı', 'Birinci tekil, üçüncü tekil, iç ses; anlatıcının güvenilirliği.', 'hk.bakis', [
    'Ben mi, o mu?',
    'İç ses',
    'Güvenilmez anlatıcı',
  ]),
  draft(9, 'u09', 'Zaman ve ritim', 'Sahne ile özet arasında geçiş; cümle uzunluğuyla tempo kurmak.', 'hk.ritim', [
    'Sahne ve özet',
    'Cümle uzunluğu tempodur',
    'Zamanı esnetmek: bir saniyeyi uzatmak',
  ]),
  draft(10, 'u10', 'Diyalog', 'Az konuşan ama çok şey söyleyen diyalog; alt metin.', 'hk.diyalog', [
    'Diyalog bilgi taşımaz, ilişki taşır',
    'Alt metin',
    'Konuşmayan cevaplar',
  ]),
  draft(11, 'u11', 'Açılış ve kapanış', 'İlk cümlenin vaadi, kapanışın yankısı, açık uçlu bitiş.', 'hk.acilis', [
    'İlk cümlenin vaadi',
    'Kapanışın yankısı',
    'Açık uçlu bitiş',
  ]),
  draft(12, 'u12', 'Kişisel anlatı ve deneme', 'Kendi deneyiminden düşünceye geçmek; anlatı ile fikrin örülmesi.', 'hk.deneme', [
    'Deneyimden düşünceye',
    'Denemenin mimarisi',
    'Fikri sahneyle sınamak',
  ]),
  draft(13, 'u13', 'Ekranda hikâye', 'Görüntüyle anlatmak, ses ve sessizlik, kurgu ritmi; kısa video tek güçlü fikir, uzun video süreç ve deneyim taşır.', 'hk.ekran', [
    'Görüntü cümledir',
    'Ses ve sessizlik',
    'Kurgu ritmi',
    'Kısa video, uzun video',
  ]),
];

export const storytellingModule: ModuleDef = {
  id: 'hikaye',
  title: 'Hikâye Anlatımı',
  description: 'Yazıda ve videoda: olaydan hikâyeye, değişimden sese.',
  available: true,
  skills: storytellingSkills,
  units: [unit01, unit02, unit03, ...futureUnits],
};
