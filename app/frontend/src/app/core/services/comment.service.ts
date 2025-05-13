import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { CreateCommentResponse, GetCommentResponse } from "../../shared/models/comment.model";

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private readonly API_URL = `${environment.apiUrl}/memes`;

    constructor(private readonly http: HttpClient) { }

    async getComments(memeId: number): Promise<GetCommentResponse> {
        return firstValueFrom(this.http.get<GetCommentResponse>(
            `${this.API_URL}/${memeId}/comments`
        ));
    }

    async addComment(memeId: number, content: string): Promise<CreateCommentResponse> {
        return firstValueFrom(this.http.post<CreateCommentResponse>(
            `${this.API_URL}/${memeId}/comments`, {
            content
        }));
    }
}