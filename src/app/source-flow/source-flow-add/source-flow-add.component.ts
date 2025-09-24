import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ErrorMessageService } from '../../services/error-message.service';
import { SourceService } from '../services/sources.service';
import { FilterService } from '../../filter/services/filter.service';
import { lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { FilterRequestDto } from '../../filter/services/filter-request.dto';
import { SourceFlowRequest } from '../services/source-flow-request.dto';
import { VkGroupResponse } from '../services/vkgroup-response.dto';

@Component({
  selector: 'app-source-flow-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule
  ],
  templateUrl: './source-flow-add.component.html',
  styleUrl: './source-flow-add.component.css'
})
export class SourceFlowAddComponent {
  private fb = inject(FormBuilder);
  sourceService = inject(SourceService);
  filterService = inject(FilterService);
  private errorMessegeService = inject(ErrorMessageService);
  showPopup = false;
  popupInfo: string = '';
  groupData: VkGroupResponse | any;

  isVkontakteSelected = false;
  isTelegramSelected = false;
  isHTTPSelected = false

  form: FormGroup = this.fb.group({
    name: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string | null>(null),
    type: new FormControl<string | null>(null, Validators.required),
    filter: new FormControl<FilterRequestDto | null>(null),
    isPrivate: new FormControl<boolean | false>(false),
    vkontakteField: new FormControl<string | null>({ value: null, disabled: false }),
    telegramField: new FormControl<string | null>({ value: null, disabled: false }),
    httpURL: new FormControl<string | null>({ value: null, disabled: false }),
    headers: new FormControl<string | null>({ value: null, disabled: false }),
  });

  ngOnInit() {
    this.form.get('type')?.valueChanges.subscribe((type) => {
      this.isVkontakteSelected = type === 'VKONTAKTE';
      this.isTelegramSelected = type === 'TELEGRAM';
      this.isHTTPSelected = type === 'HTTP';
      this.form.patchValue({
        filter: null,
        name: null,
        description: null,
        vkontakteField: null,
        telegramField: null,
        httpURL: null,
        headers: null
      });
    });
  }

  async findGroupVK() {
    const idGroupVK = this.form.value.vkontakteField;
    if (!idGroupVK) {
      this.errorMessegeService.showError("ID группы не указан!");
      return;
    }
    try {
      this.groupData = await lastValueFrom<VkGroupResponse>(this.sourceService.getGroupVK(idGroupVK));
      this.form.patchValue({
        vkontakteField: this.groupData.screenName,
        name: this.groupData.name === '' ? 'Неизвестно' : this.groupData.name,
        description: this.groupData.description === '' ? 'Неизвестно' : this.groupData.description
      })
    } catch (error: any) {
      this.errorMessegeService.showError(error.message);
    }
  }



  cancel() {
    this.sourceService.setVisibleAdd(false);
  }

  save() {
    if (this.form.valid) {
      const source: SourceFlowRequest = {
        id: null,
        type: this.form.value.type || 'VKONTAKTE',
        name: this.form.value.name || null,
        description: this.form.value.description || null,
        isPrivate: this.form.value.isPrivate || false,
        url: this.form.value.httpURL || null,
        headers: this.form.value.headers || null,
        groupId: this.form.value.type === "VKONTAKTE" ? this.form.value.vkontakteField : this.form.value.telegramField,
        token: "3123"
      };
      try {
        this.sourceService.add(source);
        this.cancel();
      } catch (error: any) {
        this.errorMessegeService.showError(error.message);
      }

    } else {
      this.errorMessegeService.showError("Форма не заполнена");
    }
  }

  clearFilterForm() {
    this.form.patchValue({
      filter: null
    });
  }
}
