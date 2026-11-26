# @rotki/eslint-plugin

ESLint plugin with rotki-specific rules for Vue, TypeScript, i18n and project conventions. It is
published to npm as `@rotki/eslint-plugin` and consumed by the rotki frontend
(`rotki/rotki/frontend`) and by `@rotki/eslint-config`.

This file is the maintenance guide for humans and coding agents. It covers day-to-day development,
adding rules, dependency updates and releases. `CONTRIBUTING.md` covers the contributor-facing
basics (commit style, linting, pull requests).

## Toolchain

- Node.js 24 (`.nvmrc`; CI reads its version from there). `engines.node` is `>=24 <25`.
- pnpm 12, pinned through `packageManager` in `package.json`. Use `corepack` or a matching pnpm.
- ESLint 9 and 10 are both supported (`peerDependencies`). CI runs the tests against each.
- Build: `unbuild` (`build.config.ts`). Tests: Vitest. Docs: VitePress.
- Linting the repo itself uses `@rotki/eslint-config`, plus `eslint-plugin-slop` and
  `eslint-plugin-sonarjs` (`eslint.config.js`).

## Layout

- `src/plugin.ts`: plugin object. Every rule is imported and registered here by hand.
- `src/index.ts`: default export (plugin plus `configs`) and the exported `RuleOptions` / `Rules`
  types.
- `src/configs/`: `recommended`, `strict`, `stylistic` presets, each in legacy and `-flat` form.
  They are built from each rule's `meta.docs.recommendation` (`src/utils/config.ts`).
- `src/rules/<rule-id>.ts`: one rule per file. A larger rule can be a directory with `index.ts`
  (see `src/rules/no-unused-i18n-keys/`).
- `src/utils/`: shared helpers. `createEslintRule` (`src/utils/rule.ts`) is the rule factory and
  sets `meta.docs.url` automatically.
- `src/types/`: type bridges between `@eslint/core`, `@typescript-eslint/utils` and
  `vue-eslint-parser`.
- `tests/rules/<rule-id>.ts`: rule tests. `tests/fixtures/`: fixture projects (i18n).
- `docs/rules/<rule-id>.md`: rule docs. `docs/rules/index.md` is generated.
- `scripts/`: `new-rule.ts` (scaffold), `update-rule-docs.ts` and `update-docs-index.ts`
  (doc generators).

## Commands

| Command                        | What it does                                                      |
| ------------------------------ | ----------------------------------------------------------------- |
| `pnpm run build`               | Build `dist/` with unbuild                                        |
| `pnpm run dev`                 | Stub build (`unbuild --stub`) that points `dist/` at the sources  |
| `pnpm run typecheck`           | `tsc --noEmit`                                                    |
| `pnpm run lint` / `lint:fix`   | ESLint over the whole repo                                        |
| `pnpm run test`                | Vitest in watch mode. Use `pnpm exec vitest run` for a single run |
| `pnpm run test:coverage`       | Single run with coverage, as CI does                              |
| `pnpm run new <rule-id>`       | Scaffold rule, test and doc files                                 |
| `pnpm run generate`            | Rewrite the generated parts of every `docs/rules/*.md`            |
| `pnpm run generate:index`      | Regenerate `docs/rules/index.md`                                  |
| `pnpm run docs` / `docs:build` | VitePress dev server / production build (runs both generators)    |

Before opening a pull request, run build, typecheck, lint and `pnpm exec vitest run`. CI runs the
same steps (`.github/workflows/ci.yml`).

## Conventions

- Commits follow Conventional Commits and are checked by commitlint in a git hook and in CI.
  `feat` and `fix` commits end up in the generated changelog, so pick the type with that in mind.
  Typical subjects: `feat: add <rule-id> rule`, `fix(<rule-id>): ...`,
  `chore(deps): update dependencies`, `ci: update github actions`.
- Dependencies are pinned to exact versions (`saveExact: true`). Add them with `pnpm add -E`.
- `lint-staged` runs ESLint on staged files in the pre-commit hook. Do not bypass hooks.
- Code comments explain why, not what. Disabling a lint rule needs a `--` reason, like the one at
  the top of `src/utils/rule.ts`.

## Adding a rule

1. Scaffold it:

   ```sh
   pnpm run new <rule-id>
   ```

   This writes `src/rules/<rule-id>.ts`, `tests/rules/<rule-id>.ts` and `docs/rules/<rule-id>.md`.
   The rule id is kebab-case and is used without the `@rotki/` prefix.

2. Implement the rule with `createEslintRule<Options, MessageIds>` (see
   `src/rules/no-dot-ts-imports.ts` for a small example). Set:
   - `meta.type` (`problem`, `suggestion` or `layout`) and `meta.docs.description`
   - `meta.docs.recommendation`: `recommended`, `strict` or `stylistic`. This decides which preset
     enables the rule. Adding a rule to `recommended` turns it on for every consumer of that preset.
   - `meta.fixable: 'code'` when the rule has a fixer, `meta.messages`, `meta.schema` and
     `defaultOptions`.

3. Register the rule in `src/plugin.ts`: import it and add it to `rules`, both in alphabetical
   order. The scaffold does not do this, and a rule that is not registered is in no preset, no
   docs index and no build.

4. Write tests in `tests/rules/<rule-id>.ts`. The existing tests use ESLint's `RuleTester` with
   `vue-eslint-parser`. Cover valid and invalid cases, every option and the fixer output
   (`output`).

5. Write the docs page. Keep the scaffold's headings: the generator replaces the header block
   under the title and the "Version" and "Implementation" footer. Add `since: vX.Y.0` to the front
   matter with the version the rule will ship in (the next minor for a new rule). The generator
   reads it to write the "Version" section.

6. Regenerate the docs and check the result:

   ```sh
   pnpm run generate && pnpm run generate:index
   ```

7. Commit as `feat: add <rule-id> rule`.

To change an existing rule, update its tests and docs in the same commit. Removing a rule, removing
or renaming an option, or making the defaults stricter in a way that reports new errors is a
breaking change (see Versioning below).

## Dependency updates

Renovate opens nothing by itself: the Dependency Dashboard issue
(`gh issue list -R rotki/eslint-plugin --search "Dependency Dashboard"`) lists pending updates for
approval (`.github/renovate.json5`).

**Prefer one batched update over approving Renovate pull requests one at a time.** Use the
dashboard as the checklist, and do a maintenance pass by hand when updates have piled up (roughly
monthly) and before a release. A batch is a single branch and pull request with a few commits, so
the lockfile is resolved once, CI and review run once, and interactions between updates (a plugin
bump that changes lint results, a transitive package that two updates share) show up together.
Renovate notices the merged versions and clears those dashboard entries by itself.

Tick a single dashboard box only for an update that cannot wait for the next batch, such as a fix
for a security advisory or a bug that blocks a consumer. The procedure below is the batched pass.

### Policy

- **7-day release-age cooldown.** It is set in both `.github/renovate.json5`
  (`minimumReleaseAge`) and `pnpm-workspace.yaml` (`minimumReleaseAge: 10080` minutes). pnpm will
  refuse to resolve anything younger. `@rotki/eslint-config` and `@rotki/eslint-plugin` are
  excluded so rotki can ship companion fixes the same day.
- **Node types follow the supported runtime.** Renovate restricts `@types/node` and `node` to
  24.x. Using types from a newer Node would let code call APIs that 24 does not have.
- **TypeScript is capped by typescript-eslint.** Check the peer range before a TypeScript major:
  `npm view @typescript-eslint/typescript-estree@<version> peerDependencies`.
- **ESLint 9 and 10 stay supported** until the peer range is changed deliberately.
- GitHub Actions are pinned by commit SHA with the version in a trailing comment.
- `pnpm-workspace.yaml` also carries a `vite` override (used by VitePress). Keep it on the latest
  patch.

### Procedure

1. Start from an up to date `main` on a branch such as `chore/deps-update`.
2. Gather the state:

   ```sh
   pnpm audit
   pnpm outdated
   gh issue view <dashboard-issue-number> -R rotki/eslint-plugin
   ```

   The dashboard also lists GitHub Actions updates, the pnpm version and the `vite` override,
   which `pnpm outdated` does not show.

3. Check publish dates on npm for each candidate and skip anything younger than 7 days:

   ```sh
   npm view <package> "time[<version>]"
   ```

4. Bump direct dependencies (runtime with `pnpm add -E`, dev tooling with `pnpm add -D -E`). Keep
   monorepo packages in lockstep: all `@typescript-eslint/*`, `vitest` with `@vitest/coverage-v8`,
   both `@commitlint/*`.
5. Update the `vite` override in `pnpm-workspace.yaml`, the pnpm version with
   `corepack use pnpm@<version>`, and action pins. Get an action's SHA with
   `gh api repos/<owner>/<repo>/commits/<tag> -q .sha`.
6. Refresh vulnerable transitive packages that `pnpm audit` still reports:

   ```sh
   pnpm update --depth Infinity <package> [<package> ...]
   ```

   Check that `package.json` gained no new direct dependencies afterwards. If an advisory remains
   because a parent pins an old version, trace it with `pnpm why <package>`. Prefer fixing it
   upstream (often in `@rotki/eslint-config`) over adding an `overrides` entry in
   `pnpm-workspace.yaml`, and never override across a major version without testing.

7. Verify: build, typecheck, lint, `pnpm exec vitest run` and `pnpm run docs:build`. The docs build
   runs the generators. If they rewrite docs you did not touch, leave that out of a dependency
   change. If any action pin changed, also run `pnpm run lint:workflows` (see Workflow changes).
8. Commit in two parts: `chore(deps): update dependencies` (package.json, lockfile,
   `pnpm-workspace.yaml`) and `ci: update github actions` (workflow pins). The pull request body
   should list what was bumped, what was held back and why, and what `pnpm audit` still reports.

## Workflow changes

Changes under `.github/workflows/`, including action pin bumps, must pass two tools that cover
different things:

- [actionlint](https://github.com/rhysd/actionlint) checks that workflows are valid: YAML and
  workflow syntax, expression types, `needs` and matrix references, action inputs, and the shell
  scripts in `run:` steps (through shellcheck).
- [zizmor](https://docs.zizmor.sh/) checks workflow security: permissions, credential persistence,
  template injection and pins. Its online audits also catch impostor commits, pins whose SHA does
  not match the version comment and actions with known vulnerabilities, which is what matters when
  updating pins.

The `workflow-lint` job in `ci.yml` runs both on every push and on pull requests that change
`.github/`. Run the same versions locally before committing (needs Docker and `uv`; the token
enables zizmor's online audits):

```sh
GH_TOKEN=$(gh auth token) pnpm run lint:workflows
```

The actionlint image digest and the zizmor version are pinned in both `ci.yml` and the
`lint:workflows` script. Move them together, and keep them in step with `rotki/eslint-config` and
`rotki/ui-library`.

The baseline is no findings. Fix new findings rather than suppressing them. If one has to stay,
suppress that single line with a `# zizmor: ignore[<audit>] <reason>` comment, never without a
reason. Two lines are ignored this way today, both `adhoc-packages`:

- `ci.yml`: `pnpm add -D eslint@${{ matrix.eslint }}` installs each supported ESLint major for the
  compatibility matrix.
- `publish.yml`: `npm install -g npm@11` provides an npm with trusted publishing support.

When editing workflows by hand, keep the existing patterns: `permissions: {}` at the top level with
per-job grants, `persist-credentials: false` on `actions/checkout`, SHA pins with a version
comment, and any `${{ }}` expression that carries outside input (pull request data, refs, inputs)
passed to `run:` steps through `env:` rather than inlined into the script.

## Releasing

Releases are tag driven. Pushing a `v*` tag runs `.github/workflows/publish.yml`.

1. Make sure `main` is green and contains everything for the release. Check that new rules have the
   right `since:` version in their docs.
2. Pick the version (see Versioning) and run:

   ```sh
   pnpm run release
   ```

   This is `bumpp -r --no-push`. It bumps `package.json`, commits `chore: release vX.Y.Z` and
   creates the tag locally.

3. Push the commit and the tag to `rotki/eslint-plugin`:

   ```sh
   git push <rotki-remote> main --follow-tags
   ```

4. The workflow then:
   - creates the GitHub release with notes from `changelogithub` (built from `feat`/`fix` commits);
   - runs the `publish` job in the `npm` environment, which waits for approval from one of the
     environment's required reviewers. After approval it builds and publishes to npm with
     provenance through npm trusted publishing (OIDC). No npm token is stored in the repository.
5. Verify the release:

   ```sh
   npm view @rotki/eslint-plugin version
   gh release view vX.Y.Z -R rotki/eslint-plugin
   ```

6. Update consumers (`@rotki/eslint-config`, `rotki/rotki/frontend`) if the release is needed
   there. The cooldown exclusion lets them pick it up immediately.

Docs are deployed to GitHub Pages (https://rotki.github.io/eslint-plugin/) on every push to `main`
by `.github/workflows/deploy-docs.yml`, independently of releases.

### Versioning

Semantic versioning, applied to what consumers see when they lint:

- **Patch:** bug fixes, fewer false positives, documentation, dependency updates that do not change
  behavior.
- **Minor:** new rules, new options, new fixers. A new rule in `recommended` is shipped as a minor,
  as previous releases have done.
- **Major:** removing or renaming a rule or option, changing defaults so that existing code gets new
  errors, dropping an ESLint or Node version from the supported ranges.

## Repository settings

These live in GitHub and npm, not in the repository. Keep this list current when they change.

- `main` is protected: 1 approving review, and the `ci`, `commit-lint`, `Workflow lint` and
  `license/cla` checks must pass. Contributors sign the rotki CLA (checked by `license/cla`).
- The `@rotki/maintainers` team has write access and is the code owner for everything
  (`.github/CODEOWNERS`). A team needs write access for a code owner entry to take effect.
- The `npm` environment allows only `v*` tags and requires a reviewer to approve each publish.
- npm package owners are managed on npmjs.com.
- Coverage is uploaded to Codecov with GitHub OIDC (`use_oidc: true`, `id-token: write` on the
  `ci` job), so no Codecov token is stored. Pull requests from forks upload without a token.
