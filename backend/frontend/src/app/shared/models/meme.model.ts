export interface Meme {
  id: number;
  tag: string;
  imagePath: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  createdBy: string;
}

export interface MemeUploadResponse {
  message: string;
  memeId: number;
}

export interface MemeFilterOptions {
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface GetMemeResponse {
  memes: Meme[];
  currentPage: number;
  totalPages: number;
  totalMemes: number;
}

export interface VoteRequest {
  memeId: number;
  voteValue: number; // 1 per upvote, -1 per downvote
}

export interface VoteResponse {
  message: string;
  removed: boolean;
}