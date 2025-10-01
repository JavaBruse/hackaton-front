import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PhotosComponent } from '../photo/photos/photos.component';
import { ConstructMetadataResponse } from '../photo/service/photo-response';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-map-2gis',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  imports: [
    MatButtonToggleModule,
    MatIconModule,
    ReactiveFormsModule,
    MatCardModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatMenuModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ]
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  photoComponent = inject(PhotosComponent);
  mapControl = new FormControl('');

  private map: any;
  private mapgl: any;
  private currentMarker: any = null;

  constructor() {
    this.mapControl.valueChanges.subscribe(value => {
      this.updateMarker();
    });
  }

  get selectedConstruct(): ConstructMetadataResponse | null {
    const constructs = this.photoComponent.photo()?.constructMetadataResponses;
    if (!constructs || constructs.length === 0) {
      return null;
    }

    const camData = this.photoComponent.photo()?.camMetadataResponse;
    if (camData) {
      // Ищем существующий элемент с position 0
      const existingCamData = constructs.find(c => c.position === 0);

      if (existingCamData) {
        // Обновляем существующий
        existingCamData.latitude = camData.latitude;
        existingCamData.longitude = camData.longitude;
        existingCamData.address = camData.address;
      } else {
        // Добавляем новый только если нет position 0
        constructs.unshift({
          id: '',
          position: 0,
          latitude: camData.latitude,
          longitude: camData.longitude,
          address: camData.address
        });
      }
    }

    const selectedId = this.mapControl.value;
    if (selectedId) {
      return constructs.find(c => c.id === selectedId) || constructs[0];
    }

    return constructs[0];
  }

  ngAfterViewInit() {
    console.log(this.photoComponent.photo());
    this.loadMapScript();
  }

  private loadMapScript() {
    if (typeof (window as any).mapgl !== 'undefined') {
      this.initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://mapgl.2gis.com/api/js?key=50424773-ff42-4459-b644-fa2a6f07d620`;
    script.onload = () => {
      setTimeout(() => this.initializeMap(), 100);
    };
    script.onerror = (error) => {
      console.error('Ошибка загрузки 2GIS API:', error);
    };
    document.head.appendChild(script);
  }

  private initializeMap() {
    const mapgl = (window as any).mapgl;

    if (!mapgl) {
      console.error('2GIS MapGL API не загружен');
      return;
    }

    try {
      this.destroyMap();

      const selectedConstruct = this.selectedConstruct;
      const center = selectedConstruct?.latitude && selectedConstruct?.longitude
        ? [selectedConstruct.longitude, selectedConstruct.latitude]
        : [37.617494, 55.755826];

      this.map = new mapgl.Map(this.mapContainer.nativeElement, {
        key: '50424773-ff42-4459-b644-fa2a6f07d620',
        center: center,
        zoom: (selectedConstruct?.latitude && selectedConstruct?.longitude) ? 15 : 12
      });

      this.mapgl = mapgl;

      this.map.on('load', () => {
        if (selectedConstruct?.latitude && selectedConstruct?.longitude) {
          this.addMarker(selectedConstruct);
        }
      });

      // Устанавливаем первое значение после инициализации карты
      setTimeout(() => {
        const constructs = this.photoComponent.photo()?.constructMetadataResponses;
        if (constructs && constructs.length > 0 && !this.mapControl.value) {
          this.mapControl.setValue(constructs[0].id);
        }
      }, 100);

    } catch (error) {
      console.error('Ошибка инициализации карты:', error);
    }
  }

  private updateMarker() {
    if (!this.map || !this.mapgl) return;

    const selectedConstruct = this.selectedConstruct;
    if (selectedConstruct?.latitude && selectedConstruct?.longitude) {
      // Обновляем центр карты
      this.map.setCenter([selectedConstruct.longitude, selectedConstruct.latitude]);
      this.map.setZoom(15);

      // Обновляем маркер
      this.addMarker(selectedConstruct);
    }
  }

  private addMarker(construct: ConstructMetadataResponse) {
    try {
      if (!construct.latitude || !construct.longitude) return;

      // Удаляем старый маркер
      if (this.currentMarker) {
        this.currentMarker.destroy();
        this.currentMarker = null;
      }

      // Создаем новый маркер
      this.currentMarker = new this.mapgl.Marker(this.map, {
        coordinates: [construct.longitude, construct.latitude]
      });

    } catch (error) {
      console.error('Ошибка создания маркера:', error);
    }
  }

  private destroyMap() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    if (this.currentMarker) {
      this.currentMarker.destroy();
      this.currentMarker = null;
    }
    if (this.mapContainer?.nativeElement) {
      this.mapContainer.nativeElement.innerHTML = '';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.mapgl) {
      this.initializeMap();
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }
}