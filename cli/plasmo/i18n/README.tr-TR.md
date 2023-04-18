<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="/cli/plasmo/LICENSE">
    <img alt="See License" src="https://img.shields.io/npm/l/plasmo"/>
  </a>
  <a aria-label="NPM" href="https://www.npmjs.com/package/plasmo">
    <img alt="NPM Install" src="https://img.shields.io/npm/v/plasmo?logo=npm"/>
  </a>
  <a aria-label="Twitter" href="https://www.twitter.com/plasmohq">
    <img alt="Follow PlasmoHQ on Twitter" src="https://img.shields.io/twitter/follow/plasmohq?logo=twitter"/>
  </a>
  <a aria-label="Twitch Stream" href="https://www.twitch.tv/plasmohq">
    <img alt="Watch our Live DEMO every Friday" src="https://img.shields.io/twitch/status/plasmohq?logo=twitch&logoColor=white"/>
  </a>
  <a aria-label="Discord" href="https://www.plasmo.com/s/d">
    <img alt="Join our Discord for support and chat about our projects" src="https://img.shields.io/discord/946290204443025438?logo=discord&logoColor=white"/>
  </a>
</p>

<p align="center">
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a> | <a href="/cli/plasmo/i18n/README.id-ID.md">Indonesian</a> | <a href="/cli/plasmo/i18n/README.ru-RU.md">Русский</a> | Turkish | <a href="/cli/plasmo/i18n/README.ja-JP.md">日本語</a>
</p>

# Plasmo Framework

[Plasmo](https://www.plasmo.com/) Framework, hacker ruhlu yazılımcılar tarafından hacker ruhlu yazılımcılar için yapılmış pille dolu bir tarayıcı uzantısı geliştirme kiti'dir.

> Tarayıcı uzantılarının [Next.js](https://nextjs.org/)'i gibi.

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Öne Çıkan Özellikler

- First-class [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) Desteği
- [Declarative Geliştirme](https://docs.plasmo.com/framework#where-is-the-manifestjson-file)
- [Content Scripts UI](https://docs.plasmo.com/csui)
- [Sekme Sayfaları](https://docs.plasmo.com/framework/tab-pages)
- Canlı-reloading + React HMR
- [`.env*` dosyaları](https://docs.plasmo.com/framework/env)
- [Storage API'ı](https://docs.plasmo.com/framework/storage)
- [Messaging API'ı](https://docs.plasmo.com/framework/messaging)
- [Remote code bundle'lama](https://docs.plasmo.com/framework/remote-code) (örn: Google Analytics için)
- [Birden çok tarayıcı ve manifest eşi](https://docs.plasmo.com/framework/workflows/build#with-specific-target) hedefleme
- [BPP ile otomatik deploy](https://docs.plasmo.com/framework/workflows/submit)
- İsteğe bağlı [Svelte](https://github.com/PlasmoHQ/with-svelte) ve [Vue](https://github.com/PlasmoHQ/with-vue) desteği

Ve daha, daha fazlası! 🚀

## Sistem Gereksinimleri

- Node.js 16.x ve üzeri
- MacOS, Windows veya Linux
- (Şiddetle Tavsiye) [pnpm](https://pnpm.io/)

## Örnekler

Plasmo'nun [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss) ve çok daha fazlası ile nasıl kullanılabileceğini gösteren örneklerimiz mevcut. Bunları görmek için [örnekler repomuzu ziyaret edin](https://github.com/PlasmoHQ/examples).

## Dökümantasyon

Plasmo Framework'u hakkında daha derinlemesine bilgi edinmek için [dökümantasyon](https://docs.plasmo.com/)'a göz atın.

## Tarayıcı Uzantıları Kitabı

Tarayıcı uzantılarının nasıl çalıştığına ve nasıl geliştirileceğine dair daha derinlemesine bir bakış için Matt Frisbie'nin yeni kitabı "[Building Browser Extensions](https://buildingbrowserextensions.com/plasmo)"ı şiddetle tavsiye ediyoruz.

## Kullanım

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

Önümüzdeki yol birçok virajla dolu.

- Popup değişiklikleri `popup.tsx` dosyasına eklenir
- Seçenekler sayfası değişiklikleri `options.tsx` dosyasına eklenir
- Content script değişiklikleri `content.ts` dosyasına eklenir
- Arka plan hizmet çalışanı değişiklikleri `background.ts` dosyasına eklenir

### Dizinler

Bu dosyaları kendi dizinlerine sahip olacak şekilde de düzenleyebilirsiniz:

```
ext-dir
├───assets
|   └───icon.png
├───popup
|   ├───index.tsx
|   └───button.tsx
├───options
|   ├───index.tsx
|   ├───utils.ts
|   └───input.tsx
├───contents
|   ├───site-one.ts
|   ├───site-two.ts
|   └───site-three.ts
...
```

Son olarak, kaynak kodunu kök dizinine koymak yerine `src` alt dizinine koymak için [bu kılavuzu izleyebilirsin](https://docs.plasmo.com/framework/customization/src). `assets`'lerinizin ve diğer config dosyalarının yine de kök dizininde olması gerekeceğini unutmayın.

## Desteklenen Tarayıcılar

Desteklenen tarayıcı hedeflerinin bir listesini görmek için [lütfen buradaki dökümantasyon'a bakın](https://docs.plasmo.com/framework/workflows/faq#what-are-the-officially-supported-browser-targets).

## Topluluk

Plasmo topluluğu [Discord](https://www.plasmo.com/s/d)'da. Bu Plasmo Framework'ü kullanma konusunda yardım almak için uygun bir kanaldır.

[Davranış Kurallarımız](./.github/CODE_OF_CONDUCT.md) tüm Plasmo topluluk kanalları için geçerlidir.

## Katkıda bulunma

Daha fazla bilgi edinmek için lütfen [katkıda bulunma yönergelerine](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) bakın.

Katkıda bulunan tüm harika [katılımcılarımıza](https://github.com/PlasmoHQ/plasmo/graphs/contributors) çok teşekkür ederiz ❤️

Eğlenceye katılmaktan ve PR göndermekten çekinmeyin!

### Plasmo Framework

<a href="https://github.com/PlasmoHQ/plasmo/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/plasmo" />
</a>

### [Plasmo Örnekleri](https://github.com/PlasmoHQ/examples)

<a href="https://github.com/PlasmoHQ/examples/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/examples" />
</a>

### [Plasmo Storage](https://github.com/PlasmoHQ/storage)

<a href="https://github.com/PlasmoHQ/storage/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/storage" />
</a>

### [Browser Platform Publisher](https://github.com/PlasmoHQ/bpp)

<a href="https://github.com/PlasmoHQ/bpp/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/bpp" />
</a>

## Sorumluluk Reddi

Plasmo şu anda alfa yazılımıdır ve bazı şeyler sürümden sürüme değişebilir, bu nedenle lütfen dikkatli olun ve riski size ait olacak şekilde kullanın.

# Lisans

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
