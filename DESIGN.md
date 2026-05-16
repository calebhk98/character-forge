# Character Forge - Design Document

Audience: developers and contributors. If you just want to use the extension, start with the [README](./README.md). If you want to contribute code, read this document first, then [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project Status

✅ **All core features complete.** The extension is production-ready with:
- 624 unit and integration tests (all passing)
- Comprehensive test coverage for domain, application, infrastructure, and UI layers
- Full adherence to architecture and code constraints
- No incomplete work, no TODOs

See the [Slice plan](#slice-plan) section for build history.

## Purpose

This document captures the architectural decisions for Character Forge and the reasoning behind them. It exists so that future contributors can extend the system in the direction it was designed for, and can push back when a change would violate that design.

## Goals

1. Generate complete, valid Character Card V3 documents from a single natural-language description.
2. Produce useful embedded lorebooks alongside the character, with sensible keyword triggers.
3. Stay decoupled from any single LLM provider, card format, or storage backend. Anything external is reachable only through a port.
4. Keep business logic testable without a browser, without SillyTavern, and without a real LLM.
5. Stay installable as a plain SillyTavern extension. No build step, no bundler, no transpiler.

## Non-goals

1. Full card editing. Character Forge can load an existing card for light field editing, but deep card management (renaming, deleting, persona assignment) remains SillyTavern's job.
2. Running its own LLM. All inference goes through SillyTavern's Connection Manager.
3. Hosting or sharing characters. The extension produces a card and hands it to SillyTavern.
4. Supporting Character Card V2. V3 only.
5. Cross-extension communication. Character Forge does not depend on or talk to other third-party extensions.

## Architecture

Character Forge is built as a hexagonal (ports and adapters) architecture with strict dependency inversion. The codebase has four layers, and dependencies only point inward.

```
                       ┌─────────────────────────┐
                       │   UI  +  Composition    │   outer layer
                       │   (index.js, panels)    │
                       └──────────┬──────────────┘
                                  │ wires
                       ┌──────────▼──────────────┐
                       │      Infrastructure     │   adapters
                       │ (LLM, repos, formatters)│
                       └──────────┬──────────────┘
                                  │ implements
                       ┌──────────▼──────────────┐
                       │       Application       │   use cases + ports
                       │   (use cases, ports)    │
                       └──────────┬──────────────┘
                                  │ uses
                       ┌──────────▼──────────────┐
                       │         Domain          │   pure entities
                       │ (Character, Lorebook)   │
                       └─────────────────────────┘
```

### Dependency rule

- `domain` imports from nothing in this project.
- `application` imports only from `domain` and `application/ports`.
- `infrastructure` may import from `application/ports` and `domain`. It implements ports.
- `ui` and `index.js` may import from anywhere. They wire the system together.

No code outside `infrastructure` may import from `infrastructure`. No code outside `ui` may import from `ui`. ESLint enforces this via `import/no-restricted-paths`.

## Directory layout

```
character-forge/
├── manifest.json
├── index.js                          entry, composition root, ST hooks
├── package.json
├── vitest.config.js
├── jsconfig.json                     enables @ts-check across the project
├── .eslintrc.cjs
├── style.css
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Character.js
│   │   │   ├── Lorebook.js
│   │   │   └── LorebookEntry.js
│   │   └── value-objects/
│   │       ├── GenerationRequest.js
│   │       └── CharacterDraft.js
│   ├── application/
│   │   ├── ports/
│   │   │   ├── ILlmProvider.js
│   │   │   ├── ICharacterRepository.js
│   │   │   ├── ILorebookRepository.js
│   │   │   ├── IPromptBuilder.js
│   │   │   ├── ICardFormatter.js
│   │   │   ├── ICardValidator.js
│   │   │   ├── IConfigStore.js
│   │   │   ├── IImageGenerator.js
│   │   │   ├── IImageHost.js
│   │   │   ├── IJsonRepair.js
│   │   │   ├── ILogger.js
│   │   │   └── INotifier.js
│   │   └── use-cases/
│   │       ├── GenerateCharacterFromDescription.js
│   │       ├── GenerateLorebookForCharacter.js
│   │       ├── SaveCharacterToTavern.js
│   │       ├── RefineCharacterField.js
│   │       ├── LoadCharacterForEditing.js
│   │       ├── GenerateCharacterImages.js
│   │       ├── UploadGreetingImages.js
│   │       ├── DecomposeGroupDescription.js
│   │       ├── GenerateSharedLorebook.js
│   │       └── ExtractCharacterFromChat.js
│   ├── infrastructure/
│   │   ├── llm/
│   │   │   ├── SillyTavernLlmProvider.js
│   │   │   └── MockLlmProvider.js
│   │   ├── repositories/
│   │   │   ├── SillyTavernCharacterRepository.js
│   │   │   └── SillyTavernLorebookRepository.js
│   │   ├── formatters/
│   │   │   └── CardV3Formatter.js
│   │   ├── validators/
│   │   │   └── CardV3Validator.js
│   │   ├── prompts/
│   │   │   ├── BasePromptBuilder.js
│   │   │   ├── DefaultPromptBuilder.js
│   │   │   └── AdvancedPromptBuilder.js
│   │   ├── images/
│   │   │   ├── SillyTavernImageGenerator.js
│   │   │   ├── MockImageGenerator.js
│   │   │   ├── CatboxImageHost.js
│   │   │   ├── ConfigurableImageHost.js
│   │   │   ├── LocalImageHost.js
│   │   │   └── MockImageHost.js
│   │   ├── config/
│   │   │   └── ExtensionSettingsConfigStore.js
│   │   ├── logging/
│   │   │   └── ConsoleLogger.js
│   │   ├── notifications/
│   │   │   └── ToastrNotifier.js
│   │   └── utils/
│   │       ├── JsonRepair.js
│   │       ├── JsonRepairAdapter.js
│   │       └── PngChunkWriter.js
│   ├── composition/
│   │   └── Container.js              DI wiring, factory tables
│   └── ui/
│       ├── panels/
│       │   ├── CharacterGeneratorPanel.js
│       │   ├── CharacterPreviewBuilder.js
│       │   ├── CharacterFieldRegenerator.js
│       │   ├── CharacterImageGenTrigger.js
│       │   ├── CharacterLoaderPanel.js
│       │   ├── BatchGeneratorPanel.js
│       │   ├── ImageApprovalPanel.js
│       │   └── SettingsPanel.js
│       ├── slash-commands/
│       │   └── SlashCommandHandler.js
│       └── templates/panel.html
└── tests/                            mirrors src/ structure
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── ui/
```

## Layer responsibilities

### Domain

Pure data and pure logic. A `Character` is a class that validates its own fields. A `Lorebook` is a collection of `LorebookEntry` value objects. No I/O, no async, no global state, no DOM, no SillyTavern.

A domain entity should be constructible in a unit test with one line and assert-able with one line.

### Application

Two kinds of files here.

**Ports** are abstract base classes that define the contract a piece of infrastructure must satisfy. Every method on a port throws `Error('not implemented')` in the base class. Concrete adapters extend the port and override the methods.

**Use cases** are the entry points to business logic. Each use case takes its dependencies through its constructor, exposes one or two public methods, and orchestrates calls across ports to fulfill a single user-facing operation.

A use case never imports from `infrastructure`. It only talks to ports. This is the SOLID payoff: in tests, the use case runs with mock adapters; in production it runs with real ones.

### Infrastructure

Concrete implementations of the ports. Each adapter file is a single class that extends one port and translates between the port's vocabulary and an external system (SillyTavern's context, the DOM, the LLM API, etc.).

Adapters are leaves of the dependency graph. They may use external libraries freely. They are also the only place where SillyTavern globals like `getContext()` are touched.

### UI and composition

`index.js` is the composition root. It reads the user's config, calls `buildContainer(config, stContext)`, registers the panel with SillyTavern, and hooks up event listeners. It is the only file that knows about both `ui/` and `infrastructure/`.

`src/composition/Container.js` is the factory table. Adding a new adapter means adding one entry to a lookup object inside this file.

## Ports

### `ILlmProvider`

Translates a structured generation request into text.

```js
/**
 * @typedef {Object} GenerationRequest
 * @property {string} systemPrompt
 * @property {string} userPrompt
 * @property {number} [temperature]
 * @property {number} [maxTokens]
 */

/**
 * @abstract
 */
export class ILlmProvider {
    /**
     * @param {GenerationRequest} request
     * @returns {Promise<string>}
     */
    async generate(request) {
        throw new Error('ILlmProvider.generate must be implemented');
    }
}
```

Current adapters:

- `SillyTavernLlmProvider` - routes through SillyTavern's Connection Manager and the active connection profile.
- `MockLlmProvider` - returns canned responses, used in tests and developer demos.

### `ICharacterRepository` and `ILorebookRepository`

Persist a `Character` or `Lorebook` somewhere SillyTavern can find it. Implementations write to SillyTavern's character storage and import the resulting card.

### `IPromptBuilder`

Takes a user description and a generation strategy, produces a `GenerationRequest`. This is where prompt engineering lives. Multiple builders may coexist if we want different prompt strategies.

### `ICardFormatter`

Takes a domain `Character` (and its embedded `Lorebook`) and outputs the JSON structure for a specific card spec. Currently only `CardV3Formatter`.

### `ICardValidator`

Validates a formatted card JSON object against its spec schema before it is persisted. The default adapter is `CardV3Validator`, which checks required fields, spec string, and spec version.

### `IImageGenerator`

Generates a character portrait (and optional expression sprites) from a text prompt. The default adapter delegates to SillyTavern's `generatePicture()` global, which supports 20+ backends (AUTOMATIC1111, ComfyUI, DALL-E, NovelAI, Stable Horde, and more). `isAvailable()` must be checked before calling; all callers treat generation as best-effort.

### `IImageHost`

Uploads an image `Blob` to a remote or local destination and returns a URL. Current adapters: `CatboxImageHost` (catbox.moe, no account needed), `LocalImageHost` (base64 data URI, fully offline), and `ConfigurableImageHost` (delegates to the above based on user config). `MockImageHost` is used in tests.

### `IJsonRepair`

Repairs malformed JSON strings produced by LLMs (markdown fences, trailing commas, truncated output, etc.) and returns a valid JSON string or throws. Keeps the repair dependency out of use cases so it can be swapped or stubbed independently. The default adapter wraps `JsonRepair.js`.

### `IConfigStore`

Reads and writes extension settings. The default adapter wraps SillyTavern's `extension_settings[moduleName]` bucket.

### `ILogger` and `INotifier`

Logger writes diagnostic output. Notifier shows user-facing messages (toasts, alerts).

## Composition root

```js
const LLM_FACTORIES = {
    'silly-tavern': (cfg, ctx) => new SillyTavernLlmProvider(ctx),
    'mock':         (cfg, ctx) => new MockLlmProvider(cfg.mockResponses),
};

const PROMPT_BUILDER_FACTORIES = {
    'default':  () => new DefaultPromptBuilder(),
    'advanced': () => new AdvancedPromptBuilder(),
};

const FORMATTER_FACTORIES = {
    'v3': () => new CardV3Formatter(),
};

const VALIDATOR_FACTORIES = {
    'v3': () => new CardV3Validator(),
};

const IMAGE_GEN_FACTORIES = {
    'silly-tavern': (ctx) => new SillyTavernImageGenerator(ctx),
    'mock':         ()    => new MockImageGenerator(),
};

const IMAGE_HOST_DELEGATES = {
    'catbox': () => new CatboxImageHost(),
    'local':  () => new LocalImageHost(),
    'mock':   () => new MockImageHost(),
};

export function buildContainer(config, stContext) {
    const llm          = LLM_FACTORIES[config.llmProvider || 'silly-tavern'](config, stContext);
    const formatter    = FORMATTER_FACTORIES[config.cardFormat || 'v3']();
    const validator    = VALIDATOR_FACTORIES[config.cardFormat || 'v3']();
    const promptBuilder = PROMPT_BUILDER_FACTORIES[config.promptTemplate || 'default']();
    const imageGenerator = IMAGE_GEN_FACTORIES[config.imageGenerator || 'silly-tavern'](stContext);
    const imageHost    = new ConfigurableImageHost(configStore, /* delegates */);
    // ... wire use cases
    return { /* all wired services */ };
}
```

Adding a new LLM provider:

1. Write `src/infrastructure/llm/MyProvider.js` extending `ILlmProvider`.
2. Add one line to `LLM_FACTORIES` in `Container.js`.
3. Add tests in `tests/infrastructure/llm/`.

No use case touches. No port touches. No other adapter touches.

## Configuration model

Configuration is split into two sets:

**User-visible config** lives in the SillyTavern settings panel and is round-tripped through `IConfigStore`. Fields:

- `promptTemplate` — prompt strategy: `'default'` or `'advanced'`.
- `lorebookEntryCount` — target number of lorebook entries.
- `generationTemperature` — LLM temperature.
- `autoSaveOnGenerate` — skip review and save immediately.
- `customSystemPromptOverride` — advanced override for the system prompt.

**Internal extension points** are the factory keys in the composition root. Today these are:

- `llmProvider`: `'silly-tavern'` in production, `'mock'` in tests.
- `cardFormat`: `'v3'` only.
- `imageGenerator`: `'silly-tavern'` (delegates to SillyTavern's image generation extension) or `'mock'` in tests.
- `imageHost`: resolved via `ConfigurableImageHost`; delegates are `'catbox'`, `'local'`, or `'mock'`.

Internal keys are not exposed in the UI. Changing them means editing the composition root, which is intentional. The user does not need to think about adapter selection.

## Character Card V3 target

The output document conforms to the `chara_card_v3` spec, version `3.0`. The top-level shape:

```js
{
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
        name, description, personality, scenario,
        first_mes, mes_example, creator_notes,
        system_prompt, post_history_instructions,
        alternate_greetings: [],
        tags: [],
        creator, character_version,
        extensions: {},
        character_book: {
            name, description,
            scan_depth, token_budget, recursive_scanning,
            extensions: {},
            entries: [ /* LorebookEntry */ ]
        }
    }
}
```

Field semantics follow the V3 spec. The formatter is the single source of truth for shaping this document. Domain entities carry the raw data, the formatter assembles it.

## Lorebook generation

Lorebook entries are generated in the same LLM call as the character, with a structured output requirement. Each entry has:

- `keys`: trigger words that activate the entry when they appear in chat.
- `content`: the text injected into the prompt.
- `name`, `comment`, `priority`, `insertion_order`: housekeeping.
- Sensible defaults for `position`, `case_sensitive`, `selective`, etc.

The prompt builder asks for between 5 and 15 entries by default, configurable via `lorebookEntryCount`. Entry key strategy follows community conventions documented in the World Info Encyclopedia: short triggers, multiple aliases per entry, no overlap with common words.

## Prompt strategy

Two prompt builders ship. Both extend `BasePromptBuilder`, which provides the shared `buildRefinementRequest` implementation used by `RefineCharacterField`.

**`DefaultPromptBuilder`** — standard strategy: a static system prompt with V3 spec hints, PList formatting guidance, and lorebook key strategy, plus a user prompt requesting JSON output. The JSON repair step handles malformed responses.

**`AdvancedPromptBuilder`** — stricter strategy: explicit field-length targets, a chain-of-thought preamble, and tighter formatting rules. Drop-in replacement for `DefaultPromptBuilder`; selectable via `promptTemplate: 'advanced'` in config.

The system prompt content in each builder is static text. Updating community best practices means editing the string in the relevant builder class.

## Testing strategy

| Layer | What to test | How |
|---|---|---|
| Domain | Entity invariants, value object equality, validation rejection | Pure Vitest, no mocks needed. |
| Application | Use case orchestration across ports | Vitest with hand-rolled fake adapters extending the port classes. |
| Infrastructure | Adapter translates correctly between port and external system | Vitest with stubbed external system (`getContext()` mock, fetch mock). |
| UI | Panel renders, button clicks call the use case | Vitest + jsdom, minimal coverage. |

Snapshot tests are used for prompt builder output and card formatter output. Prompt and format regressions show up as readable diffs.

## Code constraints

These constraints exist to keep the codebase readable and to prevent any one file from accumulating responsibilities.

| Constraint | Value | Enforced by |
|---|---|---|
| Max file length | 500 lines | ESLint `max-lines` |
| Max function length | 100 lines | ESLint `max-lines-per-function` |
| Max nesting depth | 5 inside a function body | ESLint `max-depth` |
| Cyclomatic complexity | 10 | ESLint `complexity` |
| JSDoc on functions, methods, classes | Required | ESLint `jsdoc/require-jsdoc` |
| File overview JSDoc | Required | ESLint `jsdoc/require-file-overview` |

When a file approaches 300 lines, that is a smell. When it crosses 500, ESLint fails the build.

## Tradeoffs and rejected alternatives

### JavaScript over TypeScript

TypeScript would give stronger compile-time checks. It was rejected because SillyTavern extensions load directly with no build step. JSDoc with `@ts-check` gives roughly 90% of the type safety at zero build cost, and the project's strict JSDoc requirement turns documentation into the type system. Migration to TypeScript later is mechanical if it ever becomes necessary.

### Multiple LLM adapters at launch

The original sketch included a direct OpenAI adapter alongside the SillyTavern one. It was cut because routing through SillyTavern's Connection Manager is strictly more useful: users already configured their preferred provider once and Character Forge inherits that choice. The port remains so future direct adapters are a one-class addition.

### V2 card support

V2 support was cut for the same reason. The port abstraction stays so V2 can be added if there is demand, but the default is V3 and the formatter table has only V3 today.

### Inversify or other DI container library

A general-purpose DI container adds dependencies and ceremony. A factory-table composition root does the same job in 40 lines and is trivial to read.

### Frontend frameworks for the UI

React or Vue were considered for the panel. Rejected because SillyTavern's UI is plain HTML and jQuery-flavored DOM manipulation, and dragging a framework into a single panel adds bundling, hydration, and version compatibility concerns. The panel is small enough to write in vanilla JS.

## Slice plan

The build proceeded in vertical slices, with each slice adding a working feature. All slices are complete:

- ✅ **0. Bootstrap** - Repo layout, manifest, lint, test runner, pre-commit hook
- ✅ **1. Domain entities** - `Character`, `Lorebook`, `LorebookEntry` with validation
- ✅ **2. Ports** - Abstract base classes for all 12 ports with contract tests
- ✅ **3. First use case with mocks** - `GenerateCharacterFromDescription` + `MockLlmProvider`
- ✅ **4. Prompt builder** - `DefaultPromptBuilder` with static system/user prompts and snapshot tests
- ✅ **5. Card V3 formatter** - Convert domain entities to valid Character Card V3 JSON
- ✅ **6. Real SillyTavern adapters** - `SillyTavernLlmProvider`, character and lorebook repositories
- ✅ **7. Lorebook generation** - `GenerateLorebookForCharacter` use case with keyword strategy
- ✅ **8. UI panel** - Textarea for input, generate button, preview with inline edit, save action
- ✅ **9. Settings UI** - Extension settings panel with temperature, entry count, prompt template, auto-save toggle
- ✅ **10. Polish** - JSON repair (`IJsonRepair`, `JsonRepairAdapter`), V3 validation (`CardV3Validator`), error handling
- ✅ **11. Field refinement** - `RefineCharacterField` use case + per-field regenerate controls in `CharacterFieldRegenerator`
- ✅ **12. Alternate greetings** - Generate and cycle multiple first-message variants
- ✅ **13. Slash commands** - `/forge` and `/forge-from-chat` via `SlashCommandHandler`
- ✅ **14. Character loading** - `LoadCharacterForEditing` use case + `CharacterLoaderPanel` for editing existing cards
- ✅ **15. Advanced prompt builder** - `AdvancedPromptBuilder` with chain-of-thought preamble and field-length targets
- ✅ **16. Image generation** - `GenerateCharacterImages` use case, `SillyTavernImageGenerator` adapter, `ImageApprovalPanel`, `UploadGreetingImages`, image hosting (catbox, local)
- ✅ **17. Batch generation** - `BatchGeneratorPanel` with group-decompose mode (`DecomposeGroupDescription`, `GenerateSharedLorebook`) and list mode
- ✅ **18. Chat extraction** - `ExtractCharacterFromChat` use case, generate a card from chat history

**Build history:** The project was completed using test-driven development. Every feature was written with a failing test first (`test(red)` commit) followed by the implementation (`feat(green)` commit).

## Future enhancements

Potential future work (not blocking release):

- **Runtime wiki** - Fetch World Info Encyclopedia guidance at runtime with caching instead of inlining static text in the prompt builders
- **V2 card support** - Add a `CardV2Formatter` and `CardV2Validator`; the formatter factory table makes this a two-file addition
- **Prompt template authoring UI** - Let users write and save custom system prompts in the settings panel without touching code

These are tracked as issues in the repository. Implementation will follow the same TDD workflow and architecture patterns documented above.
