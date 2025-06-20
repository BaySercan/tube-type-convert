import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as videoApi from './videoApi';
import { authenticatedFetch } from './apiClient';

// Mock the apiClient module
vi.mock('./apiClient', () => ({
  authenticatedFetch: vi.fn(),
}));

const TEST_VIDEO_URL = "https://www.youtube.com/watch?v=iNMhWz8eJDc";
const ENCODED_TEST_VIDEO_URL = encodeURIComponent(TEST_VIDEO_URL);

// Helper to cast mock
const mockedAuthenticatedFetch = authenticatedFetch as ReturnType<typeof vi.fn>;

describe('Video API Functions', () => {
  // JSDOM's Blob doesn't have arrayBuffer, so we polyfill/mock it for tests
  if (typeof Blob.prototype.arrayBuffer === 'undefined') {
    Blob.prototype.arrayBuffer = async function() {
      return new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => {
          resolve(fr.result as ArrayBuffer);
        };
        fr.readAsArrayBuffer(this);
      });
    };
  }

  beforeEach(() => {
    // Reset mocks before each test
    mockedAuthenticatedFetch.mockReset();
  });

  describe('getVideoInfo', () => {
    it('should fetch video info successfully', async () => {
      const mockData = { title: 'Test Video', video_id: 'iNMhWz8eJDc' };
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await videoApi.getVideoInfo(TEST_VIDEO_URL);
      expect(result).toEqual(mockData);
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        `http://localhost:3500/info?url=${ENCODED_TEST_VIDEO_URL}`
      );
    });

    it('should throw an error if fetching video info fails', async () => {
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'Failed to fetch' }),
      } as Response);

      await expect(videoApi.getVideoInfo(TEST_VIDEO_URL)).rejects.toThrow('Failed to fetch');
    });
  });

  describe('downloadMp3', () => {
    it('should fetch MP3 blob successfully', async () => {
      const mockBlobContent = 'mp3_content_test';
      const mockBlob = new Blob([mockBlobContent], { type: 'audio/mpeg' });
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob), // blob is a function that returns a Promise<Blob>
      } as Response);

      const result = await videoApi.downloadMp3(TEST_VIDEO_URL);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/mpeg');
      // Correct way to read blob text content in tests if needed
      const buffer = await result.arrayBuffer();
      const text = new TextDecoder().decode(buffer);
      expect(text).toBe(mockBlobContent);
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        `http://localhost:3500/mp3?url=${ENCODED_TEST_VIDEO_URL}`
      );
    });

    it('should throw an error if fetching MP3 fails', async () => {
       mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'MP3 download failed' }),
      } as Response);
      await expect(videoApi.downloadMp3(TEST_VIDEO_URL)).rejects.toThrow('MP3 download failed');
    });
  });

  describe('downloadMp4', () => {
    it('should fetch MP4 blob successfully', async () => {
      const mockBlobContent = 'mp4_content_test';
      const mockBlob = new Blob([mockBlobContent], { type: 'video/mp4' });
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob), // blob is a function that returns a Promise<Blob>
      } as Response);

      const result = await videoApi.downloadMp4(TEST_VIDEO_URL);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('video/mp4');
      const buffer = await result.arrayBuffer();
      const text = new TextDecoder().decode(buffer);
      expect(text).toBe(mockBlobContent);
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        `http://localhost:3500/mp4?url=${ENCODED_TEST_VIDEO_URL}`
      );
    });

    it('should throw an error if fetching MP4 fails', async () => {
       mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'MP4 download failed' }),
      } as Response);
      await expect(videoApi.downloadMp4(TEST_VIDEO_URL)).rejects.toThrow('MP4 download failed');
    });
  });

  describe('getVideoTranscript', () => {
    it('should fetch transcript successfully with default params', async () => {
      const mockData = { transcript: 'Test transcript', success: true };
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await videoApi.getVideoTranscript(TEST_VIDEO_URL);
      expect(result).toEqual(mockData);
      const expectedParams = new URLSearchParams({
        url: TEST_VIDEO_URL, // URL should be encoded by URLSearchParams naturally if needed by underlying fetch
        lang: 'tr',
        skipAI: 'false',
        useDeepSeek: 'true',
      }).toString();
      // Note: authenticatedFetch receives the URL already with query params,
      // so we check the fully constructed URL here.
      // The actual encoding of TEST_VIDEO_URL within the query string is handled by URLSearchParams.
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        `http://localhost:3500/transcript?url=${ENCODED_TEST_VIDEO_URL}&lang=tr&skipAI=false&useDeepSeek=true`
      );
    });

    it('should fetch transcript successfully with custom params', async () => {
      const mockData = { transcript: 'English transcript', success: true };
       mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await videoApi.getVideoTranscript(TEST_VIDEO_URL, 'en', true, false);
      expect(result).toEqual(mockData);
      // For `toHaveBeenCalledWith`, the URL params order can matter if not using a matcher.
      // Let's construct it carefully.
      const expectedUrl = `http://localhost:3500/transcript?url=${ENCODED_TEST_VIDEO_URL}&lang=en&skipAI=true&useDeepSeek=false`;
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it('should throw an error if fetching transcript fails', async () => {
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'Transcript fetch failed' }),
      } as Response);
      await expect(videoApi.getVideoTranscript(TEST_VIDEO_URL)).rejects.toThrow('Transcript fetch failed');
    });
  });

  // TODO: Add tests for getProcessingProgress and getProcessingResult
  // These will be similar, checking URL construction (with job ID) and response/error handling.

});
