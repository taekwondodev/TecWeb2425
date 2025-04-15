import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../../models/comment.model';
import { MemeService } from '../../../core/services/meme.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.scss']
})
export class CommentSectionComponent implements OnInit {
  @Input() memeId!: string;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isSubmitting = false;
  
  constructor(
    private memeService: MemeService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
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
  
  loadComments(): void {
    this.memeService.getComments(this.memeId).subscribe(comments => {
      this.comments = comments;
    });
  }
  
  submitComment(): void {
    if (this.commentForm.invalid || this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    const content = this.commentForm.get('content')?.value;
    
    this.memeService.addComment(this.memeId, content).subscribe({
      next: (newComment) => {
        this.comments.unshift(newComment);
        this.commentForm.reset();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.isSubmitting = false;
      }
    });
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}