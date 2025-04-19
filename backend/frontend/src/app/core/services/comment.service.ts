import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { CreateCommentResponse, GetCommentResponse } from "../../shared/models/comment.model";

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private readonly API_URL = `${environment.apiUrl}/comment`;

    constructor(private readonly http: HttpClient) { }

    async getComments(memeId: number): Promise<GetCommentResponse> {
        const params = new HttpParams().set('memeId', memeId.toString());
        return firstValueFrom(this.http.get<GetCommentResponse>(this.API_URL, { params }));
    }

    async addComment(memeId: number, content: string): Promise<CreateCommentResponse> {
        return firstValueFrom(this.http.post<CreateCommentResponse>(this.API_URL, {
            memeId,
            content
        }));
    }
}