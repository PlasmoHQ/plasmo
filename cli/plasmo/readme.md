<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="./license">
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

# Plasmo Framework

The [Plasmo](https://www.plasmo.com/) Framework is a low-config declarative browser extension development SDK. Build your product and stop worrying about manifest.json files and the odd peculiarities of building browser extensions.

![](https://github.com/PlasmoHQ/plasmo/blob/main/cli/plasmo/demo.gif)

Features include:

- First-class React + Typescript Support
- Declarative development
- Live-reloading
- `manifest.json` auto-generation
- MV3-by-default
- .env file support

And a large backlog of features that haven't been built yet!

## Requirements

Plasmo is an opinionated framework. As such, we support the following technologies out-of-the-box:

- View Library
  - React
- Language
  - Typescript
- Testing Library
  - Jest
- Browser Extension Version
  - Manifest Version 3

We have many examples showcasing how one can use Plasmo with [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss), and a bunch more you can see if you visit our [examples repository](https://github.com/PlasmoHQ/examples).

## Documentation

Check out the [documentation](https://docs.plasmo.com/) to get a more in-depth view into the Plasmo Framework.

## Usage

```
pnpm dlx plasmo init example-dir
cd example-dir
pnpm dev
```

The road ahead is filled with many turns.

- Popup changes go in `popup.tsx`
- Options page changes go in `options.tsx`
- Background service worker changes go in `background.ts`
- Content script changes go in `content.ts`

### Directories

You can also put these files in their own directories if you think that's cleaner:

```
ext-dir
|-background
 |-index.ts
|-contents
 |-a-content-script.ts
 |-another-one.ts
 |-names-dont-matter-here.ts
|-options
 |-index.tsx
 |-some-other-file.ts
 |-another-file.tsx
.
.
.
```

Finally, you can also avoid putting source code in your root directory by putting everything mentioned in an `src` directory.

## Community

The Plasmo community can be found on [Discord](https://www.plasmo.com/s/d). This is the appropriate channel to get help with using the Plasmo Framework.

Our [Code of Conduct](./.github/CODE_OF_CONDUCT.md) applies to all Plasmo community channels.

## Contributing

Please see the [contributing guidelines](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) to learn more.

## Disclaimer

Plasmo is currently alpha software, and some things might change from version to version, so please be mindful and use it at your own risk.

# License

[MIT](./license) ⭐ [Plasmo](https://www.plasmo.com)
