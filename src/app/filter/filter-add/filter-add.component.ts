import { Component, inject } from '@angular/core';
import { FilterService } from '../services/filter.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FilterRequestDto } from '../services/filter-request.dto';


@Component({
  selector: 'app-filter-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule
  ],
  templateUrl: './filter-add.component.html',
  styleUrl: './filter-add.component.css'
})
export class FilterAddComponent {
  private fb = inject(FormBuilder);
  private filterService = inject(FilterService);
  private errorMessageService = inject(ErrorMessageService);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    words: this.fb.array<string>([]),
    isPrivate: true
  });

  get wordsArray(): FormArray {
    return this.form.get('words') as FormArray;
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
    if (this.form.invalid) {
      this.errorMessageService.showError("Форма не заполнена или содержит ошибки");
      return;
    }

    if (this.wordsArray.length === 0) {
      this.errorMessageService.showError("Нет ключевых слов");
      return;
    }

    const newFilter: FilterRequestDto = {
      id: null,
      isPrivate: this.form.value.isPrivate,
      name: this.form.value.name,
      words: this.wordsArray.value
    };

    this.filterService.add(newFilter);
    this.cancel();
  }

  cancel() {
    this.filterService.setVisibleAdd(false);
  }
}
