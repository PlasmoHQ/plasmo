# Contributing to Plasmo

To contribute to [our examples](https://github.com/PlasmoHQ/examples/), please see **[Adding examples](#adding-examples)** below.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it:

   ```bash
   git clone git@github.com:<org>/plasmo.git --recurse-submodules
   ```

   **NOTE:** Replace `<org>` with your GitHub username or organization.

1. Work on your fork's `main` branch, then [open a PR](https://github.com/PlasmoHQ/plasmo/compare). Please ensure the PR name follows the naming convention:

   `feat: some new feature`

   Replacing `feat` with `fix`, `bug` or `doc` accordingly

## Adding examples

When you add an example to the [examples](https://github.com/PlasmoHQ/examples/) repository:

- Use `pnpm create plasmo --exp` to create the example.
- The name of the example should have a `with-*` prefix.
- To add additional notes, add a `## Notes` section at the start of the generated readme.
- Your PR should be pointed to the [examples project](https://github.com/PlasmoHQ/examples/).

## Developing

The development branch is `main`, and this is the branch that all pull
requests should be made against.

To develop locally:

1. Install [pnpm](https://pnpm.io/)
   - DO NOT install pnpm a as npm's global dependency, we need pnpm to be able to link directly to your $PATH.
   - Recommended installation method is with corepack or with brew (on macOS)
   - If installed with brew, you might need to include the pnpm $PATH to your debugger
2. Install the dependencies with:

   ```
   pnpm i
   ```

3. Start developing and watch for code changes:

   ```
   pnpm dev:cli
   ```

## Developing with your local version of Plasmo

### As global link

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

3. To revert the linking later on:

   ```sh
   pnpm rm -g plasmo
   ```

Note: The `create-plasmo` CLI tool is not meant to be run locally.
If you have already linked it, please run

```sh
pnpm -g unlink create-plasmo
```

to unlink it.

## Building

You can build the project, including all type definitions, with:

```bash
pnpm build
```

## Naming convention

### Files and directories

Any files that require attention for reading should be `UPPER_CASE`. Examples:

- README.md
- LICENSE
- SECURITY.md
- CONTRIBUTING.md

Directory and source file should use `kebab-case`, unless required by tooling. Examples:

- cli/plasmo/src/features/extension-devtools/plasmo-extension-manifest.ts

### Code

| Concept              | Naming convention       |
| -------------------- | ----------------------- |
| Local constants      | `UPPER_CASE`            |
| Enum namespace       | `PascalCase`            |
| Enum values          | `PascalCase`            |
| TS types             | `PascalCase`            |
| TS fields            | `camelCase`             |
| React component      | `PascalCase`            |
| React hook           | `camelCase`             |
| Local variable       | `camelCase`             |
| Unused argument      | `_paddedCamelCase`      |
| Template Placeholder | `__snake_case_padded__` |
| Functions            | `camelCase`             |
| API Routes           | `kebab-case`            |

## For Core Maintainers / Admin

Plasmo has 2 deployed environments:

| env name | purpose        | requirement           |
| -------- | -------------- | --------------------- |
| lab      | For WIP test   | Admin deploy directly |
| latest   | Stable release | Merge to `stable`     |

Reviewer approves and merges PRs to `main` branch -> deploys to `latest`

> NOTE: Please make sure to use the `Squash and Merge` strategy

For `hotfix`, the workflow is:

1. Creates a `hotfix-FFFF` branch off of `stable` and a PR to `stable`

   ```sh
   git checkout stable
   git checkout -b hotfix-FFFF
   ```

   PR name: `hotfix: some quick patch`

   `FFFF` is an issue number

1. Admin reviews, approves and merges `hotfix-FFFF` to `main` -> deploys to `latest`

### Merge strategy

1. Admin review PR
1. If the rough idea is good, code owner season the PR or guide the author to make it better
1. Merge and deploy following the table below:

| From       | To     | Strategy         | Deploy to |
| ---------- | ------ | ---------------- | --------- |
| `feat-*`   | `main` | Squash and Merge | latest    |
| `hotfix-*` | `main` | Squash and Merge | latest    |
