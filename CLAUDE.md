# Rüzgârla Dans — Claude için proje notu

Muhammed'in kişisel yazarlık öğrenme uygulaması. Türkçe, çevrimdışı çalışan bir PWA. Kullanıcıyla Türkçe konuş.

- **Canlı:** https://sokratyolda.github.io/ruzgarla-dans/
- **Depo:** https://github.com/sokratyolda/ruzgarla-dans (`main`'e her push GitHub Actions ile Pages'e yayınlanır, ~1 dk)
- **Ayrıntılı plan:** `docs/YAZARLIK_PLANI.md` (başındaki "Yön değişikliği" notu öncelikli). Kullanıcı rehberi: `README.md`.

## Ortam (bu bilgisayar)

- Node PATH'te değil: her komuttan önce `export PATH=~/.local/node/bin:$PATH`
- GitHub CLI: `~/.local/bin/gh` (hesap `sokratyolda`, `workflow` yetkisi var). `git push` ve `gh` komutları sandbox dışında çalıştırılmalı.
- Push: `GIT_TERMINAL_PROMPT=0 git push origin main` (kimlik `gh auth setup-git` ile ayarlı).
- Yayını izle: `~/.local/bin/gh run list -R sokratyolda/ruzgarla-dans --limit 1`, sonra `gh run watch <id> --exit-status`.
- Geliştirme sunucusu: `.claude/launch.json` başlatıcısı bu makinede çalışmadı. Arka planda başlat:
  `node node_modules/vite/bin/vite.js --port 5173 --strictPort --host 127.0.0.1`, sonra tarayıcı panesinde `http://127.0.0.1:5173`.
- Tarayıcı panesi service worker kaydedemiyor (ortam kısıtı). Çevrimdışı önbelleği `dist/sw.js`'teki listeden doğrula.

## Komutlar (proje klasöründe)

```bash
npx tsc --noEmit -p .                        # tip denetimi — her değişiklikten sonra
BASE_PATH=/ruzgarla-dans/ npx vite build     # Pages ile aynı üretim derlemesi
npm run icons                                # public/favicon.svg → PNG ikonlar
```

## Mimari (kısa)

```
src/content/      İÇERİK (veri, kod değil): types.ts (format), index.ts (BRANCHES + hızlı erişim tabloları),
                  storytelling/ (Hikâye dalı: unit01–03 tam, 4–9 taslak), branches.ts (diğer dallar, iskelet),
                  future.ts (Fotoğraf, Video), library.ts (Kütüphanem önerileri), placement.ts
src/engine/       planner.ts (günlük ders: ~%60 yeni / %40 tekrar, mevsim dalı, aktif üniteler),
                  mastery.ts (iç tahmin), srs.ts (SM-2), record.ts, profile.ts, stats.ts, unlock.ts (artık kilit yok)
src/ai/           help.ts (Yardım Al istemleri), claude.ts + prompt.ts + queue.ts (isteğe bağlı uygulama içi Claude)
src/db/db.ts      Dexie şeması, sürüm 1→2→3
src/lib/          tr.ts (tr-TR yardımcıları), backup.ts (doğrulama, birleştir/yerine koy), desk.ts (Eserlerim, şablonlar), diff.ts
src/screens/      Today, MyPath (Path/Progress/Journal), Workshop (alıştırmalar/serbest yazma/Writings), Library, SourceView,
                  Desk, DraftEditor, ProjectView, Settings, Session, Welcome (redo = yeniden tespit), RewriteLater
src/components/   Steps, WritingStep, HelpSheet, SkillPicker, ErrorBoundary, ui (Tabs, TopBar, Icon…)
```

Gezinme: **Bugün · Yolum · Atölyem · Kütüphanem · Eserlerim**. Ayarlar Bugün'ün sağ üstünde. Yönlendirme `#/...` (karma).

## Verilmiş ürün kararları (sormadan değiştirme)

- **Kilit yok:** yazılmış bütün dersler açık; uygulama yalnızca sıra önerir. İçeriği olmayan dallar Yolum'da gizli, "Geliştiriliyor" listesinde.
- **Sayı gösterme:** beceri tahmini (`mastery`) yalnızca motorun içinde. Ekranda kanıt göster (alıştırma, yazı, yeniden yazım, eser) ve kullanıcının işaretlerini ("öğrendim" / "tekrar").
- **Yapay zekâ:** ana yol "Yardım Al" (istem hazırla → göster → kopyala/paylaş; uygulama hiçbir şey göndermez). Uygulama içi Claude yalnızca kullanıcı anahtar girerse; "göndermeden önce sor" seçeneği var. Yardım eden metni kullanıcının yerine yazmaz.
- **Ton:** sakin, sıcak, dürüst. Konfeti, "Harikasın!!!", suçlayıcı seri mesajı yok. Haftalık hedef, gün değil.
- **Tek odak:** "Şu sıralar en çok şuna çalışıyoruz" tek bir beceri söyler.
- **Sunucu, hesap, eşitleme yok.** Cihazlar arası taşıma JSON yedeğiyle (birleştir).
- **Türkçe:** büyük/küçük harf her zaman `tr-TR` (`src/lib/tr.ts`: `upper`, `lower`, `genitive`). `<html lang="tr">`.
- **İçerik özgün;** alıntılar yalnızca kamu malı eserlerden ve kısa. Türkiye'de telif ölümü izleyen yıldan itibaren 70 yıl. Örnekler kullanıcının dünyasından: yol, çadır, köy kahvesi, yokuş, yabancı, gece.

## İçerik eklerken

- Bir dalın içeriği: `src/content/<dal>/unitNN.ts` yaz; `branches.ts`'deki `draftUnit(...)` yerine koy; dalın `available: true`.
- **Kimlikleri (`id`) asla değiştirme;** ilerleme ve geçmiş onlara bağlı.
- Rubrikteki her beceri, alıştırmanın `skills` listesinde de olmalı. Aksi hâlde yapay zekâ puanı kaybolur.
- Her ünitede: kavram kartları, alıştırmalar, ders sonu sınavı, atölye ve `practice` havuzu (her alt beceri için `difficulty: 1` "küçük adım" maddeleri).
- `npm run dev` açıkken içerik denetimi konsola `[içerik]` uyarıları yazar. İçerik bitince bunlara bak.

## Veritabanı

- Şema değişince `db.ts`'e yeni `this.version(n)` ekle; eskilere dokunma. Göç kuralları dondurulmuş kayıttır.
- Yeni tablo eklenince: `backup.ts`'teki `TABLES`, `TABLE_LABELS`, `mergeWith` ve yedek `version` güncellenmeli.
- Tuzaklar:
  - `orderBy()` yalnızca indeksli alanda çalışır, yoksa ekran çöker.
  - `db.settings.get` eksik alan döndürebilir: `{ ...defaultSettings(), ...s }` ile birleştir.
  - `useLiveQuery` kayıt yoksa `undefined` döner (yükleniyor ile karışır); `?? null` kullan.

## Çalışma biçimi

- **Commit, push ve yayın için her seferinde kullanıcıdan onay al.** Kullanıcı genelde önerilen seçeneği seçer ama önce sormak istiyor.
- Commit mesajı Türkçe, sonunda `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` satırı.
- Her değişiklikten sonra tip denetimi ve derleme. Arayüz ya da veri değiştiyse tarayıcıda telefon boyutunda (375×812) dene. Test verisini sonra `wipeAll()` ile sil.
- Yayından sonra canlı paketi doğrula: `assets/index-*.js` içinde yeni metin var mı?
- Kullanım limitine dikkat: küçük işlerde tarayıcı testini kısa tut. Kullanıcı "deneme gerekmez" derse yalnızca tip denetimi ve derleme yap.

## Sıradaki işler ve açık noktalar

- **İçerik (en değerli iş):** plandaki sıra: Revizyon (D10) + Dil (D2) → Gezi Yazısı (D6) → Betimleme (D4) → Kurgu Dışı (D5) → Okuma (D7) → Ekran (D8). Hikâye ünite 4–9 da bekliyor.
- **Aşama C'nin kalanı:** tempo (mini 5 dk / standart / derin) ve haftalık "öğren → oku → yaz → yeniden yaz" dengesi. `settings.tempo` ve `settings.warmup` alanları hazır, henüz kullanılmıyor. Serbest yazma Atölyem'de var.
- **Doğrulanmamış:** gerçek telefonda sürüm 3 göçü, Android'de "Paylaş…" düğmesi, gerçek ekran okuyucuyla erişilebilirlik denetimi.
- **Fikir panosu önerisi:** kullanıcı fikirleri GitHub Issues'a etiketle (`aşama-c`, `dal-gezi`, `içerik`, `fikir`, `hata`) yazabilir; `gh issue list -R sokratyolda/ruzgarla-dans` ile oku.
