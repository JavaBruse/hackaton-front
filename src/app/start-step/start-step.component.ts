import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, FormsModule, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { ErrorMessageService } from '../services/error-message.service';
import { MatButtonModule } from '@angular/material/button';
import { TaskService } from '../task/service/task.service';
import { TaskRquests } from '../task/service/task-request';
import { UploadStepComponent } from "../upload-step/upload-step.component";
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-start-step',
  imports: [MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule, UploadStepComponent],
  templateUrl: './start-step.component.html',
  styleUrl: './start-step.component.css'
})
export class StartStepComponent {
  taskService = inject(TaskService);
  private fb = inject(FormBuilder);
  private errorMessegeService = inject(ErrorMessageService);
  private pollingInterval: any;
  private trackedTasks = new Map<string, number>();
  showPopup = false;
  popupInfo: string = '';
  render = inject(Renderer2);
  form: FormGroup = this.fb.group({
    name: new FormControl<string | null>(null, Validators.required)
  });

  async saveTask() {
    if (this.form.valid) {
      const task: TaskRquests = {
        id: null,
        name: this.form.value.name || null

      };
      try {
        await this.taskService.addAndGetId(task);
        // console.log(this.taskService.taskUploadPhoto()?.id);
        this.taskService.uploadStep.set(1);
      } catch (error: any) {
        this.errorMessegeService.showError(error.message);
      }
    } else {
      this.errorMessegeService.showError("Форма не заполнена");
    }
  }

  startTask() {
    const task = this.taskService.taskUploadPhoto();
    if (task && task.id) {
      this.taskService.startTask(task.id);
      this.trackedTasks.set(task.id, task.photos.length);
      setTimeout(() => {
        this.startGlobalPolling();
      }, 10000);
    }
    this.closeButtonStep();
  }

  closeButtonStep() {
    this.taskService.setVisibleStep(false);
    this.render.removeStyle(document.body, 'overflow');
  }


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
                this.taskService.loadAll();
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
}
