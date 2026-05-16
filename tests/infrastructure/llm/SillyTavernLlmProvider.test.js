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
            generateRaw: vi.fn(),
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
     * Test that generateRaw is called with prompt, systemPrompt, and responseLength.
     */
    it('should call generateRaw with prompt, systemPrompt, and responseLength', async () => {
        const expectedResponse = 'Generated response text';
        mockContext.generateRaw.mockResolvedValue(expectedResponse);

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'You are a character creator.',
            userPrompt: 'Create a character.',
            maxTokens: 2048,
        });

        const response = await provider.generate(request);

        expect(mockContext.generateRaw).toHaveBeenCalledWith({
            prompt: 'Create a character.',
            systemPrompt: 'You are a character creator.',
            responseLength: 2048,
        });
        expect(response).toBe(expectedResponse);
    });

    /**
     * Test that the provider returns the response as-is.
     */
    it('should return response from generateRaw', async () => {
        const responseText = 'JSON character data';
        mockContext.generateRaw.mockResolvedValue(responseText);

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        const result = await provider.generate(request);
        expect(result).toBe(responseText);
    });

    /**
     * Test that errors from generateRaw are propagated.
     */
    it('should propagate errors from generateRaw', async () => {
        const testError = new Error('Connection failed');
        mockContext.generateRaw.mockRejectedValue(testError);

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: 'System',
            userPrompt: 'User',
        });

        await expect(provider.generate(request)).rejects.toBe(testError);
    });

    /**
     * Test that undefined systemPrompt is coerced to empty string, and
     * undefined maxTokens is passed through as responseLength.
     */
    it('should coerce missing systemPrompt to empty string', async () => {
        mockContext.generateRaw.mockResolvedValue('Response');

        const provider = new SillyTavernLlmProvider(mockContext);
        const request = new GenerationRequest({
            systemPrompt: '',
            userPrompt: 'User',
        });

        await provider.generate(request);

        expect(mockContext.generateRaw).toHaveBeenCalledWith({
            prompt: 'User',
            systemPrompt: '',
            responseLength: undefined,
        });
    });
});
