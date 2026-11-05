# Rüzgârla Dans

Hikâye anlatımını adım adım öğreten, kişisel ve çevrimdışı çalışan bir öğrenme uygulaması.
Duolingo'nun düzeni, ama gürültüsü olmadan: her gün tek bir odak, 15–20 dakika, en fazla 7 adım.

Adı, seviye tespitindeki şu cümleden geliyor:

> Sabahleyin uyandığımda çadırımı toplamak istedim fakat çadırım ıslanmıştı ve dışarıda güçlü bir rüzgâr esiyordu. Ben de rüzgârla dans etmeye başladım ve sabrederek toparlanmaya devam ettim.

---

## 1. Telefona kurulum (Android)

1. Telefonda **Chrome** ile uygulamanın adresini aç:
   `https://<github-kullanıcı-adın>.github.io/ruzgarla-dans/`
2. Sağ üstteki **⋮** menüsüne dokun → **Ana ekrana ekle** (ya da **Uygulamayı yükle**).
3. Ana ekranda “Rüzgârla Dans” simgesi belirir. Oradan açınca tarayıcı çubukları olmadan, kendi ikonu ve açılış ekranıyla, gerçek bir uygulama gibi açılır.
4. **İlk açılıştan sonra internet gerekmez.** Uygulama kendini telefona önbelleğe alır; uçak modunda, çadırda, dağda tam çalışır.
   (Bunu denemek için: bir kez internetle aç, sonra uçak moduna geç ve uygulamayı ana ekrandan yeniden aç.)
5. Yeni bir sürüm yayınlandığında, uygulamayı internetliyken açtığında kendiliğinden güncellenir. Verilerin silinmez.

### Uygulamanın bölümleri

Alt gezinmede beş bölüm var; Ayarlar ve yedek, Bugün ekranının sağ üstündeki simgede.

| Bölüm | İçinde |
|---|---|
| **Bugün** | Günün dersi (zayıf yanlarına göre seçilmiş en fazla 7 adım), haftalık ritim, tek odak |
| **Yolum** | **Yol:** öğrenme dalları ve dersler (yazılmış bütün dersler ilk günden açık; uygulama yalnızca bir sıra önerir). **Gelişim:** puan değil kanıt. **Günce** |
| **Atölyem** | **Alıştırmalar:** süreye (≤5 / 6–10 / 15+ dk) ve beceriye göre. **Serbest yazma:** zamanlayıcıyla, değerlendirmesiz. **Yazılarım:** ilk ve yeniden yazılmış hâller |
| **Kütüphanem** | **Kaynaklar:** öneriler + kendi listen (okunacak / okunuyor / inceledim, özetin, alıntıların). **Kavramlar:** derslerdeki kavramlar + kendi kavram kartların. **Alıntılar** |
| **Eserlerim** | **Taslaklar** (sürümler, karşılaştırma, malzeme, beceri bağlama) · **Projeler** (türe göre şablon ve defter) · **Yol Defteri** |

İçeriği henüz yazılmamış dallar (Gözlem, Dil, Gezi…) Yolum'da gösterilmez; altta "Geliştiriliyor" listesinde durur.

### Gelişim: puan değil kanıt

Uygulama hangi dersi önereceğine karar vermek için arka planda bir tahmin tutar, ama bunu sana sayı olarak göstermez. Gelişim'de her beceri için yaptıkların görünür: kaç alıştırma, kaç yazı, kaç yeniden yazım, hangi eserlerde kullandığın, en son ne zaman. Bir beceriyi **"Öğrendim"** ya da **"Tekrar denemek istiyorum"** diye işaretleyebilirsin; günlük ders buna göre ayarlanır.

### Yardım Al (kopyala–yapıştır, senin kontrolünde)

Derslerde, sorularda, yazma alıştırmalarında ve taslaklarda **Yardım al** düğmesi var:
1. Ne istediğini seç: *Metnimi değerlendir*, *Konuyu açıkla* ya da *Fikir geliştirmeme yardım et*.
2. Uygulama o anki ders bağlamıyla bir soru taslağı hazırlar ve **tamamını gösterir**; istediğin yeri silebilir ya da düzenleyebilirsin.
3. **Kopyala** ya da (Android'de) **Paylaş…** ile kendi seçtiğin araca (ChatGPT, Claude, başka bir yapay zekâ ya da bir öğretmen) taşırsın.

Uygulama bu akışta hiçbir şey göndermez. Hazırlanan istemler yardım edenin senin yerine yazmamasını, tek bir öneri vermesini ve soru sormasını ister.

### İsteğe bağlı: uygulama içinde Claude ile değerlendirme

Ayarlar'da kapalı duran bir bölüm. Kendi Anthropic API anahtarını girersen yazma alıştırmaların uygulamanın içinden Claude'a gönderilip değerlendirilir (varsayılan model `claude-sonnet-5-5`, daha ucuzu `claude-haiku-5-5`). Anahtar **yalnızca bu cihazda** saklanır, **yalnızca** `api.anthropic.com`'a gider ve yedeğe varsayılan olarak eklenmez. **"Göndermeden önce sor"** açıkken her yazı gönderilmeden önce gösterilir ve bekleyen yazılar kendiliğinden gönderilmez.

Anahtar yoksa ya da çevrimdışıysan: yazdıktan sonra öz-değerlendirme rubriği çıkar, metin "sonra değerlendir" kuyruğuna girer; Yardım Al her zaman çalışır.

### Eserlerim (eski adıyla Masa)

- **Taslaklar:** Deneme, gezi yazısı, öykü, video metni, şiir. Yazdığın her şey anında telefona kaydedilir. Tür, durum, proje, etiket ve **bu eserde uyguladığın beceriler** verilebilir (Gelişim'de kanıt olarak görünür).
- **Sürümler:** "Kontrol noktası al" o anki hâli notuyla saklar; çıkarken de otomatik sürüm alınır. Bir sürümü bugünkü metinle **farkları işaretleyerek** ya da **yan yana** karşılaştırabilir, ona **geri dönebilirsin** (dönüş geri alınabilir).
- **Malzeme:** Yol Defteri notlarını taslağa iliştir.
- **Projeler ve şablonlar:** Deneme kitabı, gezi kitabı, öykü dosyası, roman, şiir dosyası, video serisi ya da serbest. Türe göre bölüm adı ve **proje defteri** değişir (roman: karakter, mekân, olay örgüsü; gezi: durak, insan; şiir dosyasında zorunlu alan yok). Proje tek Markdown dosyası olarak, istersen defteriyle birlikte indirilir.
- Yazılarım'daki bir metni ya da bir serbest yazıyı **Eserlerime taşı** ile taslağa çevirebilirsin.

### Başlangıç noktası

İlk açılışta "Öğretmenle yaptığım tespiti kullan", "Kısa bir tespit yap" ya da "Sıfırdan başla" seçilir; adın isteğe bağlıdır. Tespit sana uymadıysa **Ayarlar → Başlangıç noktası → Seviye tespitini yeniden yap**: yalnızca başlangıç tahmini güncellenir, ilerlemen ve yazıların kalır.

### Yedek

**Ayarlar → Yedek → Dışa aktar** tüm veriyi (beceri profili, alıştırma yazıları, Eserlerim'deki taslaklar, sürümler ve projeler, Kütüphanem, Yol Defteri, Günce, serbest yazılar) tek bir JSON dosyasına indirir.

**İçe aktar** önce dosyayı doğrular ve içinde ne olduğunu gösterir; sonra iki seçenek sunar:
- **Birleştir:** Bu cihazdaki her şey kalır, yedekte olup burada olmayanlar eklenir. Telefon ile MacBook arasında taşırken bunu kullan; aynı yedeği iki kez birleştirmek bir şeyi çoğaltmaz.
- **Yerine koy:** Bu cihazdaki bütün veri silinir, yerine yedek gelir (yeni ya da sıfırlanmış cihaz için).

Bozuk ya da uygulamanın daha yeni bir sürümüyle alınmış dosyalar, mevcut veriye dokunulmadan reddedilir. 30 günden uzun süredir yedek alınmadıysa Bugün ekranında sakin bir hatırlatma çıkar.

---

## 2. Projeyi GitHub'a koymak ve yayınlamak

Bir kez yapılır:

1. GitHub'da **ruzgarla-dans** adında yeni bir depo oluştur (boş, README'siz).
2. Bu klasörde:
   ```bash
   git remote add origin https://github.com/<kullanıcı-adın>/ruzgarla-dans.git
   git push -u origin main
   ```
3. GitHub'da depo → **Settings → Pages → Build and deployment → Source: GitHub Actions** seç.
4. **Actions** sekmesinde “GitHub Pages'e yayınla” iş akışı çalışır (1–2 dk). Bitince adres:
   `https://<kullanıcı-adın>.github.io/ruzgarla-dans/`

Sonrasında `main` dalına her gönderimde uygulama otomatik yeniden yayınlanır. Depo adını değiştirirsen adres de değişir; iş akışı alt klasörü depo adından kendisi hesaplar.

> Not: Ücretsiz GitHub hesabında Pages için depo **herkese açık** olmalıdır. Kodda kişisel veri yoktur: yazdıkların, notların ve API anahtarın yalnızca telefonundadır.

### Bilgisayarda çalıştırmak

Node.js 20+ gerekir.

```bash
npm install
npm run dev        # geliştirme sunucusu: http://localhost:5173
npm run build      # dist/ klasörüne üretim derlemesi
npm run preview    # derlemeyi yerelde sun
npm run icons      # public/favicon.svg'den PNG ikonları yeniden üret
```

---

## 3. Mimari

```
src/
  content/                 ← İÇERİK (kod değil, veri)
    types.ts               ← içerik formatı (aşağıda)
    index.ts               ← dal kayıt defteri (BRANCHES) + hızlı erişim tabloları
    branches.ts            ← Hikâye dışındaki dallar (şimdilik iskelet: başlık, beceri, planlanan dersler)
    future.ts              ← Fotoğrafçılık ve Video dallarının iskeleti
    placement.ts           ← mini seviye tespiti
    storytelling/
      skills.ts            ← beceri ağacı
      unit01.ts … unit03.ts← tam içerikli üniteler
      index.ts             ← Hikâye dalının tanımı + ünite 4–9 iskeleti
  engine/                  ← ÖĞRENME MOTORU
    planner.ts             ← günlük ders oluşturucu (%60 yeni / %40 tekrar)
    mastery.ts             ← ustalık puanı güncelleme, zorlanma takibi
    srs.ts                 ← aralıklı tekrar (SM-2 türevi)
    unlock.ts              ← ünite kilitleri
    record.ts              ← denemelerin kaydı
    profile.ts             ← başlangıç profili (seviye tespiti)
    stats.ts               ← haftalık hedef ve hafta serisi
  ai/                      ← Claude değerlendirmesi
    prompt.ts              ← sistem talimatı, istek metni, JSON şeması
    claude.ts              ← API çağrısı (@anthropic-ai/sdk, tarayıcıdan)
    queue.ts               ← “sonra değerlendir” kuyruğu
  db/db.ts                 ← IndexedDB (Dexie) şeması
  screens/                 ← ekranlar (Bugün, Yolum [Yol, Gelişim, Günce], Atölyem, Kütüphanem, Eserlerim, Taslak, Proje, Kaynak, Ayarlar, Oturum)
  components/              ← adım bileşenleri, yazma akışı, ortak arayüz
  lib/                     ← Türkçe yardımcıları (tr-TR), yedek (doğrulama, birleştirme), Eserlerim ve proje şablonları (desk.ts), kelime farkı (diff.ts), yönlendirici
  ai/help.ts               ← Yardım Al istemleri (uygulama dışı, kopyala–yapıştır)
  content/library.ts       ← Kütüphanem'deki önerilen kaynaklar
```

**Teknoloji:** React + Vite + TypeScript, `vite-plugin-pwa` (Workbox) ile tam çevrimdışı PWA, Dexie (IndexedDB), gömülü yazı tipleri (Literata + Inter, `latin-ext` alt kümesi Türkçe harfleri içerir). Sunucu yok, hesap yok.

### Öğrenme motoru nasıl çalışır?

- **Beceri ağacı:** Her becerinin motorun içinde 0–100 arası bir tahmini var (ekranda gösterilmez). Bazı becerilerin alt becerileri var (ör. *Değişimi görünür kılmak* → önceki hâl / kırılma anı / sonraki hâl / davranış).
- **Puan güncelleme:** Her deneme 0–1 arası puan üretir. Etiketli her beceri için `yeni = eski + α·(100·puan − eski)`. α; kaynağa (objektif soru < öz-değerlendirme < Claude), zorluğa ve becerinin kaç kez çalışıldığına göre ayarlanır. Yanlış cevap puanı düşürür.
- **Yazarlık çatısı ve dallar:** İçerik dallara ayrılır (Gözlem, Dil, Hikâye, Betimleme, Deneme, Gezi, Okuma, Ekran, Şiir, Revizyon; ayrıca Fotoğraf ve Video). Plan: `docs/YAZARLIK_PLANI.md`.
- **Mevsim:** Her dönem bir *ana dal* seçilir (Ayarlar ya da Yol ekranı). Yeni dersler yalnızca o daldan gelir; tekrarlar açılmış bütün dallardan. Dalın yazılmış içeriği bitince oturum tekrara döner ve ön koşulları tamam, temel becerileri en zayıf dal önerilir.
- **Günlük ders:** En fazla 7 adım, yaklaşık 15–20 dakika. ~%60 mevsim dalındaki sıradaki dersin akışı (ders bitince ünite atölyesi), ~%40 tekrar: vakti gelen soru kartları + en zayıf / tekrar günü gelmiş beceriler için alıştırma havuzu.
- **Aralıklı tekrar:** Hem beceri hem soru düzeyinde SM-2. Yanlış cevaplanan soru ertesi gün geri gelir; doğru cevaplananların aralığı 1 → 3 → ~7 → … gün büyür (tavan 60 gün). Beceri düzeyindeki aralık günde en fazla bir kez ilerler.
- **Küçük adımlar:** Bir beceride üst üste iki zayıf sonuç → o beceri “küçük adımlar” kipine girer; motor kolay (difficulty 1) parçalar seçer. Art arda iki iyi sonuçla normale döner. Arayüz bunu suçlamadan söyler.
- **Erişim:** Kilit yok. Yazılmış bütün dersler ilk günden açık; uygulama yalnızca bir sıra önerir ("önerilen durak"). Tekrarlar yalnızca **başladığın** ünitelerden gelir; henüz girmediğin bir ünitenin soruları tekrar olarak karşına çıkmaz.
- **Kendi işaretin:** "Tekrar denemek istiyorum" dediğin beceriler öne alınır, "Öğrendim" dediklerin biraz geri çekilir.
- **Tek odak:** “Şu sıralar en çok şuna çalışıyoruz” cümlesi, mevsim dalının açık ünitelerindeki en zayıf (öncelikle zorlanılan) beceriden gelir.

---

## 4. İçerik nasıl eklenir / düzenlenir?

Bütün içerik `src/content/` altında, düz TypeScript nesneleri olarak durur. Metni değiştirmek için ilgili dosyayı aç, metni düzelt, kaydet. Kimlikleri (`id`) değiştirme: ilerleme ve geçmiş bu kimliklere bağlıdır.

### Hiyerarşi

```
Yazarlık → BranchDef (dal) → UnitDef → LessonDef → Exercise
```

Taslak üniteler `draftUnit(...)` ile tanımlanır: yalnızca başlık, özet, temel beceriler ve planlanan ders adları.

### Ünite

```ts
{
  id: 'u04', number: 4, title: 'İmge ve duyusal ayrıntı',
  summary: '…',
  keySkills: ['hk.imge'],          // sonraki üniteyi açan temel beceriler
  lessons: [ /* LessonDef */ ],
  atelier: { /* WriteExercise, atelier: true */ },
  practice: [ /* tekrar havuzu: zayıf beceriler için */ ],
}
```

Taslak üniteyi doldururken `draft: true` ve `plannedLessons` alanlarını sil.

### Ders

```ts
{ id: 'u4.l1', title: 'Tek ayrıntı, bütün sahne', steps: [ … ], quiz: [ … ] }
```

### Alıştırma türleri

| type | Ne işe yarar | Zorunlu alanlar |
|---|---|---|
| `concept` | Kavram kartı | `title`, `body: string[]`, (ops.) `example`, `takeaway` |
| `choice` | Çoktan seçmeli / doğru-yanlış | `prompt`, `options`, `correct` (0'dan başlar), `explanation`, (ops.) `passage` |
| `discern` | Ayırt et: iki pasaj | `prompt`, `passages: [{label, text}]`, `question`, `options`, `correct`, `explanation` |
| `missing` | Eksik unsuru bul | `prompt`, `draft`, `options`, `correct`, `explanation` |
| `rewrite` | Zayıf metni güçlendir | `prompt`, `source`, `rubric`, (ops.) `hint`, `sample` |
| `write` | Kendi malzemenle yaz | `prompt`, `rubric`, (ops.) `hint`, `noteTags`, `words: [min, max]`, `atelier` |
| `video` | Video düşüncesi (yazılı plan) | `prompt`, `fields: [{key, label, placeholder?}]`, `rubric` |

Her alıştırmada ayrıca:

- `id`: benzersiz kimlik (ör. `u4.l1.q2`)
- `skills`: etiketlendiği beceriler (ilki birincil)
- `difficulty` (ops.): `1` küçük adım, `2` normal, `3` zorlayıcı

**Rubrik** her satırda bir beceri ve evet/hayır sorulabilir bir ölçüttür:

```ts
rubric: [
  { skill: 'hk.degisim.onceki', criterion: 'Önceki hâl sahnede görünüyor mu?' },
]
```

Aynı rubrik hem öz-değerlendirmede hem Claude değerlendirmesinde kullanılır.

### Beceri eklemek

`src/content/storytelling/skills.ts` dosyasına:

```ts
{ id: 'hk.imge.tek-ayrinti', moduleId: 'hikaye', parent: 'hk.imge', name: 'Tek ayrıntı', description: '…' }
```

`parent` verirsen üst becerinin puanı alt becerilerin ortalaması olur ve zorlanınca motor alt becerilere iner.

---

## 5. Bir dalın içeriğini yazmak / yeni dal eklemek

Dalların iskeleti `src/content/branches.ts` (ve Fotoğraf/Video için `src/content/future.ts`) içinde hazır. Bir dalın içeriğini açmak için:

1. `src/content/<dal>/unit01.ts`… dosyalarında gerçek üniteleri yaz (Hikâye'nin `unit01.ts` dosyasını örnek al). Ünite kimliklerini iskeletteki gibi bırak (ör. `gy.u01`).
2. `branches.ts` içinde ilgili `draftUnit(...)` çağrısını bu üniteyle değiştir ve dalın `available` alanını `true` yap.
3. Hepsi bu. Motor, Yolum ve Gelişim ekranları, Atölyem, yedekleme ve değerlendirme başka değişiklik gerektirmez. Geliştirme kipinde (`npm run dev`) içerik denetimi konsola uyarı yazar.

Tamamen yeni bir dal için `BranchDef` nesnesini yaz ve `src/content/index.ts` içindeki `BRANCHES` listesine ekle (`order` alanı yoldaki sırayı belirler; `elective: true` seçmeli yapar; `prerequisites` ön koşul ünitelerini verir).

**Dallar arası bağlar:** Bir becerinin `links` alanı başka daldaki akraba becerileri gösterir. Örneğin `hk.degisim` → `video.oncesi-sonrasi`. Bir alıştırma birden çok dalın becerisine etiketlenebilir: video dalındaki “öncesi/sonrası planı” alıştırmasını hem `video.oncesi-sonrasi` hem `hk.degisim.sonraki` becerisine etiketlersen, yazıda öğrendiğin şey videoda pekişir (ve tersi).

**Veritabanı sürümleri:** Şema değişince `src/db/db.ts` içine yeni bir `this.version(n)` eklenir; eskiler silinmez. Sürüm 2 (Yazarlık çatısı) eksik ayarları ekler ve dalı değişen becerilerin `moduleId` alanını günceller; sürüm 3 Kütüphanem tablolarını (`sources`, `concepts`) ekler. Bütün kayıtlar korunur. Eski sürüm yedekleri de geri yüklenebilir.

---

## 6. Varsayımlar ve notlar

- **Haftalık hedef:** Seri gün değil *hafta* üzerinden sayılır; kaçırılan bir gün hiçbir şeyi bozmaz.
- **Öz-değerlendirme + sonradan Claude:** Kuyruktaki bir yazı önce öz-değerlendirmeyle (ağırlık 0,55), sonra Claude değerlendirmesiyle (ağırlık 1) profile işlenir.
- **Başlangıç profili:** “Öğretmenle yaptığım tespiti kullan” seçeneği; yapıyı (istek–engel) orta, imgeyi güçlü, *önceki hâli göstermeyi* en zayıf olarak başlatır (`src/engine/profile.ts`).
- **Atölye** ünite kilidi için şart değildir; günlük derste derslerden sonra sıraya girer ve Yol ekranından her an açılabilir.
- **Refusal yedeği:** Sonnet 5.5 ile yapılan değerlendirme isteklerinde sunucu tarafı yedek model (`fallbacks: "default"`) açıktır; parametre reddedilirse istek düz olarak bir kez daha gönderilir.
- **Capacitor/APK:** İlk sürümde yok; kod buna engel değil (tamamen istemci tarafı, göreli yollar, karma yönlendirme).
