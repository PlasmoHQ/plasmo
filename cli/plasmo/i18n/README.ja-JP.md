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
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a> | <a href="/cli/plasmo/i18n/README.id-ID.md">Indonesian</a> | <a href="/cli/plasmo/i18n/README.ru-RU.md">Русский</a> | <a href="/cli/plasmo/i18n/README.tr-TR.md">Turkish</a> | 日本語
</p>

**Production Cloud:** 私たちはブラウザ拡張機能向けのクラウドサービス「Itero」を開始しました。即時のベータテストやより素晴らしい機能が必要なら、ぜひチェックしてください。

# Plasmo Framework

[Plasmo](https://www.plasmo.com/) Framework は、すべての開発者のためのブラウザ拡張機能のSDKです。拡張機能のconfigファイルやビルドにおける面倒な独自仕様に悩まされずに拡張機能を作りましょう！

> ブラウザ拡張機能における[Next.js](https://nextjs.org/)

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## 主な機能

- [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) の全面サポート
- [宣言型開発](https://docs.plasmo.com/framework#where-is-the-manifestjson-file)
- [Contents Scripts UI](https://docs.plasmo.com/csui)
- [Tab Pages](https://docs.plasmo.com/framework/tab-pages)
- ライブリロード + React HMR
- [`.env*` ファイル](https://docs.plasmo.com/framework/env)
- [Storage API](https://docs.plasmo.com/framework/storage)
- [Messaging API](https://docs.plasmo.com/framework/messaging)
- [リモートコードバンドル](https://docs.plasmo.com/framework/remote-code) (Google Analyticsなど)
- [複数ブラウザ・マニフェスト対応](https://docs.plasmo.com/framework/workflows/build#with-specific-target)
- [BPPによる自動デプロイ](https://docs.plasmo.com/framework/workflows/submit)
- [Svelte](https://github.com/PlasmoHQ/with-svelte)、 [Vue](https://github.com/PlasmoHQ/with-vue) にも対応

他にもたくさんの機能があります！ 🚀

## システム要件

- Node.js 16.x 以上
- MacOS, Windows, Linux のいずれか
- [pnpm](https://pnpm.io/)(推奨)

## 例

[Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss) などと組み合わせた例を[こちらのリポジトリ](https://github.com/PlasmoHQ/examples)で紹介しています。

## ドキュメント

さらに詳しく知りたい場合は、[ドキュメント](https://docs.plasmo.com/)をご覧ください。

## ブラウザ拡張機能についての書籍

ブラウザ拡張機能の動作や開発方法についてさらに深く学びたい場合、Matt Frisbie氏の書籍[『Building Browser Extensions』](https://buildingbrowserextensions.com/plasmo)がおすすめです。

## 使い方

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

変更したい部分によって、以下のファイルを編集してください。

- ポップアップ → `popup.tsx` 
- 設定ページ → `options.tsx`
- コンテンツスクリプト → `content.ts`
- バックグランドサービスワーカー → `background.ts`

### ディレクトリ構造

これらのファイルはそれぞれのディレクトリに分けて整理することもできます。

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

また、ルートディレクトリに置きたくない場合は、`src` ディレクトリを作成して、そこにソースコードを置くこともできます。詳しくは[こちらのガイド](https://docs.plasmo.com/framework/customization/src)をご覧ください。

ただし、`assets` やconfigファイルはルートディレクトリに置く必要があります。

## 対応しているブラウザ

対応しているブラウザのリストは、[こちらのドキュメント](https://docs.plasmo.com/framework/workflows/faq#what-are-the-officially-supported-browser-targets)をご覧ください。

## コミュニティ

[Discord](https://www.plasmo.com/s/d)にPlasmoのコミュニティがあります。Plasmo Framework に関するヘルプはこちらでお願いします。

[Code of Conduct](./.github/CODE_OF_CONDUCT.md)は、全てのPlasmoコミュニティに適用されます。

## コントリビュート

詳しくは[コントリビュートガイドライン](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md)をご覧ください。

素晴らしい[コントリビューターの方々](https://github.com/PlasmoHQ/plasmo/graphs/contributors)に感謝します❤️

ぜひ気軽に参加してPRを送ってください！

### Plasmo Framework

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

## 免責事項

Plasmoは現在α版のソフトウェアです。バージョンアップによって変更される可能性がありますので、ご注意いただき自己責任で使用してください。

# ライセンス

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
