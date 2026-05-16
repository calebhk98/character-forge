/**
 * @file Tests for BasePromptBuilder shared refinement logic.
 */

import { describe, it, expect } from 'vitest';
import { BasePromptBuilder } from '../../../src/infrastructure/prompts/BasePromptBuilder.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

/**
 * Minimal concrete subclass for testing the base class behaviour.
 *
 * @augments BasePromptBuilder
 */
class StubPromptBuilder extends BasePromptBuilder {
    /**
     * Return the test system prompt.
     *
     * @returns {string} system prompt
     */
    _buildRefinementSystemPrompt() {
        return 'stub system prompt';
    }

    /**
     * Stub build — not under test here.
     *
     * @param {string} description - description
     * @returns {GenerationRequest} request
     */
    build(description) {
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: description });
    }
}

describe('BasePromptBuilder - buildRefinementRequest', () => {
    it('returns a GenerationRequest', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A knight', 'personality', 'Brave');
        expect(result).toBeInstanceOf(GenerationRequest);
    });

    it('uses the system prompt from _buildRefinementSystemPrompt()', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A knight', 'personality', 'Brave');
        expect(result.systemPrompt).toBe('stub system prompt');
    });

    it('includes the character concept in the user prompt', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A fierce warrior', 'scenario', 'Old scenario');
        expect(result.userPrompt).toContain('A fierce warrior');
    });

    it('includes the field name in the user prompt', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A knight', 'personality', 'Brave');
        expect(result.userPrompt).toContain('personality');
    });

    it('includes the current value in the user prompt', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A knight', 'personality', 'Brave and bold');
        expect(result.userPrompt).toContain('Brave and bold');
    });

    it('includes feedback when provided', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A knight', 'personality', 'Brave', 'make darker');
        expect(result.userPrompt).toContain('make darker');
    });

    it('omits feedback section when feedback is empty', () => {
        const builder = new StubPromptBuilder();
        const result = builder.buildRefinementRequest('A knight', 'personality', 'Brave', '');
        expect(result.userPrompt).not.toContain('Feedback:');
    });
});
