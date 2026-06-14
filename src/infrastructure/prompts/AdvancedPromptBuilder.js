/**
 * @file Advanced prompt builder. Uses explicit field-length targets, stricter
 * formatting rules, and a chain-of-thought preamble to coax higher-quality
 * character cards from the LLM. Drop-in replacement for DefaultPromptBuilder.
 */

import { BasePromptBuilder } from './BasePromptBuilder.js';
import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';

/**
 * Advanced prompt builder. Adds chain-of-thought reasoning, explicit word-count
 * targets per field, and stricter output constraints on top of the default strategy.
 *
 * @augments BasePromptBuilder
 */
export class AdvancedPromptBuilder extends BasePromptBuilder {
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

## SillyTavern Macros (optional)

You may use these runtime macros in text fields where variety adds value:

- \`{{char}}\` — replaced with the character's name. **Required** in mes_example; optional elsewhere.
- \`{{user}}\` — replaced with the user's name. **Required** in mes_example; optional elsewhere.
- \`{{random::option1::option2::option3}}\` — picks one option randomly each render. Use in scenario or first_mes for tonal variety. Example: \`It was {{random::a rainy afternoon::high noon::late at night}}.\`
- \`{{pick::option1::option2}}\` — like random, but consistent within a session.
- \`{{// comment}}\` — inline author note; stripped before display.

Only use macros where they genuinely add value — do not force them into every field.

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
     * Return the system prompt for field refinement (chain-of-thought style).
     *
     * @returns {string} system prompt text
     */
    _buildRefinementSystemPrompt() {
        return 'You are an expert character creator for SillyTavern. ' +
            'Think step by step: first identify what is weak in the current value, ' +
            'then plan the rewrite, then write only the final result. ' +
            'Return ONLY the rewritten field text — no JSON, no labels, no explanation, no reasoning.';
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

    /**
     * Build a request for step 1: metadata fields (chain-of-thought enhanced).
     *
     * @param {string} description - character concept
     * @returns {GenerationRequest}
     */
    buildMetadataRequest(description) {
        const systemPrompt = 'You are a character card creator for SillyTavern. ' +
            'Think before answering: first identify the character\'s genre, energy level, and audience appeal. ' +
            'Then write the 4 fields. ' +
            'Return a JSON object with EXACTLY these 4 fields: name, creator_notes, tags, talkativeness. ' +
            'No other fields. No markdown. No preamble. No explanation.';
        const userPrompt =
            `Character concept: "${description}"\n\n` +
            'Generate metadata fields:\n' +
            '- name: The character\'s full name (1–4 words)\n' +
            '- creator_notes: A 2–4 sentence back-cover blurb for the character browser. ' +
            'Who is this character? What makes conversations with them interesting? What tone does the roleplay take?\n' +
            '- tags: Array of 3–8 lowercase descriptive tags. Include genre, relationship type, tone, and notable traits.\n' +
            '- talkativeness: String "0.0"–"1.0". How likely the character sends unsolicited messages. ' +
            'Match to energy level ("0.2" = quiet, "0.5" = default, "0.8" = chatty).\n\n' +
            'Return JSON: {"name": "...", "creator_notes": "...", "tags": [...], "talkativeness": "..."}';
        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build a request for step 2: behavioral fields (chain-of-thought enhanced).
     *
     * @param {string} description - character concept
     * @param {{name: string}} context - metadata from step 1
     * @returns {GenerationRequest}
     */
    buildBehaviorRequest(description, context) {
        const { name } = context;
        const systemPrompt =
            'You are a character card writer for SillyTavern. ' +
            'Think step by step: first identify the behavioral core of this character — ' +
            'their ONE defining contradiction and the WHY behind their actions. ' +
            'Then write to explicit word-count targets. ' +
            'Write the description and personality fields for a character card. ' +
            'Return a JSON object with EXACTLY 2 fields: description and personality. ' +
            'No markdown, no preamble, no other fields.';
        const userPrompt =
            `Character concept: "${description}"\n` +
            `Character name: ${name}\n\n` +
            'Write:\n' +
            '- description [150–250 words]: Physical appearance, backstory, and defining characteristics. ' +
            'Prioritize behavioral patterns — how does this character act and why? ' +
            'Every sentence should shape AI behavior, not just state facts.\n' +
            '- personality [80–150 words]: A behavioral brief — NOT an adjective list. ' +
            'Write the WHY and WHEN behind each trait. Include at least one contradiction. ' +
            'An actor should be able to play 10 different scenes from this description alone.\n\n' +
            'Return JSON: {"description": "...", "personality": "..."}';
        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build a request for step 3: scene fields (chain-of-thought enhanced).
     *
     * @param {string} description - character concept
     * @param {{name: string, description: string, personality: string}} context - prior step output
     * @returns {GenerationRequest}
     */
    buildSceneRequest(description, context) {
        const charDescription = context.description;
        const { name, personality } = context;
        const systemPrompt =
            'You are a character card writer for SillyTavern. ' +
            'Think step by step: calibrate first_mes length — richer = longer AI replies. ' +
            'Write the scenario and first_mes fields for a character card. ' +
            'Return a JSON object with EXACTLY 2 fields: scenario and first_mes. ' +
            'No markdown, no preamble, no other fields.';
        const userPrompt =
            `Character concept: "${description}"\n` +
            `Character name: ${name}\n` +
            `Character description: ${charDescription}\n` +
            `Character personality: ${personality}\n\n` +
            'Write:\n' +
            '- scenario [50–100 words]: The circumstances where roleplay begins. Frames the opening situation.\n' +
            `- first_mes [150–300 words]: ${name}'s opening message — THE most important field. ` +
            'This length calibrates every future reply. Write as a narrative scene: interleave action ' +
            'descriptions (*action*) with natural dialogue. End with something that invites the user to engage.\n' +
            'You may optionally use {{random::a::b::c}} in scenario or first_mes to add variety across sessions.\n\n' +
            'Return JSON: {"scenario": "...", "first_mes": "..."}';
        return new GenerationRequest({ systemPrompt, userPrompt, maxTokens: 800 });
    }

    /**
     * Build a request for step 4: example dialogue (chain-of-thought enhanced).
     *
     * @param {string} description - character concept
     * @param {{name: string, personality: string, first_mes: string}} context - prior step output
     * @returns {GenerationRequest}
     */
    buildDialogueRequest(description, context) {
        const { name, personality, first_mes } = context;
        const systemPrompt =
            'You are writing the mes_example field for a SillyTavern character card. ' +
            'Before writing, note the character\'s voice, rhythm, and vocabulary. Then draft each exchange. ' +
            'Return ONLY the formatted dialogue — nothing else. ' +
            'No JSON wrapper, no explanation, no preamble, no sign-off.';
        const userPrompt =
            `Character concept: "${description}"\n` +
            `Character name: ${name}\n` +
            `Character personality: ${personality}\n\n` +
            `Reference opening message:\n${first_mes}\n\n` +
            `Write 2–3 example dialogue exchanges showing ${name}'s authentic voice.\n\n` +
            'Use this EXACT format for each exchange:\n' +
            '<START>\n' +
            '{{char}}: *action in asterisks* "spoken dialogue"\n' +
            '{{user}}: [a short open-ended question or statement]\n' +
            '{{char}}: *different action* "follow-up dialogue"\n\n' +
            'Rules you MUST follow:\n' +
            '• Begin EVERY exchange with <START> on its own line\n' +
            `• Use {{char}} ONLY — never "${name}" or any other name\n` +
            '• Use {{user}} ONLY — never "User", "Human", "Player", or any other label\n' +
            '• Use DIFFERENT action verbs in each example — never repeat the same verb\n' +
            '• Quotation marks for spoken words ONLY — never wrap thoughts in quotes\n' +
            '• Each exchange must be open-ended — the user should want to respond\n\n' +
            'Return ONLY the dialogue blocks starting with the first <START>. Nothing before or after.';
        return new GenerationRequest({ systemPrompt, userPrompt });
    }

    /**
     * Build a request for step 5: alternate greetings (chain-of-thought enhanced).
     *
     * @param {string} description - character concept
     * @param {{name: string, first_mes: string, scenario: string}} context - prior step output
     * @param {object} [options] - generation options
     * @param {string} [options.groupDescription] - parent group concept for group_only_greetings
     * @returns {GenerationRequest}
     */
    buildGreetingsRequest(description, context, options = {}) {
        const { name, first_mes, scenario } = context;
        const firstMesPreview = (first_mes || '').slice(0, 400);
        const systemPrompt =
            'You are writing alternate_greetings for a SillyTavern character card. ' +
            'Plan each greeting\'s distinct entry point before writing. ' +
            'Return a JSON array of EXACTLY 3 strings. ' +
            'Do NOT use backticks or code blocks. ' +
            'Start your response with [ and end with ]. Raw JSON only.';
        let userPrompt =
            `Character concept: "${description}"\n` +
            `Character name: ${name}\n` +
            `Scenario: ${scenario}\n\n` +
            `Main opening message (reference, truncated):\n${firstMesPreview}\n\n` +
            'Write 3 alternate opening messages, each 75–150 words. ' +
            'Same quality bar as the main opening (narrative scene, action + dialogue, ends with hook):\n' +
            '1. A different TONE (must contrast the main opening)\n' +
            '2. A different SCENARIO (e.g. first encounter, mid-crisis, unusual setting)\n' +
            '3. A GROUP-CHAT-SAFE opener — no assumed prior context, written to engage multiple readers\n\n' +
            'Each must be meaningfully different — not a minor rewrite.\n\n' +
            'Return ONLY a JSON array (NO code blocks, NO backticks): ["greeting 1 text", "greeting 2 text", "greeting 3 text"]';
        if (options.groupDescription) {
            userPrompt += `\n\nThis character is part of a group: "${options.groupDescription}". ` +
                'Greeting 3 should reference the shared group context.';
        }
        return new GenerationRequest({ systemPrompt, userPrompt, maxTokens: 700 });
    }
}
