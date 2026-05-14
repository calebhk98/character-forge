/**
 * @file Default prompt builder. Assembles system + user prompts for
 * character and lorebook generation. This is the project's single source
 * of truth for prompt engineering. Update with care—snapshot tests will
 * flag regressions.
 */

import { IPromptBuilder } from '../../application/ports/IPromptBuilder.js';
import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';

/**
 * Default prompt builder. Constructs structured requests for character generation.
 *
 * @augments IPromptBuilder
 */
export class DefaultPromptBuilder extends IPromptBuilder {
    /**
     * Construct the builder.
     */
    constructor() {
        super();
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a generation request from a description.
     *
     * @param {string} description - character or lorebook concept
     * @param {object} [options] - generation options
     * @param {number} [options.entryCount] - target lorebook entries
     * @param {number} [options.temperature] - LLM temperature
     * @returns {GenerationRequest} structured generation request
     */
    build(description, options = {}) {
        const systemPrompt = this.buildSystemPrompt(options);
        const userPrompt = options.entryCount
            ? this.buildLorebookUserPrompt(description, options)
            : this.buildUserPrompt(description, options);
        const temperature = options.temperature ?? 0.85;

        return new GenerationRequest({
            systemPrompt,
            userPrompt,
            temperature,
        });
    }

    /**
     * Build the system prompt for character or lorebook generation.
     *
     * @private
     * @param {object} [options] - generation options
     * @returns {string} system prompt text
     */
    buildSystemPrompt(options = {}) {
        if (options.entryCount) {
            return this.buildLorebookSystemPrompt();
        }
        return this.buildCharacterSystemPrompt();
    }

    /**
     * Build the character-specific system prompt with V3 spec guidance.
     *
     * @private
     * @returns {string} system prompt text
     */
    buildCharacterSystemPrompt() {
        return `You are an expert character creator for interactive roleplay in SillyTavern. Your task is to generate complete character profiles in JSON format following the Character Card V3 specification.

## Character Card V3 Fields

Output a JSON object with these fields:

- **name** (string): The character's name.

- **description** (string): Physical appearance, backstory, and defining characteristics. Keep world-building lore minimal — that belongs in the lorebook. Prioritise behavioral patterns over bare facts: ask yourself "does this sentence tell the model *how to act*, or just *what exists*?" Sentences that shape behavior are worth more than sentences that only describe.

- **personality** (string): A tight behavioral brief — NOT a list of adjectives. Never write "kind, mysterious, loyal." Instead write the *why*, *when*, and *how* behind each trait. Example: "She deflects emotional moments with cutting jokes — not because she doesn't care, but because sincerity makes her uncomfortable. Around strangers she's prickly; around people she trusts, the jokes get softer and the silences longer." Test: could an actor nail this voice in 10 different scenes from this description alone?

- **scenario** (string): The circumstances and context in which the roleplay begins. Frames the opening situation.

- **first_mes** (string): The character's opening message — THE most important field. The AI mirrors its tone, style, and length throughout the entire conversation, so the length here calibrates the length of every future reply. Write it as a narrative scene: 150-300 words, in-character and immersive, with action descriptions (*she sets down her cup and looks up*) woven with natural dialogue. End with something that invites the user to engage.

- **mes_example** (string): 2-3 short example exchanges (5-6 lines each) demonstrating the character's authentic voice. Use this EXACT format:
  <START>
  {{char}}: *action in asterisks* "spoken dialogue"
  {{user}}: [a short, open-ended prompt — e.g. "Tell me about yourself." or "What do you want?"]
  {{char}}: *different action* "follow-up dialogue"

  Rules for mes_example (the AI internalises these patterns, so they matter):
  • Never use the same action verb twice across all examples — use synonyms. Repeating a verb makes the AI echo it obsessively.
  • Reserve quotation marks for spoken dialogue only — never wrap thoughts or internal states in quotes.
  • Keep each exchange open-ended — no definitive resolutions, leave room for the user.
  • Mention {{char}}'s name at least once per block to reinforce who is speaking.
  • Always use {{char}} and {{user}} as placeholders — never substitute real names.

All fields must be non-empty strings. The JSON must be valid and parseable.

## Guidelines

- **Personality is behavioral, not descriptive.** Never list adjectives. Explain the behavior, the exceptions, and the contradictions.
- **first_mes calibrates reply length.** A longer, richer opener trains the AI to give longer replies throughout the chat.
- **description** should answer "how does this character act?" as much as "what do they look like?"
- Ensure tone, vocabulary, and personality are consistent across every field.

## Output Format

Return ONLY a valid JSON object. No markdown, no code blocks, no extra text.`;
    }

    /**
     * Build the user prompt with the character description.
     *
     * @private
     * @param {string} description - character concept
     * @param {object} [_options] - unused
     * @returns {string} user prompt text
     */
    buildUserPrompt(description, _options) {
        let prompt = `Create a detailed character for the following concept:\n\n"${description}"\n\n`;
        prompt += 'Generate a complete character profile including:\n';
        prompt += '- name\n';
        prompt += '- description: focus on behavioral patterns — how the character acts, not just what they look like\n';
        prompt += '- personality: a behavioral brief (no adjective lists — explain the why and when behind each trait)\n';
        prompt += '- scenario\n';
        prompt += '- first_mes: a rich narrative opening scene (150-300 words) — its length calibrates how long AI replies will be throughout the conversation\n';
        prompt += '- mes_example: 2-3 short exchanges (5-6 lines each) in <START> / {{char}}: / {{user}}: format. Vary action verbs across all examples — never repeat the same one. Quotes for dialogue only.\n\n';
        prompt += 'Return only valid JSON with the character data. No markdown, no code blocks, just the JSON object.';
        return prompt;
    }

    /**
     * Build a system prompt for lorebook generation.
     *
     * @private
     * @returns {string} lorebook system prompt
     */
    buildLorebookSystemPrompt() {
        return `You are an expert in creating lorebook (World Info) entries for SillyTavern roleplay. Your task is to generate keyword-triggered encyclopedia entries in JSON format.

## How SillyTavern Lorebook Entries Work

Entries are injected into the AI's context ONLY when their trigger keywords appear in recent messages. CRITICAL: Only the **content** field is ever inserted into the AI's context — it never sees keys, names, or comments. The content field must therefore be fully self-contained and informative on its own.

## Entry Format

{
  "entries": [
    {
      "keys": ["keyword1", "keyword2"],
      "content": "Fully self-contained world information written as concise prose. Must make sense without any surrounding context.",
      "name": "Entry title (author reference only — never seen by AI)",
      "comment": "Notes for the author (never seen by AI)",
      "priority": 10,
      "insertion_order": 0
    }
  ]
}

## Guidelines

- **keys**: 2-4 specific, distinctive trigger words per entry. Use proper nouns, unique terms, or character-specific vocabulary. Avoid common everyday words that would fire constantly and waste the token budget.
- **content**: THE only thing the AI ever sees. Write it as concise, self-contained prose (80-250 words). It must be informative without any surrounding context.
- **name**: Short label for your own reference — not injected into context.
- Cover varied entry types: setting/locations, factions, NPCs, historical events, customs, rules, and character-specific knowledge.
- Few accurate, well-targeted entries beat many vague ones. Every active entry costs tokens from the context budget — keep content lean.
- Entries should complement each other without overlapping.

## Output Format

Return ONLY a valid JSON object with the "entries" array. No additional text.`;
    }

    /**
     * Build a user prompt for lorebook generation.
     *
     * @private
     * @param {string} description - character concept
     * @param {object} options - generation options
     * @returns {string} lorebook user prompt
     */
    buildLorebookUserPrompt(description, options) {
        let prompt = `Generate lorebook entries for a character with the following concept:\n\n"${description}"\n\n`;
        const targetCount = options.entryCount || 10;
        prompt += `Create approximately ${targetCount} diverse lorebook entries covering:\n`;
        prompt += '- World setting and locations\n';
        prompt += '- Factions, organizations, or groups\n';
        prompt += '- Magic systems, technology, or special knowledge\n';
        prompt += '- Important NPCs or characters in this world\n';
        prompt += '- Historical events or lore\n';
        prompt += '- Rules, customs, or cultural elements\n\n';
        prompt += 'Remember: only the content field is injected into the AI\'s context. Use specific, distinctive trigger keywords — not common words. ';
        prompt += 'Return only valid JSON with the entries array. No markdown, no code blocks.';
        return prompt;
    }
}
