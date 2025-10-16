import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterMapComponent } from './master-map.component';

describe('MasterMapComponent', () => {
  let component: MasterMapComponent;
  let fixture: ComponentFixture<MasterMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
