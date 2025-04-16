import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meme } from '../../shared/models/meme.model';
import { Comment } from '../../shared/models/comment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemeService {
  private readonly API_URL = `${environment.apiUrl}/memes`;

  constructor(private http: HttpClient) { }

  getAllMemes(sortBy?: string, filterBy?: string): Observable<Meme[]> {
    let params = new HttpParams();
    if (sortBy) params = params.append('sortBy', sortBy);
    if (filterBy) params = params.append('filterBy', filterBy);

    return this.http.get<Meme[]>(this.API_URL, { params });
  }

  getMemeOfTheDay(): Observable<Meme> {
    return this.http.get<Meme>(`${this.API_URL}/meme-of-the-day`);
  }

  getMemeById(id: string): Observable<Meme> {
    return this.http.get<Meme>(`${this.API_URL}/${id}`);
  }

  searchMemes(query: string, tags?: string[]): Observable<Meme[]> {
    let params = new HttpParams().set('query', query);
    if (tags && tags.length) {
      tags.forEach(tag => {
        params = params.append('tags', tag);
      });
    }

    return this.http.get<Meme[]>(`${this.API_URL}/search`, { params });
  }

  uploadMeme(memeData: FormData): Observable<Meme> {
    return this.http.post<Meme>(this.API_URL, memeData);
  }

  upvoteMeme(id: string): Observable<Meme> {
    return this.http.post<Meme>(`${this.API_URL}/${id}/upvote`, {});
  }

  downvoteMeme(id: string): Observable<Meme> {
    return this.http.post<Meme>(`${this.API_URL}/${id}/downvote`, {});
  }

  addComment(memeId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.API_URL}/${memeId}/comments`, { content });
  }

  getComments(memeId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.API_URL}/${memeId}/comments`);
  }
}