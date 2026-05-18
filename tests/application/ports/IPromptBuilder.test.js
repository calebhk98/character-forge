/**
 * @file Tests for IPromptBuilder port contract.
 */

import { describe, it, expect } from 'vitest';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';

describe('IPromptBuilder (port)', () => {
    it('should throw on base class build()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.build('test description')).toThrow('IPromptBuilder.build must be implemented by subclass');
    });

    it('should throw on base class build() with options', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.build('test description', { entryCount: 5 })).toThrow('IPromptBuilder.build must be implemented by subclass');
    });

    it('should throw on base class buildRefinementRequest()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.buildRefinementRequest('desc', 'personality', 'old value', ''))
            .toThrow('IPromptBuilder.buildRefinementRequest must be implemented by subclass');
    });

    it('should throw on base class buildMetadataRequest()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.buildMetadataRequest('A wizard'))
            .toThrow('IPromptBuilder.buildMetadataRequest must be implemented by subclass');
    });

    it('should throw on base class buildBehaviorRequest()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.buildBehaviorRequest('A wizard', { name: 'Aldric' }))
            .toThrow('IPromptBuilder.buildBehaviorRequest must be implemented by subclass');
    });

    it('should throw on base class buildSceneRequest()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.buildSceneRequest('A wizard', { name: 'Aldric', description: 'desc', personality: 'calm' }))
            .toThrow('IPromptBuilder.buildSceneRequest must be implemented by subclass');
    });

    it('should throw on base class buildDialogueRequest()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.buildDialogueRequest('A wizard', { name: 'Aldric', personality: 'calm', first_mes: 'Hi' }))
            .toThrow('IPromptBuilder.buildDialogueRequest must be implemented by subclass');
    });

    it('should throw on base class buildGreetingsRequest()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.buildGreetingsRequest('A wizard', { name: 'Aldric', first_mes: 'Hi', scenario: 'A forest' }))
            .toThrow('IPromptBuilder.buildGreetingsRequest must be implemented by subclass');
    });
});
