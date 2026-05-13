/**
 * @file CLAUDE.md - Project context for AI agents.
 * 
 * This document provides essential information about Character Forge for AI
 * collaborators. Start here to understand the project's goals, architecture,
 * and development practices. For deeper context, consult DESIGN.md, README.md,
 * and CONTRIBUTING.md.
 */

# Character Forge - Agent Guide

## Project Summary

**Character Forge** is an AI-assisted character generator extension for SillyTavern. It takes a one-sentence character concept and generates a complete Character Card V3 document with an embedded lorebook.

**Status**: ✅ Production-ready. All core features complete, 242 tests passing, zero incomplete code.

**Core functionality**: Accept a natural-language character description → generate valid Character Card V3 JSON (name, description, personality, scenario, first message, dialogue examples) → produce keyword-triggered lorebook entries → allow user review → save to SillyTavern.

## Quick Reference

### Key Directories

```
src/
├── domain/                 Pure data entities, no I/O
├── application/            Use cases and abstract ports
├── infrastructure/         Adapters (LLM, formatters, storage)
├── composition/            Dependency injection wiring
└── ui/                     Panel UI and event handlers

tests/                       Mirrors src/ structure
```

### Tech Stack

- **JavaScript** (no TypeScript, no build step). SillyTavern loads code directly.
- **Vitest** for testing.
- **ESLint** for linting with strict rules on nesting, complexity, file size.
- **JSDoc** with `@ts-check` for type safety (no TS compiler).

### Scripts

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode for TDD
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run typecheck     # JSDoc type validation
```

## Architecture Overview

Character Forge uses **hexagonal architecture** (ports and adapters) with strict dependency inversion. Dependencies flow inward.

```
┌─────────────────────┐
│   UI & Composition  │  (wires system, entry point)
└──────────┬──────────┘
┌──────────▼──────────┐
│  Infrastructure     │  (adapters: LLM, formatters, storage)
└──────────┬──────────┘
┌──────────▼──────────┐
│   Application       │  (use cases, abstract ports)
└──────────┬──────────┘
┌──────────▼──────────┐
│      Domain         │  (pure entities, no I/O)
└─────────────────────┘
```

### Dependency Rule (Enforced by ESLint)

- **Domain** imports from nothing internal.
- **Application** imports only from `domain/` and `application/ports/`.
- **Infrastructure** may import from `application/ports/` and `domain/`.
- **UI and index.js** may import from anywhere.

No other layer may import from `infrastructure` or `ui`.

## Ports (Abstract Contracts)

Each port is an abstract base class that infrastructure adapters implement:

- **ILlmProvider** - translates structured requests into generated text.
- **ICharacterRepository** and **ILorebookRepository** - persist cards to storage.
- **IPromptBuilder** - converts user description into a GenerationRequest.
- **ICardFormatter** - converts domain entities to Character Card V3 JSON.
- **IConfigStore** - reads/writes user settings.
- **ILogger** and **INotifier** - diagnostics and user-facing messages.

See DESIGN.md under "Ports" for the full contract definitions.

## Development Workflow

This project uses **Test-Driven Development** with explicit "red commits."

### TDD Cycle

1. Write a failing test (`npm run test:watch`).
2. Confirm it fails for the right reason.
3. **Commit the failing test** with `git commit -m "test(red): <scope> - <what>"`.
4. Write minimum code to pass the test.
5. Confirm all tests green.
6. **Commit the implementation** with `feat(green): ...` or `fix(green): ...`.
7. Optionally refactor with all tests green, commit as `refactor: ...`.

The red commit documents that the feature was test-driven, not retrofitted with tests.

### Commit Message Format

```
<type>(<scope>): <imperative summary>

[optional body]
```

Types: `test(red)`, `feat(green)`, `fix(green)`, `refactor`, `docs`, `chore`, `style`.

Examples:
```
test(red): domain - validate Character constructor
feat(green): domain - Character entity with required fields
fix(green): prompt - handle empty description gracefully
refactor: container - simplify adapter factory table
```

## Code Constraints

Enforced by ESLint to keep code readable:

| Constraint | Limit |
|---|---|
| File length | 500 lines |
| Function length | 100 lines |
| Nesting depth | Warning at 4, error-free approach preferred |
| Cyclomatic complexity | 10 |

Every function, method, and class requires a JSDoc block. Every file needs a `@file` overview.

## Adding a New Adapter

Adapters are the extension point. Example: adding a new LLM provider.

1. **Create the adapter** at `src/infrastructure/llm/MyProvider.js`, extending `ILlmProvider`.
2. **Register it** in `src/composition/Container.js` in the `LLM_FACTORIES` table.
3. **Write tests** at `tests/infrastructure/llm/MyProvider.test.js`.
4. **Update docs** if needed (DESIGN.md, README.md).

Do not modify any use case, port, or other adapter. The design isolates changes to infrastructure layers.

## Testing Strategy

| Layer | What to test | Method |
|---|---|---|
| Domain | Constructor validation, equality, invariants | Pure Vitest, no mocks. |
| Application | Use case orchestration, port interactions | Vitest with hand-rolled fake adapters. |
| Infrastructure | Adapter correctness, external system translation | Vitest with stubbed external systems. |
| UI | Render, event handlers | Vitest + jsdom, minimal coverage. |

Snapshot tests are used for prompt builder output and card formatter output. Diffs show regressions clearly.

## Code Style

- 4-space indentation.
- Single quotes for strings.
- Semicolons required.
- Never-nesting: use guard clauses and helper functions instead of deep if-else pyramids.

## Character Card V3 Target

The extension outputs `spec: "chara_card_v3"` with `spec_version: "3.0"`. The shape includes:

```js
{
    spec, spec_version, data: {
        name, description, personality, scenario,
        first_mes, mes_example, creator_notes,
        system_prompt, post_history_instructions,
        character_book: { name, description, entries: [...] }
    }
}
```

The formatter is the single source of truth for this structure.

## Configuration

**User-visible settings** (stored in SillyTavern's extension settings):
- `promptTemplate` - built-in strategy (default: `default`).
- `lorebookEntryCount` - target entries (default: `auto`).
- `generationTemperature` - LLM temperature (default: `0.85`).
- `autoSaveOnGenerate` - skip review step (default: `false`).
- `customSystemPromptOverride` - advanced override.

**Internal extension points** (factory keys in Container.js):
- `llmProvider` - `'silly-tavern'` in production, `'mock'` in tests.
- `cardFormat` - `'v3'` (only V3 supported).

## Common Tasks

### Running tests locally

```bash
npm install
npm test           # once
npm run test:watch # during development
```

### Linting and type-checking

```bash
npm run lint       # check
npm run lint:fix   # auto-fix
npm run typecheck  # JSDoc type validation
```

### Setting up against a live SillyTavern

1. Symlink or copy the repo into `<SillyTavern>/public/scripts/extensions/character-forge/`.
2. Restart the SillyTavern server.
3. Reload the web UI.
4. Enable Character Forge in Extensions.

Code changes are picked up on browser reload (no bundler restart needed).

### Pre-commit hook

A git hook runs `lint` and `test` before each commit. Red commits bypass test enforcement if the message starts with `test(red):`.

```bash
git commit -m "test(red): <scope> - <what>"
```

### CI Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on:
- Push to `main` and `claude/**` branches
- Pull requests to `main`

The pipeline runs:
- **Lint job**: ESLint, JSDoc type checking via `typecheck`
- **Test job**: Vitest suite with jsdom environment

Both jobs use Node 18 with npm caching for speed.

## Pull Request Expectations

Before opening a PR, verify:

- [ ] All commits follow the message convention.
- [ ] PR contains `test(red)` commit followed by `feat(green)` or `fix(green)` for the same scope.
- [ ] `npm test`, `npm run lint`, `npm run typecheck` all pass.
- [ ] No file exceeds 500 lines, no function exceeds 100.
- [ ] Architectural rules respected (ESLint enforces most).
- [ ] JSDoc on every function, method, class, and file.
- [ ] If a new adapter, it follows the five-step pattern above.

## Known Non-Goals

These are out of scope:

- Editing existing character cards (SillyTavern handles that).
- Running the extension's own LLM (it routes through SillyTavern's Connection Manager).
- Hosting or sharing characters.
- Character Card V2 support (V3 only).
- Cross-extension communication.

## Where to Look

| Question | Document |
|---|---|
| Why is it built this way? | DESIGN.md |
| How do I set up and contribute? | CONTRIBUTING.md |
| How do I use it as a user? | README.md |
| What's the full API contract for a port? | DESIGN.md under "Ports" |
| What's the build plan? | DESIGN.md under "Slice Plan" |

## Quick Wins for New Contributors

- **Add test coverage** for any port or use case method lacking tests.
- **Extract helpers** from functions that approach 60 lines.
- **Add JSDoc** to any undocumented function.
- **Add a new LLM adapter** following the five-step pattern in CONTRIBUTING.md.
- **Snapshot test regressions** for prompt builder or card formatter.

## Notes for the Next Agent

The project is deliberately architectural. Rules like the dependency constraint, the max-lines ESLint config, and the red-commit convention exist to keep the codebase honest and maintainable. When you encounter them, lean into them rather than around them. If you hit a wall where the architecture doesn't fit the task, that's a design signal—open a discussion before bending the rules.
