# Contributing to Character Forge

Thanks for considering a contribution! Character Forge is production-ready with all core features complete. Contributions now focus on:

- Bug fixes
- Performance improvements
- New adapters (alternative LLM providers, formatters, etc.)
- Enhanced features listed in [DESIGN.md](./DESIGN.md#future-enhancements)

Before writing code, please read [DESIGN.md](./DESIGN.md). The architectural rules in this project are deliberate, and most code review feedback traces back to them.

## Scope of this document

This document covers:

- Setting up the development environment.
- The TDD workflow this project uses, including the red-commit convention.
- Commit message format.
- Code style and the rules ESLint enforces.
- JSDoc requirements.
- Architectural rules: what can import what, and why.
- How to add a new adapter (the extension point how-to).
- Testing requirements per layer.
- The pull request checklist.

If you want background on why things are this way, [DESIGN.md](./DESIGN.md) has the reasoning.

## Development environment

### Prerequisites

- Node.js 18 or newer.
- A working SillyTavern install for end-to-end testing.
- Git with hooks enabled. The project ships a pre-commit hook that runs lint and tests.

### Setup

```bash
git clone <repo-url> character-forge
cd character-forge
npm install
npm run prepare   # installs the git hooks
```

After install, verify the toolchain:

```bash
npm test          # should pass all 242 tests
npm run lint      # should pass with no warnings
npm run typecheck # should pass with no type errors
```

### Running against a live SillyTavern

1. Symlink or copy this repo into `<SillyTavern>/public/scripts/extensions/character-forge/`.
2. Restart the SillyTavern server.
3. Reload the SillyTavern web UI.
4. Open Extensions, enable Character Forge.

Code changes are picked up on browser reload. No bundler restart needed.

## Scripts

```bash
npm test              # run all tests once
npm run test:watch    # watch mode, used during TDD
npm run lint          # ESLint, no auto-fix
npm run lint:fix      # ESLint with auto-fix
npm run typecheck     # tsc --noEmit, validates JSDoc types
```

A pre-commit hook runs `lint` and `test` against staged files. Commits fail if either fails, with one explicit exception: see the red commit rule below.

## TDD workflow

This project uses test-driven development with explicit red commits. The flow:

1. **Write a failing test.** One concept per test, smallest possible failure.
2. **Run the test, confirm it fails for the right reason.** A test that fails because of a typo or a missing import is not a useful red.
3. **Commit the failing test.** Use the `test(red): ...` prefix (see Commit messages below).
4. **Write the minimum code to make the test pass.**
5. **Run tests, confirm green.**
6. **Commit the implementation** with `feat(green): ...` (or `fix(green): ...` for bugs).
7. **Optional: refactor** with all tests green. Commit as `refactor: ...`.

The red commit is the documentation of the TDD discipline. It is the thing a future reviewer or you-six-months-from-now uses to verify that a feature was driven by tests rather than retrofitted with them.

### Red commits and CI

Red commits fail tests by design. The pre-commit hook normally blocks failing tests. To allow a red commit:

```bash
git commit -m "test(red): <scope> - <what>"
# the hook detects the test(red) prefix and skips test enforcement
```

CI runs on the tip of feature branches and on merge to `main`. Intermediate red commits inside a feature branch are tolerated. The branch must be green before merging.

### Batching tests in one red commit

You may add multiple failing tests in one red commit, as long as they all describe the same feature and are intended to drive the same implementation. Twenty failing tests for one new use case in one commit is fine. Twenty failing tests for unrelated areas is not.

## Commit messages

Format:

```
<type>(<scope>): <imperative summary>

<optional body>
```

Types:

| Type | When to use |
|---|---|
| `test(red)` | A commit that adds failing tests. Test enforcement is skipped. |
| `feat(green)` | New behavior with passing tests. |
| `fix(green)` | Bug fix with passing tests. |
| `refactor` | Internal change with no behavior change, all tests still green. |
| `docs` | Documentation only. |
| `chore` | Build, tooling, dependencies. |
| `style` | Formatting, whitespace, no logic change. |

Scopes are short and match a directory or concept, for example `domain`, `prompt`, `card-formatter`, `panel`, `container`.

Examples:

```
test(red): domain - failing tests for Character validation
feat(green): domain - Character entity with required-field validation
test(red): prompt - failing snapshot for default builder output
feat(green): prompt - DefaultPromptBuilder produces structured request
refactor: prompt - extract section assembly into helpers
```

## Code style

The host project (SillyTavern) uses these rules and this repo matches them:

- 4-space indentation.
- Single quotes for strings.
- Semicolons required.
- One statement per line.

Additional rules enforced by ESLint:

| Rule | Value | Why |
|---|---|---|
| `max-lines` | 500 | Anything longer is hard to navigate. |
| `max-lines-per-function` | 60 | Long functions hide intent. Extract. |
| `max-depth` | 5 | Never-nesting. Use guard clauses and helper functions. |
| `complexity` | 10 | Cyclomatic complexity ceiling. |
| `import/no-restricted-paths` | layer rules | Enforces the dependency direction. |

### Never-nesting in practice

Avoid this:

```js
function thing(x) {
    if (x) {
        if (x.valid) {
            if (x.ready) {
                if (x.value > 0) {
                    doStuff(x);
                }
            }
        }
    }
}
```

Prefer this:

```js
function thing(x) {
    if (!x) return;
    if (!x.valid) return;
    if (!x.ready) return;
    if (x.value <= 0) return;
    doStuff(x);
}
```

Or extract:

```js
function thing(x) {
    if (!isReady(x)) return;
    doStuff(x);
}

function isReady(x) {
    return Boolean(x && x.valid && x.ready && x.value > 0);
}
```

## JSDoc requirements

Every function declaration, method, and class needs a JSDoc block. Every file needs a `@file` overview block at the top. ESLint will complain otherwise.

A good file header:

```js
/**
 * @file Default prompt builder. Translates a user description into a
 * structured GenerationRequest with system + user prompts and parameters.
 *
 * The system prompt content here is the project's single source of truth
 * for character-card prompt engineering. Update with care, snapshot tests
 * will flag regressions.
 */
```

A good function header:

```js
/**
 * Build a generation request from a raw user description.
 *
 * @param {string} description user-supplied character concept
 * @param {object} [options]
 * @param {number} [options.entryCount] target lorebook entry count
 * @returns {import('../ports/ILlmProvider.js').GenerationRequest}
 */
function buildRequest(description, options = {}) {
    /* ... */
}
```

JSDoc on a class:

```js
/**
 * Concrete LLM provider that routes through SillyTavern's Connection Manager.
 * The user's active connection profile determines the actual model and provider.
 *
 * @extends ILlmProvider
 */
export class SillyTavernLlmProvider extends ILlmProvider {
    /* ... */
}
```

Use `@typedef` blocks in the port files to define the data shapes that flow through the system. Other files reference them with `import('...')` syntax in JSDoc.

## Architectural rules

Per [DESIGN.md](./DESIGN.md), this project follows hexagonal architecture. The dependency rule:

- `src/domain/` imports from nothing internal.
- `src/application/` imports only from `src/domain/` and `src/application/ports/`.
- `src/infrastructure/` may import from `src/application/ports/` and `src/domain/`. Implements ports.
- `src/ui/` and `index.js` may import from anywhere. They wire the system.

ESLint enforces this with `import/no-restricted-paths`. If you have an honest case for crossing a layer, open a discussion first. The cost of bending the rule is usually higher than the cost of finding a different design.

## How to add a new adapter

This is the project's main extension point. Adding a new LLM provider, formatter, repository, or other adapter follows the same pattern.

### Step 1: confirm the port exists

Adapters extend existing ports. If the contract you need does not have a port, that is a separate change and needs design discussion first.

### Step 2: write the adapter class

```js
// src/infrastructure/llm/MyProvider.js
/**
 * @file Adapter that routes generation through <some service>.
 */

import { ILlmProvider } from '../../application/ports/ILlmProvider.js';

/**
 * @extends ILlmProvider
 */
export class MyProvider extends ILlmProvider {
    /**
     * @param {object} options
     */
    constructor(options) {
        super();
        this.options = options;
    }

    /**
     * @param {import('../../application/ports/ILlmProvider.js').GenerationRequest} request
     * @returns {Promise<string>}
     */
    async generate(request) {
        /* ... */
    }
}
```

### Step 3: register the adapter

Add one entry to the factory table in `src/composition/Container.js`:

```js
const LLM_FACTORIES = {
    'silly-tavern': (cfg, ctx) => new SillyTavernLlmProvider(ctx),
    'mock':         (cfg, ctx) => new MockLlmProvider(cfg.mockResponses),
    'my-provider':  (cfg, ctx) => new MyProvider(cfg.myProviderOptions),  // new
};
```

### Step 4: tests

Add a test file at `tests/infrastructure/llm/MyProvider.test.js` covering:

- The adapter satisfies the port contract.
- Each method translates correctly between port inputs and the external system's API.
- Error cases produce sensible behavior (thrown errors, retries, or wrapped exceptions, depending on the port's contract).

### Step 5: document

Update [DESIGN.md](./DESIGN.md) under the relevant port section to list the new adapter. If the adapter requires new user-visible config, update README and the settings panel.

You do not need to touch any use case, any other adapter, or any test outside `tests/infrastructure/llm/`.

## Testing requirements per layer

| Layer | Required tests |
|---|---|
| Domain | Constructor validation, value-object equality, all branch points in invariants. |
| Ports | Each port's base class throws on every method. |
| Application use cases | Happy path plus at least one failure path per port the use case touches. Use hand-rolled fakes that extend the port classes. |
| Infrastructure adapters | One test per public method, mocking the external dependency at its boundary. |
| UI | Render test, one event-handler-fires-use-case test. Heavy UI testing is not required. |

Coverage gates use a behavior-based heuristic rather than a fixed numerical threshold: if you broke it in code, a failing test should tell you which thing broke and roughly where.

## Pull request checklist

Before opening a PR:

- [ ] All commits follow the message convention.
- [ ] The PR contains at least one `test(red)` commit followed by a `feat(green)` or `fix(green)` commit for the same scope. Pure refactors and pure doc changes are exempt.
- [ ] `npm test` passes locally.
- [ ] `npm run lint` passes with no warnings.
- [ ] `npm run typecheck` passes.
- [ ] No file exceeds 500 lines.
- [ ] No function exceeds 60 lines.
- [ ] Architectural rules respected. ESLint will catch most violations.
- [ ] If a new adapter was added, it follows the five steps above.
- [ ] If user-visible behavior changed, README is updated.
- [ ] If architecture changed, DESIGN.md is updated.

PRs that fail the checklist will be sent back. Failing CI blocks merge.

## Code review

Reviewers look for:

- Does the diff add a test? Where is the red commit?
- Does any file approach 500 lines? Does any function approach 60?
- Does any code in `domain` or `application` import from `infrastructure`?
- Does each new function, method, and class have a JSDoc block?
- Are nesting depths under control?
- Is there a simpler shape that does the same job?

Reviewers do not gatekeep on style preferences that are not enforced by ESLint. If a rule matters enough to argue about, propose adding it to the linter config.

## Where to ask questions

Open a discussion before opening a large PR. Open an issue for bugs or feature ideas. For design questions, propose an ADR-style entry under `docs/adr-NNN-*.md` and link it from the issue.

## Current development state

The project is production-ready with comprehensive test coverage. The codebase is stable and follows the patterns documented above strictly. When you contribute:

- **Respect the architecture.** The layering and dependency rules are enforced by ESLint and exist for good reasons documented in DESIGN.md.
- **Write tests first.** Red commits are the norm here. A feature without a failing test first will be sent back.
- **Keep code simple.** The complexity and line-length constraints are not bureaucracy; they make code easier to understand and maintain.
- **Document as you go.** JSDoc and commit messages are part of the code, not afterthoughts.

The TDD discipline and architectural boundaries have served this project well. Changes that violate them should come with strong justification and discussion first.
