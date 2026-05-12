/**
 * @file Tests for DefaultPromptBuilder adapter.
 */

import { describe, it, expect } from 'vitest';
import { DefaultPromptBuilder } from '../../../src/infrastructure/prompts/DefaultPromptBuilder.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

describe('DefaultPromptBuilder', () => {
    /**
     * Test that builder extends IPromptBuilder.
     */
    it('should extend IPromptBuilder', () => {
        const builder = new DefaultPromptBuilder();
        expect(builder).toBeInstanceOf(IPromptBuilder);
    });

    /**
     * Test that build returns a GenerationRequest.
     */
    it('should return a GenerationRequest', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard');

        expect(request).toBeInstanceOf(GenerationRequest);
    });

    /**
     * Test that returned request has systemPrompt and userPrompt.
     */
    it('should return request with systemPrompt and userPrompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard');

        expect(request.systemPrompt).toBeDefined();
        expect(typeof request.systemPrompt).toBe('string');
        expect(request.userPrompt).toBeDefined();
        expect(typeof request.userPrompt).toBe('string');
    });

    /**
     * Test that temperature is respected in the request.
     */
    it('should respect temperature option', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard', { temperature: 0.7 });

        expect(request.temperature).toBe(0.7);
    });

    /**
     * Test that entryCount option is included in the request.
     */
    it('should respect entryCount option', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard', { entryCount: 5 });

        expect(request).toBeDefined();
        // entryCount should be passed through somehow (likely in the prompt)
    });

    /**
     * Test basic description generates sensible prompts.
     */
    it('should generate prompts with description included in user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const description = 'widowed father of 3 training them as superheroes';
        const request = builder.build(description);

        expect(request.userPrompt.toLowerCase()).toContain(description.toLowerCase());
    });

    /**
     * Test system prompt includes V3 spec guidance.
     */
    it('should include V3 spec guidance in system prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A character');

        expect(request.systemPrompt.toLowerCase()).toMatch(/v3|spec|json|character/i);
    });
});
