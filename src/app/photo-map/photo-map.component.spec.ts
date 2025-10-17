import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoMapComponent } from './photo-map.component';

describe('PhotoMapComponent', () => {
  let component: PhotoMapComponent;
  let fixture: ComponentFixture<PhotoMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
