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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';

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
    DatePipe,
    MatFormFieldModule, MatDatepickerModule
  ],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' }],
})
export class PhotosComponent {
  phtotService = inject(PhotoService);
  errorMessegeService = inject(ErrorMessageService);
  idTask!: string;
  readonly dialog = inject(MatDialog);
  entityes = signal<PhotoResponse[]>([]);
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  rangeValueChanges = toSignal(this.range.valueChanges, {
    initialValue: { start: null, end: null }
  });

  dateRangeSignal = computed(() => {
    const rangeValues = this.rangeValueChanges();
    return {
      start: rangeValues.start,
      end: rangeValues.end
    };
  });

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
    const dateRange = this.dateRangeSignal();

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

    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(f => {
        const photoDate = new Date(f.updatedAt);

        let startCondition = true;
        let endCondition = true;

        if (dateRange.start) {
          startCondition = photoDate >= dateRange.start;
        }

        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setDate(endDate.getDate() + 1);
          endCondition = photoDate < endDate;
        }

        return startCondition && endCondition;
      });
    }

    return filtered;
  });

  clearFilter() {
    this.searchControl.setValue('');
    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    this.range.patchValue({
      start: threeYearsAgo,
      end: today
    });
  }
  /////////////////////////


  constructor(private route: ActivatedRoute) {
    effect(() => {
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

    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);
    this.range.patchValue({
      start: threeYearsAgo,
      end: today
    });
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