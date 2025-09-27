import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HttpService } from '../services/http.service';
import { ErrorMessageService } from '../services/error-message.service';
import { environment } from '../../environments/environment';
import { UploadService, PhotoRequest, PresignedUploadResponse } from './upload.service';

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
  uploadService = inject(UploadService);
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

  // НОВЫЙ МЕТОД ЗАГРУЗКИ
  async onUpload(): Promise<void> {
    if (this.files.length === 0) return;

    this.uploading = true;

    try {
      // Загружаем файлы последовательно
      for (const uploadFile of this.files) {
        try {
          // 1. Получаем Presigned URL от бэкенда
          const photoRequest: PhotoRequest = {
            name: uploadFile.file.name,
            contentType: uploadFile.file.type,
            fileSize: uploadFile.file.size
          };

          const response = await this.uploadService.initiateUpload(photoRequest).toPromise();

          if (!response) {
            throw new Error('Не удалось получить URL для загрузки');
          }

          // 2. Загружаем файл напрямую в S3
          const s3Response = await this.uploadService.uploadToS3(response.uploadUrl, uploadFile.file);

          if (s3Response.ok) {
            console.log('Файл успешно загружен:', uploadFile.file.name);
            console.log('Постоянный URL:', response.objectKey);
          } else {
            throw new Error(`Ошибка загрузки в S3: ${s3Response.status}`);
          }

        } catch (error) {
          console.error(`Ошибка загрузки файла ${uploadFile.file.name}:`, error);
        }
      }

      console.error('Загрузка завершена');
      this.files = []; // Очищаем список после загрузки

    } catch (error) {
      console.error('Общая ошибка загрузки:', error);
      console.error('Ошибка при загрузке файлов');
    } finally {
      this.uploading = false;
    }
  }

}
