/**
 * @file Tests for BatchGeneratorPanel component.
 */

import { describe, it, expect, vi } from 'vitest';
import { BatchGeneratorPanel } from '../../../src/ui/panels/BatchGeneratorPanel.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

/**
 * Create a mock Character.
 *
 * @param {string} [name] - character name
 * @returns {Character} mock character
 */
function makeMockCharacter(name = 'Test Character') {
    return new Character({
        name,
        description: 'A test character',
        personality: 'Friendly',
        scenario: 'A test scenario',
        first_mes: 'Hello!',
        mes_example: 'How are you?',
    });
}

/**
 * Build a mock container with all needed use cases.
 *
 * @returns {object} mock container
 */
function createMockContainer() {
    return {
        decomposeGroup: {
            execute: vi.fn().mockResolvedValue([
                'Character A — the leader',
                'Character B — the sidekick',
            ]),
        },
        generateCharacter: {
            execute: vi.fn().mockResolvedValue(makeMockCharacter()),
        },
        generateLorebook: {
            execute: vi.fn().mockResolvedValue(new Lorebook()),
        },
        saveCharacter: {
            execute: vi.fn().mockResolvedValue('saved-id'),
        },
        generateSharedLorebook: {
            execute: vi.fn().mockResolvedValue(new Lorebook({ name: 'Shared Lorebook' })),
        },
        lorebookRepository: {
            save: vi.fn().mockResolvedValue('lorebook-id'),
        },
        configStore: {
            get: vi.fn().mockImplementation((key, def) => def ?? ''),
        },
        logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        notifier: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    };
}

describe('BatchGeneratorPanel - rendering', () => {
    it('should render into the target element', () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');

        panel.render(target);

        expect(target.querySelector('#batch-forge-panel')).not.toBeNull();
    });

    it('should render a group-mode tab and a list-mode tab', () => {
        const panel = new BatchGeneratorPanel(createMockContainer());
        const target = document.createElement('div');
        panel.render(target);

        expect(target.querySelector('[data-tab="group"]')).not.toBeNull();
        expect(target.querySelector('[data-tab="list"]')).not.toBeNull();
    });

    it('should show the group input area by default', () => {
        const panel = new BatchGeneratorPanel(createMockContainer());
        const target = document.createElement('div');
        panel.render(target);

        const groupSection = target.querySelector('#batch-group-section');
        const listSection = target.querySelector('#batch-list-section');

        expect(groupSection).not.toBeNull();
        expect(listSection).not.toBeNull();
        expect(groupSection.style.display).not.toBe('none');
        expect(listSection.style.display).toBe('none');
    });

    it('should render a decompose button in group mode', () => {
        const panel = new BatchGeneratorPanel(createMockContainer());
        const target = document.createElement('div');
        panel.render(target);

        expect(target.querySelector('#decompose-button')).not.toBeNull();
    });

    it('should render a generate-all button', () => {
        const panel = new BatchGeneratorPanel(createMockContainer());
        const target = document.createElement('div');
        panel.render(target);

        expect(target.querySelector('#batch-generate-button')).not.toBeNull();
    });
});

describe('BatchGeneratorPanel - tab switching', () => {
    it('should show list section and hide group section when list tab is clicked', () => {
        const panel = new BatchGeneratorPanel(createMockContainer());
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();

        const groupSection = target.querySelector('#batch-group-section');
        const listSection = target.querySelector('#batch-list-section');

        expect(listSection.style.display).not.toBe('none');
        expect(groupSection.style.display).toBe('none');
    });

    it('should switch back to group section when group tab is clicked', () => {
        const panel = new BatchGeneratorPanel(createMockContainer());
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();
        target.querySelector('[data-tab="group"]').click();

        const groupSection = target.querySelector('#batch-group-section');
        expect(groupSection.style.display).not.toBe('none');
    });
});

describe('BatchGeneratorPanel - group decomposition', () => {
    it('should call decomposeGroup use case on decompose button click', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        const textarea = target.querySelector('#group-description-input');
        textarea.value = 'A dad and his 3 superpowered daughters';

        await panel.onDecomposeClick();

        expect(container.decomposeGroup.execute).toHaveBeenCalledWith(
            'A dad and his 3 superpowered daughters',
            expect.any(Object),
        );
    });

    it('should display decomposed character list after successful decomposition', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('#group-description-input').value = 'A family';

        await panel.onDecomposeClick();

        const list = target.querySelector('#decomposed-list');
        expect(list).not.toBeNull();
        expect(list.querySelectorAll('textarea').length).toBe(2);
    });

    it('should show an error when group description is empty', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        await panel.onDecomposeClick();

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.decomposeGroup.execute).not.toHaveBeenCalled();
    });

    it('should show error notification when decomposition fails', async () => {
        const container = createMockContainer();
        container.decomposeGroup.execute.mockRejectedValue(new Error('LLM unavailable'));
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('#group-description-input').value = 'A family';

        await panel.onDecomposeClick();

        expect(container.notifier.error).toHaveBeenCalled();
    });
});

describe('BatchGeneratorPanel - batch generation', () => {
    it('should call generateCharacter for each description in the list', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();
        target.querySelector('#list-descriptions-input').value =
            'A brave knight\nA cunning rogue';

        await panel.onGenerateAllClick();

        expect(container.generateCharacter.execute).toHaveBeenCalledTimes(2);
        expect(container.saveCharacter.execute).toHaveBeenCalledTimes(2);
    });

    it('should continue generating remaining characters after one failure', async () => {
        const container = createMockContainer();
        container.generateCharacter.execute
            .mockRejectedValueOnce(new Error('Generation failed'))
            .mockResolvedValue(makeMockCharacter());
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();
        target.querySelector('#list-descriptions-input').value =
            'Character A\nCharacter B\nCharacter C';

        await panel.onGenerateAllClick();

        expect(container.generateCharacter.execute).toHaveBeenCalledTimes(3);
        expect(container.saveCharacter.execute).toHaveBeenCalledTimes(2);
    });

    it('should show error when no descriptions are provided in list mode', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();

        await panel.onGenerateAllClick();

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.generateCharacter.execute).not.toHaveBeenCalled();
    });

    it('should show error when decomposed list is empty and generate-all clicked in group mode', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        await panel.onGenerateAllClick();

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.generateCharacter.execute).not.toHaveBeenCalled();
    });

    it('should show progress status section during generation', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();
        target.querySelector('#list-descriptions-input').value = 'A knight';

        await panel.onGenerateAllClick();

        const progress = target.querySelector('#batch-progress-section');
        expect(progress).not.toBeNull();
        expect(progress.style.display).not.toBe('none');
    });
});

describe('BatchGeneratorPanel - group context passed to character generation', () => {
    it('should pass groupDescription to generateCharacter when in group mode', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('#group-description-input').value = 'A family of four heroes';
        await panel.onDecomposeClick();
        await panel.onGenerateAllClick();

        expect(container.generateCharacter.execute).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ groupDescription: 'A family of four heroes' }),
        );
    });

    it('should NOT pass groupDescription when in list mode', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();
        target.querySelector('#list-descriptions-input').value = 'A lone knight';
        await panel.onGenerateAllClick();

        const calls = container.generateCharacter.execute.mock.calls;
        expect(calls[0][1]).not.toHaveProperty('groupDescription');
    });
});

describe('BatchGeneratorPanel - shared lorebook generation', () => {
    it('should call generateSharedLorebook after group mode generation succeeds', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('#group-description-input').value = 'A family of heroes';
        await panel.onDecomposeClick();
        await panel.onGenerateAllClick();

        expect(container.generateSharedLorebook.execute).toHaveBeenCalledWith(
            'A family of heroes',
            expect.arrayContaining([expect.any(String)]),
        );
    });

    it('should save the shared lorebook via lorebookRepository', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('#group-description-input').value = 'A family of heroes';
        await panel.onDecomposeClick();
        await panel.onGenerateAllClick();

        expect(container.lorebookRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should NOT call generateSharedLorebook in list mode', async () => {
        const container = createMockContainer();
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('[data-tab="list"]').click();
        target.querySelector('#list-descriptions-input').value = 'A knight';
        await panel.onGenerateAllClick();

        expect(container.generateSharedLorebook.execute).not.toHaveBeenCalled();
    });

    it('should continue and show summary even if shared lorebook generation fails', async () => {
        const container = createMockContainer();
        container.generateSharedLorebook.execute.mockRejectedValue(new Error('LLM error'));
        const panel = new BatchGeneratorPanel(container);
        const target = document.createElement('div');
        panel.render(target);

        target.querySelector('#group-description-input').value = 'A family of heroes';
        await panel.onDecomposeClick();
        await panel.onGenerateAllClick();

        const summary = target.querySelector('#batch-summary');
        expect(summary).not.toBeNull();
        expect(summary.textContent).toContain('saved');
    });
});
