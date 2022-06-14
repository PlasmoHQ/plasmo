# Contributing to Plasmo

To contribute to [our examples](https://github.com/PlasmoHQ/examples/), please see **[Adding examples](#adding-examples)** below.

## Developing

The development branch is `main`, and this is the branch that all pull
requests should be made against.

To develop locally:

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.
1. Clone the repository together with its submodules:

   ```bash
   git clone git@github.com:PlasmoHQ/plasmo.git --recurse-submodules
   ```

1. Checkout the current sprint `release-*` branch, see [workflow](#workflow) for more info:

   ```
   git checkout release-
   ```

1. Create a new feature branch:

   ```
   git checkout -b MY_BRANCH_NAME
   ```

1. Install [pnpm](https://pnpm.io/)
1. Install the dependencies with:

   ```
   pnpm i
   ```

1. Start developing and watch for code changes:

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
- To add additional notes, add `## Notes` section at the start of the generated readme.

## Naming convention

### Files and directories

Any files that require attention for reading should be `UPPER_CASE`. Examples:

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

### Branch and PR names

- Release branch: `release-x.x.x`
- Release branch PR: `Release x.x.x`
- Feature branch: `feat-FFFF`
- Feature branch PR: `FEAT | Some new feature | #FFFF |`
- Hotfix branch: `hotfix-FFFF`
- Hotfix branch PR: `HOTIX | Some quick patch | #FFFF |`

> `FFFF` is the issue number

## Devops and Merging process

Plasmo has 3 deployed environments:

| env name | purpose        | requirement           |
| -------- | -------------- | --------------------- |
| canary   | For WIP test   | Admin deploy directly |
| staging  | For beta test  | Merge to `release-*`  |
| latest   | Stable release | Merge to `main`       |

### Workflow

1. Admin starts a cycle by bumping the cli version, creating a `release-x.x.x` branch off `main` and a PR to `main`

   ```sh
   git checkout main
   git checkout -b release-x.x.x
   ```

   PR name: `Release x.x.x`

1. Contributor creates a `{feature}` branch off of `release-*` and a PR to `release-*`

   ```sh
   git checkout release-x.x.x
   git checkout -b feat-FFFF
   ```

   PR name: `FEAT | Some new feature | #FFFF |`

1. Reviewer approves and merges `{feature}` to `release-*` branch -> deploys to `staging`
1. Repeat the last 2 steps for the cycle duration (168 hours)
1. Admin merges `release-*` PR into `main` branch -> deploys to `latest`
1. Back to step 1

For `hotfix`, the workflow is:

1. Contributor creates a `hotfix-*` branch off of `main` and a PR to `main`

   ```sh
   git checkout main
   git checkout -b hotfix-FFFF
   ```

   PR name: `HOTIX | Some quick patch | #FFFF |`

1. Admin reviews, approves and merges `hotfix-*` to `main` -> deploys to `latest`
1. Admin update current cycle's `release-x.x.x` with update from `main` -> deploys to `staging`

### Merge strategy

| To          | From        | Strategy         | Deploy to |
| ----------- | ----------- | ---------------- | --------- |
| `release-*` | `{feature}` | Squash and Merge | staging   |
| `release-*` | `main`      | Update           | staging   |
| `main`      | `hotfix-*`  | Squash and Merge | latest    |
| `main`      | `release-*` | Merge commit     | latest    |

This is inspired by the [git flows workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
