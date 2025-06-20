// Simple in-memory store for the custom API token

let apiToken: string | null = null;

export const setCustomApiToken = (token: string | null): void => {
  apiToken = token;
};

export const getCustomApiToken = (): string | null => {
  return apiToken;
};
