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
    dialogTitle: string | null = null;
    dialogDisk: string | null = null;



    private readonly tasksSignal = signal<TaskResponse[]>([]);
    private readonly isVisibleAddSignal = signal(false);
    private readonly isVisibleEditSignal = signal(false);

    readonly tasks = this.tasksSignal.asReadonly();
    readonly visibleAdd = this.isVisibleAddSignal.asReadonly();
    readonly visibleEdit = this.isVisibleEditSignal.asReadonly();

    loadAll() {
        this.http.get<TaskResponse[]>(`${this.apiUrl}/all`).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => { },
        });
    }

    reportXLSX(taskId: string) {
        this.http.getBlob(`${this.url}main/v1/report/XLSX/${taskId}`).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${taskId}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => console.error('Ошибка загрузки отчета')
        });
    }

    add(task: TaskRquests) {
        this.http.post<TaskResponse[]>(`${this.apiUrl}/add`, task).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => { },
        });
    }

    save(task: TaskRquests) {
        this.http.post<TaskResponse[]>(`${this.apiUrl}/save`, task).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => { },
        });
    }

    delete(id: string) {
        this.http.delete<TaskResponse[]>(`${this.apiUrl}/delete/${id}`).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => { },
        });
    }

    // http://5.129.246.42:1818/main/v1/task/start/eef5337d-9811-41ff-8b17-65c9e487ac67
    startTask(id: string) {
        this.http.put<TaskResponse[]>(`${this.apiUrl}/start/${id}`, null).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => { },
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