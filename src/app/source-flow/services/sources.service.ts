import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { Observable } from 'rxjs';
import { SourceFlowResponse } from './source-flow-response.dto';
import { SourceFlowRequest } from './source-flow-request.dto';
import { VkGroupResponse } from './vkgroup-response.dto';
import { FilterService } from '../../filter/services/filter.service';

@Injectable({
    providedIn: 'root',
})
export class SourceService {
    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'main/v1/source';
    private filterService = inject(FilterService);

    // Приватные сигналы
    private readonly sourcePublicAndMySignal = signal<SourceFlowResponse[]>([]);
    private readonly sourceFollowAndMySignal = signal<SourceFlowResponse[]>([]);
    private readonly isVisibleAddSignal = signal(false);
    private readonly isVisibleEditSignal = signal(false);

    // Наружу отдаём только readonly
    readonly sourcePublicAndMy = this.sourcePublicAndMySignal.asReadonly();
    readonly sourceFollowAndMy = this.sourceFollowAndMySignal.asReadonly();
    readonly visibleAdd = this.isVisibleAddSignal.asReadonly();
    readonly visibleEdit = this.isVisibleEditSignal.asReadonly();

    /** --------------------- Загрузка данных --------------------- */
    loadPublicAndMy() {
        this.http.get<SourceFlowResponse[]>(`${this.apiUrl}/allPublicAndMy`).subscribe({
            next: (sources) => this.sourcePublicAndMySignal.set(sources),
            error: () => this.sourcePublicAndMySignal.set([]),
        });
    }

    loadFollowAndMy() {
        this.http.get<SourceFlowResponse[]>(`${this.apiUrl}/allFollowAndMy`).subscribe({
            next: (sources) => this.sourceFollowAndMySignal.set(sources),
            error: () => this.sourceFollowAndMySignal.set([]),
        });
    }

    /** --------------------- CRUD --------------------- */
    add(source: SourceFlowRequest) {
        this.http.post<SourceFlowResponse[]>(`${this.apiUrl}/add`, source).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    save(source: SourceFlowRequest) {
        this.http.post<SourceFlowResponse[]>(`${this.apiUrl}/save`, source).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    follow(id: string) {
        this.http.put<SourceFlowResponse[]>(`${this.apiUrl}/follow/${id}`, null).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    addFilterSource(idSource: string, idFilter: string) {
        this.http.put<SourceFlowResponse[]>(`${this.apiUrl}/addFilter/${idSource}/${idFilter}`, null).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    removeFilterSource(idSource: string) {
        this.http.delete<SourceFlowResponse[]>(`${this.apiUrl}/removeFilter/${idSource}`).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    updatePrivate(idSource: string, isPrivate: boolean) {
        this.http.put<SourceFlowResponse[]>(`${this.apiUrl}/updatePrivate/${idSource}/${isPrivate}`, null).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    delete(id: string) {
        this.http.delete<SourceFlowResponse[]>(`${this.apiUrl}/delete/${id}`).subscribe({
            next: (sources) => this.updateSignals(sources),
            error: () => this.updateSignals([]),
        });
    }

    /** --------------------- Вспомогательные --------------------- */
    private updateSignals(sources: SourceFlowResponse[]) {
        this.sourcePublicAndMySignal.set(sources);
    }

    clear() {
        this.sourcePublicAndMySignal.set([]);
        this.sourceFollowAndMySignal.set([]);
        this.isVisibleAddSignal.set(false);
        this.isVisibleEditSignal.set(false);
    }

    /** --------------------- UI управление --------------------- */
    setVisibleAdd(value: boolean) {
        this.loadFollowAndMy();
        this.filterService.loadFollowAndMy();
        this.isVisibleAddSignal.set(value);
    }

    setVisibleEdit(value: boolean) {
        this.isVisibleEditSignal.set(value);
    }

    getGroupVK(name: string): Observable<VkGroupResponse> {
        const urlVK = this.url + `vk/v1/group/search?name=${name}`;
        return this.http.get<VkGroupResponse>(urlVK);
    }
}
