import { ChangeDetectionStrategy, computed, Component, effect, inject, signal, Signal, ViewChild, ElementRef } from '@angular/core';
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
import { TaskService } from '../../task/service/task.service';
import { MatTabsModule } from '@angular/material/tabs';
import { StyleSwitcherService } from '../../services/style-switcher.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { PhotoMapComponent } from "../../photo-map/photo-map.component";
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Renderer2 } from '@angular/core';


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
    MatFormFieldModule, MatDatepickerModule,
    MatPaginatorModule,
    MatTabsModule,
    MatExpansionModule,
    PhotoMapComponent
  ],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' }, { provide: MatPaginatorIntl, useClass: RussianPaginatorIntl }],
})
export class PhotosComponent {
  taskService = inject(TaskService);
  phtotService = inject(PhotoService);
  styleSwitcherService = inject(StyleSwitcherService);
  readonly panelOpenState = signal(false);
  errorMessegeService = inject(ErrorMessageService);
  idTask!: string;
  readonly dialog = inject(MatDialog);
  entityes = signal<PhotoResponse[]>([]);
  private readonly photoSignal = signal<PhotoResponse | null>(null);
  isViewMap = signal(false);
  selectedPhoto = signal<PhotoResponse[]>([]);
  render = inject(Renderer2);
  @ViewChild('overlay') overlay!: ElementRef;
  previewImage: string | null = null;

  showPreview(file: string): void {
    if (file) this.previewImage = file;
  }

  closePreview(): void { this.previewImage = null; }
  currentPage = signal(0);
  pageSize = signal(5);

  paginatedPhotos = computed(() => {
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredValues().slice(startIndex, endIndex);
  });

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
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

  openMapOverlay(photo: PhotoResponse) {
    this.phtotService.currentMapPhotos.set([photo])
    this.isViewMap.set(true);
    this.render.setStyle(document.body, 'overflow', 'hidden');
  }

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
      filtered = filtered.filter(f => {
        // Поиск по адресу в ConstructMetadataResponse
        const hasAddressMatch = f.constructMetadataResponses.some(construct =>
          construct.address?.toLowerCase().includes(searchText.toLowerCase())
        );
        if (hasAddressMatch) {
          return true;
        }

        // Если ввели ТОЛЬКО двоеточие - показываем все (для начала ввода второй координаты)
        if (searchText.trim() === ':') {
          return true;
        }

        // Проверяем, есть ли разделитель координат (двоеточие)
        const hasColon = searchText.includes(':');

        if (hasColon) {
          // Разделяем по двоеточию
          const [leftPart, rightPart] = searchText.split(':').map(part => part.trim());

          const hasCoordMatch = f.constructMetadataResponses.some(construct => {
            if (construct.latitude && construct.longitude) {
              const latString = construct.latitude.toString().replace(',', '.');
              const lngString = construct.longitude.toString().replace(',', '.');

              let leftMatch = true;  // по умолчанию true если левая часть пустая
              let rightMatch = true; // по умолчанию true если правая часть пустая

              // Если есть левая часть - ищем по широте
              if (leftPart) {
                const searchLatPart = leftPart.replace(',', '.');
                leftMatch = latString.startsWith(searchLatPart);
              }

              // Если есть правая часть - ищем по долготе  
              if (rightPart) {
                const searchLngPart = rightPart.replace(',', '.');
                rightMatch = lngString.startsWith(searchLngPart);
              }

              return leftMatch && rightMatch;
            }
            return false;
          });

          return hasCoordMatch;
        } else {
          // Если нет двоеточия - ищем только по одному числу (широта ИЛИ долгота)
          const searchPart = searchText.replace(',', '.');

          const hasSingleMatch = f.constructMetadataResponses.some(construct => {
            if (construct.latitude && construct.longitude) {
              const latString = construct.latitude.toString().replace(',', '.');
              const lngString = construct.longitude.toString().replace(',', '.');

              return latString.startsWith(searchPart) || lngString.startsWith(searchPart);
            }
            return false;
          });

          return hasSingleMatch;
        }

        return false;
      });
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
}