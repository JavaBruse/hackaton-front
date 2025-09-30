import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-map-2gis',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() marker: { lat: number, lng: number, title?: string, id?: string } | null = null;

  private map: any;
  private mapgl: any;
  private currentMarker: any = null;

  ngAfterViewInit() {
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
      // console.log('2GIS API загружен');
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
      // УНИЧТОЖАЕМ СТАРУЮ КАРТУ ПЕРЕД СОЗДАНИЕМ НОВОЙ
      this.destroyMap();
      const center = this.marker
        ? [this.marker.lng, this.marker.lat]
        : [37.617494, 55.755826];

      this.map = new mapgl.Map(this.mapContainer.nativeElement, {
        key: '50424773-ff42-4459-b644-fa2a6f07d620',
        center: center,
        zoom: this.marker ? 15 : 12
      });

      this.mapgl = mapgl;

      // Ждем полной загрузки карты
      this.map.on('load', () => {
        if (this.marker) {
          this.addMarker(this.marker);
        }
      });

      // Добавляем маркер сразу, если карта уже готова
      setTimeout(() => {
        if (this.marker && this.map) {
          this.addMarker(this.marker);
        }
      }, 500);

    } catch (error) {
      console.error('Ошибка инициализации карты:', error);
    }
  }

  private destroyMap() {
    // Уничтожаем старую карту если она есть
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    // Удаляем все дочерние элементы из контейнера
    if (this.mapContainer?.nativeElement) {
      this.mapContainer.nativeElement.innerHTML = '';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log('Маркер изменен:', this.marker);

    if (changes['marker'] && this.mapgl) {
      // Пересоздаем карту полностью при изменении маркера
      this.initializeMap();
    }
  }

  private addMarker(markerData: { lat: number, lng: number, title?: string, id?: string }) {
    try {
      const markerId = markerData.id || 'default';
      // console.log('Добавляем маркер:', markerData);

      // Удаляем старый маркер если есть
      if (this.currentMarker) {
        this.currentMarker.destroy();
        this.currentMarker = null;
      }

      // Создаем маркер
      this.currentMarker = new this.mapgl.Marker(this.map, {
        coordinates: [markerData.lng, markerData.lat]
      });

      // console.log(`Маркер ${markerId} создан успешно`);

    } catch (error) {
      console.error(`Ошибка создания маркера:`, error);
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }
}