/**
 * @file Use case: extract a named character from an existing chat history and
 * synthesise it into a Character entity. Useful when an NPC has developed
 * organically in a roleplay and the user wants to save them as a card.
 */

// @ts-check

import { Character } from '../../domain/entities/Character.js';
import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';
import { repairJson } from '../../infrastructure/utils/JsonRepair.js';

const SYSTEM_PROMPT = 'You are a character card writer for SillyTavern. ' +
    'Given a conversation transcript, extract and synthesise everything known about ' +
    'the named character into a structured character card. ' +
    'Respond with valid JSON only — no prose, no markdown fences. ' +
    'The JSON must have exactly these string fields: ' +
    'name, description, personality, scenario, first_mes, mes_example.';

/**
 * Extract a named character from chat history and return a Character entity.
 */
export class ExtractCharacterFromChat {
    /**
     * Construct the use case.
     *
     * @param {import('../ports/ILlmProvider.js').ILlmProvider} llmProvider - port for LLM generation
     * @param {import('../ports/ILogger.js').ILogger} logger - port for diagnostic logging
     */
    constructor(llmProvider, logger) {
        this.llmProvider = llmProvider;
        this.logger = logger;
    }

    /**
     * Execute the use case.
     *
     * @param {string} characterName - name of the character to extract
     * @param {Array<{is_user: boolean, mes: string}>|null} chatMessages - conversation messages
     * @returns {Promise<Character>} synthesised character entity
     */
    async execute(characterName, chatMessages) {
        if (!characterName || !characterName.trim()) {
            throw new Error('Character name is required');
        }
        if (!chatMessages || chatMessages.length === 0) {
            throw new Error('Chat history is empty — no messages to extract from');
        }

        this.logger.debug('Extracting character from chat', {
            characterName,
            messageCount: chatMessages.length,
        });

        const transcript = this._buildTranscript(chatMessages);
        const userPrompt = `Extract the character "${characterName}" from this conversation ` +
            `transcript and return a character card JSON.\n\nTranscript:\n${transcript}`;

        const request = new GenerationRequest({
            systemPrompt: SYSTEM_PROMPT,
            userPrompt,
            maxTokens: 1200,
        });

        const response = await this.llmProvider.generate(request);

        const characterData = this._parseResponse(response);
        const character = new Character(characterData);
        this.logger.info('Character extracted successfully', { name: character.name });
        return character;
    }

    /**
     * Parse and repair the LLM response into a plain object.
     *
     * @param {string} response - raw LLM output
     * @returns {object} parsed character data
     */
    _parseResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            this.logger.debug('Direct JSON parse failed, attempting repair', { error: error.message });
            const repaired = repairJson(response);
            if (!repaired) {
                this.logger.error('Failed to parse or repair LLM response', { response });
                throw new Error('LLM returned invalid JSON and repair failed. Please try again.');
            }
            this.logger.info('Successfully repaired malformed JSON');
            return repaired;
        }
    }

    /**
     * Format chat messages into a readable transcript string.
     *
     * @param {Array<{is_user: boolean, mes: string}>} messages - chat messages
     * @returns {string} formatted transcript
     */
    _buildTranscript(messages) {
        return messages
            .map(msg => `${msg.is_user ? 'User' : 'AI'}: ${msg.mes}`)
            .join('\n');
    }
}
