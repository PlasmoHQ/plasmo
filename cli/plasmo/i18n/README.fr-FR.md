<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="/cli/plasmo/license">
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
  <a href="/cli/plasmo/readme.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | French | <a href="/cli/plasmo/i18n/README.fr-FR.md">Deutsch</a>
</p>

# Plasmo Framework

Le [Plasmo](https://www.plasmo.com/) Framework est un SDK pour la création d'extensions de navigateur, développé par des hackers pour des hackers. Créez votre produit sans vous soucier des fichiers de configuration et des étranges particularités de la création d'extensions de navigateur.

> C'est comme [Next.js](https://nextjs.org/) pour les extensions de navigateur !

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Fonctionnalités

- Prise en charge de [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) de première classe
- [Développement déclaratif avec création automatique de "manifest.json" (MV3)](https://docs.plasmo.com/#where-is-the-manifestjson-file)
- Chargement en temps réel
- [Content Scripts UI](https://docs.plasmo.com/csui)
- [Fichiers `.env*`](https://docs.plasmo.com/browser-extension/env)
- [Regroupement de codes distants](https://docs.plasmo.com/browser-extension/remote-code) (par exemple pour gtag4)
- Cibler [plusieurs paires de navigateurs et de manifestes](https://docs.plasmo.com/workflows/build#with-specific-target)
- [Déploiement automatisé via BPP](https://docs.plasmo.com/workflows/submit)
- [Svelte](https://github.com/PlasmoHQ/with-svelte) ou [Vue](https://github.com/PlasmoHQ/with-vue)
- Et beaucoup, beaucoup plus! 🚀

## Configuration requise

- Node.js 16.x ou plus récent
- MacOS, Windows ou Linux
- (Fortement recommandé) [pnpm](https://pnpm.io/)

## Examples

Nous avons des exemples qui montrent comment utiliser Plasmo avec [l'authentification Firebase](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss), et bien d'autres. Pour les essayer, [visitez notre référentiel d'exemples](https://github.com/PlasmoHQ/examples).

## Documentation

Consultez la [documentation](https://docs.plasmo.com/) pour obtenir une vue plus approfondie du cadre Plasmo.

## Utilisation

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

La route qui nous attend est pleine de virages.

- Les modifications de popup viennent dans `popup.tsx`.
- Les modifications de la page d'options viennent dans `options.tsx`.
- Les modifications du script de contenu se trouvent dans `content.ts`.
- Les modifications du service d'arrière-plan vont dans le fichier `background.ts`.

### Structure des dossiers

Vous pouvez également organiser ces fichiers dans leurs propres répertoires :

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

Enfin, vous pouvez aussi éviter de placer le code source dans votre répertoire racine en le plaçant dans un sous-répertoire `src`, [en suivant ce guide](https://docs.plasmo.com/customization/src). Notez que `assets` et les autres fichiers de configuration devront toujours être dans le répertoire racine.

## Communauté

La communauté Plasmo se trouve sur [Discord](https://www.plasmo.com/s/d). C'est le réseau approprié pour obtenir de l'aide sur l'utilisation du cadre Plasmo.

Notre [code de conduite](./.github/CODE_OF_CONDUCT.md) s'applique à tous les canaux de la communauté Plasmo.

## Contribution

Veuillez consulter les [directives de contribution](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) pour en savoir plus.

## Avis de non-responsabilité

Plasmo est actuellement un logiciel alpha, et certaines choses peuvent changer d'une version à l'autre, alors soyez attentifs et utilisez-le à vos propres risques.

# License

[MIT](./license) ⭐ [Plasmo](https://www.plasmo.com)
