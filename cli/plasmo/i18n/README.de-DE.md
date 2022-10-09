<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="/cli/plasmo/LICENSE">
    <img alt="License anzeigen" src="https://img.shields.io/npm/l/plasmo"/>
  </a>
  <a aria-label="NPM" href="https://www.npmjs.com/package/plasmo">
    <img alt="NPM Install" src="https://img.shields.io/npm/v/plasmo?logo=npm"/>
  </a>
  <a aria-label="Twitter" href="https://www.twitter.com/plasmohq">
    <img alt="Folge PlasmoHQ auf Twitter" src="https://img.shields.io/twitter/follow/plasmohq?logo=twitter"/>
  </a>
  <a aria-label="Twitch Stream" href="https://www.twitch.tv/plasmohq">
    <img alt="Schaue unsere Live DEMO jeden Freitag an" src="https://img.shields.io/twitch/status/plasmohq?logo=twitch&logoColor=white"/>
  </a>
  <a aria-label="Discord" href="https://www.plasmo.com/s/d">
    <img alt="Trete unserem Discord server bei, um zu chatten und Unterstützung für Projekte zu bekommen" src="https://img.shields.io/discord/946290204443025438?logo=discord&logoColor=white"/>
  </a>
</p>

<p align="center">
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | Deutsch | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a>
</p>

# Plasmo Framework

Das [Plasmo](https://www.plasmo.com/) Framework ist ein SDK zum Erstellen von Browser-Erweiterungen, das von Hackern für Hacker entwickelt wurde. Erstelle dein Produkt, ohne dir Gedanken über Konfigurationsdateien und die seltsamen Eigenheiten der Erstellung von Browsererweiterungen machen zu müssen.

> Es ist wie [Next.js](https://nextjs.org/) für Browser-Erweiterungen!

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Features

- Direkte Unterstützung von [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/)
- [Deklarative Entwicklung mit automatischer Erzeugung von "manifest.json" (MV3)](https://docs.plasmo.com/#where-is-the-manifestjson-file)
- Automatisches Neuladen
- [`.env*` Datei-Unterstützung](https://docs.plasmo.com/browser-extension/env)
- [Bundling von externen Skripten](https://docs.plasmo.com/workflows/remote-code) (z.B. für gtag4)
- Automatisierte Bereitstellung (über [BPP](https://docs.plasmo.com/workflows/submit))
- Und viel, viel mehr! 🚀

## Systemanforderungen

- Node.js 16.x oder neuer
- MacOS, Windows oder Linux
- (Stark empfohlen) [pnpm](https://pnpm.io/)

## Beispiele

Wir haben Beispiele, die zeigen, wie man Plasmo mit [Firebase-Authentifizierung](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase-Authentifizierung](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss) und vielen anderen verwenden kann. Um sie auszuprobieren, [besuche unser Beispiel-Repository](https://github.com/PlasmoHQ/examples).

## Dokumentation

Schaue dir die [Dokumentation](https://docs.plasmo.com/) an, um einen tieferen Einblick in das Plasmo Framework zu erhalten.

## Nutzung

```
pnpm dlx plasmo init example-dir
cd example-dir
pnpm dev
```

Danach stehen dir alle Wege offen.

- Popup-Änderungen kommen in `popup.tsx`
- Änderungen an der Optionsseite kommen in `options.tsx`.
- Änderungen am Inhaltsskript kommen in `content.ts`
- Änderungen am Hintergrunddienst kommen in die Datei `background.ts`.

### Ordner-Struktur

Du kannst die Dateien auch in eigenen Ordnern organisieren:

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

Außerdem kannst du auch vermeiden, dass alle Dateien im Hauptverzeichnis liegen, wenn du sie in das Unterverzeichnis `src` legen, [indem du dieser Anleitung folgst](https://docs.plasmo.com/customization/src). Beachte, dass `assets` und andere Konfigurationsdateien immer noch im Hauptverzeichnis liegen müssen.

## Community

Die Plasmo-Community ist auf [Discord](https://www.plasmo.com/s/d) zu finden. Das ist der richtige Kanal, um Hilfe bei der Verwendung des Plasmo-Frameworks zu erhalten.

Unser [Verhaltenskodex](./.github/CODE_OF_CONDUCT.md) gilt für alle Plasmo Community-Kanäle.

## Am Projekt beteiligen

Schaue dir die [Richtlinien](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) an, um mehr zu erfahren.

## Information

Plasmo ist derzeit eine Alphasoftware, und einige Dinge können sich von Version zu Version ändern. Sei also bitte achtsam und benutze es auf eigenes Risiko.

# Lizenz

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
