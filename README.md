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
