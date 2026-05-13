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
        return `You are an expert character creator for interactive roleplay. Your task is to generate complete, detailed character profiles in JSON format.

## Character Card V3 Specification

You must output a JSON object with the following fields:

- **name** (string): The character's name.
- **description** (string): A comprehensive background and physical description. Include appearance, history, and defining characteristics.
- **personality** (string): The character's personality traits, speech patterns, quirks, and behavioral tendencies.
- **scenario** (string): The current context or situation in which the character is placed for roleplay.
- **first_mes** (string): The character's opening message in the roleplay. Should be engaging and set the scene.
- **mes_example** (string): An example of a typical message from this character during conversation, showing their voice and style.

All fields must be non-empty strings. The JSON must be valid and parseable.

## Guidelines

- Make each field substantial and detailed (at least 100-200 characters each).
- Ensure personality and behavior are consistent across fields.
- The first_mes should be immersive and prompt user engagement.
- mes_example should demonstrate the character's authentic voice in dialogue.
- All content should be appropriate and well-written.

## Output Format

Return ONLY a valid JSON object. No additional text before or after.`;
    }

    /**
     * Build the user prompt with the character description and options.
     *
     * @private
     * @param {string} description - character concept
     * @param {object} options - generation options
     * @returns {string} user prompt text
     */
    buildUserPrompt(description, options) {
        let prompt = `Create a detailed character for the following concept:\n\n"${description}"\n\n`;
        prompt += 'Generate a complete character profile with name, description, personality, scenario, first message, and example dialogue.\n\n';

        if (options.entryCount) {
            prompt += `Target creating approximately ${options.entryCount} lorebook entries for this character's knowledge base.\n\n`;
        }

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
        return `You are an expert in creating detailed lorebook (World Info) entries for interactive roleplay. Your task is to generate keyword-triggered encyclopedia entries in JSON format.

## Lorebook Entry Format

Each entry is a keyword-triggered piece of world information. Generate entries as a JSON object with:

{
  "entries": [
    {
      "keys": ["keyword1", "keyword2", "alias"],
      "content": "Detailed world information text",
      "name": "Entry title (optional)",
      "comment": "Notes about this entry (optional)",
      "priority": 0,
      "insertion_order": 0
    }
  ]
}

## Guidelines

- **keys**: Array of trigger words. Use 2-5 short aliases per entry. Avoid common words.
- **content**: 100-300 character descriptions of world lore, locations, factions, magic systems, etc.
- **name**: Concise entry title (optional but recommended).
- Generate 5-15 varied entries covering different aspects of the character's world.
- Entries should be complementary and provide depth without overlap.

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
        prompt += 'Return only valid JSON with the entries array. No markdown, no code blocks.';
        return prompt;
    }
}
