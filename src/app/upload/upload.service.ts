// src/app/upload/upload.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../services/http.service';
import { environment } from '../../environments/environment';

export interface PhotoRequest {
    name: string;
    contentType?: string;
    fileSize?: number;
    id?: string;
    taskId: string;
    filePath?: string;
}

export interface PresignedUploadResponse {
    uploadUrl: string;
    objectKey: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
    private http = inject(HttpService);
    private apiUrl = environment.apiUrl + 'main/v1/photo/upload';

    initiateUpload(photoRequest: PhotoRequest): Observable<PresignedUploadResponse> {
        return this.http.post<PresignedUploadResponse>(this.apiUrl, photoRequest);
    }

    uploadToS3WithProgress(
        presignedUrl: string,
        file: File,
        onProgress: (percent: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                const proxiedUrl = presignedUrl.replace('https://s3.twcstorage.ru', '/s3-upload');
                xhr.open('PUT', proxiedUrl, true);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        const p = Math.round((ev.loaded / ev.total) * 100);
                        onProgress(p);
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        onProgress(100);
                        resolve();
                    } else {
                        reject(new Error(`Upload failed ${xhr.status} ${xhr.statusText} ${xhr.responseText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(file);
            } catch (err) {
                reject(err);
            }
        });
    }
}
