/**
 * @file Adapter that formats Character entities to Character Card V3 JSON.
 * Per spec: chara_card_v3, spec_version 3.0.
 */

import { ICardFormatter } from '../../application/ports/ICardFormatter.js';
import { Lorebook } from '../../domain/entities/Lorebook.js';

/**
 * Formatter for Character Card V3 spec.
 *
 * @augments ICardFormatter
 */
export class CardV3Formatter extends ICardFormatter {
    /**
     * Format a character and lorebook to V3 JSON.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - character to format
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [lorebook] - optional lorebook to embed
     * @returns {object} Character Card V3 JSON object
     */
    format(character, lorebook) {
        const charBook = lorebook || new Lorebook();

        return {
            spec: 'chara_card_v3',
            spec_version: '3.0',
            data: {
                name: character.name,
                description: character.description,
                personality: character.personality,
                scenario: character.scenario,
                first_mes: character.first_mes,
                mes_example: character.mes_example,
                creator_notes: character.creator_notes,
                system_prompt: character.system_prompt,
                post_history_instructions: character.post_history_instructions,
                alternate_greetings: character.alternate_greetings ?? [],
                tags: [],
                extensions: {},
                character_book: {
                    name: charBook.name,
                    description: charBook.description,
                    scan_depth: charBook.scan_depth,
                    token_budget: charBook.token_budget,
                    recursive_scanning: charBook.recursive_scanning,
                    entries: charBook.entries,
                },
            },
        };
    }
}
