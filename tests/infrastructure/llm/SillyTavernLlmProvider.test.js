/**
 * @file Tests for SillyTavernLlmProvider adapter.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SillyTavernLlmProvider } from '../../../src/infrastructure/llm/SillyTavernLlmProvider.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

describe('SillyTavernLlmProvider', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            generateQuietPrompt: vi.fn(),
        };
    });

    /**
     * Test that provider extends ILlmProvider.
     */
    it('should extend ILlmProvider', () => {
        const provider = new SillyTavernLlmProvider(mockContext);
        expect(provider).toBeInstanceOf(ILlmProvider);
    });

    /**
     * Test that generateQuietPrompt is called with correct parameters.
     */
    it('should call generateQuietPrompt with user and system prompts', async () => {
        const expectedResponse = 'Generated response text';
        mockContext.generateQuietPrompt.mockResolvedValue(expectedResponse);

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'You are a character creator.',
            userPrompt: 'Create a character.',
            temperature: 0.85,
            maxTokens: 2048,
        });

        const response = await provider.generate(request);

        expect(mockContext.generateQuietPrompt).toHaveBeenCalledWith({
            quietPrompt: 'Create a character.',
            systemPrompt: 'You are a character creator.',
            temperature: 0.85,
            maxTokens: 2048,
        });
        expect(response).toBe(expectedResponse);
    });

    /**
     * Test that the provider returns the response as-is.
     */
    it('should return response from generateQuietPrompt', async () => {
        const responseText = 'JSON character data';
        mockContext.generateQuietPrompt.mockResolvedValue(responseText);

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        const result = await provider.generate(request);
        expect(result).toBe(responseText);
    });

    /**
     * Test that errors from generateQuietPrompt are propagated.
     */
    it('should propagate errors from generateQuietPrompt', async () => {
        const testError = new Error('Connection failed');
        mockContext.generateQuietPrompt.mockRejectedValue(testError);

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        await expect(provider.generate(request)).rejects.toBe(testError);
    });

    /**
     * Test that optional parameters are passed through.
     */
    it('should handle requests without optional temperature and maxTokens', async () => {
        mockContext.generateQuietPrompt.mockResolvedValue('Response');

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        await provider.generate(request);

        expect(mockContext.generateQuietPrompt).toHaveBeenCalledWith({
            quietPrompt: 'User',
            systemPrompt: 'System',
            temperature: undefined,
            maxTokens: undefined,
        });
    });
});
