import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HttpService } from '../services/http.service';
import { ErrorMessageService } from '../services/error-message.service';
import { environment } from '../../environments/environment';

interface UploadFile {
  file: File;
  preview?: string;
  isImage: boolean;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  files: UploadFile[] = [];
  http = inject(HttpService);
  errorMessage = inject(ErrorMessageService);
  urlApi = environment.apiUrl;
  uploading = false;
  dragOver = false;
  previewImage: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(input.files);
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (!event.dataTransfer?.files) return;
    this.addFiles(event.dataTransfer.files);
  }

  addFiles(fileList: FileList): void {
    Array.from(fileList).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const uploadFile: UploadFile = { file, isImage };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = e => uploadFile.preview = e.target?.result as string;
        reader.readAsDataURL(file);
      }

      this.files.push(uploadFile);
    });
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  formatSize(size: number): string {
    if (size < 1024) return size + ' Б';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' КБ';
    return (size / (1024 * 1024)).toFixed(1) + ' МБ';
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  showPreview(file: UploadFile): void {
    if (file.isImage && file.preview) {
      this.previewImage = file.preview;
    }
  }

  closePreview(): void {
    this.previewImage = null;
  }

  onUpload(): void {
    if (this.files.length === 0) return;

    const formData = new FormData();
    this.files.forEach(f => formData.append('files', f.file));

    this.uploading = true;

    // this.http.post(this.uploadUrl, formData, {
    //   reportProgress: true,
    //   observe: 'events'
    // }).subscribe({
    //   next: event => {
    //     if (event.type === HttpEventType.Response) {
    //       alert('Файлы успешно отправлены!');
    //       this.files = [];
    //       this.uploading = false;
    //     }
    //   },
    //   error: () => {
    //     alert('Ошибка при загрузке файлов');
    //     this.uploading = false;
    //   }
    // });

  }

}
