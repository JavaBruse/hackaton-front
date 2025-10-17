import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ErrorMessageService } from '../../services/error-message.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';
import { TaskService } from '../service/task.service';
import { TaskResponse } from '../service/task-response';
import { TaskAddComponent } from "../task-add/task-add.component";
import { TaskEditComponent } from "../task-edit/task-edit.component";
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../dialog/dialog.component';
import { StyleSwitcherService } from '../../services/style-switcher.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tasks',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    TaskAddComponent,
    TaskEditComponent,
    DatePipe
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent {
  taskService = inject(TaskService);
  errorMessegeService = inject(ErrorMessageService);
  styleSwithService = inject(StyleSwitcherService);
  editTaskId: string | null = null;
  entityes = signal<TaskResponse[]>([]);

  readonly dialog = inject(MatDialog);

  /////////////////////////"TASK_NEW" | "IN_PROGRESS" | "COMPLETED"

  selectedControl = new FormControl<'all' | 'TASK_NEW' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  searchControl = new FormControl('');


  selectedSignal = toSignal(this.selectedControl.valueChanges, {
    initialValue: 'all' as const
  });

  filteredValues = computed(() => {
    const filterType = this.selectedSignal();
    let filtered = [...this.taskService.tasks()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    switch (filterType) {
      case 'TASK_NEW':
        filtered = filtered.filter(f => f.status === "TASK_NEW");
        break;
      case 'IN_PROGRESS':
        filtered = filtered.filter(f => f.status === "IN_PROGRESS");
        break;
      case 'COMPLETED':
        filtered = filtered.filter(f => f.status === "COMPLETED");
        break;
    }

    return filtered;
  });

  /////////////////////////

  constructor() {
    effect(() => {
      this.taskService.loadAll();
    });
  }

  ngOnInit() {
    if (this.taskService.tasks().length === 0) {
      this.taskService.tasks();
    }
  }

  startEdit(task: TaskResponse) {
    this.editTaskId = task.id;
  }

  finishEdit() {
    this.editTaskId = null;
  }

  delete(id: string | null) {
    if (id) {
      this.taskService.delete(id);
    } else {
      this.errorMessegeService.showError('id не может быть null');
    }
  }
  startTask(id: string | null, photoCount: number) {
    if (id) {
      this.taskService.startTask(id);
      setTimeout(() => {
        this.taskService.loadAllSilent().subscribe({
          next: (tasks) => {
            const task = tasks.find(t => t.id === id);
            if (task?.status === 'IN_PROGRESS') {
              this.trackedTasks.set(id, photoCount);
              this.startGlobalPolling();
            }
          }
        });
      }, 1000);
    }
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string, photoId: string | null): void {
    this.taskService.dialogTitle = "Удаление";
    this.taskService.dialogDisk = "Действие не обратимо, Вы уверены?";
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.delete(photoId);
      }
    });
  }

  openDialogTask(enterAnimationDuration: string, exitAnimationDuration: string, taskId: string | null, photoCount: number): void {
    this.taskService.dialogTitle = "Запуск задачи";
    this.taskService.dialogDisk = "Запуск задачи не обратим, пока задача не завершится, её нельзя будет удалить!";
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.startTask(taskId, photoCount);
      }
    });
  }

  getReport(id: string) {
    if (id) {
      this.taskService.reportXLSX(id);
    }
  }

  private pollingInterval: any;
  private trackedTasks = new Map<string, number>();

  private startGlobalPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(() => {
      this.taskService.loadAllSilent().subscribe({
        next: (newTasks) => {
          newTasks.forEach(newTask => {
            if (this.trackedTasks.has(newTask.id!)) {
              this.taskService.updateTaskStatus(newTask.id!, newTask.status);

              if (newTask.status !== 'IN_PROGRESS') {
                this.trackedTasks.delete(newTask.id!);
              }
            }
          });

          if (this.trackedTasks.size === 0) {
            this.stopGlobalPolling();
          }
        }
      });
    }, this.calculatePollingInterval());
  }

  private calculatePollingInterval(): number {
    const maxPhotoCount = Math.max(...Array.from(this.trackedTasks.values()));
    return maxPhotoCount * 3000;
  }

  private stopGlobalPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.trackedTasks.clear();
    }
  }

  ngOnDestroy() {
    this.stopGlobalPolling();
  }
}
