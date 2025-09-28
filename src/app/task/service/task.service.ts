import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { TaskResponse } from './task-response';
import { TaskRquests } from './task-request';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    private http = inject(HttpService);
    private url = environment.apiUrl;
    private apiUrl = this.url + 'main/v1/task';

    private readonly tasksSignal = signal<TaskResponse[]>([]);
    private readonly isVisibleAddSignal = signal(false);
    private readonly isVisibleEditSignal = signal(false);

    readonly tasks = this.tasksSignal.asReadonly();
    readonly visibleAdd = this.isVisibleAddSignal.asReadonly();
    readonly visibleEdit = this.isVisibleEditSignal.asReadonly();

    loadAll() {
        this.http.get<TaskResponse[]>(`${this.apiUrl}/all`).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => this.tasksSignal.set([]),
        });
    }

    add(task: TaskRquests) {
        this.http.post<TaskResponse[]>(`${this.apiUrl}/add`, task).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => this.tasksSignal.set([]),
        });
    }

    save(task: TaskRquests) {
        this.http.post<TaskResponse[]>(`${this.apiUrl}/save`, task).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => this.tasksSignal.set([]),
        });
    }

    delete(id: string) {
        this.http.delete<TaskResponse[]>(`${this.apiUrl}/delete/${id}`).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => this.tasksSignal.set([]),
        });
    }

    clear() {
        this.tasksSignal.set([]);
        this.isVisibleAddSignal.set(false);
        this.isVisibleEditSignal.set(false);
    }

    setVisibleAdd(value: boolean) {
        this.isVisibleAddSignal.set(value);
    }
}