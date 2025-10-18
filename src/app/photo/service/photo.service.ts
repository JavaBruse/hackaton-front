import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { PhotoRequest } from './photo-request';
import { PhotoResponse } from './photo-response';

@Injectable({
    providedIn: 'root',
})
export class PhotoService {
    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'main/v1/photo';
    readonly currentMapPhotos = signal<PhotoResponse[]>([])
    private readonly photosSignal = signal<PhotoResponse[]>([]);
    readonly photos = this.photosSignal.asReadonly();

    setCurrentMapPhotosSignal(photos: PhotoResponse[]) {
        this.currentMapPhotos.set(photos);
    }

    loadAll() {
        this.http.get<PhotoResponse[]>(`${this.apiUrl}/all`).subscribe({
            next: (photos) => this.photosSignal.set(photos),
            error: () => { },
        });
    }

    loadAllByTask(taskId: string) {
        this.http.get<PhotoResponse[]>(`${this.apiUrl}/all/${taskId}`).subscribe({
            next: (photos) => this.photosSignal.set(photos),
            error: () => { },
        });
    }

    add(photo: PhotoRequest) {
        this.http.post<PhotoResponse[]>(`${this.apiUrl}/add`, photo).subscribe({
            next: (photos) => this.photosSignal.set(photos),
            error: () => { },
        });
    }

    save(photo: PhotoRequest) {
        this.http.post<PhotoResponse[]>(`${this.apiUrl}/save`, photo).subscribe({
            next: (photos) => this.photosSignal.set(photos),
            error: () => { },
        });
    }

    delete(id: string) {
        this.http.delete<PhotoResponse[]>(`${this.apiUrl}/delete/${id}`).subscribe({
            next: (photos) => this.photosSignal.set(photos),
            error: () => { },
        });
    }

    clear() {
        this.photosSignal.set([]);
    }
}