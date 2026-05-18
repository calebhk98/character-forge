/**
 * @file Use case: generate a character from a natural-language description
 * using a five-step field-by-field pipeline. Each step calls the LLM once
 * with a focused prompt, returning plain text or a small JSON object.
 * Results are assembled into a Character entity.
 */

import { Character } from '../../domain/entities/Character.js';

/**
 * Fix common mes_example format violations produced by the LLM.
 *
 * @param {string} text - raw LLM dialogue output
 * @param {string} characterName - character's name for {{char}} substitution
 * @returns {string} repaired dialogue text
 */
function repairMesExample(text, characterName) {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    result = result.replace(/^START\b/gm, '<START>');
    result = result.replace(/^SillyTavern\s+System:/gm, '{{char}}:');
    if (characterName) {
        const escaped = characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(`^${escaped}:`, 'gm'), '{{char}}:');
    }
    return result;
}

/**
 * Parse a step JSON response, falling back to repair on parse failure.
 *
 * @param {string} response - raw LLM output
 * @param {string} context - step name for error messages
 * @param {string[]} required - required field names to validate
 * @param {import('../ports/IJsonRepair.js').IJsonRepair} jsonRepair
 * @param {import('../ports/ILogger.js').ILogger} logger
 * @returns {object} parsed data object
 */
function parseStepJson(response, context, required, jsonRepair, logger) {
    let data;
    try {
        data = JSON.parse(response);
    } catch {
        logger.debug(`Direct JSON parse failed for ${context}, attempting repair`);
        data = jsonRepair.parseOrRepair(response, context);
    }
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`${context}: LLM response missing required field "${field}"`);
        }
    }
    return data;
}

/**
 * Parse an alternate greetings response into a string array.
 *
 * @param {string} response - raw LLM output (expected JSON array)
 * @param {import('../ports/IJsonRepair.js').IJsonRepair} jsonRepair
 * @param {import('../ports/ILogger.js').ILogger} logger
 * @returns {string[]} greetings array
 */
function parseGreetingsArray(response, jsonRepair, logger) {
    let parsed;
    try {
        parsed = JSON.parse(response);
    } catch {
        logger.debug('Direct JSON parse failed for greetings, attempting repair');
        parsed = jsonRepair.parseOrRepair(response, 'alternate greetings');
    }
    const arr = Array.isArray(parsed) ? parsed : (parsed?.alternate_greetings ?? []);
    return arr
        .filter((item) => item !== null && item !== undefined)
        .map((item) => (typeof item === 'string' ? item : String(item)));
}

/**
 * Generate a character from a text description using a five-step pipeline.
 */
export class GenerateCharacterFromDescription {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/IPromptBuilder.js').IPromptBuilder} promptBuilder
     * @param {import('../ports/ILlmProvider.js').ILlmProvider} llmProvider
     * @param {import('../ports/ILogger.js').ILogger} logger
     * @param {import('../ports/IJsonRepair.js').IJsonRepair} jsonRepair
     */
    constructor(promptBuilder, llmProvider, logger, jsonRepair) {
        this.promptBuilder = promptBuilder;
        this.llmProvider = llmProvider;
        this.logger = logger;
        this.jsonRepair = jsonRepair;
    }

    /**
     * Execute the five-step generation pipeline.
     *
     * @param {string} description - character concept
     * @param {object} [options] - generation options
     * @param {string} [options.groupDescription] - parent group concept
     * @param {Function} [onProgress] - optional callback(step, data) fired after each step
     * @returns {Promise<import('../../domain/entities/Character.js').Character>}
     */
    async execute(description, options = {}, onProgress = null) {
        this.logger.debug('Starting field-by-field character generation', { description });

        const metadata = await this._generateMetadata(description);
        onProgress?.('metadata', metadata);

        const behavior = await this._generateBehavior(description, metadata);
        onProgress?.('behavior', behavior);

        const sceneCtx = { name: metadata.name, description: behavior.description, personality: behavior.personality };
        const scene = await this._generateScene(description, sceneCtx);
        onProgress?.('scene', scene);

        const dialogueCtx = { name: metadata.name, personality: behavior.personality, first_mes: scene.first_mes };
        const mes_example = await this._generateDialogue(description, dialogueCtx, metadata.name);
        onProgress?.('dialogue', { mes_example });

        const greetingsCtx = { name: metadata.name, first_mes: scene.first_mes, scenario: scene.scenario };
        const alternate_greetings = await this._generateGreetings(description, greetingsCtx, options);
        onProgress?.('greetings', { alternate_greetings });

        const character = new Character({
            name: metadata.name,
            description: behavior.description,
            personality: behavior.personality,
            scenario: scene.scenario,
            first_mes: scene.first_mes,
            mes_example,
            alternate_greetings,
            creator_notes: metadata.creator_notes || '',
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
            talkativeness: metadata.talkativeness,
        });

        this.logger.info('Character generated successfully', { name: character.name });
        return character;
    }

    /**
     * Step 1: name, creator_notes, tags, talkativeness.
     *
     * @private
     * @param {string} description
     * @returns {Promise<object>}
     */
    async _generateMetadata(description) {
        this.logger.debug('Step 1: generating metadata');
        const request = this.promptBuilder.buildMetadataRequest(description);
        const response = await this.llmProvider.generate(request);
        return parseStepJson(response, 'metadata', ['name'], this.jsonRepair, this.logger);
    }

    /**
     * Step 2: description and personality.
     *
     * @private
     * @param {string} description
     * @param {{name: string}} context
     * @returns {Promise<object>}
     */
    async _generateBehavior(description, context) {
        this.logger.debug('Step 2: generating behavior');
        const request = this.promptBuilder.buildBehaviorRequest(description, context);
        const response = await this.llmProvider.generate(request);
        return parseStepJson(response, 'behavior', ['description', 'personality'], this.jsonRepair, this.logger);
    }

    /**
     * Step 3: scenario and first_mes.
     *
     * @private
     * @param {string} description
     * @param {object} context
     * @returns {Promise<object>}
     */
    async _generateScene(description, context) {
        this.logger.debug('Step 3: generating scene');
        const request = this.promptBuilder.buildSceneRequest(description, context);
        const response = await this.llmProvider.generate(request);
        return parseStepJson(response, 'scene', ['scenario', 'first_mes'], this.jsonRepair, this.logger);
    }

    /**
     * Step 4: mes_example as plain text.
     *
     * @private
     * @param {string} description
     * @param {object} context
     * @param {string} characterName
     * @returns {Promise<string>}
     */
    async _generateDialogue(description, context, characterName) {
        this.logger.debug('Step 4: generating dialogue');
        const request = this.promptBuilder.buildDialogueRequest(description, context);
        const rawText = await this.llmProvider.generate(request);
        return repairMesExample(rawText.trim(), characterName);
    }

    /**
     * Step 5: alternate_greetings as a string array.
     *
     * @private
     * @param {string} description
     * @param {object} context
     * @param {object} options
     * @returns {Promise<string[]>}
     */
    async _generateGreetings(description, context, options) {
        this.logger.debug('Step 5: generating greetings');
        const request = this.promptBuilder.buildGreetingsRequest(description, context, options);
        const response = await this.llmProvider.generate(request);
        return parseGreetingsArray(response, this.jsonRepair, this.logger);
    }
}
