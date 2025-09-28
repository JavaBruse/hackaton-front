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

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string, photoId: string | null): void {
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
}
