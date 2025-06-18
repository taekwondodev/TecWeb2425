import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  GetMemeResponse,
  Meme,
  MemeFilterOptions,
  MemeUploadResponse,
  VoteResponse,
} from '../../shared/models/meme.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MemeService {
  private readonly API_URL = `${environment.apiUrl}/memes`;

  private readonly _memes = signal<Meme[]>([]);
  private readonly _currentMeme = signal<Meme | null>(null);
  private readonly _memeOfDay = signal<Meme | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);

  readonly memes = this._memes.asReadonly();
  readonly currentMeme = this._currentMeme.asReadonly();
  readonly memeOfDay = this._memeOfDay.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  readonly hasMorePages = computed(
    () => this._currentPage() < this._totalPages()
  );
  readonly hasPreviousPage = computed(() => this._currentPage() > 1);

  constructor(private readonly http: HttpClient) {}

  async getMemes(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'newest',
    filterOptions?: MemeFilterOptions
  ): Promise<GetMemeResponse> {
    this._isLoading.set(true);

    try {
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

      const response = await firstValueFrom(
        this.http.get<GetMemeResponse>(this.API_URL, { params })
      );

      this._memes.set(response.memes || []);
      this._currentPage.set(page);
      this._totalPages.set(response.totalPages || 0);

      return response;
    } finally {
      this._isLoading.set(false);
    }
  }

  async getMemeOfTheDay(): Promise<Meme> {
    this._isLoading.set(true);

    try {
      const meme = await firstValueFrom(
        this.http.get<Meme>(`${this.API_URL}/daily`)
      );

      this._memeOfDay.set(meme);
      return meme;
    } finally {
      this._isLoading.set(false);
    }
  }

  async getMemeById(id: number): Promise<Meme> {
    this._isLoading.set(true);

    try {
      const meme = await firstValueFrom(
        this.http.get<Meme>(`${this.API_URL}/${id}`)
      );

      this._currentMeme.set(meme);
      return meme;
    } finally {
      this._isLoading.set(false);
    }
  }

  async uploadMeme(image: File, tag: string): Promise<MemeUploadResponse> {
    this._isLoading.set(true);

    try {
      const formData = new FormData();
      formData.append('image', image, image.name);
      formData.append('tag', tag);

      return await firstValueFrom(
        this.http.post<MemeUploadResponse>(`${this.API_URL}`, formData)
      );
    } finally {
      this._isLoading.set(false);
    }
  }

  async getUserVote(memeId: number): Promise<number> {
    const response = await firstValueFrom(
      this.http.get<{ vote: number }>(`${this.API_URL}/${memeId}/vote`)
    );
    return response.vote;
  }

  async voteMeme(memeId: number, vote: number): Promise<VoteResponse> {
    const response = await firstValueFrom(
      this.http.patch<VoteResponse>(`${this.API_URL}/${memeId}/vote`, {
        vote,
      })
    );

    this.updateMemeVotes(memeId, vote, response);
    return response;
  }

  private updateMemeVotes(
    memeId: number,
    vote: number,
    response: VoteResponse
  ): void {
    const updateVotes = (meme: Meme): Meme => {
      const isUpvote = vote === 1;
      const voteType = isUpvote ? 'upvotes' : 'downvotes';
      const voteChange = response.removed ? -1 : 1;

      return {
        ...meme,
        [voteType]: meme[voteType] + voteChange,
      };
    };

    this._memes.update((memes) =>
      memes.map((meme) => (meme.id === memeId ? updateVotes(meme) : meme))
    );

    const currentMeme = this._currentMeme();
    if (currentMeme?.id === memeId) {
      this._currentMeme.set(updateVotes(currentMeme));
    }

    const memeOfDay = this._memeOfDay();
    if (memeOfDay?.id === memeId) {
      this._memeOfDay.set(updateVotes(memeOfDay));
    }
  }
}
