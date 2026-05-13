/**
 * @file Tests for CharacterGeneratorPanel utility methods.
 */

import { describe, it, expect } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';

describe('CharacterGeneratorPanel - escapeHtml utility', () => {
    it('should escape HTML special characters', () => {
        const panel = new CharacterGeneratorPanel({});

        const escaped = panel.escapeHtml('<script>alert("xss")</script>');

        expect(escaped).not.toContain('<script>');
        expect(escaped).toContain('&lt;');
        expect(escaped).toContain('&gt;');
    });

    it('should escape ampersands', () => {
        const panel = new CharacterGeneratorPanel({});

        const escaped = panel.escapeHtml('A & B');

        expect(escaped).toContain('&amp;');
    });

    it('should handle plain text without modification', () => {
        const panel = new CharacterGeneratorPanel({});

        const escaped = panel.escapeHtml('Plain text');

        expect(escaped).toBe('Plain text');
    });

    it('should escape single quotes by preserving them', () => {
        const panel = new CharacterGeneratorPanel({});

        const escaped = panel.escapeHtml("It's a test");

        // Single quotes don't get HTML-escaped by textContent/innerHTML
        expect(escaped).toBe("It's a test");
    });

    it('should handle empty string', () => {
        const panel = new CharacterGeneratorPanel({});

        const escaped = panel.escapeHtml('');

        expect(escaped).toBe('');
    });

    it('should escape multiple dangerous patterns', () => {
        const panel = new CharacterGeneratorPanel({});

        const escaped = panel.escapeHtml('<img src=x onerror="alert(1)">');

        // Should have opening and closing angle brackets escaped
        expect(escaped).toContain('&lt;');
        expect(escaped).toContain('&gt;');
        // Should not contain raw HTML tags
        expect(escaped.indexOf('<img')).toBe(-1);
    });
});
