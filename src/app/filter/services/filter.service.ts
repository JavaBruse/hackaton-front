import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { FilterResponseDto } from './filter-response.dto';
import { FilterRequestDto } from './filter-request.dto';

@Injectable({
    providedIn: 'root',
})
export class FilterService {
    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'main/v1/filter';

    // Сигналы — приватные
    private readonly filtersPublicAndMySignal = signal<FilterResponseDto[]>([]);
    private readonly filtersFollowAndMySignal = signal<FilterResponseDto[]>([]);
    private readonly visibleAddFilterSignal = signal(false);
    private readonly visibleEditFilterSignal = signal(false);

    // Сигналы наружу только для чтения
    readonly filtersPublicAndMy = this.filtersPublicAndMySignal.asReadonly();
    readonly filtersFollowAndMy = this.filtersFollowAndMySignal.asReadonly();
    readonly visibleAdd = this.visibleAddFilterSignal.asReadonly();
    readonly visibleEdit = this.visibleEditFilterSignal.asReadonly();


    /** --------------------- Методы для работы с API --------------------- */

    loadPublicAndMy() {
        this.http.get<FilterResponseDto[]>(`${this.apiUrl}/allPublicAndMy`).subscribe({
            next: (filters) => this.filtersPublicAndMySignal.set(filters),
            error: () => this.filtersPublicAndMySignal.set([]),
        });
    }

    loadFollowAndMy() {
        this.http.get<FilterResponseDto[]>(`${this.apiUrl}/allFollowAndMy`).subscribe({
            next: (filters) => this.filtersFollowAndMySignal.set(filters),
            error: () => this.filtersFollowAndMySignal.set([]),
        });
    }

    add(filter: FilterRequestDto) {
        this.http.post<FilterResponseDto[]>(`${this.apiUrl}/add`, filter).subscribe({
            next: (filters) => this.updateSignals(filters),
            error: () => this.updateSignals([]),
        });
    }

    save(filter: FilterRequestDto) {
        this.http.post<FilterResponseDto[]>(`${this.apiUrl}/save`, filter).subscribe({
            next: (filters) => this.updateSignals(filters),
            error: () => this.updateSignals([]),
        });
    }

    follow(id: string) {
        this.http.put<FilterResponseDto[]>(`${this.apiUrl}/follow/${id}`, null).subscribe({
            next: (filters) => this.updateSignals(filters),
            error: () => this.updateSignals([]),
        });
    }

    delete(id: string) {
        this.http.delete<FilterResponseDto[]>(`${this.apiUrl}/delete/${id}`).subscribe({
            next: (filters) => this.updateSignals(filters),
            error: () => this.updateSignals([]),
        });
    }

    setVisibleAdd(value: boolean) {
        this.visibleAddFilterSignal.set(value);
    }

    setVisibleEdit(value: boolean) {
        this.visibleEditFilterSignal.set(value);
    }

    /** --------------------- Сброс состояния --------------------- */
    clear() {
        this.filtersPublicAndMySignal.set([]);
        this.filtersFollowAndMySignal.set([]);
        this.visibleAddFilterSignal.set(false);
        this.visibleEditFilterSignal.set(false);
    }

    private updateSignals(filters: FilterResponseDto[]) {
        this.filtersPublicAndMySignal.set(filters);
        // this.filtersFollowAndMySignal.set(filters);
    }
}
