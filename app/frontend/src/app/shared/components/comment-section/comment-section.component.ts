import {
  Component,
  inject,
  Input,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Comment } from '../../models/comment.model';
import { AuthService } from '../../../core/services/auth.service';
import { CommentService } from '../../../core/services/comment.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  styleUrls: ['./comment-section.component.css'],
})
export class CommentSectionComponent implements OnInit {
  @Input() memeId!: number;

  private readonly _comments = signal<Comment[]>([]);
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _commentError = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly comments = this._comments.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly commentError = this._commentError.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());
  readonly hasComments = computed(() => this._comments().length > 0);

  commentForm: FormGroup;

  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadComments();
  }

  get content() {
    return this.commentForm.get('content');
  }

  async loadComments(): Promise<void> {
    try {
      const response = await this.commentService.getComments(this.memeId);
      this._comments.set(response.comments);
      this._error.set(null);
    } catch (error) {
      console.error('Error loading comments:', error);
      this._error.set('Failed to load comments');
    }
  }

  async submitComment(): Promise<void> {
    if (this.commentForm.invalid || this._isSubmitting()) {
      this._commentError.set(true);
      return;
    }

    this._isSubmitting.set(true);
    this._error.set(null);
    this._commentError.set(false);

    try {
      await this.commentService.addComment(this.memeId, this.content!.value);
      await this.loadComments();
      this.commentForm.reset();
    } catch (error) {
      console.error('Error adding comment:', error);
      this._error.set('Failed to add comment');
    } finally {
      this._isSubmitting.set(false);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
