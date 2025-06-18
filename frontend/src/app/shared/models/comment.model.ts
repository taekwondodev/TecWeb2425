export interface Comment {
  id: number;
  memeId: number;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface CreateCommentRequest {
  memeID: number;
  content: string;
}

export interface CreateCommentResponse {
  message: string;
}

export interface GetCommentResponse {
  message: string;
  comments: Comment[];
}