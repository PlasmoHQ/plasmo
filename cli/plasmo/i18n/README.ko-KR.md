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
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a> | <a href="/cli/plasmo/i18n/README.id-ID.md">Indonesian</a> | <a href="/cli/plasmo/i18n/README.ru-RU.md">Русский</a> | <a href="/cli/plasmo/i18n/README.tr-TR.md">Turkish</a> | <a href="/cli/plasmo/i18n/README.ja-JP.md">日本語</a> | 한국어
</p>

**Production Cloud:** [Itero](https://itero.plasmo.com)라는 브라우저 확장 프로그램용 클라우드 서비스를 구축했습니다. 즉시 베타 테스트 및 더 많은 멋진 기능을 원하시면 확인해보세요.


# Plasmo 프레임워크

[Plasmo](https://www.plasmo.com/) 프레임워크는 개발자들을 위해 만들어진 강력한 브라우저 확장 프로그램 SDK입니다. 이를 통해 제품을 만들 때 설정 파일과 브라우저 확장 프로그램 개발의 특이한 부분에 대해 걱정하지 않고 진행할 수 있습니다.

> 브라우저 확장 프로그램을 위한 [Next.js](https://nextjs.org/)와 같습니다!

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## 주요 기능

- [React](https://reactjs.org/) 및 [Typescript](https://www.typescriptlang.org/)를 위한 first-class 지원
- [선언적 개발](https://docs.plasmo.com/framework#where-is-the-manifestjson-file)
- [콘텐츠 스크립트 UI](https://docs.plasmo.com/csui)
- [탭 페이지](https://docs.plasmo.com/framework/tab-pages)
- 라이브 리로딩 및 React HMR
- [`.env*` 파일](https://docs.plasmo.com/framework/env)
- [Storage API](https://docs.plasmo.com/framework/storage)
- [Messaging API](https://docs.plasmo.com/framework/messaging)
- [원격 코드 번들링](https://docs.plasmo.com/framework/remote-code) (ex. Google Analytics를 위한)
- [여러 브라우저 및 매니페스트 타겟팅](https://docs.plasmo.com/framework/workflows/build#with-specific-target)
- [BPP를 통한 자동 배포](https://docs.plasmo.com/framework/workflows/submit)
- [Svelte](https://github.com/PlasmoHQ/with-svelte) 및 [Vue](https://github.com/PlasmoHQ/with-vue)의 선택적 지원

이 외에도 많은 기능이 있습니다! 🚀

## 시스템 요구 사항

- Node.js 16.x 이상
- MacOS, Windows 또는 Linux
- (매우 권장) [pnpm](https://pnpm.io/)

## 예제

[Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss)와 함께 Plasmo를 사용하는 방법을 보여주는 예제를 제공하고 있습니다. 이를 확인하려면 [예제 레포지토리](https://github.com/PlasmoHQ/examples)를 방문해보세요.

## 문서

Plasmo 프레임워크에 대해 더 자세히 알아보려면 [문서](https://docs.plasmo.com/)를 확인하세요.


## 브라우저 확장 프로그램 관련 책

브라우저 확장 프로그램이 작동하는 방식과 개발하는 방법에 대해 더 자세히 알아보려면 Matt Frisbie의 새 책 ["Building Browser Extensions"](https://buildingbrowserextensions.com/plasmo)을 강력히 추천합니다.

## 사용법

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

변경하고자 하는 부분에 따라 아래 파일을 편집해 주세요.

- 팝업 → `popup.tsx` 파일
- 옵션 페이지 → `options.tsx`
- 콘텐츠 스크립트 → `content.ts`
- 백그라운드 서비스 워커 → `background.ts`

### 폴더 구조

이 파일들을 각각의 디렉토리에 정리해서 넣을 수도 있습니다.

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

마지막으로, 소스 코드를 루트 디렉토리에 넣지 않고 [이 가이드를 따라](https://docs.plasmo.com/framework/customization/src) `src` 하위 디렉토리에 넣을 수도 있습니다. 그러나 `assets` 및 기타 구성 파일은 여전히 루트 디렉토리에 있어야 합니다.

## 지원하는 브라우저

지원하는 브라우저 목록을 확인하려면 [이 문서](https://docs.plasmo.com/framework/workflows/faq#what-are-the-officially-supported-browser-targets)를 참조하세요.

## 커뮤니티

Plasmo 커뮤니티는 [Discord](https://www.plasmo.com/s/d)에서 찾을 수 있습니다. Plasmo 프레임워크 사용에 관한 도움을 받기에 적절한 채널입니다.

[행동 강령(Code of Conduct)](./.github/CODE_OF_CONDUCT.md)은 모든 Plasmo 커뮤니티 채널에 적용됩니다.

## 기여

자세한 내용은 [기여 가이드라인(Contributing Guidelines)](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md)을 참조하세요.

훌륭한 [컨트리뷰터](https://github.com/PlasmoHQ/plasmo/graphs/contributors) 여러분들께 큰 감사를 드립니다 ❤️

자유롭게 참여하고 PR을 보내주세요!

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

## 면책 조항

Plasmo는 현재 알파 버전의 소프트웨어이며, 버전 간에 일부 변경 사항이 있을 수 있으므로 주의하고 사용하십시오.

# 라이선스

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
