export interface Meme {
  id: number;
  tag: string;
  imagePath: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  createdAt: Date;
  createdBy: string;
}

export interface Comment {
  id: number;
  memeId: number;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface MemeUploadResponse {
  message: string;
  removed: boolean;
}

export interface GetMemeResponse {
  memes: Meme[];
  currentPage: number;
  totalPages: number;
  totalMemes: number;
}