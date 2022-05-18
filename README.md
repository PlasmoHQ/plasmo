<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="./LICENSE">
    <img alt="See License" src="https://img.shields.io/npm/l/plasmo"/>
  </a>
  <a aria-label="Twitter" href="https://www.twitter.com/plasmohq">
    <img alt="Follow PlasmoHQ on Twitter" src="https://img.shields.io/twitter/follow/plasmohq?logo=twitter"/>
  </a>
  <a aria-label="Twitch Stream" href="https://www.twitch.tv/plasmohq">
    <img alt="Watch our Live DEMO every Friday" src="https://img.shields.io/twitch/status/plasmohq?logo=twitch&logoColor=white"/>
  </a>
  <a aria-label="Discord" href="https://www.plasmo.com/s/d">
    <img alt="Join our Discord for support and chat about our projects" src="https://img.shields.io/discord/904466750429609984?logo=discord&logoColor=white"/>
  </a>
</p>

# p1asm0 open lab

This is an open laboratory for experimental as well as production modules from [plasmo](https://www.plasmo.com).

## Setup

```sh
# 0. Clone the base repo, and initialize the submodules:
# OR, clone and initialize each individual submodule <- recommended when this get HUGE
git clone git@github.com:PlasmoHQ/p1asm0.git --recurse-submodules

cd p1asm0

# 1. Checkout main on all submodules
pnpm -r --parallel --no-bail exec git checkout main

# 2. Install dependencies
pnpm i

# Happy hacking!
```

## Add a new submodule into packages

```sh
git submodule add git@github.com:PlasmoHQ/repo.git packages/repo
```

## Pull

```sh
git pull --recurse-submodules
# OR
git submodule update --remote --merge
# OR
pnpm -r --parallel --no-bail exec git pull
```

## Recursively commit and push

```sh
pnpm -r --parallel --no-bail exec git add .

pnpm -r --parallel --no-bail exec git commit -- -am "Bump dependencies"

pnpm -r --parallel --no-bail exec git push
```

## Recursively patch

```sh
pnpm patch

pnpm -r --parallel --no-bail exec git push
```

## Publishing

```sh
pnpm --filter ./packages/** -r publish --otp xxxxxx
```

# License

[MIT](./license) 🚀 [Plasmo Corp.](https://plasmo.com)
