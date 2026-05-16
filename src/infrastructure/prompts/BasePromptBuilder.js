/**
 * @file Shared base class for prompt builders. Provides the concrete
 * buildRefinementRequest implementation, which is identical across all
 * builders except for the system prompt. Subclasses override
 * _buildRefinementSystemPrompt() to inject their own system-prompt strategy.
 */

import { IPromptBuilder } from '../../application/ports/IPromptBuilder.js';
import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';

/**
 * Abstract base that provides shared prompt-building utilities.
 * Extend this instead of IPromptBuilder when you only need to customise
 * the system-prompt wording for field refinement.
 *
 * @abstract
 * @augments IPromptBuilder
 */
export class BasePromptBuilder extends IPromptBuilder {
    /**
     * Return the system prompt to use for single-field refinement requests.
     * Subclasses must override this to differentiate their refinement strategy.
     *
     * @abstract
     * @returns {string} system prompt text
     */
    _buildRefinementSystemPrompt() {
        throw new Error('BasePromptBuilder._buildRefinementSystemPrompt must be implemented by subclass');
    }

    /**
     * Build a refinement request that rewrites a single character field.
     * The user-prompt structure is shared; subclasses differentiate via
     * _buildRefinementSystemPrompt().
     *
     * @param {string} description - original character concept
     * @param {string} fieldName - character property to rewrite
     * @param {string} currentValue - existing field text shown to the model
     * @param {string} [feedback] - optional user direction for the rewrite
     * @returns {GenerationRequest} structured refinement request
     */
    buildRefinementRequest(description, fieldName, currentValue, feedback = '') {
        const systemPrompt = this._buildRefinementSystemPrompt();
        let userPrompt = `Character concept: "${description}"\n\n`;
        userPrompt += `Field to rewrite: ${fieldName}\n\n`;
        userPrompt += `Current value:\n${currentValue}\n\n`;
        if (feedback && feedback.trim()) {
            userPrompt += `Feedback: ${feedback.trim()}\n\n`;
        }
        userPrompt += `Rewrite the "${fieldName}" field only. Return just the new text, nothing else.`;
        return new GenerationRequest({ systemPrompt, userPrompt });
    }
}
