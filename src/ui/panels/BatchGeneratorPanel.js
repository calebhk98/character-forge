/**
 * @file Batch character generator UI panel. Provides two generation modes:
 * Group mode decomposes an ensemble description into individual characters via
 * LLM, then generates each sequentially. List mode accepts one description per
 * line and generates them in order. Both modes auto-save each character on
 * success and continue past individual failures.
 */

import { CharacterDraft } from '../../domain/value-objects/CharacterDraft.js';

/**
 * Batch generator panel component. Manages two tabs (Group / List) and
 * orchestrates sequential character generation with per-item progress tracking.
 */
export class BatchGeneratorPanel {
    /**
     * Construct the panel with its dependencies.
     *
     * @param {object} container - application container with wired services
     */
    constructor(container) {
        this.container = container;
        this.element = null;
        this.activeMode = 'group';
        this.decomposedDescriptions = [];
        this.groupDescription = '';
        this.isRunning = false;
    }

    /**
     * Render the panel into a target DOM element.
     *
     * @param {HTMLElement} targetElement - element to render into
     */
    render(targetElement) {
        const panel = document.createElement('div');
        panel.id = 'batch-forge-panel';
        panel.className = 'batch-forge-panel';
        panel.innerHTML = this.buildPanelHtml();
        targetElement.appendChild(panel);
        this.element = panel;
        this.attachEventListeners();
    }

    /**
     * Build the full panel HTML string.
     *
     * @private
     * @returns {string} panel HTML
     */
    buildPanelHtml() {
        return `
            <div class="panel-header">
                <h2>Batch Character Forge</h2>
                <p class="subtitle">Generate multiple characters at once</p>
            </div>
            <div class="batch-tabs">
                <button class="batch-tab batch-tab-active" data-tab="group">Group / Ensemble</button>
                <button class="batch-tab" data-tab="list">List Mode</button>
            </div>
            <div id="batch-group-section" class="batch-section">
                <label for="group-description-input">Describe the group or ensemble</label>
                <textarea
                    id="group-description-input"
                    class="batch-textarea"
                    placeholder="Example: A widowed scientist and his three superpowered daughters who protect their city."
                    rows="4"></textarea>
                <div class="batch-controls">
                    <button id="decompose-button" class="btn btn-secondary">Decompose into Characters</button>
                </div>
                <div id="decomposed-list" style="display: none;">
                    <p class="hint">Review and edit each character below before generating:</p>
                    <div id="decomposed-items"></div>
                </div>
            </div>
            <div id="batch-list-section" class="batch-section" style="display: none;">
                <label for="list-descriptions-input">One character description per line</label>
                <textarea
                    id="list-descriptions-input"
                    class="batch-textarea"
                    placeholder="A brave knight who protects the realm&#10;A cunning rogue with a heart of gold&#10;A wise mage haunted by past mistakes"
                    rows="8"></textarea>
            </div>
            <div class="batch-controls batch-generate-controls">
                <button id="batch-generate-button" class="btn btn-primary">Generate All</button>
            </div>
            <div id="batch-progress-section" style="display: none;">
                <h3>Progress</h3>
                <div id="batch-progress-items"></div>
                <div id="batch-summary"></div>
            </div>
            <div id="batch-status-section"></div>
        `;
    }

    /**
     * Attach event listeners to rendered elements.
     *
     * @private
     */
    attachEventListeners() {
        this.element.querySelectorAll('.batch-tab').forEach((tab) => {
            tab.addEventListener('click', (e) => {
                this.switchTab(/** @type {HTMLElement} */ (e.currentTarget).dataset.tab);
            });
        });

        const decomposeBtn = this.element.querySelector('#decompose-button');
        if (decomposeBtn) {
            decomposeBtn.addEventListener('click', () => this.onDecomposeClick());
        }

        const generateBtn = this.element.querySelector('#batch-generate-button');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.onGenerateAllClick());
        }
    }

    /**
     * Switch the active tab and show/hide corresponding sections.
     *
     * @param {string} tab - tab name ('group' or 'list')
     */
    switchTab(tab) {
        this.activeMode = tab;
        this.element.querySelectorAll('.batch-tab').forEach((btn) => {
            const tabBtn = /** @type {HTMLElement} */ (btn);
            tabBtn.classList.toggle('batch-tab-active', tabBtn.dataset.tab === tab);
        });
        const groupSection = /** @type {HTMLElement} */ (this.element.querySelector('#batch-group-section'));
        const listSection = /** @type {HTMLElement} */ (this.element.querySelector('#batch-list-section'));
        if (groupSection) groupSection.style.display = tab === 'group' ? '' : 'none';
        if (listSection) listSection.style.display = tab === 'list' ? '' : 'none';
    }

    /**
     * Handle the decompose button click. Calls the LLM to break the group
     * description into individual character descriptions and renders the list.
     *
     * @returns {Promise<void>}
     */
    async onDecomposeClick() {
        const textarea = /** @type {HTMLTextAreaElement} */ (
            this.element.querySelector('#group-description-input')
        );
        const description = textarea?.value.trim();

        if (!description) {
            this.container.notifier.error('Please enter a group or ensemble description.');
            return;
        }

        const decomposeBtn = /** @type {HTMLButtonElement} */ (
            this.element.querySelector('#decompose-button')
        );
        if (decomposeBtn) decomposeBtn.disabled = true;

        try {
            const descriptions = await this.container.decomposeGroup.execute(description, {});
            this.groupDescription = description;
            this.decomposedDescriptions = descriptions;
            this.renderDecomposedList(descriptions);
        } catch (error) {
            this.container.logger.error('Group decomposition failed', { error: error.message });
            this.container.notifier.error(`Could not decompose group: ${error.message}`);
        } finally {
            if (decomposeBtn) decomposeBtn.disabled = false;
        }
    }

    /**
     * Render the decomposed character list as editable textareas.
     *
     * @private
     * @param {string[]} descriptions - list of character descriptions
     */
    renderDecomposedList(descriptions) {
        const listContainer = /** @type {HTMLElement} */ (
            this.element.querySelector('#decomposed-list')
        );
        const itemsContainer = /** @type {HTMLElement} */ (
            this.element.querySelector('#decomposed-items')
        );

        if (!listContainer || !itemsContainer) return;

        itemsContainer.innerHTML = '';
        descriptions.forEach((desc, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'decomposed-item';
            const label = document.createElement('label');
            label.textContent = `Character ${idx + 1}`;
            const ta = document.createElement('textarea');
            ta.className = 'decomposed-item-input';
            ta.dataset.index = String(idx);
            ta.rows = 3;
            ta.value = desc;
            ta.addEventListener('change', (e) => {
                const idx2 = parseInt(/** @type {HTMLTextAreaElement} */ (e.target).dataset.index, 10);
                this.decomposedDescriptions[idx2] = /** @type {HTMLTextAreaElement} */ (e.target).value;
            });
            wrapper.appendChild(label);
            wrapper.appendChild(ta);
            itemsContainer.appendChild(wrapper);
        });

        listContainer.style.display = '';
    }

    /**
     * Collect descriptions from the active mode and run batch generation.
     *
     * @returns {Promise<void>}
     */
    async onGenerateAllClick() {
        if (this.isRunning) return;

        const descriptions = this.collectDescriptions();
        if (descriptions.length === 0) {
            this.container.notifier.error('No character descriptions to generate.');
            return;
        }

        this.isRunning = true;
        this.showProgressSection(descriptions.length);

        const generateBtn = /** @type {HTMLButtonElement} */ (
            this.element.querySelector('#batch-generate-button')
        );
        if (generateBtn) generateBtn.disabled = true;

        const { successCount, savedNames } = await this.runBatch(descriptions);

        if (this.activeMode === 'group' && savedNames.length > 0) {
            await this.generateAndSaveSharedLorebook(savedNames);
        }

        this.showSummary(successCount, descriptions.length);
        this.isRunning = false;
        if (generateBtn) generateBtn.disabled = false;
    }

    /**
     * Run the generation loop over all descriptions. Returns counts for summary.
     *
     * @private
     * @param {string[]} descriptions - character descriptions to generate
     * @returns {Promise<{successCount: number, savedNames: string[]}>} generation results
     */
    async runBatch(descriptions) {
        const groupContext = this.activeMode === 'group' && this.groupDescription
            ? { groupDescription: this.groupDescription }
            : {};

        let successCount = 0;
        const savedNames = [];
        for (let i = 0; i < descriptions.length; i++) {
            this.updateProgressItem(i, 'pending', descriptions[i]);
            const result = await this.generateOne(descriptions[i], groupContext);
            if (result.success) {
                successCount++;
                if (result.characterName) savedNames.push(result.characterName);
                this.updateProgressItem(i, 'success', descriptions[i]);
            } else {
                this.updateProgressItem(i, 'error', descriptions[i], result.error);
            }
        }
        return { successCount, savedNames };
    }

    /**
     * Collect descriptions from the currently active mode.
     *
     * @private
     * @returns {string[]} non-empty description strings
     */
    collectDescriptions() {
        if (this.activeMode === 'group') {
            const items = this.element.querySelectorAll('.decomposed-item-input');
            if (items.length > 0) {
                return Array.from(items)
                    .map((el) => /** @type {HTMLTextAreaElement} */ (el).value.trim())
                    .filter((s) => s.length > 0);
            }
            return this.decomposedDescriptions.filter((s) => s.trim().length > 0);
        }

        const listTA = /** @type {HTMLTextAreaElement} */ (
            this.element.querySelector('#list-descriptions-input')
        );
        if (!listTA) return [];
        return listTA.value
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }

    /**
     * Generate and save one character. Returns a result object so callers can
     * continue past failures without throwing.
     *
     * @private
     * @param {string} description - character description
     * @param {object} [groupContext] - optional group context for prompt builder
     * @param {string} [groupContext.groupDescription] - parent ensemble description
     * @returns {Promise<{success: boolean, characterName?: string, error?: string}>} result
     */
    async generateOne(description, groupContext = {}) {
        try {
            const rawCount = this.container.configStore?.get('lorebookEntryCount', 'auto');
            const entryCount = rawCount === 'auto' ? undefined : parseInt(rawCount, 10);

            const character = await this.container.generateCharacter.execute(description, groupContext);
            if (groupContext.groupDescription) {
                character.creator_notes = this.buildGroupCreatorNotes(groupContext.groupDescription);
            }
            const lorebook = await this.container.generateLorebook.execute(description, { entryCount });
            const draft = new CharacterDraft({ character, lorebook });

            await this.container.saveCharacter.execute(draft.character, draft.lorebook);
            return { success: true, characterName: character.name };
        } catch (error) {
            this.container.logger.error('Batch item failed', { description, error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * Build the creator_notes string that instructs users how to activate the
     * shared lorebook for this ensemble in SillyTavern.
     *
     * @private
     * @param {string} groupDescription - the ensemble concept
     * @returns {string} creator notes text
     */
    buildGroupCreatorNotes(groupDescription) {
        return `Part of the "${groupDescription}" ensemble generated by Character Forge.\n\n` +
            'GROUP CHAT SETUP:\n' +
            '1. Load all characters from this set into a SillyTavern group chat.\n' +
            '2. Load the shared lorebook (saved alongside these cards as "' +
            `${groupDescription} — Shared Lorebook") as a Global lorebook ` +
            'or attach it to the group chat via the chat\'s lorebook selector.\n' +
            '   The shared lorebook contains relationship dynamics and group context ' +
            'that all characters need — without it, characters will not be aware of each other.\n\n' +
            'Each character\'s individual embedded lorebook covers their own behavioral rules ' +
            'and persona. The shared lorebook covers inter-character relationships and group history.';
    }

    /**
     * Generate and save the shared lorebook for the ensemble. Logs errors but
     * does not throw — a shared lorebook failure should not block the summary.
     *
     * @private
     * @param {string[]} characterNames - names of all successfully saved characters
     * @returns {Promise<void>}
     */
    async generateAndSaveSharedLorebook(characterNames) {
        if (!this.container.generateSharedLorebook || !this.container.lorebookRepository) {
            return;
        }
        try {
            this.container.logger.info('Generating shared lorebook', { characterNames });
            const lorebook = await this.container.generateSharedLorebook.execute(
                this.groupDescription, characterNames,
            );
            await this.container.lorebookRepository.save(lorebook);
            this.container.notifier.success('Shared lorebook saved.');
        } catch (error) {
            this.container.logger.error('Shared lorebook generation failed', { error: error.message });
            this.container.notifier.warning('Shared lorebook failed — individual cards were saved.');
        }
    }

    /**
     * Show the progress section with placeholder rows.
     *
     * @private
     * @param {number} count - number of characters to generate
     */
    showProgressSection(count) {
        const section = /** @type {HTMLElement} */ (
            this.element.querySelector('#batch-progress-section')
        );
        const itemsContainer = /** @type {HTMLElement} */ (
            this.element.querySelector('#batch-progress-items')
        );
        if (!section || !itemsContainer) return;

        itemsContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.id = `batch-item-${i}`;
            row.className = 'batch-progress-item batch-pending';
            row.textContent = `Character ${i + 1}: queued`;
            itemsContainer.appendChild(row);
        }

        section.style.display = '';
    }

    /**
     * Update the progress indicator for a single item.
     *
     * @private
     * @param {number} index - item index
     * @param {'pending'|'success'|'error'} status - generation status
     * @param {string} description - character description (for display)
     * @param {string} [errorMessage] - error message on failure
     */
    updateProgressItem(index, status, description, errorMessage) {
        const row = /** @type {HTMLElement} */ (
            this.element.querySelector(`#batch-item-${index}`)
        );
        if (!row) return;
        const label = description.length > 60 ? `${description.slice(0, 57)}...` : description;
        row.className = `batch-progress-item batch-${status}`;
        if (status === 'pending') {
            row.textContent = `Character ${index + 1}: generating — ${label}`;
        } else if (status === 'success') {
            row.textContent = `Character ${index + 1}: saved — ${label}`;
        } else {
            row.textContent = `Character ${index + 1}: failed — ${errorMessage ?? 'unknown error'}`;
        }
    }

    /**
     * Show the final summary after batch completion.
     *
     * @private
     * @param {number} successCount - number of successfully saved characters
     * @param {number} total - total characters attempted
     */
    showSummary(successCount, total) {
        const summary = /** @type {HTMLElement} */ (
            this.element.querySelector('#batch-summary')
        );
        if (!summary) return;
        const failed = total - successCount;
        summary.className = successCount === total ? 'batch-summary-success' : 'batch-summary-partial';
        summary.textContent = failed === 0
            ? `All ${total} character${total > 1 ? 's' : ''} saved successfully.`
            : `${successCount} of ${total} saved. ${failed} failed — see above for details.`;
    }
}
