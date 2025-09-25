import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpService } from '../services/http.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiDocsService {

    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'security/v3/api-docs';

    getApiDocs() {
        return this.http.get(this.apiUrl);
    }
}
