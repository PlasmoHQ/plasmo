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
1. Install the dependencies with:

   ```
   pnpm i
   ```

1. Start developing and watch for code changes:

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

Plasmo has 3 deployed environments:

| env name | purpose        | requirement           |
| -------- | -------------- | --------------------- |
| canary   | For WIP test   | Admin deploy directly |
| staging  | For beta test  | Merge to `main`       |
| latest   | Stable release | Merge to `stable`     |

Reviewer approves and merges PRs to `main` branch -> deploys to `staging`

> NOTE: Please make sure to use the `Squash and Merge` strategy

For `hotfix`, the workflow is:

1. Creates a `hotfix-FFFF` branch off of `stable` and a PR to `stable`

   ```sh
   git checkout stable
   git checkout -b hotfix-FFFF
   ```

   PR name: `hotfix: some quick patch`

   `FFFF` is an issue number

1. Admin reviews, approves and merges `hotfix-FFFF` to `stable` -> deploys to `latest`
1. Admin update `main` with `stable` -> deploys to `staging`

For `latest` deployment:

1. Admin merges `main` PR into `stable` branch -> deploys to `latest`

### Merge strategy

| From       | To       | Strategy         | Deploy to |
| ---------- | -------- | ---------------- | --------- |
| `feat-*`   | `main`   | Squash and Merge | staging   |
| `main`     | `stable` | Merge commit     | latest    |
| `hotfix-*` | `stable` | Squash and Merge | latest    |
| `stable`   | `main`   | Update/Merge     | staging   |

This is inspired by the [git flows workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
