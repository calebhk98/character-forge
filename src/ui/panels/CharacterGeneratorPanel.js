/**
 * @file Character generator UI panel. Renders input field, generation
 * button, and result preview. Delegates business logic to use cases
 * through dependency injection.
 */

/**
 * Character generator panel component.
 */
export class CharacterGeneratorPanel {
    /**
     * Construct the panel with its dependencies.
     *
     * @param {object} _container application container with wired services
     */
    constructor(_container) {
        this.container = _container;
        this.element = null;
    }

    /**
     * Render the panel into a DOM element.
     *
     * @param {HTMLElement} targetElement - element to render into
     */
    render(targetElement) {
        const panel = document.createElement('div');
        panel.id = 'character-forge-panel';
        panel.className = 'character-forge-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Character Forge</h2>
                <p class="subtitle">AI-assisted character generator</p>
            </div>
            <div class="panel-section input-section">
                <label for="character-description">Character Concept</label>
                <textarea
                    id="character-description"
                    class="character-description-input"
                    placeholder="Describe your character in plain language."
                    rows="4"></textarea>
            </div>
            <div class="panel-section controls-section">
                <button id="generate-button" class="btn btn-primary">Generate</button>
            </div>
        `;
        targetElement.appendChild(panel);
        this.element = panel;
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to rendered elements.
     */
    attachEventListeners() {
        const generateBtn = this.element?.querySelector('#generate-button');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.onGenerateClick());
        }
    }

    /**
     * Handle the generate button click.
     *
     * @returns {Promise<void>}
     */
    async onGenerateClick() {
        // TODO: implement - call use cases, update UI with result
        console.log('[Character Forge] Generate clicked');
    }

    /**
     * Handle the save button click.
     *
     * @returns {Promise<void>}
     */
    async onSaveClick() {
        // TODO: implement - save the character and lorebook
        console.log('[Character Forge] Save clicked');
    }
}
