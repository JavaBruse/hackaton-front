import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceFlowAddComponent } from './source-flow-add.component';

describe('SourceFlowAddComponent', () => {
  let component: SourceFlowAddComponent;
  let fixture: ComponentFixture<SourceFlowAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceFlowAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourceFlowAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
