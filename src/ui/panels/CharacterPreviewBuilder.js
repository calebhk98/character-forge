/**
 * @file Assembles the preview form HTML for CharacterGeneratorPanel. Extracted
 * to keep the panel under the 500-line ESLint limit.
 */

/**
 * Builds the editable preview HTML for a generated character and lorebook.
 */
export class CharacterPreviewBuilder {
    /**
     * Build the full preview HTML for the given character and lorebook.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - generated character
     * @param {import('../../domain/entities/Lorebook.js').Lorebook|null} lorebook - generated lorebook
     * @returns {string} HTML string
     */
    buildPreviewHtml(character, lorebook) {
        const fields = [
            this.buildFieldHtml('edit-name', 'Name', 'name', true),
            this.buildFieldHtml('edit-description', 'Description', 'description', false, 4),
            this.buildFieldHtml('edit-personality', 'Personality', 'personality', false, 3),
            this.buildFieldHtml('edit-scenario', 'Scenario', 'scenario', false, 3),
            this.buildFieldHtml('edit-first-mes', 'First Message', 'first_mes', false, 2),
            this.buildFieldHtml('edit-mes-example', 'Example Dialogue', 'mes_example', false, 3),
            this.buildFieldHtml('edit-creator-notes', 'Creator Notes', 'creator_notes', false, 2),
            this.buildFieldHtml('edit-tags', 'Tags (comma-separated)', 'tags', true),
        ].join('');
        return `<div class="preview-character">${fields}</div>` +
            this.buildAlternateGreetingsHtml(character) +
            this.buildLorebookHtml(lorebook);
    }

    /**
     * Build HTML for a single preview field with an inline ↺ regenerate control
     * and a stats span that shows word count and token estimate.
     *
     * @param {string} id - element id for the input or textarea
     * @param {string} label - visible field label text
     * @param {string} fieldName - character property key used in data-field attributes
     * @param {boolean} [isInput] - render as text input when true; textarea otherwise
     * @param {number} [rows] - textarea row count; ignored when isInput is true
     * @returns {string} HTML string for the field row
     */
    buildFieldHtml(id, label, fieldName, isInput = false, rows = 3) {
        const ctl = isInput
            ? `<input type="text" id="${id}" class="edit-input"/>`
            : `<textarea id="${id}" class="edit-textarea" rows="${rows}"></textarea>`;
        const regenForm = `<div class="regen-form" data-field="${fieldName}" style="display:none">` +
            '<input class="regen-feedback" placeholder="What to change (optional)..."/>' +
            `<button class="regen-confirm" data-field="${fieldName}">Rewrite</button>` +
            `<button class="regen-cancel" data-field="${fieldName}">×</button></div>`;
        const stats = `<span class="field-stats" data-for="${id}"></span>`;
        return `<div class="preview-field"><label for="${id}"><strong>${label}:</strong></label>` +
            `<button class="regen-btn" data-field="${fieldName}">↺</button>${regenForm}${ctl}${stats}</div>`;
    }

    /**
     * Compute word count and rough token estimate for a text string.
     * Token estimate uses the words × 1.3 heuristic.
     *
     * @param {string} text - text to analyse
     * @returns {{ words: number, tokens: number }} computed stats
     */
    static computeStats(text) {
        if (!text || !text.trim()) {
            return { words: 0, tokens: 0 };
        }
        const words = text.trim().split(/\s+/).length;
        const tokens = Math.round(words * 1.3);
        return { words, tokens };
    }

    /**
     * Update a stats span element based on the current value of its field.
     *
     * @param {HTMLInputElement|HTMLTextAreaElement} input - the field element
     * @param {Element} statsEl - the paired stats span
     */
    static updateStats(input, statsEl) {
        const { words, tokens } = CharacterPreviewBuilder.computeStats(input.value);
        statsEl.textContent = `${words} words · ~${tokens} tokens`;
        statsEl.classList.toggle('field-stats--short', words > 0 && words < 50);
        statsEl.classList.toggle('field-stats--long', words > 500);
    }

    /**
     * Attach input event listeners to all fields that have a paired stats span,
     * and initialise their displayed counts from the current field values.
     *
     * @param {HTMLElement} container - element containing the rendered preview HTML
     */
    static attachStatsListeners(container) {
        const statsEls = container.querySelectorAll('.field-stats[data-for]');
        for (const statsEl of statsEls) {
            const id = /** @type {HTMLElement} */ (statsEl).dataset.for;
            const input = /** @type {HTMLInputElement|HTMLTextAreaElement|null} */ (
                container.querySelector(`#${id}`)
            );
            if (!input) {
                continue;
            }
            CharacterPreviewBuilder.updateStats(input, statsEl);
            input.addEventListener('input', () => CharacterPreviewBuilder.updateStats(input, statsEl));
        }
    }

    /**
     * Build HTML for the editable alternate greetings section.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - generated character
     * @returns {string} HTML string
     */
    buildAlternateGreetingsHtml(character) {
        const greetings = character?.alternate_greetings ?? [];
        let html = '<div class="preview-alternate-greetings"><h4>Alternate Greetings</h4>';
        if (!greetings.length) {
            html += '<p>No alternate greetings generated</p>';
        } else {
            for (let i = 0; i < greetings.length; i++) {
                html += '<div class="preview-field">' +
                    `<label for="edit-alt-greeting-${i}"><strong>Alternate Greeting ${i + 1}:</strong></label>` +
                    `<textarea id="edit-alt-greeting-${i}" class="edit-textarea edit-alt-greeting" data-index="${i}" rows="3"></textarea>` +
                    '</div>';
            }
        }
        html += '</div>';
        return html;
    }

    /**
     * Build HTML for editable lorebook entries.
     *
     * @param {import('../../domain/entities/Lorebook.js').Lorebook|null} lorebook - generated lorebook
     * @returns {string} HTML string
     */
    buildLorebookHtml(lorebook) {
        let html = '<div class="preview-lorebook"><h4>Lorebook Entries</h4>';
        if (!lorebook?.entries?.length) {
            html += '<p>No entries generated</p>';
        } else {
            html += '<div class="lorebook-entries">';
            for (let i = 0; i < lorebook.entries.length; i++) {
                html += `
                    <div class="lorebook-entry" data-index="${i}">
                        <label for="edit-entry-name-${i}"><strong>Name:</strong></label>
                        <input type="text" id="edit-entry-name-${i}" class="edit-input edit-entry-name" data-index="${i}" />
                        <label for="edit-entry-keys-${i}"><strong>Keys (comma-separated):</strong></label>
                        <input type="text" id="edit-entry-keys-${i}" class="edit-input edit-entry-keys" data-index="${i}" />
                        <label for="edit-entry-content-${i}"><strong>Content:</strong></label>
                        <textarea id="edit-entry-content-${i}" class="edit-textarea edit-entry-content" data-index="${i}" rows="3"></textarea>
                    </div>
                `;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }
}
