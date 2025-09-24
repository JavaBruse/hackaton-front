import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourcesFlowComponent } from './sources-flow.component';

describe('SourcesFlowComponent', () => {
  let component: SourcesFlowComponent;
  let fixture: ComponentFixture<SourcesFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourcesFlowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourcesFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
