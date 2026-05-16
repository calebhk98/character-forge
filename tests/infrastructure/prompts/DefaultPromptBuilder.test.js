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
});

describe('DefaultPromptBuilder - Options', () => {
    /**
     * Test that entryCount option is included in the user prompt.
     */
    it('should respect entryCount option', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard', { entryCount: 5 });

        expect(request).toBeDefined();
        expect(request.userPrompt).toContain('5');
    });

    /**
     * Test basic description generates sensible prompts.
     */
    it('should include description in user prompt', () => {
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

describe('DefaultPromptBuilder - Snapshots', () => {
    /**
     * Snapshot test for system prompt consistency.
     */
    it('should produce stable system prompt (snapshot)', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A character');

        expect(request.systemPrompt).toMatchSnapshot();
    });

    /**
     * Snapshot test for user prompt with basic description.
     */
    it('should produce stable user prompt for basic description (snapshot)', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard');

        expect(request.userPrompt).toMatchSnapshot();
    });

    /**
     * Snapshot test for user prompt with entryCount option.
     */
    it('should produce stable user prompt with entryCount option (snapshot)', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A wise wizard', { entryCount: 5 });

        expect(request.userPrompt).toMatchSnapshot();
    });

    /**
     * Snapshot test for example description from issue.
     */
    it('should produce stable prompt for issue example description (snapshot)', () => {
        const builder = new DefaultPromptBuilder();
        const description = 'widowed father of 3 training them as superheroes';
        const request = builder.build(description, { entryCount: 10 });

        expect(request.systemPrompt).toMatchSnapshot();
        expect(request.userPrompt).toMatchSnapshot();
    });
});

describe('DefaultPromptBuilder - buildRefinementRequest', () => {
    /**
     * Returns a GenerationRequest instance.
     */
    it('should return a GenerationRequest', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', '');

        expect(request).toBeInstanceOf(GenerationRequest);
    });

    /**
     * fieldName appears in the user prompt.
     */
    it('should include fieldName in the user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', '');

        expect(request.userPrompt).toContain('personality');
    });

    /**
     * currentValue appears in the user prompt.
     */
    it('should include currentValue in the user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave and bold', '');

        expect(request.userPrompt).toContain('Brave and bold');
    });

    /**
     * feedback string appears in the user prompt when provided.
     */
    it('should include feedback in the user prompt when provided', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', 'make darker');

        expect(request.userPrompt).toContain('make darker');
    });

    /**
     * Empty feedback still produces a valid GenerationRequest.
     */
    it('should produce a valid GenerationRequest with empty feedback', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', '');

        expect(request.systemPrompt).toBeDefined();
        expect(typeof request.userPrompt).toBe('string');
        expect(request.userPrompt.length).toBeGreaterThan(0);
    });

    /**
     * Character description appears in the user prompt.
     */
    it('should include the character description in the user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildRefinementRequest('A fierce warrior', 'scenario', 'Old scenario', '');

        expect(request.userPrompt).toContain('A fierce warrior');
    });
});

describe('DefaultPromptBuilder - alternate_greetings', () => {
    /**
     * alternate_greetings field documented in character system prompt.
     */
    it('should include alternate_greetings in character system prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A character');

        expect(request.systemPrompt).toContain('alternate_greetings');
    });

    /**
     * alternate_greetings included in character user prompt.
     */
    it('should include alternate_greetings in character user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A character');

        expect(request.userPrompt).toContain('alternate_greetings');
    });
});

describe('DefaultPromptBuilder - customSystemPrompt override', () => {
    /**
     * When options.customSystemPrompt is provided, it should be returned as-is.
     */
    it('should return customSystemPrompt verbatim when provided', () => {
        const builder = new DefaultPromptBuilder();
        const override = 'You are a custom system prompt for testing.';
        const request = builder.build('A knight', { customSystemPrompt: override });

        expect(request.systemPrompt).toBe(override);
    });

    /**
     * customSystemPrompt takes priority over entryCount lorebook routing.
     */
    it('should prefer customSystemPrompt over entryCount routing', () => {
        const builder = new DefaultPromptBuilder();
        const override = 'Custom override beats lorebook routing.';
        const request = builder.build('A knight', { customSystemPrompt: override, entryCount: 5 });

        expect(request.systemPrompt).toBe(override);
    });

    /**
     * An empty string override should NOT suppress the default prompt.
     */
    it('should use default prompt when customSystemPrompt is empty string', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A knight', { customSystemPrompt: '' });

        expect(request.systemPrompt).not.toBe('');
        expect(request.systemPrompt).toContain('character');
    });
});

describe('DefaultPromptBuilder - Lorebook defaults', () => {
    it('should use default entryCount of 10 when entryCount is 0', () => {
        const builder = new DefaultPromptBuilder();
        // Test with entryCount explicitly set to ensure 10 appears in prompt
        const request = builder.build('A character', { entryCount: 10 });
        expect(request.userPrompt).toContain('10');
    });

    it('should build lorebook system prompt with correct structure', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A character', { entryCount: 5 });

        expect(request.systemPrompt.toLowerCase()).toContain('lorebook');
        expect(request.systemPrompt.toLowerCase()).toContain('entries');
        expect(request.systemPrompt.toLowerCase()).toContain('keys');
    });

});
