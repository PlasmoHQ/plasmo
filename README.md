# p1asm0 open lab

This is an open laboratory for experimental as well as production modules from [plasmo](https://www.plasmo.com).

## Setup

```sh
# 0. Clone the base repo, and initialize the submodules:
# OR, clone and initialize each individual submodule <- recommended when this get HUGE
git clone git@github.com:plasmo-corp/p1asm0.git --recurse-submodules

cd p1asm0

# 1. Install the dependencies
pnpm i

# Happy hacking!
```

## Pull

```sh
git submodule update --remote
```

## Recursively commit and push

```sh
git submodule foreach --recursive git add .
git submodule foreach --recursive git commit -am "Bump dependencies"
git submodule foreach --recursive git push
```

## Recursively patch

```sh
pnpm patch
git submodule foreach --recursive git push
```

## Publishing

```sh
pnpm publish
```
