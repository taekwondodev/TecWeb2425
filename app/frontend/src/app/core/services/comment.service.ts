import { Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { CreateCommentResponse, GetCommentResponse, Comment } from "../../shared/models/comment.model";

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private readonly API_URL = `${environment.apiUrl}/memes`;

    private readonly _comments = signal<Record<number, Comment[]>>({});
    private readonly _isLoading = signal<boolean>(false);

    readonly comments = this._comments.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();

    constructor(private readonly http: HttpClient) { }

    async getComments(memeId: number): Promise<GetCommentResponse> {
        this._isLoading.set(true);
        
        try {
            const response = await firstValueFrom(
                this.http.get<GetCommentResponse>(`${this.API_URL}/${memeId}/comments`)
            );

            this._comments.update(current => ({
                ...current,
                [memeId]: response.comments
            }));

            return response;
        } finally {
            this._isLoading.set(false);
        }
    }

    async addComment(memeId: number, content: string): Promise<CreateCommentResponse> {
        this._isLoading.set(true);
        
        try {
            const response = await firstValueFrom(
                this.http.post<CreateCommentResponse>(`${this.API_URL}/${memeId}/comments`, {
                    content
                })
            );

            await this.getComments(memeId);

            return response;
        } finally {
            this._isLoading.set(false);
        }
    }

    getCommentsForMeme(memeId: number): Comment[] {
        return this._comments()[memeId] ?? [];
    }

    clearCommentsForMeme(memeId: number): void {
        this._comments.update(current => {
            const updated = { ...current };
            delete updated[memeId];
            return updated;
        });
    }
}