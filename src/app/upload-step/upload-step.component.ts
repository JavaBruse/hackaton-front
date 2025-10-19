import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '../services/http.service';
import { ErrorMessageService } from '../services/error-message.service';
import { environment } from '../../environments/environment';
import { UploadService } from '../upload/upload.service';
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
import { ReactiveFormsModule } from '@angular/forms';
import { PhotoRequest } from '../photo/service/photo-request';
import { FormsModule } from '@angular/forms';
import exifr from 'exifr';
import { ChangeDetectorRef } from '@angular/core';
import { TaskService } from '../task/service/task.service';


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
  selector: 'app-upload-step',
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
    MatCheckboxModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './upload-step.component.html',
  styleUrl: './upload-step.component.css'
})
export class UploadStepComponent {
  files: UploadFile[] = [];
  http = inject(HttpService);
  uploadService = inject(UploadService);
  errorMessage = inject(ErrorMessageService);
  taskService = inject(TaskService);
  urlApi = environment.apiUrl;
  uploading = false;
  dragOver = false;
  previewImage: string | null = null;
  id!: string;
  private cdRef = inject(ChangeDetectorRef);
  @Output() nextStep = new EventEmitter<void>();

  onSomeButtonClick() {
    this.nextStep.emit();
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
    this.cdRef.detectChanges();
  }

  async addFiles(fileList: FileList): Promise<void> {
    for (const file of Array.from(fileList)) {
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
        reader.onload = e => uploadFile.preview = e.target?.result as string;
        reader.readAsDataURL(file);
        await this.readExifData(file, uploadFile);
      }

      this.files.push(uploadFile);
    }
    this.cdRef.detectChanges();

  }

  private async readExifData(file: File, uploadFile: UploadFile): Promise<void> {
    try {
      const exif = await exifr.parse(file);
      console.log('EXIF data:', exif);

      if (exif?.latitude && exif?.longitude) {
        // exifr уже конвертирует в десятичные градусы
        uploadFile.latitude = exif.latitude;
        uploadFile.longitude = exif.longitude;
      } else if (exif?.GPSLatitude && exif?.GPSLongitude) {
        uploadFile.latitude = exif.GPSLatitude;
        uploadFile.longitude = exif.GPSLongitude;
      }
    } catch (error) {
      console.log('EXIF read error:', error);
    }
  }

  private convertExifGps(coords: any, ref: string): number {
    // coords может быть массивом [deg, min, sec] или строкой
    if (Array.isArray(coords)) {
      const deg = coords[0];
      const min = coords[1];
      const sec = coords[2];
      const decimal = deg + min / 60 + sec / 3600;
      return (ref === 'S' || ref === 'W') ? -decimal : decimal;
    }
    return 0;
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
    this.cdRef.detectChanges();
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
    this.cdRef.detectChanges();
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
    this.cdRef.detectChanges();
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
    this.cdRef.detectChanges();
    this.taskService.photosIsPresent.set(true);
  }

  private async uploadSingle(uploadFile: UploadFile): Promise<void> {
    try {
      const photoRequest: PhotoRequest = {
        name: uploadFile.file.name,
        taskId: this.taskService.taskUploadPhoto()?.id || '',
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
    this.onSomeButtonClick();
    this.cdRef.detectChanges();
    this.taskService.photosIsPresent.set(true);
  }
}