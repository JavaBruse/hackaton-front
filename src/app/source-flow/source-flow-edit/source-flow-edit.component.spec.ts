import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceFlowEditComponent } from './source-flow-edit.component';

describe('SourceFlowEditComponent', () => {
  let component: SourceFlowEditComponent;
  let fixture: ComponentFixture<SourceFlowEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceFlowEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourceFlowEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
