import type { ReviewsResponse, ReviewDetail, SearchResponse } from '../types/review';

// Base URL routed through Vite dev proxy to bypass browser CORS
const API_BASE = 'https://api.emanuels.review/v1';

class APIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Fallback to HTTP status text
      }
      throw new APIError(errorMessage, response.status);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof APIError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Unknown network error';
    throw new APIError(`Failed to fetch from Emanuel's API: ${message}`);
  }
}

export const reviewsApi = {
  /**
   * Get all reviews list
   */
  async getAllReviews(): Promise<ReviewsResponse> {
    return fetchJSON<ReviewsResponse>('/reviews');
  },

  /**
   * Get a single review by id/slug
   */
  async getReviewById(id: string): Promise<ReviewDetail> {
    if (!id) {
      throw new APIError('Review ID is required', 400);
    }
    return fetchJSON<ReviewDetail>(`/reviews/${encodeURIComponent(id)}`);
  },

  /**
   * Search reviews by query string (supports keywords or actor:Name, director:Name, etc.)
   */
  async searchReviews(query: string): Promise<SearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { query: '', count: 0, results: [] };
    }
    return fetchJSON<SearchResponse>(`/search?q=${encodeURIComponent(trimmed)}`);
  },
};
