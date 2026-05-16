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

### Easiest Method (SillyTavern Extension Manager)

The simplest way to install Character Forge is through SillyTavern's built-in extension manager:

1. **Open SillyTavern** - Navigate to http://localhost:8000 (or wherever your SillyTavern is running)
2. **Go to Extensions** - Click Extensions in the UI
3. **Click "Install Extension"**
4. **Paste the repository URL**: `https://github.com/calebhk98/character-forge.git`
5. **(Optional)** Specify a branch if you want something other than the default
6. **Click Install** - SillyTavern will clone the repo and install dependencies automatically
7. **Reload SillyTavern** - Refresh the browser
8. **Enable the extension** - Go to Settings → Extensions, find "Character Forge" and toggle it on

> **Note:** Git must be installed on your system for this method to work. If you don't have Git, use one of the manual methods below.

### Git Method (For Developers)

If you prefer to clone the repository manually:

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

### Generating a single character

1. Open the Character Forge panel.
2. Type your character concept in the description box.
3. Click **Generate**.
4. Review the result. Every field (name, description, personality, scenario, first message, example dialogue, alternate greetings, lorebook entries) is editable inline.
5. To rewrite any individual field, click the **↺** button next to it. An optional feedback box lets you give the AI direction ("make it darker", "shorter"). Click **Rewrite** and the field updates in place.
6. Click **Save to SillyTavern** to import the finished card into your character library.

### Loading and editing an existing card

1. Expand the **Load Existing Character** section at the bottom of the panel.
2. Click **↺ Refresh List** to populate the dropdown with your saved characters.
3. Select a character and click **Load for Editing**.
4. The card opens in the same review/edit view. Make changes and save.

### Alternate greetings

Each generated character includes three alternate first-message variants. They appear as separate editable textareas in the **Alternate Greetings** section of the preview. Edit them freely before saving.

### Field-level regeneration

Every core character field (name, description, personality, scenario, first message, example dialogue) has a **↺** regenerate button. Clicking it reveals an inline form where you can optionally type what to change. The AI rewrites just that field without touching the rest of the card.

## Batch Generation

The **Batch Generator** lets you create multiple characters in one run. Access it from the Character Forge panel.

### Group / ensemble mode (default)

1. Enter a description of the whole group — for example: *"A widowed scientist and his three superpowered daughters who protect their city."*
2. Click **Decompose into Characters**. The LLM breaks the description into individual character descriptions, which appear as editable textareas.
3. Review and tweak the descriptions, then click **Generate All**.

Each character gets its own card and lorebook. The batch also produces a **shared lorebook** covering relationship dynamics and group history, which you should load alongside the character cards when setting up a group chat in SillyTavern. Each card's creator notes include setup instructions.

### List mode

1. Switch to the **List** tab.
2. Enter one character description per line.
3. Click **Generate All**.

Characters are generated sequentially. A progress log shows each character's status in real time. Failures are skipped and reported at the end — they don't stop the rest of the batch.

## Slash Commands

Character Forge registers two slash commands in SillyTavern so you can generate cards without leaving the chat interface.

### `/forge`

```
/forge A grizzled detective who drinks too much and solves impossible cases
```

Generates a character card from the description, saves it, and notifies you when done.

### `/forge-from-chat`

```
/forge-from-chat Alice
```

Reads the current chat history, extracts everything known about the named character, and generates a card from it. Useful for turning an NPC or a persona that emerged through roleplay into a saved card.

Both commands show a progress notification while running and an error message if something goes wrong.

## Image Generation

After saving a character, Character Forge automatically starts generating an avatar portrait in the background using whatever image generation backend you have configured in SillyTavern (AUTOMATIC1111, ComfyUI, DALL-E, NovelAI, Stable Horde, and others are all supported).

Once generation completes, an **approval panel** appears with thumbnails of the generated images. Check the ones you want to keep and click **Upload selected**. Images are uploaded to your configured host (catbox.moe by default, or embedded as local data URIs if you prefer) and their URLs are injected into the relevant character fields.

If no image generation backend is active, this step is silently skipped — the card is always saved regardless.

Image generation can be turned on or off in the extension settings.

## Configuration

All settings live in SillyTavern's extension settings panel and persist across sessions.

| Setting | What it does | Default |
|---|---|---|
| `promptTemplate` | Prompt strategy: `default` (standard) or `advanced` (chain-of-thought, stricter formatting) | `default` |
| `lorebookEntryCount` | Target number of lorebook entries. `auto` lets the AI decide. | `auto` |
| `autoSaveOnGenerate` | Skip the review step and save immediately after generation | `false` |
| `customSystemPromptOverride` | Replace the built-in system prompt entirely (advanced users) | _(empty)_ |

Image generation settings (if you have a SillyTavern image generation extension active):

| Setting | What it does | Default |
|---|---|---|
| `generateAvatarAfterSave` | Automatically generate a portrait after each save | `true` |
| `generateSpritesAfterSave` | Also generate expression sprites | `false` |

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
- ✅ **Alternate greetings** - Generate multiple first-message variants and cycle through them
- ✅ **Field refinement** - Regenerate any individual field with optional feedback
- ✅ **Review and edit** - Preview the card before saving, edit any field inline
- ✅ **Load existing cards** - Open a saved character card for editing and re-saving
- ✅ **Batch generation** - Generate multiple characters from a list, or decompose an ensemble description
- ✅ **Image generation** - Generate a character portrait after saving (requires a SillyTavern image generation extension)
- ✅ **Slash commands** - `/forge` and `/forge-from-chat` for generating cards without leaving the chat
- ✅ **SillyTavern integration** - Save directly to your character library
- ✅ **Configuration** - Adjust temperature, entry count, and prompt strategy (default or advanced)
- ✅ **Full test coverage** - 624 unit and integration tests, all passing
- ✅ **Hexagonal architecture** - Swap LLM providers, formatters, or storage without touching business logic

See [DESIGN.md](./DESIGN.md#slice-plan) for the full development history.

## License

Character Forge is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

- The SillyTavern project for the host environment and the extension API.
- The Character Card V3 spec maintainers.
- The World Info Encyclopedia and the broader character-card community for prompt and lorebook patterns.
