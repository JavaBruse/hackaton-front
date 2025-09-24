import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FilterService } from '../services/filter.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FilterResponseDto } from '../services/filter-response.dto';
import { FilterRequestDto } from '../services/filter-request.dto';


@Component({
  selector: 'app-filter-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule
  ],
  templateUrl: './filter-edit.component.html',
  styleUrl: './filter-edit.component.css'
})
export class FilterEditComponent implements OnChanges {
  @Input() filter: FilterResponseDto | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private filterService = inject(FilterService);
  private errorMessageService = inject(ErrorMessageService);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    words: this.fb.array<string>([]),
    isPrivate: [false]
  });

  get wordsArray(): FormArray {
    return this.form.get('words') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filter'] && this.filter) {
      this.form.patchValue({
        name: this.filter.name || '',
        isPrivate: this.filter.isPrivate
      });
      this.wordsArray.clear();
      this.filter.words.forEach(word => this.wordsArray.push(this.fb.control(word)));
    }
  }

  addWord(word: string) {
    const trimmed = word.trim();
    if (!trimmed) {
      this.errorMessageService.showError('Ключевое слово не задано!');
      return;
    }

    const exists = this.wordsArray.value.some(
      (w: string) => w.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      this.errorMessageService.showError('Это слово уже добавлено!');
      return;
    }

    this.wordsArray.push(this.fb.control(trimmed));
  }

  removeWord(index: number) {
    this.wordsArray.removeAt(index);
  }

  save() {
    if (!this.filter) return;

    if (this.form.invalid) {
      this.errorMessageService.showError("Форма не заполнена или содержит ошибки");
      return;
    }

    if (this.wordsArray.length === 0) {
      this.errorMessageService.showError("Нет ключевых слов");
      return;
    }

    const updatedFilter: FilterRequestDto = {
      id: this.filter.id,
      name: this.form.value.name,
      isPrivate: this.form.value.isPrivate,
      words: this.wordsArray.value
    };

    this.filterService.save(updatedFilter);
    this.saved.emit();
  }

  cancel() {
    this.cancelled.emit();
  }
}
