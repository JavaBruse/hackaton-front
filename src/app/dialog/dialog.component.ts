import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TaskService } from '../task/service/task.service';


@Component({
  selector: 'app-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogTitle, MatDialogContent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent {
  readonly dialogRef = inject(MatDialogRef<DialogComponent>);
  taskService = inject(TaskService);
  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
