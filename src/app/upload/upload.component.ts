import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '../services/http.service';
import { ErrorMessageService } from '../services/error-message.service';
import { environment } from '../../environments/environment';
import { UploadService } from './upload.service';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { PhotoRequest } from '../photo/service/photo-request';
import { FormsModule } from '@angular/forms';
import EXIF from 'exif-js';

interface UploadFile {
  file: File;
  preview?: string;
  isImage: boolean;
  progress: number;
  uploaded: boolean;
  error?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule
  ],
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
    });
  }

  private _uploadedCount = 0;
  get uploadedCount(): number { return this._uploadedCount; }

  concurrency = 4;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(input.files);
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
        error: null,
        latitude: null,
        longitude: null
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = e => {
          uploadFile.preview = e.target?.result as string;
          // Читаем EXIF данные после загрузки preview
          this.readExifData(file, uploadFile);
        };
        reader.readAsDataURL(file);
      }

      this.files.push(uploadFile);
    });
  }

  private readExifData(file: File, uploadFile: UploadFile): void {
    // Используем любую EXIF библиотеку, например exif-js
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const exif = EXIF.readFromBinaryFile(e.target.result);
      if (exif.GPSLatitude && exif.GPSLongitude) {
        // Конвертируем EXIF координаты в десятичные
        uploadFile.latitude = this.convertExifGps(exif.GPSLatitude, exif.GPSLatitudeRef);
        uploadFile.longitude = this.convertExifGps(exif.GPSLongitude, exif.GPSLongitudeRef);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private convertExifGps(coords: number[], ref: string): number {
    const decimal = coords[0] + coords[1] / 60 + coords[2] / 3600;
    return (ref === 'S' || ref === 'W') ? -decimal : decimal;
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
    if (this.uploading) return;
    this.files.splice(index, 1);
  }

  showPreview(file: UploadFile): void {
    if (file.isImage && file.preview) this.previewImage = file.preview;
  }

  closePreview(): void { this.previewImage = null; }

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
      const photoRequest: PhotoRequest = {
        name: uploadFile.file.name,
        taskId: this.id,
        latitude: uploadFile.latitude || null,
        longitude: uploadFile.longitude || null,
        contentType: uploadFile.file.type,
        fileSize: uploadFile.file.size
      };
      const response = await firstValueFrom(this.uploadService.initiateUpload(photoRequest));

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