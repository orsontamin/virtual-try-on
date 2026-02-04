import { describe, it, expect, vi } from 'vitest';
import { analyzeAndConsult } from './barber-api';
import axios from 'axios';

vi.mock('axios');

describe('Barber API - analyzeAndConsult', () => {
    const mockImage = 'data:image/png;base64,abc';

    it('should execute the full pipeline and return formatted result', async () => {
        // Mock Gemini Response
        const mockGeminiResp = {
            data: {
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify({
                                analysis: { face_shape: 'Square', hair_type: 'Wavy', notable_features: ['Strong Jaw'] },
                                recommendations: [
                                    { 
                                        category: 'Trendsetter', 
                                        style_name: 'Crop', 
                                        rationale: 'Good', 
                                        barber_notes: { sides: '0', top: '2', product: 'Clay' } 
                                    },
                                    { category: 'Professional', style_name: 'Quiff', rationale: 'Clean' },
                                    { category: 'Low Maintenance', style_name: 'Buzz', rationale: 'Easy' }
                                ]
                            })
                        }]
                    }
                }]
            }
        };

        // Mock Imagen Response
        const mockImagenResp = {
            data: {
                predictions: [{
                    bytesBase64Encoded: 'generated_image_data'
                }]
            }
        };

        axios.post.mockResolvedValueOnce(mockGeminiResp).mockResolvedValueOnce(mockImagenResp);

        const result = await analyzeAndConsult(mockImage);

        expect(result.text).toContain('Welcome to the Chair');
        expect(result.text).toContain('Face Shape: Square');
        expect(result.image).toBe('data:image/jpeg;base64,generated_image_data');
        expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should throw clear error on 401 Unauthorized', async () => {
        axios.post.mockRejectedValueOnce({
            response: { status: 401 }
        });

        await expect(analyzeAndConsult(mockImage)).rejects.toThrow('ACCESS_TOKEN_EXPIRED');
    });

    it('should throw clear error on 403 Forbidden', async () => {
        axios.post.mockRejectedValueOnce({
            response: { status: 403, data: { error: { message: 'insufficient scope' } } }
        });

        await expect(analyzeAndConsult(mockImage)).rejects.toThrow('AUTH_SCOPE_ERROR');
    });
});
