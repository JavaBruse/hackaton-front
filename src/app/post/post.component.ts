import { Component, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostService } from './services/post.service';
import { ErrorMessageService } from '../services/error-message.service';
import { VkWidgetService } from './services/VkWidge.service';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-post',
  imports: [
    DatePipe,
    MatCardModule
  ],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent {
  postService = inject(PostService);
  errorMessegeService = inject(ErrorMessageService);
  vkWidgetService = inject(VkWidgetService);

  id!: string;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
      this.postService.loadAll(this.id);
    });
  }

  trackByPostIndex(index: number): number {
    return index;
  }

  trackByAttachmentIndex(index: number): number {
    return index;
  }

  fullscreenImage: string | null = null;

  toggleFullscreen(imageUrl: string) {
    if (this.fullscreenImage === imageUrl) {
      this.fullscreenImage = null;
    } else {
      this.fullscreenImage = imageUrl;
    }
  }

  closeFullscreen() {
    this.fullscreenImage = null;
  }

  isFullscreen(imageUrl: string): boolean {
    return this.fullscreenImage === imageUrl;
  }

}
