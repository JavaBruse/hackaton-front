import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ErrorMessageService } from '../../services/error-message.service';
import { lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { TaskService } from '../service/task.service';
import { TaskRquests } from '../service/task-request';

@Component({
  selector: 'app-task-add',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule
  ],
  templateUrl: './task-add.component.html',
  styleUrl: './task-add.component.css'
})
export class TaskAddComponent {
  taskService = inject(TaskService);
  private fb = inject(FormBuilder);
  private errorMessegeService = inject(ErrorMessageService);

  showPopup = false;
  popupInfo: string = '';

  form: FormGroup = this.fb.group({
    name: new FormControl<string | null>(null, Validators.required)
  });
  cancel() {
    this.taskService.setVisibleAdd(false);
  }
  save() {
    if (this.form.valid) {
      const task: TaskRquests = {
        id: null,
        name: this.form.value.name || null

      };
      try {
        this.taskService.add(task);
        this.cancel();
      } catch (error: any) {
        this.errorMessegeService.showError(error.message);
      }

    } else {
      this.errorMessegeService.showError("Форма не заполнена");
    }
  }
}
