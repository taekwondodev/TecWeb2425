import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { CreateCommentResponse, GetCommentResponse } from "../../shared/models/comment.model";

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private readonly API_URL = `${environment.apiUrl}/comment`;

    constructor(private readonly http: HttpClient) { }

    getComments(memeId: number): Observable<GetCommentResponse> {
        const params = new HttpParams().set('memeId', memeId.toString());
        return this.http.get<GetCommentResponse>(this.API_URL, { params });
    }

    addComment(memeId: number, content: string): Observable<CreateCommentResponse> {
        return this.http.post<CreateCommentResponse>(this.API_URL, {
            memeId,
            content
        });
    }
}