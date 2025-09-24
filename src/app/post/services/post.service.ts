import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { PostResponse } from './post-response.dto';
@Injectable({
    providedIn: 'root',
})
export class PostService {
    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'main/v1/post';
    readonly postSignal = signal<PostResponse[]>([]);

    loadAll(id: string) {
        this.http.get<PostResponse[]>(`${this.apiUrl}/all/` + id).subscribe({
            next: (sources) => {
                const sortedPosts = sources.sort((a, b) => b.date - a.date);
                this.postSignal.set(sortedPosts);
            },
            error: () => this.postSignal.set([]),
        });
    }

    clear() {
        this.postSignal.set([]);
    }
}