/**
 * @file Tests for dependency injection container.
 */

import { describe, it, expect } from 'vitest';
import { buildContainer } from '../../src/composition/Container.js';
import { ILlmProvider } from '../../src/application/ports/ILlmProvider.js';
import { ICardFormatter } from '../../src/application/ports/ICardFormatter.js';
import { IPromptBuilder } from '../../src/application/ports/IPromptBuilder.js';
import { ICharacterRepository } from '../../src/application/ports/ICharacterRepository.js';
import { ILorebookRepository } from '../../src/application/ports/ILorebookRepository.js';
import { IConfigStore } from '../../src/application/ports/IConfigStore.js';
import { ILogger } from '../../src/application/ports/ILogger.js';
import { INotifier } from '../../src/application/ports/INotifier.js';
import { GenerateCharacterFromDescription } from '../../src/application/use-cases/GenerateCharacterFromDescription.js';
import { GenerateLorebookForCharacter } from '../../src/application/use-cases/GenerateLorebookForCharacter.js';
import { SaveCharacterToTavern } from '../../src/application/use-cases/SaveCharacterToTavern.js';
import { DefaultPromptBuilder } from '../../src/infrastructure/prompts/DefaultPromptBuilder.js';
import { AdvancedPromptBuilder } from '../../src/infrastructure/prompts/AdvancedPromptBuilder.js';

describe('Container - structure', () => {
    it('should build container with all required services', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container).toBeDefined();
        expect(container.llm).toBeDefined();
        expect(container.formatter).toBeDefined();
        expect(container.promptBuilder).toBeDefined();
        expect(container.charRepository).toBeDefined();
        expect(container.lorebookRepository).toBeDefined();
        expect(container.configStore).toBeDefined();
        expect(container.logger).toBeDefined();
        expect(container.notifier).toBeDefined();
        expect(container.generateCharacter).toBeDefined();
        expect(container.generateLorebook).toBeDefined();
        expect(container.saveCharacter).toBeDefined();
    });
});

describe('Container - LLM provider wiring', () => {
    it('should wire LLM provider using config', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: ['test response'],
        };

        const container = buildContainer(config, mockContext);

        expect(container.llm).toBeInstanceOf(ILlmProvider);
    });

    it('should use silly-tavern LLM as default', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'silly-tavern',
            cardFormat: 'v3',
        };

        const container = buildContainer(config, mockContext);

        expect(container.llm).toBeInstanceOf(ILlmProvider);
    });
});

describe('Container - formatter and prompt builder wiring', () => {
    it('should wire card formatter from config', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.formatter).toBeInstanceOf(ICardFormatter);
    });

    it('should use v3 formatter as default', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.formatter).toBeInstanceOf(ICardFormatter);
    });

    it('should wire prompt builder', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.promptBuilder).toBeInstanceOf(IPromptBuilder);
    });

    it('should wire DefaultPromptBuilder when promptTemplate is "default"', () => {
        const mockContext = { extensionSettings: {} };
        const config = { llmProvider: 'mock', cardFormat: 'v3', mockResponses: [], promptTemplate: 'default' };

        const container = buildContainer(config, mockContext);

        expect(container.promptBuilder).toBeInstanceOf(DefaultPromptBuilder);
    });

    it('should wire AdvancedPromptBuilder when promptTemplate is "advanced"', () => {
        const mockContext = { extensionSettings: {} };
        const config = { llmProvider: 'mock', cardFormat: 'v3', mockResponses: [], promptTemplate: 'advanced' };

        const container = buildContainer(config, mockContext);

        expect(container.promptBuilder).toBeInstanceOf(AdvancedPromptBuilder);
    });

    it('should default to DefaultPromptBuilder when promptTemplate is not set', () => {
        const mockContext = { extensionSettings: {} };
        const config = { llmProvider: 'mock', cardFormat: 'v3', mockResponses: [] };

        const container = buildContainer(config, mockContext);

        expect(container.promptBuilder).toBeInstanceOf(DefaultPromptBuilder);
    });
});

describe('Container - repository and port wiring', () => {
    it('should wire character repository with context', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.charRepository).toBeInstanceOf(ICharacterRepository);
    });

    it('should wire lorebook repository with context', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.lorebookRepository).toBeInstanceOf(ILorebookRepository);
    });

    it('should wire config store with namespace', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.configStore).toBeInstanceOf(IConfigStore);
    });

    it('should wire logger', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.logger).toBeInstanceOf(ILogger);
    });

    it('should wire notifier with context', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.notifier).toBeInstanceOf(INotifier);
    });
});

describe('Container - use case wiring', () => {
    it('should wire generate character use case with dependencies', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.generateCharacter).toBeInstanceOf(GenerateCharacterFromDescription);
    });

    it('should wire generate lorebook use case with dependencies', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.generateLorebook).toBeInstanceOf(GenerateLorebookForCharacter);
    });

    it('should wire save character use case with dependencies', () => {
        const mockContext = {
            extensionSettings: {},
        };
        const config = {
            llmProvider: 'mock',
            cardFormat: 'v3',
            mockResponses: [],
        };

        const container = buildContainer(config, mockContext);

        expect(container.saveCharacter).toBeInstanceOf(SaveCharacterToTavern);
    });
});
