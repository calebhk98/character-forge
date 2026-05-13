/**
 * @file Tests for GenerationRequest value object.
 */

import { describe, it, expect } from 'vitest';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

describe('GenerationRequest', () => {
    it('should construct with required fields', () => {
        const data = {
            systemPrompt: 'You are a helpful assistant.',
            userPrompt: 'Create a character.',
        };
        const request = new GenerationRequest(data);
        expect(request.systemPrompt).toBe('You are a helpful assistant.');
        expect(request.userPrompt).toBe('Create a character.');
    });

    it('should allow optional fields to be undefined', () => {
        const data = {
            systemPrompt: 'You are helpful.',
            userPrompt: 'Create a character.',
        };
        const request = new GenerationRequest(data);
        expect(request.temperature).toBeUndefined();
        expect(request.maxTokens).toBeUndefined();
    });

    it('should accept temperature field when provided', () => {
        const data = {
            systemPrompt: 'You are helpful.',
            userPrompt: 'Create a character.',
            temperature: 0.8,
        };
        const request = new GenerationRequest(data);
        expect(request.temperature).toBe(0.8);
    });

    it('should accept maxTokens field when provided', () => {
        const data = {
            systemPrompt: 'You are helpful.',
            userPrompt: 'Create a character.',
            maxTokens: 2048,
        };
        const request = new GenerationRequest(data);
        expect(request.maxTokens).toBe(2048);
    });

    it('should accept both optional fields', () => {
        const data = {
            systemPrompt: 'You are helpful.',
            userPrompt: 'Create a character.',
            temperature: 0.9,
            maxTokens: 4096,
        };
        const request = new GenerationRequest(data);
        expect(request.temperature).toBe(0.9);
        expect(request.maxTokens).toBe(4096);
    });
});
