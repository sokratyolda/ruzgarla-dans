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

### Claude ile değerlendirme (isteğe bağlı)

Yazma alıştırmalarının gerçekten okunup değerlendirilmesi için:

1. <https://console.anthropic.com> adresinden bir API anahtarı oluştur.
2. Uygulamada **Daha → Ayarlar ve yedek → Claude ile değerlendirme** bölümüne yapıştır, **Kaydet** ve **Bağlantıyı dene**.
3. Model: varsayılan `claude-sonnet-5-5`; daha ucuzu `claude-haiku-5-5`. “Başka bir model adı…” ile istediğin adı yazabilirsin.

Anahtar **yalnızca bu telefonda** (IndexedDB) saklanır ve **yalnızca** `api.anthropic.com`'a gönderilir. Yedeğe varsayılan olarak eklenmez.

Anahtar yoksa ya da çevrimdışıysan uygulama yine tam çalışır:
- Yazdıktan sonra **öz-değerlendirme rubriği** çıkar; işaretlerin beceri profiline (daha düşük ağırlıkla) işlenir.
- Metin **“sonra değerlendir” kuyruğuna** girer; internet gelince (ve anahtar varsa) kendiliğinden değerlendirilir. **Yazılarım** ekranından elle de başlatabilirsin.
- **“Metni ve rubriği kopyala”** düğmesi, metnini ve ölçütleri hazır bir istemle panoya kopyalar; istediğin bir yapay zekâya yapıştırabilirsin.

### Yedek

**Ayarlar → Yedek → Dışa aktar** tüm veriyi (beceri profili, yazılar, Yol Defteri, Günce) tek bir JSON dosyasına indirir. Telefon değişirse **İçe aktar** ile geri yüklenir. Arada bir yedek alıp buluta ya da bilgisayara koymanı öneririm.

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
    index.ts               ← modül kayıt defteri + hızlı erişim tabloları
    future.ts              ← Fotoğrafçılık ve Video modüllerinin iskeleti
    placement.ts           ← mini seviye tespiti
    storytelling/
      skills.ts            ← beceri ağacı
      unit01.ts … unit03.ts← tam içerikli üniteler
      index.ts             ← modül tanımı + ünite 4–13 iskeleti
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
  screens/                 ← ekranlar (Bugün, Yol, Eksiklerim, Yol Defteri, Günce, Yazılarım, Ayarlar, Oturum)
  components/              ← adım bileşenleri, yazma akışı, ortak arayüz
  lib/                     ← Türkçe yardımcıları (tr-TR), yedek, yönlendirici
```

**Teknoloji:** React + Vite + TypeScript, `vite-plugin-pwa` (Workbox) ile tam çevrimdışı PWA, Dexie (IndexedDB), gömülü yazı tipleri (Literata + Inter, `latin-ext` alt kümesi Türkçe harfleri içerir). Sunucu yok, hesap yok.

### Öğrenme motoru nasıl çalışır?

- **Beceri ağacı:** Her becerinin 0–100 ustalık puanı var. Bazı becerilerin alt becerileri var (ör. *Değişimi görünür kılmak* → önceki hâl / kırılma anı / sonraki hâl / davranış).
- **Puan güncelleme:** Her deneme 0–1 arası puan üretir. Etiketli her beceri için `yeni = eski + α·(100·puan − eski)`. α; kaynağa (objektif soru < öz-değerlendirme < Claude), zorluğa ve becerinin kaç kez çalışıldığına göre ayarlanır. Yanlış cevap puanı düşürür.
- **Günlük ders:** En fazla 7 adım, yaklaşık 15–20 dakika. ~%60 sıradaki dersin akışı (ders bitince ünite atölyesi), ~%40 tekrar: vakti gelen soru kartları + en zayıf / tekrar günü gelmiş beceriler için alıştırma havuzu.
- **Aralıklı tekrar:** Hem beceri hem soru düzeyinde SM-2. Yanlış cevaplanan soru ertesi gün geri gelir; doğru cevaplananların aralığı 1 → 3 → ~7 → … gün büyür (tavan 60 gün).
- **Küçük adımlar:** Bir beceride üst üste iki zayıf sonuç → o beceri “küçük adımlar” kipine girer; motor kolay (difficulty 1) parçalar seçer. Art arda iki iyi sonuçla normale döner. Arayüz bunu suçlamadan söyler.
- **Kilitler:** Bir ünite, önceki ünitenin bütün dersleri bitince VE temel becerilerinde ortalama ≥ 60 (hiçbiri < 45 değil) olunca açılır. Açılan ünite açık kalır.
- **Tek odak:** “Şu sıralar en çok şuna çalışıyoruz” cümlesi, açık ünitelerdeki en zayıf (öncelikle zorlanılan) beceriden gelir.

---

## 4. İçerik nasıl eklenir / düzenlenir?

Bütün içerik `src/content/` altında, düz TypeScript nesneleri olarak durur. Metni değiştirmek için ilgili dosyayı aç, metni düzelt, kaydet. Kimlikleri (`id`) değiştirme: ilerleme ve geçmiş bu kimliklere bağlıdır.

### Hiyerarşi

```
ModuleDef → UnitDef → LessonDef → Exercise
```

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

## 5. Yeni modül eklemek (Fotoğrafçılık, Video)

İskeletleri `src/content/future.ts` içinde hazır. Bir modülü açmak için:

1. `src/content/foto/` klasörü oluştur; `skills.ts`, `unit01.ts`… ve modülü dışa aktaran `index.ts` yaz (hikâye modülünü örnek al).
2. `src/content/index.ts` içindeki `MODULES` dizisinde `photographyModule` yerine yeni modülünü koy ve `available: true` yap.
3. Hepsi bu. Motor, ekranlar, yedekleme ve yapay zekâ değerlendirmesi başka değişiklik gerektirmez.

**Modüller arası bağlar:** Bir becerinin `links` alanı başka modüldeki akraba becerileri gösterir. Örneğin `hk.degisim` → `video.oncesi-sonrasi`. Video modülünde “öncesi/sonrası planı” alıştırmalarını hem `video.oncesi-sonrasi` hem `hk.degisim.sonraki` becerisine etiketlersen, yazıda öğrendiğin şey videoda pekişir (ve tersi).

> Şimdilik Yol ve Eksiklerim ekranları ilk kullanılabilir modülü gösterir. İkinci modül açıldığında Yol ekranının başına bir modül seçici eklemek gerekecek (`src/screens/Path.tsx`, `src/screens/Gaps.tsx` — `MODULES[0]` geçen yerler).

---

## 6. Varsayımlar ve notlar

- **Haftalık hedef:** Seri gün değil *hafta* üzerinden sayılır; kaçırılan bir gün hiçbir şeyi bozmaz.
- **Öz-değerlendirme + sonradan Claude:** Kuyruktaki bir yazı önce öz-değerlendirmeyle (ağırlık 0,55), sonra Claude değerlendirmesiyle (ağırlık 1) profile işlenir.
- **Başlangıç profili:** “Öğretmenle yaptığım tespiti kullan” seçeneği; yapıyı (istek–engel) orta, imgeyi güçlü, *önceki hâli göstermeyi* en zayıf olarak başlatır (`src/engine/profile.ts`).
- **Atölye** ünite kilidi için şart değildir; günlük derste derslerden sonra sıraya girer ve Yol ekranından her an açılabilir.
- **Refusal yedeği:** Sonnet 5.5 ile yapılan değerlendirme isteklerinde sunucu tarafı yedek model (`fallbacks: "default"`) açıktır; parametre reddedilirse istek düz olarak bir kez daha gönderilir.
- **Capacitor/APK:** İlk sürümde yok; kod buna engel değil (tamamen istemci tarafı, göreli yollar, karma yönlendirme).
