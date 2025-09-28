import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ErrorMessageService } from '../../services/error-message.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PhotoService } from '../service/photo.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../dialog/dialog.component';


@Component({
  selector: 'app-photos',
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
    DatePipe
  ],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotosComponent {
  phtotService = inject(PhotoService);
  errorMessegeService = inject(ErrorMessageService);
  idTask!: string;
  readonly dialog = inject(MatDialog);

  constructor(private route: ActivatedRoute) {
    effect(() => {
      console.log(this.idTask)
      if (this.idTask) {
        this.phtotService.loadAllByTask(this.idTask);

      } else {
        this.phtotService.loadAll();
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.idTask = params.get('id')!;
    });

    if (this.phtotService.photos().length === 0) {
      this.phtotService.photos();
    }
  }

  delete(id: string | null) {
    if (id) {
      this.phtotService.delete(id);
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