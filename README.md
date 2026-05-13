# Character Forge

> An AI-assisted character generator extension for [SillyTavern](https://github.com/SillyTavern/SillyTavern). Describe a character in plain language, get back a complete V3 character card with an embedded lorebook.


## Status

✅ **Production-ready.** All core features complete and tested. Ready to install and use.

## What it does

Give the extension a one-sentence concept:

> "A widowed father of three young girls who is secretly training them to be superheroes."

It builds:

- A complete Character Card V3 (`spec: "chara_card_v3"`) with name, description, personality, scenario, first message, and example dialogue.
- An embedded lorebook (`character_book`) with keyword-triggered entries for world details, supporting characters, and recurring concepts.
- Optional system prompt and post-history instructions.

You review and edit the result before it lands as a saved character in SillyTavern.

## Requirements

- **SillyTavern 1.10.0 or newer** - Download from [SillyTavern GitHub](https://github.com/SillyTavern/SillyTavern)
- **An LLM connected in SillyTavern** - Character Forge uses whatever LLM you have configured in the Connection Manager. No separate API key needed.
- **Git** (for installation) - Download from [git-scm.com](https://git-scm.com)
- **A modern web browser** - Chrome, Edge, Firefox (recent versions). Safari may work but is untested.

> **Note:** If you don't have Git installed, you can also download Character Forge as a ZIP file and extract it manually (see "Alternative Installation" below).

## Installation

### Quick Start (Git Method - Recommended)

This method is quickest if you have Git installed. Copy and paste these commands into your terminal:

#### On Windows (Command Prompt)

```batch
cd %APPDATA%\SillyTavern\public\scripts\extensions
git clone https://github.com/calebhk98/character-forge.git
cd character-forge
npm install
```

Then restart SillyTavern.

#### On Mac/Linux

```bash
cd ~/.sillytavern/public/scripts/extensions
git clone https://github.com/calebhk98/character-forge.git
cd character-forge
npm install
```

Then restart SillyTavern.

> **Where is SillyTavern installed?** If you're not sure, you can usually find it by:
> - Windows: Check your user folder (press Windows key + R, type `%APPDATA%`, then navigate)
> - Mac: Look in `~/.sillytavern` or check your home directory
> - Linux: Usually in `~/.sillytavern` or wherever you cloned it

### Manual Installation (No Git Required)

1. **Download Character Forge**
   - Go to https://github.com/calebhk98/character-forge
   - Click the green "Code" button
   - Click "Download ZIP"
   - Extract the ZIP file

2. **Place it in SillyTavern**
   - Navigate to your SillyTavern installation folder
   - Go to `public/scripts/extensions/`
   - Create a new folder called `character-forge`
   - Copy all files from the extracted ZIP into this folder

3. **Install dependencies**
   - Open a terminal in the `character-forge` folder
   - Run: `npm install`

4. **Restart SillyTavern**

### After Installation

1. **Open SillyTavern** - Navigate to http://localhost:8000 (or wherever your SillyTavern is running)
2. **Enable the extension** - Go to Settings → Extensions, find "Character Forge" and toggle it on
3. **Find the panel** - Look for "Character Forge" in the extensions panel on the right side
4. **Start generating** - See the Usage section below

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

## Troubleshooting

### "npm command not found"
You need to install Node.js, which includes npm. Download from [nodejs.org](https://nodejs.org) and follow the installer.

### "Extensions folder doesn't exist"
Create it manually:
- Windows: `%APPDATA%\SillyTavern\public\scripts\extensions`
- Mac/Linux: `~/.sillytavern/public/scripts/extensions`

### Extension doesn't appear after install
- Make sure you restarted SillyTavern (close and reopen)
- Check that you ran `npm install` in the `character-forge` folder
- Check the browser console (F12) for errors

### "Git is not installed"
Use the manual installation method instead (download the ZIP from GitHub).

### Still having issues?
- Check that SillyTavern is running and accessible at http://localhost:8000
- Verify your LLM is configured in SillyTavern's Connection Manager
- Open an issue on GitHub with your error message

## Compatibility

| Component | Version | Notes |
|---|---|---|
| SillyTavern | 1.10.0+ | Extension API and Character Card V3 support required |
| Node.js | 16+ | Required only for installation (not needed to run) |
| Browsers | Chrome, Edge, Firefox (recent) | Safari may work but is untested |
| Card format | Character Card V3 only | Version 2 cards are not supported |

## What's Implemented

Character Forge ships with all core features complete:

- ✅ **Character generation** - Converts a text description into a complete Character Card V3
- ✅ **Lorebook generation** - Creates keyword-triggered world info entries
- ✅ **Review and edit** - Preview the card before saving, edit any field
- ✅ **SillyTavern integration** - Save directly to your character library
- ✅ **Configuration** - Adjust temperature, entry count, and prompt templates
- ✅ **Full test coverage** - 242 unit and integration tests, all passing
- ✅ **Hexagonal architecture** - Swap LLM providers, formatters, or storage without touching business logic

See [DESIGN.md](./DESIGN.md#slice-plan) for the full development history.

## License

Character Forge is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

- The SillyTavern project for the host environment and the extension API.
- The Character Card V3 spec maintainers.
- The World Info Encyclopedia and the broader character-card community for prompt and lorebook patterns.
