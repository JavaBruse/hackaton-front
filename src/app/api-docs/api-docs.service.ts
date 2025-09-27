import { Injectable, signal, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpService } from '../services/http.service';
import { Observable } from 'rxjs';

export interface ApiServiceInfo {
    name: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApiDocsService {

    private http = inject(HttpService);

    selectedService = signal<ApiServiceInfo | null>(null);

    // Массив доступных сервисов (можно расширять)
    services: ApiServiceInfo[] = [
        { name: 'Security', url: environment.apiUrl + 'security/v3/api-docs' }
        { name: 'Main', url: environment.apiUrl + 'main/v3/api-docs' }
    ];

    // Метод для получения списка сервисов
    getServices(): ApiServiceInfo[] {
        return this.services;
    }

    // Метод для выбора сервиса
    selectService(service: ApiServiceInfo) {
        this.selectedService.set(service);
    }

    // Если нужно, можно запросить спецификацию напрямую через Http
    fetchApiDocs(service: ApiServiceInfo): Observable<any> {
        return this.http.get(service.url);
    }
}
