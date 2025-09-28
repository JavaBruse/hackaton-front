// src/app/upload/upload.component.ts
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '../services/http.service';
import { ErrorMessageService } from '../services/error-message.service';
import { environment } from '../../environments/environment';
import { UploadService, PhotoRequest } from './upload.service';
import { ActivatedRoute } from '@angular/router';


interface UploadFile {
  file: File;
  preview?: string;
  isImage: boolean;
  progress: number;    // 0..100 (инициализирован)
  uploaded: boolean;   // true если успешно
  error?: string | null;
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
  id!: string;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
      // this.postService.loadAll(this.id);
    });
  }


  // счётчик завершённых (успешных) загрузок
  private _uploadedCount = 0;
  get uploadedCount(): number { return this._uploadedCount; }

  // Параллелизм (можешь менять)
  concurrency = 4;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(input.files);
    // сбрасываем input для повторного выбора того же файла (опционально)
    input.value = '';
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
      const uploadFile: UploadFile = {
        file,
        isImage,
        progress: 0,
        uploaded: false,
        error: null
      };

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

  onDragLeave(): void { this.dragOver = false; }

  formatSize(size: number): string {
    if (size < 1024) return size + ' Б';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' КБ';
    return (size / (1024 * 1024)).toFixed(1) + ' МБ';
  }

  removeFile(index: number): void {
    // не даём удалять файл, если идёт загрузка (по желанию можно разрешить)
    if (this.uploading) return;
    this.files.splice(index, 1);
  }

  showPreview(file: UploadFile): void {
    if (file.isImage && file.preview) this.previewImage = file.preview;
  }

  closePreview(): void { this.previewImage = null; }

  // === главная логика: параллельная загрузка с лимитом concurrency ===
  async onUpload(): Promise<void> {
    if (this.files.length === 0) return;
    this.uploading = true;
    this._uploadedCount = 0;

    try {
      await this.uploadAllWithConcurrency(this.concurrency);
      console.log('All uploads finished');
    } catch (err) {
      console.error('Error during uploads', err);
    } finally {
      // очищаем список только от успешно загруженных
      this.files = this.files.filter(f => !f.uploaded);
      this.uploading = false;
    }
  }

  private async uploadAllWithConcurrency(concurrency: number): Promise<void> {
    let idx = 0;
    const total = this.files.length;

    const worker = async () => {
      while (true) {
        const i = idx++;
        if (i >= total) break;
        const file = this.files[i];
        await this.uploadSingle(file).catch(e => {
          // уже обработано внутри uploadSingle — просто лог
          console.error('uploadSingle error', e);
        });
      }
    };

    const workers: Promise<void>[] = [];
    const parallel = Math.min(concurrency, total);
    for (let w = 0; w < parallel; w++) workers.push(worker());
    await Promise.all(workers);
  }

  private async uploadSingle(uploadFile: UploadFile): Promise<void> {
    try {
      // 1) запрос presigned
      const photoRequest: PhotoRequest = {
        name: uploadFile.file.name,
        taskId: this.id,
        contentType: uploadFile.file.type,
        fileSize: uploadFile.file.size
      };

      const response = await firstValueFrom(this.uploadService.initiateUpload(photoRequest));

      // 2) загрузка через XHR с прогрессом
      await this.uploadService.uploadToS3WithProgress(response.uploadUrl, uploadFile.file, (percent) => {
        uploadFile.progress = percent;
      });

      uploadFile.uploaded = true;
      uploadFile.error = null;
      this._uploadedCount++;
    } catch (err: any) {
      uploadFile.error = err?.message || String(err);
      uploadFile.progress = 0;
      uploadFile.uploaded = false;
      console.error(`Error uploading ${uploadFile.file.name}:`, err);
    }
  }
}
