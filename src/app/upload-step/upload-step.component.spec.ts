import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStepComponent } from './upload-step.component';

describe('UploadStepComponent', () => {
  let component: UploadStepComponent;
  let fixture: ComponentFixture<UploadStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
