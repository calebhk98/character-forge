/**
 * @file Tests for SillyTavernLlmProvider adapter.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SillyTavernLlmProvider } from '../../../src/infrastructure/llm/SillyTavernLlmProvider.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

describe('SillyTavernLlmProvider', () => {
    let mockGenerateRaw;

    beforeEach(() => {
        mockGenerateRaw = vi.fn();
    });

    /** Provider is a valid ILlmProvider subclass. */
    it('should extend ILlmProvider', () => {
        const provider = new SillyTavernLlmProvider(mockGenerateRaw);
        expect(provider).toBeInstanceOf(ILlmProvider);
    });

    /** generateRaw receives positional args matching ST's actual signature. */
    it('should call generateRaw with positional args matching ST signature', async () => {
        const expectedResponse = 'Generated response text';
        mockGenerateRaw.mockResolvedValue(expectedResponse);

        const provider = new SillyTavernLlmProvider(mockGenerateRaw);
        const request = new GenerationRequest({
            systemPrompt: 'You are a character creator.',
            userPrompt: 'Create a character.',
            maxTokens: 2048,
        });

        const response = await provider.generate(request);

        expect(mockGenerateRaw).toHaveBeenCalledWith(
            'Create a character.',
            undefined,
            false,
            true,
            'You are a character creator.',
            2048,
        );
        expect(response).toBe(expectedResponse);
    });

    /** Return value from generateRaw is passed through unchanged. */
    it('should return response from generateRaw', async () => {
        const responseText = 'JSON character data';
        mockGenerateRaw.mockResolvedValue(responseText);

        const provider = new SillyTavernLlmProvider(mockGenerateRaw);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        const result = await provider.generate(request);
        expect(result).toBe(responseText);
    });

    /** Errors from generateRaw propagate to the caller. */
    it('should propagate errors from generateRaw', async () => {
        const testError = new Error('Connection failed');
        mockGenerateRaw.mockRejectedValue(testError);

        const provider = new SillyTavernLlmProvider(mockGenerateRaw);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        await expect(provider.generate(request)).rejects.toBe(testError);
    });

    /** Empty systemPrompt passes as-is; missing maxTokens coerces to 0. */
    it('should coerce missing systemPrompt to empty string and maxTokens to 0', async () => {
        mockGenerateRaw.mockResolvedValue('Response');

        const provider = new SillyTavernLlmProvider(mockGenerateRaw);
        const request = new GenerationRequest({
            systemPrompt: '',
            userPrompt: 'User',
        });

        await provider.generate(request);

        expect(mockGenerateRaw).toHaveBeenCalledWith(
            'User',
            undefined,
            false,
            true,
            '',
            0,
        );
    });
});
