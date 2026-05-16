/**
 * @file Tests for AdvancedPromptBuilder adapter.
 */

import { describe, it, expect } from 'vitest';
import { AdvancedPromptBuilder } from '../../../src/infrastructure/prompts/AdvancedPromptBuilder.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

describe('AdvancedPromptBuilder', () => {
    /**
     * Test that builder extends IPromptBuilder.
     */
    it('should extend IPromptBuilder', () => {
        const builder = new AdvancedPromptBuilder();
        expect(builder).toBeInstanceOf(IPromptBuilder);
    });

    /**
     * Test that build returns a GenerationRequest.
     */
    it('should return a GenerationRequest', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A wise wizard');

        expect(request).toBeInstanceOf(GenerationRequest);
    });

    /**
     * Test that returned request has systemPrompt and userPrompt.
     */
    it('should return request with systemPrompt and userPrompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A wise wizard');

        expect(request.systemPrompt).toBeDefined();
        expect(typeof request.systemPrompt).toBe('string');
        expect(request.userPrompt).toBeDefined();
        expect(typeof request.userPrompt).toBe('string');
    });
});

describe('AdvancedPromptBuilder - Character System Prompt', () => {
    /**
     * System prompt should include explicit field-length targets.
     */
    it('should include explicit field-length targets in system prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A detective');

        expect(request.systemPrompt).toMatch(/word|\d+\s*[-–]\s*\d+/i);
    });

    /**
     * System prompt should include chain-of-thought preamble.
     */
    it('should include chain-of-thought preamble in system prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A detective');

        expect(request.systemPrompt).toMatch(/think|step|reason|chain|plan|before|first/i);
    });

    /**
     * System prompt should include stricter formatting rules.
     */
    it('should include stricter formatting rules in system prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A detective');

        expect(request.systemPrompt).toMatch(/format|json|output|strict|rule/i);
    });

    /**
     * System prompt should include all Character Card V3 field names.
     */
    it('should document all V3 fields in system prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A character');

        expect(request.systemPrompt).toContain('name');
        expect(request.systemPrompt).toContain('description');
        expect(request.systemPrompt).toContain('personality');
        expect(request.systemPrompt).toContain('scenario');
        expect(request.systemPrompt).toContain('first_mes');
        expect(request.systemPrompt).toContain('mes_example');
        expect(request.systemPrompt).toContain('alternate_greetings');
    });

    /**
     * System prompt should include alternate_greetings.
     */
    it('should include alternate_greetings in character system prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A character');

        expect(request.systemPrompt).toContain('alternate_greetings');
    });
});

describe('AdvancedPromptBuilder - User Prompt', () => {
    /**
     * User prompt should contain the description.
     */
    it('should include description in user prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const description = 'widowed father of 3 training them as superheroes';
        const request = builder.build(description);

        expect(request.userPrompt.toLowerCase()).toContain(description.toLowerCase());
    });

    /**
     * User prompt should include alternate_greetings.
     */
    it('should include alternate_greetings in character user prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A character');

        expect(request.userPrompt).toContain('alternate_greetings');
    });
});

describe('AdvancedPromptBuilder - Lorebook', () => {
    /**
     * Lorebook path triggers when entryCount is provided.
     */
    it('should respect entryCount option', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A wise wizard', { entryCount: 5 });

        expect(request).toBeDefined();
        expect(request.userPrompt).toContain('5');
    });

    /**
     * Lorebook system prompt should mention lorebook/entries/keys.
     */
    it('should build lorebook system prompt with correct structure', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A character', { entryCount: 5 });

        expect(request.systemPrompt.toLowerCase()).toContain('lorebook');
        expect(request.systemPrompt.toLowerCase()).toContain('entries');
        expect(request.systemPrompt.toLowerCase()).toContain('keys');
    });
});

describe('AdvancedPromptBuilder - buildRefinementRequest', () => {
    /**
     * Returns a GenerationRequest instance.
     */
    it('should return a GenerationRequest', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', '');

        expect(request).toBeInstanceOf(GenerationRequest);
    });

    /**
     * fieldName appears in the user prompt.
     */
    it('should include fieldName in the user prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', '');

        expect(request.userPrompt).toContain('personality');
    });

    /**
     * currentValue appears in the user prompt.
     */
    it('should include currentValue in the user prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave and bold', '');

        expect(request.userPrompt).toContain('Brave and bold');
    });

    /**
     * feedback appears in the user prompt when provided.
     */
    it('should include feedback in the user prompt when provided', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.buildRefinementRequest('A knight', 'personality', 'Brave', 'make darker');

        expect(request.userPrompt).toContain('make darker');
    });

    /**
     * Character description appears in the user prompt.
     */
    it('should include the character description in the user prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.buildRefinementRequest('A fierce warrior', 'scenario', 'Old scenario', '');

        expect(request.userPrompt).toContain('A fierce warrior');
    });
});

describe('AdvancedPromptBuilder - Snapshots', () => {
    /**
     * Snapshot test for system prompt consistency.
     */
    it('should produce stable system prompt (snapshot)', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A character');

        expect(request.systemPrompt).toMatchSnapshot();
    });

    /**
     * Snapshot test for user prompt with basic description.
     */
    it('should produce stable user prompt for basic description (snapshot)', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A wise wizard');

        expect(request.userPrompt).toMatchSnapshot();
    });
});

describe('AdvancedPromptBuilder - buildSharedLorebookRequest', () => {
    it('should return a GenerationRequest', () => {
        const builder = new AdvancedPromptBuilder();
        const result = builder.buildSharedLorebookRequest('A team of heroes', ['Alice', 'Bob']);
        expect(result).toBeInstanceOf(GenerationRequest);
    });

    it('should include group description in the prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const result = builder.buildSharedLorebookRequest('A family of superheroes', ['Blossom']);
        expect(result.userPrompt).toContain('A family of superheroes');
    });

    it('should include character names in the prompt', () => {
        const builder = new AdvancedPromptBuilder();
        const result = builder.buildSharedLorebookRequest('A crew', ['Gandalf', 'Saruman']);
        expect(result.userPrompt).toContain('Gandalf');
        expect(result.userPrompt).toContain('Saruman');
    });

    it('should include group_only_greetings guidance when groupDescription option is set', () => {
        const builder = new AdvancedPromptBuilder();
        const request = builder.build('A brave knight', { groupDescription: 'A trio of heroes' });
        expect(request.userPrompt).toContain('group_only_greetings');
    });
});
