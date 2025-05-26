import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GetMemeResponse, Meme, MemeFilterOptions, MemeUploadResponse, VoteResponse } from '../../shared/models/meme.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemeService {
  private readonly API_URL = `${environment.apiUrl}/memes`;

  constructor(private readonly http: HttpClient) { }

  async getMemes(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'newest',
    filterOptions?: MemeFilterOptions
  ): Promise<GetMemeResponse> {
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

    return firstValueFrom(this.http.get<GetMemeResponse>(this.API_URL, { params }));
  }

  async getMemeOfTheDay(): Promise<Meme> {
    return firstValueFrom(this.http.get<Meme>(`${this.API_URL}/daily`));
  }

  async getMemeById(id: number): Promise<Meme> {
    return firstValueFrom(this.http.get<Meme>(`${this.API_URL}/${id}`));
  }

  async uploadMeme(image: File, tag: string): Promise<MemeUploadResponse> {
    const formData = new FormData();
    formData.append('image', image, image.name);
    formData.append('tag', tag);

    return firstValueFrom(
      this.http.post<MemeUploadResponse>(`${this.API_URL}`, formData)
    );
  }

  async getUserVote(memeId: number): Promise<number> {
    const response = await firstValueFrom(
      this.http.get<{ vote: number }>(`${this.API_URL}/${memeId}/vote`)
    );
    return response.vote;
  }

  async voteMeme(memeId: number, vote: number): Promise<VoteResponse> {
    return firstValueFrom(
      this.http.patch<VoteResponse>(`${this.API_URL}/${memeId}/vote`, {
        vote
      })
    );
  }
}