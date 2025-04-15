export interface Meme {
    id: string;
    title: string;
    imageUrl: string;
    tags: string[];
    uploadDate: Date;
    upvotes: number;
    downvotes: number;
    uploadedBy: string; // userId
    comments: Comment[];
  }