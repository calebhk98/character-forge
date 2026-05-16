/**
 * @file Use case: load an existing character card from storage for editing.
 * Fetches the card by avatar filename, parses it into domain entities, and
 * returns a CharacterDraft ready for the preview/edit flow.
 */

import { Character } from '../../domain/entities/Character.js';
import { CharacterDraft } from '../../domain/value-objects/CharacterDraft.js';
import { Lorebook } from '../../domain/entities/Lorebook.js';
import { LorebookEntry } from '../../domain/entities/LorebookEntry.js';

/**
 * Load an existing character card into a CharacterDraft for editing.
 */
export class LoadCharacterForEditing {
    /**
     * Construct the use case.
     *
     * @param {import('../ports/ICharacterRepository.js').ICharacterRepository} charRepository - loads cards from storage
     * @param {import('../ports/ILogger.js').ILogger} logger - diagnostic logging
     */
    constructor(charRepository, logger) {
        this.charRepository = charRepository;
        this.logger = logger;
    }

    /**
     * Execute: fetch and parse an existing character card into a CharacterDraft.
     *
     * @param {string} avatarUrl - character avatar filename (e.g. 'Alice.png')
     * @returns {Promise<CharacterDraft>} parsed draft ready for editing
     */
    async execute(avatarUrl) {
        this.logger.debug('Loading character for editing', { avatarUrl });

        const cardJson = await this.charRepository.load(avatarUrl);
        const data = cardJson.data ?? cardJson;

        const character = new Character({
            name: data.name,
            description: data.description,
            personality: data.personality,
            scenario: data.scenario,
            first_mes: data.first_mes,
            mes_example: data.mes_example,
            creator_notes: data.creator_notes,
            system_prompt: data.system_prompt,
            post_history_instructions: data.post_history_instructions,
            alternate_greetings: data.alternate_greetings,
        });

        const lorebook = this.parseLorebook(data.character_book);
        this.logger.info('Character loaded for editing', { name: character.name });
        return new CharacterDraft({ character, lorebook });
    }

    /**
     * Parse a character_book JSON blob into a Lorebook entity.
     * Handles both array and object-keyed entry formats (ST world info).
     *
     * @param {object|undefined} bookData - raw character_book from card JSON
     * @returns {Lorebook} lorebook entity (empty if no book data)
     */
    parseLorebook(bookData) {
        if (!bookData) {
            return new Lorebook({});
        }

        const rawEntries = Array.isArray(bookData.entries)
            ? bookData.entries
            : Object.values(bookData.entries || {});

        const entries = rawEntries.reduce((acc, e) => {
            const keys = Array.isArray(e.keys) ? e.keys : (Array.isArray(e.key) ? e.key : []);
            const validKeys = keys.filter((k) => k && typeof k === 'string');
            if (validKeys.length === 0 || !e.content?.trim()) {
                return acc;
            }
            try {
                acc.push(new LorebookEntry({
                    keys: validKeys,
                    content: e.content,
                    name: e.comment || e.name || '',
                    insertion_order: e.insertion_order,
                }));
            } catch (_err) {
                this.logger.debug('Skipping invalid lorebook entry', { error: _err.message });
            }
            return acc;
        }, []);

        return new Lorebook({
            name: bookData.name || '',
            description: bookData.description || '',
            entries,
            scan_depth: bookData.scan_depth,
            token_budget: bookData.token_budget,
            recursive_scanning: bookData.recursive_scanning,
        });
    }
}
