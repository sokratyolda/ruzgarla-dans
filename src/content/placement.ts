/** Mini seviye tespiti: üç kısa soru + bir küçük yazma (öz-değerlendirmeli). */
import type { ChoiceExercise, RubricItem } from './types';

export const placementQuestions: ChoiceExercise[] = [
  {
    id: 'pt.1',
    type: 'choice',
    skills: ['hk.olay-hikaye'],
    prompt: 'Hangisi bir olaydan çok bir hikâyeye yakın?',
    options: [
      'Sabah yedide yola çıktım, öğlen Kemaliye\'ye vardım, akşam kamp kurdum.',
      'Yokuşta bisikleti iterken bir çoban "Nereye bu acele?" diye sordu; cevap veremedim, o gün ilk kez durdum.',
      'Karadeniz sahil yolu 380 kilometredir ve çoğu tüneldir.',
    ],
    correct: 1,
    explanation: 'İlk ve üçüncü seçenek "ne oldu"yu söyler. İkincide bir kişi var, bir soru var ve o soru kişide bir şeyi değiştiriyor: o gün ilk kez duruyor.',
  },
  {
    id: 'pt.2',
    type: 'choice',
    skills: ['hk.degisim-yapi'],
    prompt: 'Aşağıdaki kısa anlatıda en çok ne eksik?',
    passage: 'Gece çadırın önünde oturuyordum. Sonra her şeyin yolunda olduğunu anladım ve huzurla uyudum.',
    options: [
      'Mekân betimlemesi',
      'Huzurdan önceki hâl ve onu değiştiren an',
      'Diyalog',
    ],
    correct: 1,
    explanation: '"Anladım" ve "huzurla" diye bir sonuca atlanıyor ama öncesinde ne vardı, ne değişti, görmüyoruz. Değişim, ancak önceki hâl görünürse hissedilir.',
  },
  {
    id: 'pt.3',
    type: 'choice',
    skills: ['hk.goster'],
    prompt: 'Hangisi duyguyu "anlatmak" yerine "gösteriyor"?',
    options: [
      'Köy kahvesine girince çok utandım.',
      'Köy kahvesine girince bütün başlar döndü; ben kaskımı çıkarmayı unuttum, öyle durdum kapıda.',
      'Köy kahvesine girdiğimde içimi tuhaf bir utanç kapladı.',
    ],
    correct: 1,
    explanation: 'İkinci cümlede "utanç" kelimesi hiç yok ama okur onu hissediyor: dönen başlar, unutulan kask, kapıda kalakalmak.',
  },
];

export const placementWritePrompt =
  'Yolculuğundan küçük bir anı iki üç cümleyle anlat: ne istedin, önüne ne çıktı ve sonunda sende ne değişti? Düşünmeden, ilk aklına gelenle yaz.';

export const placementRubric: RubricItem[] = [
  { skill: 'hk.istek', criterion: 'Ne istediğim açık mı?' },
  { skill: 'hk.engel', criterion: 'Önüme çıkan şey somut mu?' },
  { skill: 'hk.degisim.onceki', criterion: 'Değişimden ÖNCEKİ hâlimi (sinir, sabırsızlık, korku…) gösterdim mi?' },
  { skill: 'hk.degisim.davranis', criterion: 'Sonraki hâlimi bir davranışla gösterdim mi (yalnızca "sabrettim" demek yerine)?' },
];
