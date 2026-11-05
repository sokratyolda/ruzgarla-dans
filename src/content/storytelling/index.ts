import type { BranchDef, UnitDef } from '../types';
import { storytellingSkills } from './skills';
import { unit01 } from './unit01';
import { unit02 } from './unit02';
import { unit03 } from './unit03';

/** Taslak ünite: başlık, özet, temel beceri ve planlanan dersler hazır; içerik sonraki aşamada. */
export const draftUnit = (
  number: number,
  id: string,
  title: string,
  summary: string,
  keySkills: string[],
  plannedLessons: string[],
): UnitDef => ({ id, number, title, summary, keySkills, lessons: [], practice: [], draft: true, plannedLessons });

/**
 * Hikâye dalının taslak üniteleri (4–9).
 * Kimlikler (u06, u07…) eski 13 üniteli plandan kalma; ilerleme kayıtlarıyla uyum için değiştirilmedi.
 * İmge/Atmosfer → Betimleme dalı, Deneme → Kurgu Dışı dalı, Ekranda hikâye → Görüntü ve Ses dalı.
 */
const futureUnits: UnitDef[] = [
  draftUnit(4, 'u06', 'Karakter', 'Arzu, korku, çelişki. Yolda karşılaştığın insanları istismar etmeden karaktere dönüştürmek.', ['hk.karakter'], [
    'Arzu ve korku',
    'Çelişki: insanı canlı kılan',
    'Gerçek insandan karaktere',
    'Saygı ve mahremiyet',
  ]),
  draftUnit(5, 'u07', 'Merak ve gerilim', 'Soru açmak, cevabı geciktirmek, beklenti kurmak.', ['hk.merak'], [
    'Okurun kafasındaki soru',
    'Geciktirmenin sanatı',
    'Küçük gerilimler: yokuş, akşam, su',
  ]),
  draftUnit(6, 'u08', 'Bakış açısı ve anlatıcı', 'Birinci tekil, üçüncü tekil, iç ses; anlatıcının güvenilirliği.', ['hk.bakis'], [
    'Ben mi, o mu?',
    'İç ses',
    'Güvenilmez anlatıcı',
  ]),
  draftUnit(7, 'u09', 'Zaman, sahne ve özet', 'Sahne ile özet arasında geçiş; cümle uzunluğuyla tempo kurmak.', ['hk.ritim'], [
    'Sahne ve özet',
    'Cümle uzunluğu tempodur',
    'Zamanı esnetmek: bir saniyeyi uzatmak',
  ]),
  draftUnit(8, 'u10', 'Diyalog ve alt metin', 'Az konuşan ama çok şey söyleyen diyalog.', ['hk.diyalog'], [
    'Diyalog bilgi taşımaz, ilişki taşır',
    'Alt metin',
    'Konuşmayan cevaplar',
  ]),
  draftUnit(9, 'u11', 'Açılış ve kapanış', 'İlk cümlenin vaadi, kapanışın yankısı, açık uçlu bitiş.', ['hk.acilis'], [
    'İlk cümlenin vaadi',
    'Kapanışın yankısı',
    'Açık uçlu bitiş',
  ]),
];

export const storytellingBranch: BranchDef = {
  id: 'hikaye',
  order: 3,
  title: 'Hikâye Anlatımı',
  short: 'Hikâye',
  description: 'Olaydan hikâyeye: istek, engel, değişim; göstermek, karakter, gerilim, diyalog.',
  available: true,
  skills: storytellingSkills,
  units: [unit01, unit02, unit03, ...futureUnits],
};
