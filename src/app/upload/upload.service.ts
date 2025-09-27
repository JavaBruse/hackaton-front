import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpService } from '../services/http.service';
import { Observable } from 'rxjs';

export interface PhotoRequest {
    id?: string;
    name: string;
    contentType: string;
    fileSize: number;
    taskId?: string;
    filePath?: string;
}

export interface PresignedUploadResponse {
    photoId: string;
    uploadUrl: string;
    objectKey: string;
    expiresAt: number;
}

@Injectable({
    providedIn: 'root',
})
export class UploadService {
    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'main/v1/photo/upload';

    // Получить Presigned URL от бэкенда
    initiateUpload(photoRequest: PhotoRequest): Observable<PresignedUploadResponse> {
        return this.http.post<PresignedUploadResponse>(this.apiUrl, photoRequest);
    }

    // Загрузить файл напрямую в S3 (используем нативный fetch)
    uploadToS3(presignedUrl: string, file: File): Promise<Response> {
        return fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
    }
}