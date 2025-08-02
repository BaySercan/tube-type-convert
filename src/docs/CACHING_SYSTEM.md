# Video Caching System Documentation

## Overview

The video caching system provides intelligent caching and refresh functionality for YouTube video processing requests. It stores processed video data and tracks user requests to optimize performance and provide a better user experience.

## Architecture

### Database Tables

#### 1. `processed_videos` Table
Stores processed video data and request statistics:

```sql
CREATE TABLE processed_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  channel_id TEXT,
  language TEXT,
  title TEXT,
  video_url TEXT,
  info_result JSONB,
  transcript_result JSONB,
  info_requests INTEGER DEFAULT 0,
  transcript_requests INTEGER DEFAULT 0,
  mp3_requests INTEGER DEFAULT 0,
  mp4_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `user_video_requests` Table
Tracks individual user requests:

```sql
CREATE TABLE user_video_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  request_type TEXT CHECK (request_type IN ('info', 'transcript', 'mp3', 'mp4')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, user_id, request_type)
);
```

## Core Components

### 1. Database Services (`src/lib/db/`)

#### `ProcessedVideosService`
- `upsertVideo()`: Creates new records or updates existing ones with incremented counters
- `getVideoByVideoId()`: Retrieves video data by YouTube video ID
- `updateWithInfoResult()`: Updates video with info metadata
- `updateWithTranscriptResult()`: Updates video with transcript data

#### `UserVideoRequestsService`
- `createUserRequest()`: Tracks user-video-request relationships
- `hasUserRequestedVideo()`: Checks if user already requested specific video type
- `getUserRequests()`: Gets all requests for a specific user
- `getVideoRequests()`: Gets all requests for a specific video
- `getVideoRequestStats()`: Gets analytics for video requests

### 2. Cache Hook (`src/hooks/useVideoCache.ts`)

The `useVideoCache` hook provides React integration for the caching system:

```typescript
interface VideoCacheResult {
  videoData: ProcessedVideo | null;
  userHasRequested: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshVideoData: () => Promise<void>;
  trackUserRequest: () => Promise<void>;
  updateVideoWithRequest: (updateData: Partial<ProcessedVideo>) => Promise<void>;
}
```

### 3. Cache Utilities (`src/lib/db/cacheUtils.ts`)

Utility functions for cache management:

- `isCacheStale()`: Determines if cached data is stale (older than 24 hours)
- `formatCacheAge()`: Formats cache age in human-readable format

## Usage Flow

### 1. Initial Request Processing

1. User enters YouTube URL and selects output type
2. `useVideoCache` hook checks database for existing video data
3. If cached data exists and is fresh, it's displayed immediately
4. If no cached data or stale, API call is made
5. Results are stored in `processed_videos` table
6. User request is tracked in `user_video_requests` table

### 2. Cached Data Display

When cached data is available:
- Video information is shown with "Last requested" timestamp
- Cache age is displayed (fresh/stale indicator)
- Refresh button is provided for stale data
- JSON results are displayed in an interactive viewer

### 3. Refresh Functionality

When user clicks refresh:
1. `isRefreshing` state is set to true
2. Fresh API call is made
3. Database is updated with new results
4. Request counter is incremented
5. UI shows loading state during refresh

## Implementation Examples

### Checking Cache in Components

```typescript
const { videoData, userHasRequested, isLoading, isRefreshing, error } = useVideoCache(url, requestType);

useEffect(() => {
  if (videoData?.info_result) {
    // Show cached info data
  }
}, [videoData]);
```

### Updating Database on Successful Requests

```typescript
// In API success handlers
await updateVideoWithRequest({
  video_id: videoUrl,
  info_result: data,
  title: data.title,
  channel_id: data.channel_id,
  video_url: videoUrl
});
```

### Tracking User Requests

```typescript
// Before making API calls
await trackUserRequest();
```

## Cache Freshness Policy

- **Fresh Data**: Updated within the last 24 hours
- **Stale Data**: Older than 24 hours
- **First-time Requests**: No existing cache data

## Error Handling

The system gracefully handles:
- Database connection errors
- "Not found" scenarios (treated as first-time requests)
- Cache validation failures
- Concurrent request scenarios

## Performance Considerations

- Database indexes on frequently queried columns
- Efficient upsert operations
- Minimal data transfer (only necessary fields)
- Client-side caching with React Query integration

## Future Enhancements

- Configurable cache expiration times
- Cache warming strategies
- Advanced analytics and reporting
- Cache preloading for popular videos
- Offline cache support
