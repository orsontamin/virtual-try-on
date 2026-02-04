import { describe, it, expect, vi } from 'vitest';
import { tryOn } from './api';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('API Service - tryOn', () => {
  it('should construct the correct payload and return the image data URL on success', async () => {
    // Arrange
    const mockHumanImage = 'data:image/png;base64,humanbase64data';
    const mockDesignImage = 'data:image/png;base64,designbase64data';
    const mockResponse = {
      data: {
        predictions: [
          {
            bytesBase64Encoded: 'resultbase64data'
          }
        ]
      }
    };
    axios.post.mockResolvedValue(mockResponse);

    // Act
    const result = await tryOn(mockHumanImage, mockDesignImage);

    // Assert
    expect(axios.post).toHaveBeenCalledTimes(1);
    
    // Check if payload strips the header
    const expectedPayload = {
      instances: [
        {
          personImage: { bytesBase64Encoded: 'humanbase64data' },
          productImages: [{ bytesBase64Encoded: 'designbase64data' }]
        }
      ],
      parameters: expect.any(Object)
    };
    
    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('virtual-try-on-001:predict'),
        expect.objectContaining(expectedPayload),
        expect.any(Object)
    );

    expect(result).toBe('data:image/jpeg;base64,resultbase64data');
  });

  it('should handle API errors gracefully', async () => {
    axios.post.mockRejectedValue(new Error('API Error'));
    
    await expect(tryOn('data:,', 'data:,')).rejects.toThrow('API Error');
  });
});
