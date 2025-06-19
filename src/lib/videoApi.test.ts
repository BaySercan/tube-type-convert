import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as videoApi from './videoApi';
import { authenticatedFetch } from './apiClient';

// Mock the apiClient module
vi.mock('./apiClient', () => ({
  authenticatedFetch: vi.fn(),
}));

// Helper to cast mock
const mockedAuthenticatedFetch = authenticatedFetch as ReturnType<typeof vi.fn>;

describe('Video API Functions', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedAuthenticatedFetch.mockReset();
  });

  describe('getVideoInfo', () => {
    it('should fetch video info successfully', async () => {
      const mockData = { title: 'Test Video', video_id: '123' };
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await videoApi.getVideoInfo('test_url');
      expect(result).toEqual(mockData);
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3500/info?url=test_url'
      );
    });

    it('should throw an error if fetching video info fails', async () => {
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'Failed to fetch' }),
      } as Response);

      await expect(videoApi.getVideoInfo('test_url')).rejects.toThrow('Failed to fetch');
    });
  });

  describe('downloadMp3', () => {
    it('should fetch MP3 blob successfully', async () => {
      const mockBlob = new Blob(['mp3_content'], { type: 'audio/mpeg' });
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response);

      const result = await videoApi.downloadMp3('test_url');
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/mpeg');
      const text = await result.text();
      expect(text).toBe('mp3_content');
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3500/mp3?url=test_url'
      );
    });

    it('should throw an error if fetching MP3 fails', async () => {
       mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'MP3 download failed' }),
      } as Response);
      await expect(videoApi.downloadMp3('test_url')).rejects.toThrow('MP3 download failed');
    });
  });

  describe('downloadMp4', () => {
    it('should fetch MP4 blob successfully', async () => {
      const mockBlob = new Blob(['mp4_content'], { type: 'video/mp4' });
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response);

      const result = await videoApi.downloadMp4('test_url');
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('video/mp4');
      const text = await result.text();
      expect(text).toBe('mp4_content');
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3500/mp4?url=test_url'
      );
    });

    it('should throw an error if fetching MP4 fails', async () => {
       mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'MP4 download failed' }),
      } as Response);
      await expect(videoApi.downloadMp4('test_url')).rejects.toThrow('MP4 download failed');
    });
  });

  describe('getVideoTranscript', () => {
    it('should fetch transcript successfully with default params', async () => {
      const mockData = { transcript: 'Test transcript', success: true };
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await videoApi.getVideoTranscript('test_url');
      expect(result).toEqual(mockData);
      const expectedParams = new URLSearchParams({
        url: 'test_url',
        lang: 'tr',
        skipAI: 'false',
        useDeepSeek: 'true',
      }).toString();
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        `http://localhost:3500/transcript?${expectedParams}`
      );
    });

    it('should fetch transcript successfully with custom params', async () => {
      const mockData = { transcript: 'English transcript', success: true };
       mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await videoApi.getVideoTranscript('test_url_en', 'en', true, false);
      expect(result).toEqual(mockData);
      const expectedParams = new URLSearchParams({
        url: 'test_url_en',
        lang: 'en',
        skipAI: 'true',
        useDeepSeek: 'false',
      }).toString();
      expect(mockedAuthenticatedFetch).toHaveBeenCalledWith(
        `http://localhost:3500/transcript?${expectedParams}`
      );
    });

    it('should throw an error if fetching transcript fails', async () => {
      mockedAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'API Error',
        json: async () => ({ message: 'Transcript fetch failed' }),
      } as Response);
      await expect(videoApi.getVideoTranscript('test_url')).rejects.toThrow('Transcript fetch failed');
    });
  });

  // TODO: Add tests for getProcessingProgress and getProcessingResult
  // These will be similar, checking URL construction (with job ID) and response/error handling.

});
