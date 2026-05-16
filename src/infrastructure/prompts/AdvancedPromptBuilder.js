/**
 * @file Advanced prompt builder. Uses explicit field-length targets, stricter
 * formatting rules, and a chain-of-thought preamble to coax higher-quality
 * character cards from the LLM. Drop-in replacement for DefaultPromptBuilder.
 */

import { IPromptBuilder } from '../../application/ports/IPromptBuilder.js';
import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';

/**
 * Advanced prompt builder. Adds chain-of-thought reasoning, explicit word-count
 * targets per field, and stricter output constraints on top of the default strategy.
 *
 * @augments IPromptBuilder
 */
export class AdvancedPromptBuilder extends IPromptBuilder {
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
     * @returns {string} system prompt text
     */
    buildSystemPrompt(options = {}) {
        if (options.entryCount) {
            return this.buildLorebookSystemPrompt();
        }
        return this.buildCharacterSystemPrompt();
    }

    /**
     * Build the character-specific system prompt with chain-of-thought preamble,
     * explicit word-count targets per field, and strict output rules.
     *
     * @private
     * @returns {string} system prompt text
     */
    buildCharacterSystemPrompt() {
        return `You are an expert character creator for interactive roleplay in SillyTavern. Generate complete character profiles in JSON following the Character Card V3 specification.

## Step-by-Step Reasoning (Chain of Thought)

Before writing any JSON, think through these steps in order:

1. **Concept analysis** – Identify the character's genre, archetype, core tension, and emotional register.
2. **Behavioral core** – Decide the ONE defining behavioral contradiction (e.g. "fiercely protective yet emotionally unavailable"). Every field must express this.
3. **Voice calibration** – Choose vocabulary level, sentence rhythm, and dialogue style. Lock these in before writing first_mes.
4. **Field drafting** – Draft each field to its word-count target, then trim to exactly the target range.
5. **Consistency pass** – Re-read all fields together. Fix any tone, vocabulary, or personality inconsistencies.
6. **Format check** – Verify JSON is valid; alternate_greetings is an array of exactly 3 strings; all fields are non-empty.

Output ONLY the final JSON object — no reasoning, no commentary.

## Character Card V3 Fields with Word-Count Targets

- **name** (string): The character's name. [1–4 words]

- **description** (string): Physical appearance, backstory, and defining characteristics — weighted toward behavioral patterns. [150–250 words]
  - Rule: Every sentence must either shape how the AI behaves or explain why the character acts a specific way. Cut sentences that only state facts.

- **personality** (string): Behavioral brief. NOT an adjective list. [80–150 words]
  - Rule: Explain the WHY and WHEN behind each trait. Include at least one contradiction and one situational exception.
  - Rule: An actor must be able to perform 10 different scenes from this description alone.

- **scenario** (string): Opening situation and context. [50–100 words]

- **first_mes** (string): The character's opening message — THE most important field. [150–300 words]
  - Rule: This length calibrates every future reply. Richer = longer AI responses throughout the session.
  - Rule: Write as a narrative scene. Interleave action descriptions (*she glances up*) with natural dialogue.
  - Rule: End with an implicit or explicit hook that invites the user to engage.

- **mes_example** (string): 2–3 short exchanges demonstrating authentic voice. Use EXACTLY this format:
  <START>
  {{char}}: *action in asterisks* "spoken dialogue"
  {{user}}: [short open-ended prompt]
  {{char}}: *different action* "follow-up dialogue"

  Strict rules for mes_example:
  • Never reuse an action verb across all examples — use distinct synonyms each time.
  • Quotation marks for spoken dialogue ONLY — never wrap thoughts in quotes.
  • Each exchange must be open-ended — no definitive resolutions.
  • Mention {{char}}'s name at least once per block.
  • Always use {{char}} and {{user}} — never substitute real names.

- **alternate_greetings** (array of exactly 3 strings): Three additional opening messages, each 150–300 words.
  Entry 1 — different **tone** (e.g. comedic, tense, or intimate vs. first_mes).
  Entry 2 — different **scenario** (character mid-crisis, or first encounter in an unusual setting).
  Entry 3 — **group-chat-safe** opener: no assumed prior context, written to engage multiple users simultaneously.
  Each entry must be meaningfully distinct from first_mes and from each other.

## Strict Output Rules

- Return ONLY a valid JSON object. Zero markdown, zero code fences, zero extra text.
- All string fields must be non-empty.
- alternate_greetings must be an array of exactly 3 non-empty strings.
- JSON must be parseable with JSON.parse() without pre-processing.`;
    }

    /**
     * Build the user prompt with the character description and structured checklist.
     *
     * @private
     * @param {string} description - character concept
     * @param {object} [options] - generation options
     * @param {string} [options.groupDescription] - parent group concept; when set, adds group_only_greetings field
     * @returns {string} user prompt text
     */
    buildUserPrompt(description, options = {}) {
        let prompt = `Create a detailed character for the following concept:\n\n"${description}"\n\n`;
        prompt += 'Follow the chain-of-thought steps in your system prompt before writing JSON.\n\n';
        prompt += 'Required fields and word-count targets:\n';
        prompt += '- name [1–4 words]\n';
        prompt += '- description [150–250 words]: behavioral-first; every sentence shapes how the AI acts\n';
        prompt += '- personality [80–150 words]: behavioral brief with the WHY, WHEN, and at least one contradiction\n';
        prompt += '- scenario [50–100 words]\n';
        prompt += '- first_mes [150–300 words]: narrative scene with interleaved action + dialogue; ends with engagement hook\n';
        prompt += '- mes_example: 2–3 exchanges in <START>/{{char}}:/{{user}}: format; unique action verbs; dialogue-only quotes\n';
        prompt += '- alternate_greetings: array of exactly 3 strings [150–300 words each] — vary tone, scenario, and one group-chat-safe opener\n';
        if (options.groupDescription) {
            prompt += '- group_only_greetings: array of exactly 1 string [150–250 words] — a group-chat-specific ';
            prompt += `opening that acknowledges the shared ensemble: "${options.groupDescription}". `;
            prompt += 'Written to engage multiple participants simultaneously, referencing the team/family context.\n';
        }
        prompt += '\nReturn only valid JSON. No markdown, no code blocks, no extra text.';
        return prompt;
    }

    /**
     * Build a system prompt for lorebook generation.
     *
     * @private
     * @returns {string} lorebook system prompt
     */
    buildLorebookSystemPrompt() {
        return `You are an expert in creating lorebook (World Info) entries for SillyTavern roleplay. Generate keyword-triggered encyclopedia entries in JSON format.

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

## Strict Guidelines

- **keys**: 2–4 specific, distinctive trigger words per entry. Use proper nouns, unique terms, or character-specific vocabulary. Avoid common everyday words that would fire constantly and waste the token budget.
- **content**: THE only thing the AI ever sees. [80–250 words] Concise, self-contained prose. Informative without surrounding context.
- **name**: Short author-facing label — never injected.
- Cover varied entry types: setting/locations, factions, NPCs, historical events, customs, rules, and character-specific behavioral knowledge.
- Few accurate, well-targeted entries beat many vague ones. Every active entry costs tokens — keep content lean.
- Entries must complement each other without overlapping.
- Every entry's keys must be genuinely distinctive — test: would this keyword appear in a conversation about something unrelated?

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
            'Think step by step: first identify what is weak in the current value, ' +
            'then plan the rewrite, then write only the final result. ' +
            'Return ONLY the rewritten field text — no JSON, no labels, no explanation, no reasoning.';
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
     * Uses chain-of-thought to surface the richest relationship dynamics and group lore.
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
            'Your task is to generate a SHARED lorebook for an ensemble of characters.\n\n' +
            '## Chain-of-Thought Steps\n' +
            '1. Map every pair of characters — what is their dynamic? Any tension, history, or loyalty?\n' +
            '2. Identify the group\'s founding story: how did they come together? What defines their bond?\n' +
            '3. List shared locations, symbols, rituals, or enemies that tie the group together.\n' +
            '4. Draft entries — relationship-pair entries first, then group-wide lore.\n' +
            '5. Verify each entry\'s content is self-contained (80–300 words), informative without context.\n\n' +
            'Output ONLY the final JSON — no reasoning, no markdown, no code fences.\n' +
            'Format: { "name": "Lorebook name", "entries": [...] }';
        let userPrompt = `Ensemble concept: "${groupDescription}"\n`;
        userPrompt += `Characters: ${nameList}\n\n`;
        userPrompt += `Follow the chain-of-thought steps, then generate approximately ${entryCount} entries.\n`;
        userPrompt += 'Weight toward relationship dynamics, group history, and inter-character tension.\n';
        userPrompt += 'Return JSON: { "name": "...", "entries": [...] }';
        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build a request to decompose a group description into individual character descriptions.
     * Uses chain-of-thought to surface distinct voices, roles, and relationships.
     *
     * @param {string} groupDescription - description of the group, ensemble, or family
     * @param {object} [options] - decomposition options
     * @param {number} [options.maxCharacters] - maximum number of characters to generate
     * @returns {GenerationRequest} structured generation request
     */
    buildGroupDecompositionRequest(groupDescription, options = {}) {
        const maxNote = options.maxCharacters
            ? ` Do not exceed ${options.maxCharacters} characters.`
            : '';
        const systemPrompt =
            'You are a world-building expert. Given a group or ensemble concept, identify every distinct ' +
            'individual and write a concise but vivid character concept for each one. ' +
            'Think step by step: first list the roles implied by the group (leader, mentor, comic relief, etc.), ' +
            'then assign a distinct behavioral core to each role, then write the final description. ' +
            'Output ONLY the final JSON — no reasoning, no markdown, no code fences. ' +
            'Format: { "characters": ["description 1", "description 2", ...] }';
        const userPrompt =
            `Group or ensemble concept: "${groupDescription}"\n\n` +
            'Follow the chain-of-thought steps, then return JSON with each member as a standalone ' +
            `character description string.${maxNote}`;
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
        prompt += '- Behavioral rules: speech patterns, emotional tells, habits, and quirks (highest impact)\n';
        prompt += '- World setting and locations\n';
        prompt += '- Factions, organizations, or groups\n';
        prompt += '- Magic systems, technology, or special knowledge\n';
        prompt += '- Important NPCs or characters in this world\n';
        prompt += '- Historical events or lore\n';
        prompt += '- Rules, customs, or cultural elements\n\n';
        prompt += 'For each entry: choose keys that are specific and distinctive — not common words. ';
        prompt += 'Keep content self-contained (80–250 words), informative without surrounding context. ';
        prompt += 'Return only valid JSON with the entries array. No markdown, no code blocks.';
        return prompt;
    }
}
