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
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a> | Indonesian | <a href="/cli/plasmo/i18n/README.ru-RU.md">Русский</a> | <a href="/cli/plasmo/i18n/README.tr-TR.md">Turkish</a> | <a href="/cli/plasmo/i18n/README.ja-JP.md">日本語</a>
</p>

# Framework Plasmo

Framework [Plasmo](https://www.plasmo.com/) adalah SDK ekstensi browser penuh daya yang dibuat oleh hacker untuk hacker. Bangun produk Anda dan berhenti khawatir terhadap file konfigurasi dan berbagai macam anomali dalam membuat ekstensi browser.

> Seperti [Next.js](https://nextjs.org/) untuk ekstensi browser!

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Fitur Utama

- First-class [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) Support
- [Declarative Development](https://docs.plasmo.com/framework#where-is-the-manifestjson-file)
- [Content Scripts UI](https://docs.plasmo.com/csui)
- [Tab Pages](https://docs.plasmo.com/framework/tab-pages)
- Live-reloading + React HMR
- [`.env*` files](https://docs.plasmo.com/framework/env)
- [Storage API](https://docs.plasmo.com/framework/storage)
- [Messaging API](https://docs.plasmo.com/framework/messaging)
- [Remote code bundling](https://docs.plasmo.com/framework/remote-code) (contohnya: untuk Google Analytics)
- Penargetan [beberapa browser dan manifest](https://docs.plasmo.com/framework/workflows/build#with-specific-target)
- [Deployment otomatis melalui BPP](https://docs.plasmo.com/framework/workflows/submit)
- Dukungan opsional untuk [Svelte](https://github.com/PlasmoHQ/with-svelte) dan [Vue](https://github.com/PlasmoHQ/with-vue)

Dan masih banyak lagi! 🚀

## Kebutuhan Sistem

- Node.js 16.x atau lebih tinggi
- MacOS, Windows, atau Linux
- (Sangat direkomendasikan) [pnpm](https://pnpm.io/)

## Examples

Kami memiliki contoh yang menunjukkan bagaimana anda dapat menggunakan Plasmo [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss), dan banyak masih banyak lagi. Untuk mencobanya, [kunjungi repositori contoh kami](https://github.com/PlasmoHQ/examples).

## Dokumentasi

Lihat [dokumentasi](https://docs.plasmo.com/) untuk mendapatkan gambaran yang lebih mendalam mengenai Framework Plasmo.

## Browser Extensions Book

Untuk gambaran yang lebih mendalam tentang cara kerja ekstensi browser, dan cara mengembangkannya, kami sangat merekomendasikan buku baru Matt Frisbie ["Building Browser Extensions"](https://buildingbrowserextensions.com/plasmo)

## Cara Penggunaan

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

Jalan di depan dipenuhi dengan banyak pilihan.

- Mengubah Popup lakukan di `popup.tsx`
- Mengubah Options page lakukan di `options.tsx`
- Mengubah Content script lakukan di `content.ts`
- Mengubah Background service worker lakukan di `background.ts`

### Direktori

Anda juga dapat mengatur file-file ini di direktori mereka sendiri:

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

Terakhir, Anda juga dapat menghindari menempatkan kode sumber di direktori root dengan menempatkannya di sub-direktori `src`, [mengikuti panduan ini](https://docs.plasmo.com/framework/customization/src). Perhatikan bahwa `assets` dan file konfigurasi lainnya masih perlu berada di direktori root.

## Browser yang Didukung

Untuk melihat daftar target browser yang didukung, [lihat dokumentasi kami di sini](https://docs.plasmo.com/framework/workflows/faq#what-are-the-officially-supported-browser-targets).

## Komunitas

Komunitas Plasmo dapat ditemukan di [Discord](https://www.plasmo.com/s/d). Ini adalah saluran yang tepat untuk mendapatkan bantuan dalam menggunakan Plasmo Framework.

[Pedoman Perilaku](./.github/CODE_OF_CONDUCT.md) kami berlaku untuk semua saluran komunitas Plasmo.

## Berkontribusi

Silahkan lihat [pedoman kontribusi](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) untuk mempelajari lebih lanjut.

Terima kasih banyak untuk semua yang luar biasa [kontributor](https://github.com/PlasmoHQ/plasmo/graphs/contributors) ❤️

Jangan ragu untuk ikut bersenang-senang dan mengirim PR!

### Framework Plasmo

<a href="https://github.com/PlasmoHQ/plasmo/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/plasmo" />
</a>

### [Plasmo Examples](https://github.com/PlasmoHQ/examples)

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

## Disclaimer

Plasmo saat ini adalah perangkat lunak alpha, dan beberapa hal mungkin berubah dari versi ke versi, jadi harap berhati-hati dan gunakan dengan risiko Anda sendiri.

# Lisensi

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
