/**
 * @file Use case: summarise a named character from chat history into a
 * plain-text description. The caller passes the result to
 * GenerateCharacterFromDescription so the normal IPromptBuilder pipeline
 * produces the Character entity.
 */

// @ts-check

import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';

const SYSTEM_PROMPT = 'You are a character analyst for a roleplay session. ' +
    'Read the conversation transcript and write a detailed prose description ' +
    'of the named character — their appearance, personality, backstory, speech patterns, ' +
    'and role in the story. Write only the description; no JSON, no headings.';

/**
 * Summarise a named character from chat history into a plain-text description.
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
     * @param {string} characterName - name of the character to summarise
     * @param {Array<{is_user: boolean, mes: string}>|null} chatMessages - conversation messages
     * @returns {Promise<string>} prose description of the character
     */
    async execute(characterName, chatMessages) {
        if (!characterName || !characterName.trim()) {
            throw new Error('Character name is required');
        }
        if (!chatMessages || chatMessages.length === 0) {
            throw new Error('Chat history is empty — no messages to extract from');
        }

        this.logger.debug('Extracting character description from chat', {
            characterName,
            messageCount: chatMessages.length,
        });

        const transcript = chatMessages
            .map(msg => `${msg.is_user ? 'User' : 'AI'}: ${msg.mes}`)
            .join('\n');

        const request = new GenerationRequest({
            systemPrompt: SYSTEM_PROMPT,
            userPrompt: `Summarise the character "${characterName}" from this transcript:\n\n${transcript}`,
            maxTokens: 800,
        });

        const description = await this.llmProvider.generate(request);
        this.logger.info('Character description extracted', { characterName, length: description.length });
        return description;
    }
}
