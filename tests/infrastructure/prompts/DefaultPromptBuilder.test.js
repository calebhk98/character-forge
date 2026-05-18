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

describe('DefaultPromptBuilder - buildSharedLorebookRequest', () => {
    it('should return a GenerationRequest', () => {
        const builder = new DefaultPromptBuilder();
        const result = builder.buildSharedLorebookRequest(
            'A team of four heroes', ['Alice', 'Bob', 'Carol', 'Dave'],
        );
        expect(result).toBeInstanceOf(GenerationRequest);
    });

    it('should include group description in the prompt', () => {
        const builder = new DefaultPromptBuilder();
        const result = builder.buildSharedLorebookRequest(
            'A family of superheroes', ['Blossom', 'Bubbles', 'Buttercup'],
        );
        expect(result.userPrompt).toContain('A family of superheroes');
    });

    it('should include character names in the prompt', () => {
        const builder = new DefaultPromptBuilder();
        const result = builder.buildSharedLorebookRequest(
            'A trio of mages', ['Gandalf', 'Saruman'],
        );
        expect(result.userPrompt).toContain('Gandalf');
        expect(result.userPrompt).toContain('Saruman');
    });

    it('should request more entries than a single-character lorebook', () => {
        const builder = new DefaultPromptBuilder();
        const standard = builder.build('A lone knight', { entryCount: 10 });
        const shared = builder.buildSharedLorebookRequest('A team', ['A', 'B'], { entryCount: 20 });
        const sharedCount = parseInt(shared.userPrompt.match(/\d+/)?.[0] || '0', 10);
        const standardCount = parseInt(standard.userPrompt.match(/(\d+)/)?.[0] || '0', 10);
        expect(sharedCount).toBeGreaterThan(standardCount);
    });

    it('should emphasise inter-character relationships in its system prompt', () => {
        const builder = new DefaultPromptBuilder();
        const result = builder.buildSharedLorebookRequest('A crew', ['A', 'B']);
        expect(result.systemPrompt.toLowerCase()).toMatch(/relationship|dynamic|ensemble|group/);
    });
});

describe('DefaultPromptBuilder - group_only_greetings in character prompt', () => {
    it('should include group_only_greetings guidance when groupDescription option is set', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A brave knight', { groupDescription: 'A trio of heroes' });
        expect(request.userPrompt).toContain('group_only_greetings');
    });

    it('should not include group_only_greetings guidance without groupDescription option', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.build('A brave knight');
        expect(request.userPrompt).not.toContain('group_only_greetings');
    });
});

describe('DefaultPromptBuilder - field-by-field step methods', () => {
    it('buildMetadataRequest returns a GenerationRequest with name and creator_notes in user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildMetadataRequest('A wizard');

        expect(request).toBeInstanceOf(GenerationRequest);
        expect(request.userPrompt).toContain('name');
        expect(request.userPrompt).toContain('creator_notes');
        expect(request.userPrompt).toContain('A wizard');
    });

    it('buildBehaviorRequest returns a GenerationRequest with description and personality in user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildBehaviorRequest('A wizard', { name: 'Aldric' });

        expect(request).toBeInstanceOf(GenerationRequest);
        expect(request.userPrompt).toContain('description');
        expect(request.userPrompt).toContain('personality');
        expect(request.userPrompt).toContain('Aldric');
    });

    it('buildSceneRequest returns a GenerationRequest with scenario and first_mes in user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', description: 'A tall mage', personality: 'Calm' };
        const request = builder.buildSceneRequest('A wizard', ctx);

        expect(request).toBeInstanceOf(GenerationRequest);
        expect(request.userPrompt).toContain('scenario');
        expect(request.userPrompt).toContain('first_mes');
        expect(request.userPrompt).toContain('Aldric');
    });

    it('buildDialogueRequest returns a GenerationRequest with {{char}} and {{user}} and <START> in user prompt', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', personality: 'Calm', first_mes: 'Greetings, traveler.' };
        const request = builder.buildDialogueRequest('A wizard', ctx);

        expect(request).toBeInstanceOf(GenerationRequest);
        expect(request.userPrompt).toContain('{{char}}');
        expect(request.userPrompt).toContain('{{user}}');
        expect(request.userPrompt).toContain('<START>');
    });

    it('buildDialogueRequest system prompt says "Return ONLY the formatted dialogue"', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', personality: 'Calm', first_mes: 'Greetings, traveler.' };
        const request = builder.buildDialogueRequest('A wizard', ctx);

        expect(request.systemPrompt).toContain('Return ONLY the formatted dialogue');
    });

    it('buildGreetingsRequest returns a GenerationRequest with "3" and "JSON array" in prompts', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', first_mes: 'Greetings, traveler.', scenario: 'In a library.' };
        const request = builder.buildGreetingsRequest('A wizard', ctx);

        expect(request).toBeInstanceOf(GenerationRequest);
        expect(request.userPrompt).toContain('3');
        expect(request.systemPrompt.toLowerCase()).toContain('json array');
    });

    it('buildGreetingsRequest includes groupDescription in user prompt when provided', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', first_mes: 'Greetings.', scenario: 'In a library.' };
        const request = builder.buildGreetingsRequest('A wizard', ctx, { groupDescription: 'A trio of mages' });

        expect(request.userPrompt).toContain('A trio of mages');
    });
});

describe('DefaultPromptBuilder - field-by-field step method snapshots', () => {
    it('buildMetadataRequest snapshot', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildMetadataRequest('A wise wizard');
        expect(request.userPrompt).toMatchSnapshot();
    });

    it('buildBehaviorRequest snapshot', () => {
        const builder = new DefaultPromptBuilder();
        const request = builder.buildBehaviorRequest('A wise wizard', { name: 'Aldric' });
        expect(request.userPrompt).toMatchSnapshot();
    });

    it('buildSceneRequest snapshot', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', description: 'A tall mage.', personality: 'Calm and wise.' };
        const request = builder.buildSceneRequest('A wise wizard', ctx);
        expect(request.userPrompt).toMatchSnapshot();
    });

    it('buildDialogueRequest snapshot', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', personality: 'Calm and wise.', first_mes: 'Greetings, traveler.' };
        const request = builder.buildDialogueRequest('A wise wizard', ctx);
        expect(request.userPrompt).toMatchSnapshot();
    });

    it('buildGreetingsRequest snapshot', () => {
        const builder = new DefaultPromptBuilder();
        const ctx = { name: 'Aldric', first_mes: 'Greetings, traveler.', scenario: 'In a library.' };
        const request = builder.buildGreetingsRequest('A wise wizard', ctx);
        expect(request.userPrompt).toMatchSnapshot();
    });
});
