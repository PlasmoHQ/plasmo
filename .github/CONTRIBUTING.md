# Contributing to Plasmo

To contribute to [our examples](https://github.com/PlasmoHQ/examples/), please see **[Adding examples](#adding-examples)** below.

## Developing

The development branch is `main`, and this is the branch that all pull
requests should be made against.

To develop locally:

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.
2. Clone the repository together with its submodules:
   ```bash
   git clone git@github.com:PlasmoHQ/plasmo.git --recurse-submodules
   ```
3. Create a new branch:
   ```
   git checkout -b MY_BRANCH_NAME
   ```
4. Install [pnpm](https://pnpm.io/)
5. Install the dependencies with:
   ```
   pnpm i
   ```
6. Start developing and watch for code changes:
   ```
   pnpm dev
   ```

## Building

You can build the project, including all type definitions, with:

    ```bash
    pnpm build
    ```

## Developing with your local version of Plasmo

There are two options to develop with your local version of the codebase:

### Set as local dependency in package.json

1. Link `plasmo` to your local registry:

   ```sh
   cd plasmo/cli/plasmo
   pnpm link --global
   ```

2. Invoke plasmo directly:

   ```sh
     plasmo init
     plasmo dev
     plasmo build
   ```

## Adding examples

When you add an example to the [examples](examples) repository:

- Use `pnpm dlx plasmo init` to create the example.
- The name of the example should have a `with-*` prefix.
- To add additional notes, add `## Notes` section at the end of the generated readme.
