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
  <a href="/cli/plasmo/README.md">English</a> | 简体中文 | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a> | <a href="/cli/plasmo/i18n/README.id-ID.md">Indonesian</a> | <a href="/cli/plasmo/i18n/README.ru-RU.md">Русский</a> | <a href="/cli/plasmo/i18n/README.tr-TR.md">Turkish</a> | <a href="/cli/plasmo/i18n/README.ja-JP.md">日本語</a> | <a href="/cli/plasmo/i18n/README.ko-KR.md">한국어</a>
</p>

**云服务:** 我们为浏览器扩展程序构建了一个云服务，叫 [Itero](https://itero.plasmo.com) 。如果你想要进行即时beta测试并体验更多很棒的功能，可以去尝试一下。

# Plasmo 框架

[Plasmo](https://www.plasmo.com/) 框架是一款黑客为黑客打造的功能强大的浏览器扩展程序软件开发工具包（SDK）。使用 Plasmo 来构建你的浏览器扩展程序，不需要操心扩展的配置文件和构建时的一些奇怪特性。

> 它就像浏览器扩展界的 [Next.js](https://nextjs.org/) ！

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## 特性

- 一流的 [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) 支持
- [声明式开发（自动生成 manifest.json）](https://docs.plasmo.com/framework#where-is-the-manifestjson-file)
- [将UI组件渲染到网页](https://docs.plasmo.com/csui)
- [扩展内置页面](https://docs.plasmo.com/framework/tab-pages)
- 扩展热重载 + React 模块热更新
- [`.env*` 文件](https://docs.plasmo.com/framework/env)
- [扩展储存 API](https://docs.plasmo.com/framework/storage)
- [扩展通信 API](https://docs.plasmo.com/framework/messaging)
- [远程代码打包](https://docs.plasmo.com/framework/remote-code) (例如 Google Analytics)
- 支持[多个浏览器和manifest版本](https://docs.plasmo.com/framework/workflows/build#with-specific-target)
- [通过BPP进行自动部署](https://docs.plasmo.com/framework/workflows/submit)
- 可选 [Svelte](https://github.com/PlasmoHQ/with-svelte) 或 [Vue](https://github.com/PlasmoHQ/with-vue) 进行开发

还有更多的功能！🚀

## 系统要求

- Node.js 16.x 及以上
- MacOS，Windows，或 Linux
- (强烈推荐) [pnpm](https://pnpm.io/)

## 代码示例

我们有一些展示如何集成 [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss) 以及更多技术的代码示例。如果想要浏览全部代码示例，请[访问示例仓库](https://github.com/PlasmoHQ/examples)。

## 文档

阅读 [文档](https://docs.plasmo.com/) 以更深入地了解 Plasmo 框架。

## 浏览器扩展书籍

为了更深入了解浏览器扩展工作原理和开发方法，我们强烈推荐 Matt Frisbie 的新书 ["Building Browser Extensions"](https://buildingbrowserextensions.com/plasmo)。

## 使用

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

注意

- Popup 页面改动应在 `popup.tsx`
- Options 页面改动应在 `options.tsx`
- Content script 改动应在 `content.ts`
- Background service worker 改动应在 `background.ts`

### 目录

您还可以在它们各自的目录中组织这些文件：

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

此外，您也能够将代码放到 `src` 子目录，而不将它们放到根目录，请[参阅该指南](https://docs.plasmo.com/framework/customization/src)。注意 `assets` 和其他配置文件仍须在根目录下。

## 支持的浏览器

要查看支持的浏览器列表，[请参考我们此处的文档](https://docs.plasmo.com/framework/workflows/faq#what-are-the-officially-supported-browser-targets).

## 社区

可以在 [Discord](https://www.plasmo.com/s/d) 找到 Plasmo 社区。这是获得 Plasmo 框架使用帮助的恰当渠道。

我们的 [行为守则](./.github/CODE_OF_CONDUCT.md) 适用于所有 Plasmo 社区频道。

## 贡献

请参阅 [贡献指南](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) 以了解更多内容。

非常感谢所有的 [贡献者](https://github.com/PlasmoHQ/plasmo/graphs/contributors) ❤️

欢迎发送PR加入我们的行列！

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

## 免责声明

Plasmo 当前仍为 alpha 软件，且不同版本间可能存在修改，所以在使用过程中请留意，风险自负。

# 协议

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
