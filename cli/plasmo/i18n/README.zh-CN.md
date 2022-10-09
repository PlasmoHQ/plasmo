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
  <a href="/cli/plasmo/README.md">English</a> | 简体中文 | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a>
</p>

# Plasmo 框架

[Plasmo](https://www.plasmo.com/) 框架是骇客为骇客制作的一个强力的浏览器扩展 SDK。构建您的产品，无需担心配置文件编写和构建浏览器扩展时的奇怪特性。

> 它就像浏览器扩展界的 [Next.js](https://nextjs.org/) ！

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## 特性

- 对 [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) 的一等支持
- [声明式开发，自动生成 `manifest.json` (MV3)](https://docs.plasmo.com/#where-is-the-manifestjson-file)
- 热重载
- [`.env*` 文件](https://docs.plasmo.com/browser-extension/env)
- [远程代码打包](https://docs.plasmo.com/workflows/remote-code) (例如：使用 gtag4 )
- 自动部署 (通过 [BPP](https://docs.plasmo.com/workflows/submit))
- 还有更多! 🚀

## 系统要求

- Node.js 16.x 及以上
- MacOS，Windows，或 Linux
- (强烈推荐) [pnpm](https://pnpm.io/)

## 例子

我们有一些展示如何集成 [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth)、[Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux)、[Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase)、[Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss) 以及更多技术的示例。若要浏览全部示例，请[访问示例仓库](https://github.com/PlasmoHQ/examples)。

## 文档

阅读[文档](https://docs.plasmo.com/)以更深入地了解 Plasmo 框架。

## 使用

```
pnpm dlx plasmo init example-dir
cd example-dir
pnpm dev
```

注意

- Popup 改动应在 `popup.tsx`
- Options 页面改动应在 `options.tsx`
- Content script 改动应在 `content.ts`
- Background service worker 改动应在 `background.ts`

### 目录

您还可以在它们各自的目录中组织这些文件：

```
ext-dir
├───assets
|   └───icon512.png
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

此外，您也能够将代码放到 `src` 子目录，而不将它们放到根目录，请[参阅该指南](https://docs.plasmo.com/customization/src)。注意 `assets` 和其他配置文件仍须在根目录下。

## 社区

可以在 [Discord](https://www.plasmo.com/s/d) 找到 Plasmo 社区。这是获得 Plasmo 框架使用帮助的恰当渠道。

我们的 [行为守则](./.github/CODE_OF_CONDUCT.md) 适用于所有 Plasmo 社区频道。

## 贡献

请参阅 [贡献指南](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) 以了解更多。

## 免责声明

Plasmo 当前仍为 alpha 软件，且不同版本间可能存在修改，所以在使用过程中请留意，风险自负。

# 协议

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
