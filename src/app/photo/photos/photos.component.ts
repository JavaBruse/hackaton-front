import { ChangeDetectionStrategy, computed, Component, effect, inject, signal } from '@angular/core';
import { ErrorMessageService } from '../../services/error-message.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
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
import { PhotoResponse } from '../service/photo-response';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


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
  entityes = signal<PhotoResponse[]>([]);


  /////////////////////////
  selectedControl = new FormControl<'all' | 'TASK_NEW' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  searchControl = new FormControl('');
  searchSignal = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  selectedSignal = toSignal(this.selectedControl.valueChanges, {
    initialValue: 'all' as const
  });

  filteredValues = computed(() => {
    const searchText = this.searchSignal()?.trim().toLowerCase();
    const filterType = this.selectedSignal();
    let filtered = [...this.phtotService.photos()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

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

    if (searchText) {
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(searchText)
        // f.data?.toLowerCase().includes(searchText) 
      );
    }

    return filtered;
  });

  clearFilter() {
    this.searchControl.setValue('');
  }
  /////////////////////////


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