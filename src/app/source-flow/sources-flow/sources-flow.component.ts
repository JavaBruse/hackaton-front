import { Component, computed, effect, inject, signal } from '@angular/core';
import { SourceService } from '../services/sources.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SourceFlowAddComponent } from '../source-flow-add/source-flow-add.component';
import { SourceFlowEditComponent } from '../source-flow-edit/source-flow-edit.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StyleSwitcherService } from '../../services/style-switcher.service';
import { SourceFlowResponse } from '../services/source-flow-response.dto';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import { FilterService } from '../../filter/services/filter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterOutlet, RouterModule, Router } from '@angular/router';


@Component({
  selector: 'app-sources-flow',
  standalone: true,
  imports: [
    SourceFlowAddComponent,
    SourceFlowEditComponent,
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
    MatIcon,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './sources-flow.component.html',
  styleUrls: ['./sources-flow.component.css'],
})
export class SourcesFlowComponent {
  sourceService = inject(SourceService);
  errorMessegeService = inject(ErrorMessageService);
  styleSwithService = inject(StyleSwitcherService);
  filterService = inject(FilterService);

  entityes = signal<SourceFlowResponse[]>([]);
  editSourceId: string | null = null;

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
        f.description?.toLowerCase().includes(searchText)
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

  constructor() {
    effect(() => {
      this.entityes.set(this.sourceService.sourcePublicAndMy());
    });
  }

  getPrivatStatusIcon(isPrivate: boolean): string {
    return isPrivate ? 'visibility_off' : 'visibility';
  }

  ngOnInit() {
    if (this.sourceService.sourcePublicAndMy().length === 0) {
      this.sourceService.loadPublicAndMy();
    }
    console.log(this.sourceService.sourcePublicAndMy);

  }

  startEdit(source: SourceFlowResponse) {
    this.editSourceId = source.id;
    this.filterService.loadFollowAndMy();
  }

  finishEdit() {
    this.editSourceId = null;
  }

  delete(id: string | null) {
    if (id) {
      this.sourceService.delete(id);
    } else {
      this.errorMessegeService.showError('id не может быть null');
    }
  }

  onFollow(id: string | null) {
    if (id) {
      this.sourceService.follow(id);
    } else {
      this.errorMessegeService.showError('Не на что подписаться');
    }
  }
}
