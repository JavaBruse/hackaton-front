import { Component, computed, effect, inject, signal } from '@angular/core';
import { FilterService } from '../services/filter.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FilterAddComponent } from "../filter-add/filter-add.component";
import { FilterEditComponent } from "../filter-edit/filter-edit.component";
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { StyleSwitcherService } from '../../services/style-switcher.service';
import { FilterResponseDto } from '../services/filter-response.dto';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [
    FilterAddComponent,
    FilterEditComponent,
    ReactiveFormsModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatMenuModule
  ],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.css'
})
export class FiltersComponent {
  filterService = inject(FilterService);
  private errorService = inject(ErrorMessageService);
  styleSwithService = inject(StyleSwitcherService);

  entityes = signal<FilterResponseDto[]>([]);
  editFilterId: string | null = null;

  /////////////////////////
  selectedControl = new FormControl<'all' | 'folow' | 'only-my'>('all');
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
    let filtered = [...this.entityes()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    switch (filterType) {
      case 'folow':
        filtered = filtered.filter(f => f.isFollow);
        break;
      case 'only-my':
        filtered = filtered.filter(f => f.isMy);
        break;
    }

    if (searchText) {
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(searchText) ||
        f.words?.some(w => w.toLowerCase().includes(searchText))
      );
    }

    return filtered;
  });

  getCurrentFilterIcon(): string {
    switch (this.selectedSignal()) {
      case 'folow': return 'star';
      case 'only-my': return 'person';
      default: return 'apps';
    }
  }

  clearFilter() {
    this.searchControl.setValue('');
  }
  /////////////////////////


  getPrivatStatusIcon(isPrivate: boolean): string {
    return isPrivate ? 'visibility_off' : 'visibility';
  }

  constructor() {
    effect(() => {
      this.entityes.set(this.filterService.filtersPublicAndMy());
    });
  }

  ngOnInit() {
    if (this.filterService.filtersPublicAndMy().length === 0) {
      this.filterService.loadPublicAndMy();
    }
  }


  startEdit(filter: FilterResponseDto) {
    this.editFilterId = filter.id;
  }
  finishEdit() {
    this.editFilterId = null;
  }

  delete(id: string | null) {
    if (id) {
      this.filterService.delete(id);
    } else {
      this.errorService.showError('id не может быть равен нулю');
    }
  }

  onFollow(id: string | null) {
    if (id) {
      this.filterService.follow(id);
    } else {
      this.errorService.showError('Не на что подписаться');
    }
  }
}
