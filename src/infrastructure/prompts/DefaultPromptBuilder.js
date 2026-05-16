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
     * @param {string} [options.customSystemPrompt] - verbatim system prompt; replaces default when non-empty
     * @param {string} [options.groupDescription] - parent group concept; when set, adds group_only_greetings field
     * @returns {GenerationRequest} structured generation request
     */
    build(description, options = {}) {
        const systemPrompt = this.buildSystemPrompt(options);
        const userPrompt = options.entryCount
            ? this.buildLorebookUserPrompt(description, options)
            : this.buildUserPrompt(description, options);

        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build the system prompt for character or lorebook generation.
     *
     * @private
     * @param {object} [options] - generation options
     * @param {string} [options.customSystemPrompt] - verbatim override; skips default when non-empty
     * @param {number} [options.entryCount] - routes to lorebook prompt when set
     * @returns {string} system prompt text
     */
    buildSystemPrompt(options = {}) {
        if (options.customSystemPrompt) return options.customSystemPrompt;
        if (options.entryCount) return this.buildLorebookSystemPrompt();
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

- **alternate_greetings** (array of 3 strings): Three additional opening messages, each placing the character in a distinct scenario or tone. Follow the same quality bar as first_mes (150–300 words, narrative scene with action descriptions and dialogue, ends with an engagement hook) but vary the entry point:
  1. A different **tone** (e.g. casual, comedic, or tense — contrasting first_mes).
  2. A different **scenario** (e.g. finding the character mid-crisis, or summoning them for the first time).
  3. A version that works as a **standalone group-chat opener** — no assumed prior context, written to engage multiple users.

  Each entry must be meaningfully different from first_mes and from each other — not minor rewrites.

All fields must be non-empty strings except alternate_greetings which is an array. The JSON must be valid and parseable.

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
     * @param {object} [options] - generation options
     * @param {string} [options.groupDescription] - parent group concept; when set, adds group_only_greetings field
     * @returns {string} user prompt text
     */
    buildUserPrompt(description, options = {}) {
        let prompt = `Create a detailed character for the following concept:\n\n"${description}"\n\n`;
        prompt += 'Generate a complete character profile including:\n';
        prompt += '- name\n';
        prompt += '- description: focus on behavioral patterns — how the character acts, not just what they look like\n';
        prompt += '- personality: a behavioral brief (no adjective lists — explain the why and when behind each trait)\n';
        prompt += '- scenario\n';
        prompt += '- first_mes: a rich narrative opening scene (150-300 words) — its length calibrates how long AI replies will be throughout the conversation\n';
        prompt += '- mes_example: 2-3 short exchanges (5-6 lines each) in <START> / {{char}}: / {{user}}: format. Vary action verbs across all examples — never repeat the same one. Quotes for dialogue only.\n';
        prompt += '- alternate_greetings: an array of exactly 3 opening scenes. Each 150–300 words, narrative style matching first_mes quality. Cover a different tone, a different scenario, and one group-chat-safe opener respectively.\n';
        if (options.groupDescription) {
            prompt += '- group_only_greetings: an array containing exactly 1 string — a 150–250 word opening message ';
            prompt += 'written specifically for a SillyTavern group chat set in the same ensemble as: ';
            prompt += `"${options.groupDescription}". The greeting should acknowledge the shared world or team `;
            prompt += 'context and be written so it engages multiple participants simultaneously.\n';
        }
        prompt += '\nReturn only valid JSON with the character data. No markdown, no code blocks, just the JSON object.';
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
     * Build a refinement request that rewrites a single character field.
     *
     * @param {string} description - original character concept
     * @param {string} fieldName - character property to rewrite
     * @param {string} currentValue - existing field text shown to the model
     * @param {string} [feedback] - optional user direction for the rewrite
     * @returns {GenerationRequest} structured refinement request
     */
    buildRefinementRequest(description, fieldName, currentValue, feedback = '') {
        const systemPrompt = 'You are an expert character creator for SillyTavern. ' +
            'Rewrite a single character card field as instructed. ' +
            'Return ONLY the rewritten field text — no JSON, no labels, no explanation.';
        let userPrompt = `Character concept: "${description}"\n\n`;
        userPrompt += `Field to rewrite: ${fieldName}\n\n`;
        userPrompt += `Current value:\n${currentValue}\n\n`;
        if (feedback && feedback.trim()) {
            userPrompt += `Feedback: ${feedback.trim()}\n\n`;
        }
        userPrompt += `Rewrite the "${fieldName}" field only. Return just the new text, nothing else.`;
        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build a request to generate a shared lorebook for an ensemble of characters.
     * Targets inter-character relationships, group dynamics, and shared world context.
     *
     * @param {string} groupDescription - description of the group or ensemble
     * @param {string[]} characterNames - names of the generated characters in this ensemble
     * @param {object} [options] - generation options
     * @param {number} [options.entryCount] - target entry count (default: 20)
     * @returns {GenerationRequest} structured generation request
     */
    buildSharedLorebookRequest(groupDescription, characterNames, options = {}) {
        const entryCount = options.entryCount || 20;
        const nameList = characterNames.join(', ');
        const systemPrompt =
            'You are an expert in creating lorebook (World Info) entries for SillyTavern roleplay. ' +
            'Your task is to generate a SHARED lorebook for an ensemble of characters — ' +
            'focus on inter-character relationships, group dynamics, shared history, and world context ' +
            'that all members inhabit together. ' +
            'CRITICAL: Only the content field is ever injected into the AI context. ' +
            'Each entry must be fully self-contained and informative without surrounding context. ' +
            'Return ONLY a valid JSON object with an "entries" array and an optional "name" string. ' +
            'No markdown, no code blocks, no extra text.';
        let userPrompt = `Generate a shared lorebook for this ensemble:\n\n"${groupDescription}"\n\n`;
        userPrompt += `Characters in the ensemble: ${nameList}\n\n`;
        userPrompt += `Create approximately ${entryCount} lorebook entries. `;
        userPrompt += 'Prioritise these categories for a shared ensemble lorebook:\n';
        userPrompt += '- Relationship dynamics between specific character pairs (highest value — use character names as keys)\n';
        userPrompt += '- Group history: origin of the team/family, formative events, shared trauma or triumph\n';
        userPrompt += '- Group identity: how they function together, roles each member plays, internal tensions\n';
        userPrompt += '- Shared locations: headquarters, home, recurring meeting places\n';
        userPrompt += '- Common enemies, allies, or factions that affect the whole group\n';
        userPrompt += '- Shared rules, rituals, or customs unique to this group\n';
        userPrompt += '- Individual backstory details that matter to the group dynamic\n\n';
        userPrompt += 'Use character names and relationship-specific terms as trigger keywords. ';
        userPrompt += 'Content must be self-contained prose (80–300 words per entry). ';
        userPrompt += 'Return JSON: { "name": "Ensemble Lorebook name", "entries": [...] }';
        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build a request to decompose a group description into individual character descriptions.
     *
     * @param {string} groupDescription - description of the group, ensemble, or family
     * @param {object} [options] - decomposition options
     * @param {number} [options.maxCharacters] - maximum number of characters to generate
     * @returns {GenerationRequest} structured generation request
     */
    buildGroupDecompositionRequest(groupDescription, options = {}) {
        const maxNote = options.maxCharacters
            ? ` Limit your response to at most ${options.maxCharacters} characters.`
            : '';
        const systemPrompt =
            'You are a world-building expert. Given a description of a group, ensemble, or family, ' +
            'identify each individual member and write a concise standalone character concept for each one. ' +
            'Return ONLY a valid JSON object with a "characters" key containing an array of strings. ' +
            'Each string must be a self-contained character description (one sentence to a short paragraph). ' +
            'No markdown, no code blocks, no extra text.';
        const userPrompt =
            `Group or ensemble concept: "${groupDescription}"\n\n` +
            `Identify each individual character in this group and describe them.${maxNote} ` +
            'Return JSON: { "characters": ["description of character 1", "description of character 2", ...] }';
        return new GenerationRequest({ systemPrompt, userPrompt });
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
        prompt += '- Character persona: the character\'s own appearance, identity, and distinctive features\n';
        prompt += '- Behavioral rules: speech patterns, emotional tells, habits, and quirks (highest impact — this is what makes the character feel consistent and alive)\n';
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
