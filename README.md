# Character Forge

> An AI-assisted character generator extension for [SillyTavern](https://github.com/SillyTavern/SillyTavern). Describe a character in plain language, get back a complete V3 character card with an embedded lorebook.


## Status

Pre-alpha. Under active development. Not yet installable.

## What it does

Give the extension a one-sentence concept:

> "A widowed father of three young girls who is secretly training them to be superheroes."

It builds:

- A complete Character Card V3 (`spec: "chara_card_v3"`) with name, description, personality, scenario, first message, and example dialogue.
- An embedded lorebook (`character_book`) with keyword-triggered entries for world details, supporting characters, and recurring concepts.
- Optional system prompt and post-history instructions.

You review and edit the result before it lands as a saved character in SillyTavern.

## Requirements

- SillyTavern, recent enough to support extensions and the Character Card V3 spec.
- A configured LLM connection in SillyTavern. Character Forge routes through whatever you have set in the Connection Manager. No separate API key needed.
- A modern Chromium-based browser or Firefox.

## Installation

Installation instructions will go here once the first release is cut. The expected flow is:

1. In SillyTavern, open Extensions, click "Install Extension," paste this repo's URL.
2. Reload SillyTavern.
3. Open the Character Forge panel from the extensions menu.

## Usage

1. Open the Character Forge panel.
2. Type your character concept in the description box.
3. Adjust generation options if you want (lorebook entry count, temperature, prompt template).
4. Click Generate.
5. Review the result. Edit any field inline.
6. Click Save to import into SillyTavern as a character card.

## Configuration

All settings live in SillyTavern's extension settings panel and persist across sessions. Currently:

- `promptTemplate` - which built-in prompt strategy to use. Default: `default`.
- `lorebookEntryCount` - target number of lorebook entries to generate. Default: `auto`.
- `generationTemperature` - LLM temperature for generation. Default: `0.85`.
- `autoSaveOnGenerate` - skip the review step and save straight to library. Default: `false`.
- `customSystemPromptOverride` - advanced users only, replaces the built-in system prompt.

LLM provider and card format are internal extension points rather than user-facing settings. Adding alternative providers or card formats means writing a new adapter class. See [DESIGN.md](./DESIGN.md) for how this works.

## Architecture overview

Character Forge follows a hexagonal architecture (ports and adapters) with strict dependency inversion. Business logic lives in `src/domain` and `src/application` and depends on no external system. SillyTavern, the LLM, storage, and the UI are all adapters plugged into abstract ports.

This means:

- Use cases can be tested without a browser or a network connection.
- Swapping the LLM provider, card format, or storage backend is one config switch plus one new adapter class.
- The build system stays simple: no TypeScript compiler, no bundler, just JavaScript loaded directly by SillyTavern.

Full details in [DESIGN.md](./DESIGN.md).

## Project documentation

- [DESIGN.md](./DESIGN.md) - architecture, ports, adapters, decisions and tradeoffs.
- [CONTRIBUTING.md](./CONTRIBUTING.md) - dev setup, TDD workflow, commit conventions, code style.

## Compatibility

| Component | Minimum | Notes |
|---|---|---|
| SillyTavern | Recent release with extension API and CCv3 support | Tested versions documented per release. |
| Browsers | Chrome, Edge, Firefox, recent versions | Safari untested. |
| Card spec | Character Card V3 (`chara_card_v3`, `3.0`) | V2 not supported. |

## Roadmap

See [DESIGN.md](./DESIGN.md#slice-plan) for the slice-by-slice plan. Headline items:

1. Domain entities and ports.
2. First use case with a mock LLM.
3. Card V3 formatter.
4. Real SillyTavern adapters.
5. Lorebook generation.
6. UI panel and settings.
7. Polish, error handling, validation.

## License

TBD. A license file will land before the first public release.

## Acknowledgments

- The SillyTavern project for the host environment and the extension API.
- The Character Card V3 spec maintainers.
- The World Info Encyclopedia and the broader character-card community for prompt and lorebook patterns.
