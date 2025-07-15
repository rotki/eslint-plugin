# @rotki/eslint-plugin

This is an ESLint plugin for Rotki-specific linting rules. It provides custom rules for Vue components, TypeScript, and other project-specific conventions.

## Project Structure

- `src/` - Source code for the plugin
  - `rules/` - Custom ESLint rules
  - `configs/` - Predefined configurations
  - `utils/` - Utility functions
  - `types/` - TypeScript type definitions
- `tests/` - Test files for the rules
- `docs/` - Documentation
- `scripts/` - Build and utility scripts

## Development Commands

- `pnpm run build` - Build the plugin
- `pnpm run dev` - Build in watch mode
- `pnpm run test` - Run tests
- `pnpm run test:coverage` - Run tests with coverage
- `pnpm run lint` - Run linting
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run new` - Create a new rule
- `pnpm run docs` - Start documentation server
- `pnpm run docs:build` - Build documentation

## Package Manager

This project uses pnpm as the package manager.

## Node Version

Requires Node.js 22.x

## Testing

Uses Vitest for testing with @typescript-eslint/rule-tester for rule testing.
