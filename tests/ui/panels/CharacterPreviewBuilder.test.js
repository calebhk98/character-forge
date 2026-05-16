/**
 * @file Tests for CharacterPreviewBuilder field stats: word count, token
 * estimate, live updates, and short/long visual indicators.
 */

import { describe, it, expect } from 'vitest';
import { CharacterPreviewBuilder } from '../../../src/ui/panels/CharacterPreviewBuilder.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

/**
 * Create a minimal Character for preview rendering tests.
 *
 * @returns {Character} stub character
 */
function makeCharacter() {
    return new Character({
        name: 'Ada',
        description: 'A test character',
        personality: 'Curious',
        scenario: 'A library',
        first_mes: 'Hello.',
        mes_example: 'Example.',
    });
}

describe('CharacterPreviewBuilder.computeStats', () => {
    it('returns zero words and tokens for empty string', () => {
        expect(CharacterPreviewBuilder.computeStats('')).toEqual({ words: 0, tokens: 0 });
    });

    it('returns zero words and tokens for whitespace-only string', () => {
        expect(CharacterPreviewBuilder.computeStats('   ')).toEqual({ words: 0, tokens: 0 });
    });

    it('returns correct word count for single word', () => {
        const result = CharacterPreviewBuilder.computeStats('hello');
        expect(result.words).toBe(1);
    });

    it('returns correct word count for multiple words', () => {
        const result = CharacterPreviewBuilder.computeStats('one two three four');
        expect(result.words).toBe(4);
    });

    it('returns token estimate as Math.round(words * 1.3)', () => {
        const result = CharacterPreviewBuilder.computeStats('one two three');
        expect(result.tokens).toBe(Math.round(3 * 1.3));
    });

    it('handles extra internal whitespace', () => {
        const result = CharacterPreviewBuilder.computeStats('  one   two  ');
        expect(result.words).toBe(2);
    });
});

describe('CharacterPreviewBuilder.buildFieldHtml - stats span', () => {
    it('includes a field-stats span with data-for matching the field id', () => {
        const builder = new CharacterPreviewBuilder();
        const html = builder.buildFieldHtml('edit-description', 'Description', 'description', false, 4);
        expect(html).toContain('class="field-stats"');
        expect(html).toContain('data-for="edit-description"');
    });

    it('includes the stats span for input (non-textarea) fields', () => {
        const builder = new CharacterPreviewBuilder();
        const html = builder.buildFieldHtml('edit-name', 'Name', 'name', true);
        expect(html).toContain('class="field-stats"');
        expect(html).toContain('data-for="edit-name"');
    });

    it('stats span is inside the preview-field div', () => {
        const builder = new CharacterPreviewBuilder();
        const html = builder.buildFieldHtml('edit-personality', 'Personality', 'personality', false, 3);
        const div = document.createElement('div');
        div.innerHTML = html;
        const statsEl = div.querySelector('.preview-field .field-stats');
        expect(statsEl).not.toBeNull();
        expect(statsEl?.dataset.for).toBe('edit-personality');
    });
});

describe('CharacterPreviewBuilder.buildPreviewHtml - stats spans present', () => {
    it('includes a stats span for every character text field', () => {
        const builder = new CharacterPreviewBuilder();
        const html = builder.buildPreviewHtml(makeCharacter(), new Lorebook({ name: 'L', description: '', entries: [] }));
        const div = document.createElement('div');
        div.innerHTML = html;
        const statsSpans = div.querySelectorAll('.field-stats');
        expect(statsSpans.length).toBeGreaterThanOrEqual(6);
    });
});

describe('CharacterPreviewBuilder.attachStatsListeners - initial population', () => {
    it('populates stats text with word and token count after field values are set', () => {
        const builder = new CharacterPreviewBuilder();
        const container = document.createElement('div');
        container.innerHTML = builder.buildPreviewHtml(
            makeCharacter(),
            new Lorebook({ name: 'L', description: '', entries: [] }),
        );

        const descTextarea = /** @type {HTMLTextAreaElement} */ (
            container.querySelector('#edit-description')
        );
        descTextarea.value = 'one two three four five';

        CharacterPreviewBuilder.attachStatsListeners(container);

        const statsEl = container.querySelector('.field-stats[data-for="edit-description"]');
        expect(statsEl?.textContent).toContain('5 words');
        expect(statsEl?.textContent).toContain('~7 tokens');
    });

    it('updates stats text when the user types into a field', () => {
        const builder = new CharacterPreviewBuilder();
        const container = document.createElement('div');
        container.innerHTML = builder.buildPreviewHtml(
            makeCharacter(),
            new Lorebook({ name: 'L', description: '', entries: [] }),
        );
        CharacterPreviewBuilder.attachStatsListeners(container);

        const textarea = /** @type {HTMLTextAreaElement} */ (
            container.querySelector('#edit-personality')
        );
        textarea.value = 'brave bold bright';
        textarea.dispatchEvent(new Event('input'));

        const statsEl = container.querySelector('.field-stats[data-for="edit-personality"]');
        expect(statsEl?.textContent).toContain('3 words');
    });

});

describe('CharacterPreviewBuilder.attachStatsListeners - visual indicators', () => {
    it('adds field-stats--short class when word count is between 1 and 49', () => {
        const builder = new CharacterPreviewBuilder();
        const container = document.createElement('div');
        container.innerHTML = builder.buildPreviewHtml(
            makeCharacter(),
            new Lorebook({ name: 'L', description: '', entries: [] }),
        );

        const textarea = /** @type {HTMLTextAreaElement} */ (
            container.querySelector('#edit-description')
        );
        textarea.value = 'just a few words';
        CharacterPreviewBuilder.attachStatsListeners(container);

        const statsEl = container.querySelector('.field-stats[data-for="edit-description"]');
        expect(statsEl?.classList.contains('field-stats--short')).toBe(true);
        expect(statsEl?.classList.contains('field-stats--long')).toBe(false);
    });

    it('adds field-stats--long class when word count exceeds 500', () => {
        const builder = new CharacterPreviewBuilder();
        const container = document.createElement('div');
        container.innerHTML = builder.buildPreviewHtml(
            makeCharacter(),
            new Lorebook({ name: 'L', description: '', entries: [] }),
        );

        const textarea = /** @type {HTMLTextAreaElement} */ (
            container.querySelector('#edit-description')
        );
        textarea.value = 'word '.repeat(501).trim();
        CharacterPreviewBuilder.attachStatsListeners(container);

        const statsEl = container.querySelector('.field-stats[data-for="edit-description"]');
        expect(statsEl?.classList.contains('field-stats--long')).toBe(true);
        expect(statsEl?.classList.contains('field-stats--short')).toBe(false);
    });

    it('adds no indicator class for empty fields', () => {
        const builder = new CharacterPreviewBuilder();
        const container = document.createElement('div');
        container.innerHTML = builder.buildPreviewHtml(
            makeCharacter(),
            new Lorebook({ name: 'L', description: '', entries: [] }),
        );
        CharacterPreviewBuilder.attachStatsListeners(container);

        const statsEl = container.querySelector('.field-stats[data-for="edit-scenario"]');
        expect(statsEl?.classList.contains('field-stats--short')).toBe(false);
        expect(statsEl?.classList.contains('field-stats--long')).toBe(false);
    });

    it('removes short class and adds long class when input grows past 500 words', () => {
        const builder = new CharacterPreviewBuilder();
        const container = document.createElement('div');
        container.innerHTML = builder.buildPreviewHtml(
            makeCharacter(),
            new Lorebook({ name: 'L', description: '', entries: [] }),
        );
        CharacterPreviewBuilder.attachStatsListeners(container);

        const textarea = /** @type {HTMLTextAreaElement} */ (
            container.querySelector('#edit-description')
        );
        const statsEl = container.querySelector('.field-stats[data-for="edit-description"]');

        textarea.value = 'short text';
        textarea.dispatchEvent(new Event('input'));
        expect(statsEl?.classList.contains('field-stats--short')).toBe(true);

        textarea.value = 'word '.repeat(501).trim();
        textarea.dispatchEvent(new Event('input'));
        expect(statsEl?.classList.contains('field-stats--long')).toBe(true);
        expect(statsEl?.classList.contains('field-stats--short')).toBe(false);
    });
});
