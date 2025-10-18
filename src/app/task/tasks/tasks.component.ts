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
import { Router } from '@angular/router';
import { PhotoResponse } from '../../photo/service/photo-response';
import { PhotoService } from '../../photo/service/photo.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Renderer2 } from '@angular/core';
import { PhotoMapComponent } from "../../photo-map/photo-map.component";
import { StartStepComponent } from "../../start-step/start-step.component";


export class RussianPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Фотографии:';
  override nextPageLabel = 'Следующая страница';
  override previousPageLabel = 'Предыдущая страница';
  override firstPageLabel = 'Первая страница';
  override lastPageLabel = 'Последняя страница';

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 из ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ?
      Math.min(startIndex + pageSize, length) :
      startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} из ${length}`;
  };
}

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
    DatePipe,
    MatExpansionModule,
    MatPaginatorModule,
    PhotoMapComponent,
    StartStepComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useClass: RussianPaginatorIntl }],

})
export class TasksComponent {
  taskService = inject(TaskService);
  errorMessegeService = inject(ErrorMessageService);
  styleSwithService = inject(StyleSwitcherService);
  editTaskId: string | null = null;
  entityes = signal<TaskResponse[]>([]);
  readonly dialog = inject(MatDialog);
  photoService = inject(PhotoService);
  render = inject(Renderer2);
  taskPaginationStates = new Map<string, { currentPage: number, pageSize: number }>();
  isViewMap = signal(false);
  getPaginatedTaskPhotos(task: TaskResponse) {
    const taskId = task.id!;

    if (!this.taskPaginationStates.has(taskId)) {
      this.taskPaginationStates.set(taskId, { currentPage: 0, pageSize: 2 });
    }

    const state = this.taskPaginationStates.get(taskId)!;
    const startIndex = state.currentPage * state.pageSize;
    const endIndex = startIndex + state.pageSize;

    return task.photos.slice(startIndex, endIndex);
  }

  onPhotoPageChange(event: PageEvent, task: TaskResponse) {
    const taskId = task.id!;
    this.taskPaginationStates.set(taskId, {
      currentPage: event.pageIndex,
      pageSize: event.pageSize
    });
  }

  getPaginationState(task: TaskResponse) {
    const taskId = task.id!;
    if (!this.taskPaginationStates.has(taskId)) {
      this.taskPaginationStates.set(taskId, { currentPage: 0, pageSize: 2 });
    }
    return this.taskPaginationStates.get(taskId)!;
  }


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

  constructor(private router: Router) {
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
      this.trackedTasks.set(id, photoCount);
      setTimeout(() => {
        this.startGlobalPolling();
      }, 10000);
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
    let pollingTime = 10000;
    const poll = () => {
      this.taskService.loadAllSilent().subscribe({
        next: (newTasks) => {
          let hasInProgress = false;
          let minPollingTime = 10000;
          newTasks.forEach(newTask => {
            if (this.trackedTasks.has(newTask.id!)) {
              this.taskService.updateTaskStatus(newTask.id!, newTask.status);
              if (newTask.status === 'IN_PROGRESS') {
                hasInProgress = true;
                const completedPhotos = newTask.photos.filter(p => p.status === 'COMPLETED').length;
                const totalPhotos = this.trackedTasks.get(newTask.id!)!;

                if (completedPhotos > 0) {
                  const progress = completedPhotos / totalPhotos;
                  const taskPollingTime = Math.max(2000, 10000 - (progress * 8000));
                  // Берем минимальное время из всех активных задач
                  minPollingTime = Math.min(minPollingTime, taskPollingTime);
                }
              } else if (newTask.status === 'COMPLETED') {
                this.trackedTasks.delete(newTask.id!);
              }
            }
          });
          pollingTime = minPollingTime;
          if (!hasInProgress) {
            this.stopGlobalPolling();
          } else {
            this.stopGlobalPolling();
            this.pollingInterval = setTimeout(poll, pollingTime);
          }
        }
      });
    };

    this.pollingInterval = setTimeout(poll, pollingTime);
  }

  private stopGlobalPolling() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopGlobalPolling();
  }

  closeOverlay(event: Event) {
    if (event.target === event.currentTarget) {
      this.isViewMap.set(false);
      this.render.removeStyle(document.body, 'overflow');
    }
  }

  closeMapButton() {
    this.isViewMap.set(false);
    this.render.removeStyle(document.body, 'overflow');
  }

  openMapOverlay(photos: PhotoResponse[]) {
    this.photoService.currentMapPhotos.set(photos)
    this.isViewMap.set(true);
    this.render.setStyle(document.body, 'overflow', 'hidden');
  }

  closeOverlayStep(event: Event) {
    if (event.target === event.currentTarget) {
      this.taskService.setVisibleStep(false);
      this.render.removeStyle(document.body, 'overflow');
    }
  }

  closeButtonStep() {
    this.taskService.setVisibleStep(false);
    this.render.removeStyle(document.body, 'overflow');
  }

  openOverlayStep() {
    this.taskService.setVisibleStep(true);
    this.render.setStyle(document.body, 'overflow', 'hidden');
  }
}
