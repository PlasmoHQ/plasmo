<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="/cli/plasmo/license">
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
  English | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a>
</p>

# Plasmo Framework

The [Plasmo](https://www.plasmo.com/) Framework is a battery-packed browser extension SDK made by hackers for hackers. Build your product and stop worrying about config files and the odd peculiarities of building browser extensions.

> It's like [Next.js](https://nextjs.org/) for browser extensions!

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Features

- First-class [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/) Support
- [Declarative development](https://docs.plasmo.com/#where-is-the-manifestjson-file)
- Live-reloading
- [`.env*` files](https://docs.plasmo.com/workflows/env)
- [Remote code bundling](https://docs.plasmo.com/workflows/remote-code) (e.g for gtag4)
- Targetting [multiple browser and manifest pairs](https://docs.plasmo.com/workflows#--target-flag)
- Automated deployment (via [BPP](https://docs.plasmo.com/workflows/submit))
- Optional support for [Svelte](https://github.com/PlasmoHQ/with-svelte) and [Vue](https://github.com/PlasmoHQ/with-vue)
- And many, many more! 🚀

## System Requirements

- Node.js 16.x or later
- MacOS, Windows, or Linux
- (Strongly Recommended) [pnpm](https://pnpm.io/)

## Examples

We have examples showcasing how one can use Plasmo with [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss), and many more. To check them out, [visit our examples repository](https://github.com/PlasmoHQ/examples).

## Documentation

Check out the [documentation](https://docs.plasmo.com/) to get a more in-depth view into the Plasmo Framework.

## Usage

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

The road ahead is filled with many turns.

- Popup changes go in `popup.tsx`
- Options page changes go in `options.tsx`
- Content script changes go in `content.ts`
- Background service worker changes go in `background.ts`

### Directories

You can also organize these files in their own directories:

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

Finally, you can also avoid putting source code in your root directory by putting them in a `src` sub-directory, [following this guide](https://docs.plasmo.com/customization#using-src-directory-for-source-code). Note that `assets` and other config files will still need to be in the root directory.

## Community

The Plasmo community can be found on [Discord](https://www.plasmo.com/s/d). This is the appropriate channel to get help with using the Plasmo Framework.

Our [Code of Conduct](./.github/CODE_OF_CONDUCT.md) applies to all Plasmo community channels.

## Contributing

Please see the [contributing guidelines](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) to learn more.

## Disclaimer

Plasmo is currently alpha software, and some things might change from version to version, so please be mindful and use it at your own risk.

# License

[MIT](./license) ⭐ [Plasmo](https://www.plasmo.com)
