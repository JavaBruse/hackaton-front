import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterAddComponent } from './filter-add.component';

describe('FilterAddComponent', () => {
  let component: FilterAddComponent;
  let fixture: ComponentFixture<FilterAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
