import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Comment } from '../../models/comment.model';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { CommentService } from '../../../core/services/comment.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrls: ['./comment-section.component.css']
})
export class CommentSectionComponent implements OnInit {
  @Input() memeId!: number;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadComments();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get content() { return this.commentForm.get('content'); }

  async loadComments(): Promise<void> {
    try {
      this.comments = (await this.commentService.getComments(this.memeId)).comments;
    } catch (error) {
      console.error('Error loading comments:', error);
      this.error = 'Failed to load comments';
    }
  }

  async submitComment(): Promise<void> {
    if (this.commentForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      await this.commentService.addComment(this.memeId, this.content!.value);
      await this.loadComments();
      this.commentForm.reset();
    } catch (error) {
      console.error('Error adding comment:', error);
      this.error = 'Failed to add comment';
    } finally {
      this.isSubmitting = false;
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}