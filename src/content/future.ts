/**
 * Gelecek modüller: yalnızca iskelet. `available: true` yapıldığında ve üniteler
 * doldurulduğunda yolda açılırlar. Beceri kimlikleri hikâye modülündeki `links`
 * alanlarıyla eşleşir; böylece "değişimi göstermek" video modülünde
 * "öncesi/sonrası planı" olarak geri döner.
 */
import type { ModuleDef } from './types';

export const photographyModule: ModuleDef = {
  id: 'foto',
  title: 'Fotoğrafçılık',
  description: 'Işık, kompozisyon, anı yakalamak ve tek kareyle hikâye anlatmak.',
  available: false,
  skills: [
    { id: 'foto.isik', moduleId: 'foto', name: 'Işığı okumak', description: 'Saatin, yönün ve havanın ışığı nasıl değiştirdiğini görmek.' },
    { id: 'foto.kompozisyon', moduleId: 'foto', name: 'Kompozisyon', description: 'Kareyi bilinçli kurmak.' },
    { id: 'foto.an', moduleId: 'foto', name: 'Anı yakalamak', description: 'Duygunun görünür olduğu anı beklemek.', links: ['hk.goster'] },
    { id: 'foto.ayrinti', moduleId: 'foto', name: 'Tek ayrıntı', description: 'Bütünü anlatan küçük parçayı kadrajlamak.', links: ['hk.imge'] },
  ],
  units: [],
};

export const videoModule: ModuleDef = {
  id: 'video',
  title: 'Video Çekimi',
  description: 'Plan türleri, hareket, ses; DJI Action 4 ve Nikon Z30 ile yormayan yöntemler.',
  available: false,
  skills: [
    { id: 'video.plan-turleri', moduleId: 'video', name: 'Plan türleri', description: 'Geniş, orta, yakın planla anlam kurmak.' },
    { id: 'video.oncesi-sonrasi', moduleId: 'video', name: 'Öncesi/sonrası planı', description: 'Değişimi iki planın yan yana gelişiyle göstermek.', links: ['hk.degisim'] },
    { id: 'video.ilk-uc-saniye', moduleId: 'video', name: 'İlk üç saniye', description: 'İzleyiciyi ilk görüntüyle içeri almak.', links: ['hk.acilis'] },
    { id: 'video.kurgu-ritmi', moduleId: 'video', name: 'Kurgu ritmi', description: 'Kesme sıklığıyla tempo kurmak.', links: ['hk.ritim'] },
    { id: 'video.mekan', moduleId: 'video', name: 'Mekânı çekmek', description: 'Mekânın ruh hâlini kadraja almak.', links: ['hk.atmosfer'] },
    { id: 'video.ses', moduleId: 'video', name: 'Ses ve sessizlik', description: 'Doğal sesi ve sessizliği anlatının parçası yapmak.' },
  ],
  units: [],
};
