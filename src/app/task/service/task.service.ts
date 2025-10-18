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
    readonly taskUploadPhoto = signal<TaskResponse | null>(null);


    private readonly tasksSignal = signal<TaskResponse[]>([]);
    private readonly isVisibleAddSignal = signal(false);
    private readonly isVisibleEditSignal = signal(false);
    readonly isVisibleStepSignal = signal(false);

    readonly tasks = this.tasksSignal.asReadonly();
    readonly visibleAdd = this.isVisibleAddSignal.asReadonly();
    readonly visibleEdit = this.isVisibleEditSignal.asReadonly();

    loadAll() {
        this.http.get<TaskResponse[]>(`${this.apiUrl}/all`).subscribe({
            next: (tasks) => this.tasksSignal.set(tasks),
            error: () => { },
        });
    }

    loadAllSilent() {
        return this.http.get<TaskResponse[]>(`${this.apiUrl}/all`);
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

    addAndGetId(task: TaskRquests) {
        this.http.post<TaskResponse>(`${this.apiUrl}/add-get-id`, task).subscribe({
            next: (task) => this.taskUploadPhoto.set(task),
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


    updateTaskStatus(taskId: string, status: TaskResponse['status']) {
        this.tasksSignal.update(tasks =>
            tasks.map(task => task.id === taskId ? { ...task, status } : task)
        );
    }

    clear() {
        this.tasksSignal.set([]);
        this.isVisibleAddSignal.set(false);
        this.isVisibleEditSignal.set(false);
    }

    setVisibleAdd(value: boolean) {
        this.isVisibleAddSignal.set(value);
    }

    setVisibleStep(value: boolean) {
        this.isVisibleStepSignal.set(value);
    }
}