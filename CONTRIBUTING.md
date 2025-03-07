# Contribution Guide

Thank you for considering contributing to `@rotki/eslint-plugin`! We welcome all kinds of contributions, from code to documentation, and everything in between. This guide will help you get started with contributing to our project.

## Prerequisites

Before you start contributing, make sure you have the following tools installed:

- **Node.js** (version 20 or higher). For ease of setup we recommend the usage of [`nvm`](https://github.com/nvm-sh/nvm).
- **pnpm** as the package manager

  - To install pnpm, use:

  `npm install -g pnpm`

## Getting Started

Before you start contributing, make sure you read our contribution guide to understand what we expect from a contribution.

### Guidelines for Vue and TypeScript

We use Vue and TypeScript in our project. Please familiarize yourself with our style and structure guidelines to ensure consistency across the codebase.

**[Vue TypeScript Guide](https://docs.rotki.com/contribution-guides/vue-typescript.html#vue)**

This guide provides detailed instructions and best practices for working with Vue and TypeScript in our project. Please make sure you follow these guidelines when contributing to our codebase.

### Managing Dependencies

Proper dependency management is crucial for maintaining a healthy codebase. Please refer to the section on dependencies for more details.

**[Dependencies Guide](https://docs.rotki.com/contribution-guides/vue-typescript.html#dependencies)**

This section outlines how to add, update, and manage dependencies in our project. Understanding and following these rules will help us avoid common pitfalls associated with dependencies.

## Commit Style

We use Conventional Commits as our commit style to ensure consistent and descriptive commit messages. This helps in automatically generating changelogs, determining the nature of changes (major, minor, patch), and for generally keeping our project's history clean and readable.

### Conventional Commits

A specification for adding human and machine-readable meaning to commit messages. The commit message should be structured as follows:

```text
<type>[optional scope]: <description>

[optional body]
[optional footer(s)]
```

**Types**:

- `feat`: Introduces a new feature.
- `fix`: Patches a bug in the codebase.
- `docs`: Documentation-only changes.
- `chore`: Maintenance tasks like tooling updates, dependencies, etc.
- `test`: Adding or modifying test cases.
- `refactor`: Code refactoring without behavior changes.
- `ci`: Modifications to CI configuration files and scripts.

#### Reverting and Breaking Changes

- If your commit reverts a previous commit, add `revert: ` before the type. E.g., `revert: feat(pencil): add 'graphiteWidth' option`.
- Breaking changes should start with `feat!` or `fix!`.

**Examples**:

```text
feat: add support for new configuration
fix: properly validate directory names
feat!: change input and output format
```

### Changelog Generation

Ensure that any changes that should be included in the change log are properly prefixed with `feat:` or `fix:`.
By following these guidelines, you will help ensure that our project remains maintainable and understandable for everyone involved.

## Linting

We use `@rotki/eslint-config` for linting to ensure code quality and consistency. Please make sure your code adheres to the project's linting rules before submitting a pull request.

### Running Linting

To run the linter, use the following command:

```sh
pnpm run lint
```

### Fixing Linting Issues

If you encounter any linting issues, you can attempt to auto-fix them using:

```sh
pnpm run lint --fix
```

Ensure that your code passes all linting checks before submitting your pull request. Proper linting helps maintain readability and reduces potential errors in the codebase.

### Making a Pull Request

Make sure that the project builds successfully and that the linter reports no errors.
For linter warnings you should strive to make sure that you changes do not increase them.

## Releases

We use `bumpp` to handle versioning for our releases, following Semantic Versioning principles. The release process involves updating the version and pushing a tag to trigger the release flow.

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/) to label our releases. The version number is of the format `MAJOR.MINOR.PATCH`:

- **MAJOR**: Incompatible API changes
- **MINOR**: Added functionality in a backwards-compatible manner
- **PATCH**: Backwards-compatible bug fixes

### Steps for Releasing

1. **Update Version**: Use `bumpp` to update the project version.

   ```sh
   pnpm run release
   ```

   Follow the prompts to select the appropriate version bump (e.g., patch, minor, major) based on the nature of the changes.

2. **Push Tag**: After updating the version, push the tag to remote to trigger the release flow.

   ```sh
   git push --follow-tags
   ```

3. **Update action tags**: The pushed tag will trigger the CI/CD pipeline to handle the remainder of the release process.

At this point the new version tag should be present at your git repository.
The next step is to create the major version tag. If you just released `v3.1.1` you now need to update
the v3 tag and push it as well.

> [!WARNING]
>
> If you already have pushed a major tag in the past, you might need to overwrite it by using the
> `--force` flag with the commands. The force is destructive, and you should be really careful when doing so.

```bash
# Make sure you are at v3.1.1
git tag v3 # -f if needed
git push upstream v3 # -f if needed
```

By doing this you will create, or update the `v3` tag. Any consumers of the action that use this tag
should also automatically pick the updated action.

> [!NOTE]
>
> Make sure to properly follow schemantic versioning and avoid introducing breaking changes in minor
> or patch releases since that might inconvenience any consumers of the major tag version.

## Contact

If you have any questions or need assistance, feel free to reach out to the [maintainers](https://discord.rotki.com) or open an issue on our repository.

Happy coding!
