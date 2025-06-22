# YouTube Multi-Tool Frontend

This project is a frontend application for interacting with a YouTube Multi-API. It allows users to input a YouTube video URL and perform various actions such as downloading the video as MP3 or MP4, fetching video metadata, and generating AI-powered transcripts.

## ✨ Features

*   **Modern UI**: Built with React, Vite, TypeScript, and Shadcn UI components for a clean and responsive user experience.
*   **YouTube Video Processing**:
    *   **MP3 Audio Download**: Extract and download the audio from a YouTube video in MP3 format.
    *   **MP4 Video Download**: Download the YouTube video in MP4 format.
    *   **AI Transcript Generation**:
        *   Supports multiple languages for transcription.
        *   Option to get a plain transcript (skip AI post-processing).
        *   Option to use advanced models like DeepSeek for higher quality results.
        *   Real-time progress updates for transcription jobs.
    *   **Video Information**: Fetch metadata about a YouTube video, including title, thumbnail, channel information, and post date.
*   **Real-time Feedback**: A dynamic sidebar displays the progress of ongoing processes, results, and any errors encountered.
*   **Authentication**: Utilizes Supabase for user authentication (though core features are accessible on the main page).
*   **API Interaction**: Communicates with a backend YouTube Multi-API (defined in `openapi.yaml`) for all processing tasks. Uses React Query for efficient data fetching, caching, and state management.

## 🛠️ Tech Stack

*   **Framework/Library**: React (v18)
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **UI Components**: Shadcn UI, Tailwind CSS
*   **API Client**: Custom client using `fetch` with React Query for state management.
*   **Routing**: React Router DOM (v6)
*   **Linting**: ESLint
*   **Testing**: Vitest, React Testing Library
*   **Authentication**: Supabase

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or bun (this project uses `bun.lockb` and `package-lock.json`, so either should work, but `bun` might be preferred if `bun.lockb` is the primary lockfile)
*   A running instance of the [YouTube Multi API backend](https://github.com/BaySercan/youtube-multi-api) or access to a deployed version.

### Environment Variables

The application connects to a Supabase instance and the YouTube Multi-API. You'll need to set up environment variables for these. Create a `.env` file in the root of the project with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_YOUTUBE_MULTI_API_URL=your_youtube_multi_api_backend_url
VITE_YOUTUBE_MULTI_API_TOKEN=your_youtube_multi_api_token
```

*   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: Your Supabase project URL and anonymous key.
*   `VITE_YOUTUBE_MULTI_API_URL`: The base URL of your YouTube Multi-API backend.
*   `VITE_YOUTUBE_MULTI_API_TOKEN`: The JWT token required to authenticate with the backend API if it's secured.

Replace `your_supabase_url`, `your_supabase_anon_key`, `your_youtube_multi_api_backend_url`, and `your_youtube_multi_api_token` with your actual credentials and API endpoint. The API token is likely obtained after logging in through the Supabase auth flow, and the application seems to manage this token via `apiTokenStore.ts`. The `VITE_YOUTUBE_MULTI_API_TOKEN` might be a default or test token if the API allows unauthenticated access for some endpoints or if it's used for a service worker/backend function that then uses a master key. Refer to the API's documentation for specifics on token requirements.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using bun:
    ```bash
    bun install
    ```

### Running the Development Server

1.  **Start the Vite development server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using bun:
    ```bash
    bun run dev
    ```
2.  Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

### Building for Production

1.  **Build the application:**
    Using npm:
    ```bash
    npm run build
    ```
    Or using bun:
    ```bash
    bun run build
    ```
    This will create a `dist` folder with the optimized production build.

### Running Tests

1.  **Run tests:**
    Using npm:
    ```bash
    npm run test
    ```
    Or using bun:
    ```bash
    bun run test
    ```
    For UI mode:
    ```bash
    npm run test:ui
    ```
    Or:
    ```bash
    bun run test:ui
    ```

## 📂 Project Structure

```
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components (including shadcn/ui)
│   ├── contexts/       # React contexts (e.g., AuthContext)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions, API clients, Supabase client
│   ├── pages/          # Page components (routed via React Router)
│   ├── App.tsx         # Main application component with routing setup
│   ├── main.tsx        # Entry point of the application
│   └── index.css       # Global styles
├── supabase/           # Supabase specific configurations/functions
├── .env.example        # Example environment variables
├── openapi.yaml        # OpenAPI specification for the backend API
├── package.json        # Project metadata and dependencies
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

##🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

(Note: This README was generated based on an analysis of the project structure and key files. Specific details, especially around API token handling and backend setup, should be verified with the backend API's documentation.)
