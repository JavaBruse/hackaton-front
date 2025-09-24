import { Component, Input, Output, EventEmitter, inject, SimpleChanges, effect } from '@angular/core';
import { ErrorMessageService } from '../../services/error-message.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StyleSwitcherService } from '../../services/style-switcher.service';
import { SourceFlowResponse } from '../services/source-flow-response.dto';
import { MatSelectModule } from '@angular/material/select';
import { FilterService } from '../../filter/services/filter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SourceService } from '../services/sources.service';

@Component({
  selector: 'app-source-flow-edit',
  imports: [
    ReactiveFormsModule,
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
    MatCheckboxModule
  ],
  templateUrl: './source-flow-edit.component.html',
  styleUrl: './source-flow-edit.component.css'
})
export class SourceFlowEditComponent {
  @Input() source: SourceFlowResponse | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  errorMessegeService = inject(ErrorMessageService);
  styleSwithService = inject(StyleSwitcherService);
  filterService = inject(FilterService);
  sourceService = inject(SourceService);
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    filterId: new FormControl<string | null>(null, Validators.required),
    isPrivate: new FormControl<boolean>(false)
  });

  constructor() {
    effect(() => {
      const filters = this.filterService.filtersFollowAndMy();
      if (this.source && filters?.length) {
        const wantedId = this.source?.filter?.id ?? null;
        const current = this.form.get('filterId')?.value ?? null;
        if (wantedId && current !== wantedId) {
          this.form.patchValue({ filterId: wantedId }, { emitEvent: false });
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['source'] && this.source) {
      this.form.patchValue({
        filterId: this.source?.filter?.id ?? null,
        isPrivate: this.source?.isPrivate ?? false
      }, { emitEvent: false });
    }
  }

  save() {
    try {
      if (this.source?.id) {
        if (this.form.value.filterId != this.source.filter?.id) {
          if (this.form.value.filterId) {
            this.sourceService.addFilterSource(this.source.id || '', this.form.value.filterId || '')
          } else {
            this.sourceService.removeFilterSource(this.source.id || '')
          }
        }
        if (this.source.isMy) {
          if (this.source.isPrivate != this.form.value.isPrivate) {
            this.sourceService.updatePrivate(this.source.id || '', this.form.value.isPrivate);
          }
        }
      }
      this.saved.emit();
      this.cancel();
    } catch (error: any) {
      this.errorMessegeService.showError(error.message);
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}
