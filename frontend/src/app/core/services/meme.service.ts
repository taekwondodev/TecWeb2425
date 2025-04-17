import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetMemeResponse, Meme, MemeFilterOptions, MemeUploadResponse, VoteResponse } from '../../shared/models/meme.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemeService {
  private readonly API_URL = `${environment.apiUrl}/memes`;

  constructor(private readonly http: HttpClient) { }

  getMemes(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'newest',
    filterOptions?: MemeFilterOptions
  ): Observable<GetMemeResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);

    if (filterOptions?.dateFrom) {
      params = params.set('dateFrom', filterOptions.dateFrom);
    }

    if (filterOptions?.dateTo) {
      params = params.set('dateTo', filterOptions.dateTo);
    }

    if (filterOptions?.tags && filterOptions.tags.length > 0) {
      params = params.set('filterBy', filterOptions.tags.join(','));
    }

    return this.http.get<GetMemeResponse>(this.API_URL, { params });
  }

  getMemeOfTheDay(): Observable<Meme> {
    return this.http.get<Meme>(`${this.API_URL}/daily`);
  }

  uploadMeme(image: File, tag: string): Observable<MemeUploadResponse> {
    const formData = new FormData();
    formData.append('image', image, image.name);
    formData.append('tag', tag);

    return this.http.post<MemeUploadResponse>(`${this.API_URL}/upload`, formData);
  }

  voteMeme(memeId: number, voteValue: number): Observable<VoteResponse> {
    return this.http.patch<VoteResponse>(`${this.API_URL}/vote`, {
      memeId,
      voteValue
    });
  }
}