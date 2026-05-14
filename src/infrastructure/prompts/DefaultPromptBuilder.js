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
- **description** (string): Physical appearance, backstory, and defining characteristics. Keep world-building lore minimal here — that belongs in the lorebook, not the card description.
- **personality** (string): A concise distillation of key personality traits, speech patterns, quirks, and behavioral tendencies. This is a punchy summary, not a full character study.
- **scenario** (string): The circumstances and context in which the roleplay begins. Frames the opening situation.
- **first_mes** (string): The character's opening message — THE most important field. The AI will mirror its tone, style, and length throughout the entire conversation. Write it as a narrative scene: 150-300 words, in-character and immersive, with action descriptions (*she sets down her cup and looks up*) woven with natural dialogue. End with something that invites the user to engage.
- **mes_example** (string): One or more example exchanges that demonstrate the character's authentic voice. Use this EXACT format with no variation:
  <START>
  {{char}}: [character message — mix actions and dialogue]
  {{user}}: [a plausible user reply]
  {{char}}: [character follow-up]

All fields must be non-empty strings. The JSON must be valid and parseable.

## Guidelines

- **first_mes is critical.** The model anchors its style and response length to it more than any other field. Make it count.
- Keep **description** lean. The lorebook handles world-building; the card description handles the character.
- Use \`{{char}}\` and \`{{user}}\` as placeholders in mes_example — never use real names there.
- Ensure tone, vocabulary, and personality are consistent across all fields.

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
        prompt += '- name, description, personality, scenario\n';
        prompt += '- first_mes: a rich narrative opening scene (150-300 words) that establishes tone and ends with an invitation for the user to engage\n';
        prompt += '- mes_example: at least one exchange using the exact <START> / {{char}}: / {{user}}: format\n\n';
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
