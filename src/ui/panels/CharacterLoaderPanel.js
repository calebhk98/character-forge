/**
 * @file UI component for loading an existing character card into the edit flow.
 * Renders a collapsible "Load Existing Character" section with a character
 * selector dropdown. Delegates the actual load to the LoadCharacterForEditing
 * use case, then hands the resulting CharacterDraft back to the generator panel.
 */

/**
 * Collapsible panel for browsing and loading existing character cards.
 */
export class CharacterLoaderPanel {
    /**
     * Construct the loader panel.
     *
     * @param {HTMLElement} panelElement - root element of the generator panel
     * @param {object} container - application container with wired services
     * @param {object} generatorPanel - CharacterGeneratorPanel instance exposing loadCharacterDraft()
     */
    constructor(panelElement, container, generatorPanel) {
        this.element = panelElement;
        this.container = container;
        this.generatorPanel = generatorPanel;
        this.isOpen = false;
        this.isLoading = false;
    }

    /**
     * Build and inject the loader section HTML into the panel, then attach listeners.
     */
    attach() {
        const controlsSection = this.element.querySelector('.controls-section');
        if (!controlsSection) {
            return;
        }

        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'panel-section loader-section';
        loaderDiv.innerHTML = this.buildHtml();
        controlsSection.after(loaderDiv);

        this.attachListeners(loaderDiv);
    }

    /**
     * Build the HTML for the loader section.
     *
     * @returns {string} HTML string
     */
    buildHtml() {
        return `
            <button id="load-existing-toggle" class="btn btn-secondary load-existing-toggle">
                Load Existing Character ▼
            </button>
            <div id="load-existing-content" class="load-existing-content" style="display:none">
                <div class="loader-controls">
                    <select id="character-select" class="character-select">
                        <option value="">— click Refresh to browse characters —</option>
                    </select>
                    <div class="loader-actions">
                        <button id="refresh-characters-btn" class="btn btn-secondary">↺ Refresh List</button>
                        <button id="load-character-btn" class="btn btn-primary" disabled>Load for Editing</button>
                    </div>
                </div>
                <div id="loader-status" class="loader-status"></div>
            </div>
        `;
    }

    /**
     * Attach click and change event listeners to the loader section.
     *
     * @param {HTMLElement} loaderDiv - the loader section element
     */
    attachListeners(loaderDiv) {
        loaderDiv.querySelector('#load-existing-toggle')?.addEventListener('click', () => {
            this.toggleOpen(loaderDiv);
        });

        loaderDiv.querySelector('#refresh-characters-btn')?.addEventListener('click', () => {
            this.refreshCharacterList(loaderDiv).catch(() => {});
        });

        loaderDiv.querySelector('#character-select')?.addEventListener('change', (e) => {
            const select = /** @type {HTMLSelectElement} */ (e.target);
            const loadBtn = /** @type {HTMLButtonElement} */ (
                loaderDiv.querySelector('#load-character-btn')
            );
            if (loadBtn) {
                loadBtn.disabled = !select.value;
            }
        });

        loaderDiv.querySelector('#load-character-btn')?.addEventListener('click', () => {
            this.onLoadClick(loaderDiv).catch(() => {});
        });
    }

    /**
     * Toggle the collapsible content open or closed.
     *
     * @param {HTMLElement} loaderDiv - the loader section element
     */
    toggleOpen(loaderDiv) {
        this.isOpen = !this.isOpen;
        const content = /** @type {HTMLElement} */ (loaderDiv.querySelector('#load-existing-content'));
        const toggle = loaderDiv.querySelector('#load-existing-toggle');
        if (content) {
            content.style.display = this.isOpen ? 'block' : 'none';
        }
        if (toggle) {
            toggle.textContent = this.isOpen
                ? 'Load Existing Character ▲'
                : 'Load Existing Character ▼';
        }
    }

    /**
     * Fetch the character list from the repository and populate the select element.
     *
     * @param {HTMLElement} loaderDiv - the loader section element
     * @returns {Promise<void>}
     */
    async refreshCharacterList(loaderDiv) {
        const select = /** @type {HTMLSelectElement} */ (loaderDiv.querySelector('#character-select'));
        const status = /** @type {HTMLElement} */ (loaderDiv.querySelector('#loader-status'));

        if (!select) {
            return;
        }

        this.setLoaderStatus(status, 'Loading character list…', 'info');

        try {
            const characters = await this.container.charRepository.list();
            select.innerHTML = characters.length === 0
                ? '<option value="">— no characters found —</option>'
                : '<option value="">— select a character —</option>' +
                  characters.map((c) =>
                      `<option value="${this.escapeAttr(c.avatarUrl)}">${this.escapeHtml(c.name)}</option>`,
                  ).join('');

            const loadBtn = /** @type {HTMLButtonElement} */ (loaderDiv.querySelector('#load-character-btn'));
            if (loadBtn) {
                loadBtn.disabled = true;
            }
            this.setLoaderStatus(status, `${characters.length} character(s) found`, 'success');
        } catch (error) {
            this.container?.logger?.error('Failed to list characters', { error: error.message });
            this.setLoaderStatus(status, `Failed to load list: ${error.message}`, 'error');
        }
    }

    /**
     * Handle the Load button click: fetch the selected character and hand it to the generator panel.
     *
     * @param {HTMLElement} loaderDiv - the loader section element
     * @returns {Promise<void>}
     */
    async onLoadClick(loaderDiv) {
        if (this.isLoading) {
            return;
        }

        const select = /** @type {HTMLSelectElement} */ (loaderDiv.querySelector('#character-select'));
        const avatarUrl = select?.value;
        if (!avatarUrl) {
            return;
        }

        const status = /** @type {HTMLElement} */ (loaderDiv.querySelector('#loader-status'));
        const loadBtn = /** @type {HTMLButtonElement} */ (loaderDiv.querySelector('#load-character-btn'));

        this.isLoading = true;
        if (loadBtn) {
            loadBtn.disabled = true;
        }
        this.setLoaderStatus(status, 'Loading character…', 'info');

        try {
            const draft = await this.container.loadCharacterForEditing.execute(avatarUrl);
            this.generatorPanel.loadCharacterDraft(draft);
        } catch (error) {
            this.container?.logger?.error('Failed to load character for editing', { error: error.message });
            this.container?.notifier?.error(`Failed to load character: ${error.message}`);
            this.setLoaderStatus(status, `Failed to load: ${error.message}`, 'error');
            if (loadBtn) {
                loadBtn.disabled = false;
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Update the loader status message.
     *
     * @param {HTMLElement|null} statusEl - status element
     * @param {string} message - message text
     * @param {'info'|'success'|'error'} type - visual style
     */
    setLoaderStatus(statusEl, message, type) {
        if (!statusEl) {
            return;
        }
        statusEl.className = `loader-status status-${type}`;
        statusEl.textContent = message;
    }

    /**
     * Escape HTML to prevent XSS in dynamic content.
     *
     * @param {string} text - raw text
     * @returns {string} escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Escape a value for use in an HTML attribute.
     *
     * @param {string} text - raw text
     * @returns {string} escaped attribute value
     */
    escapeAttr(text) {
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
}
