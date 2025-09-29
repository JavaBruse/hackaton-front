import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

declare var ymaps3: any;

@Component({
  selector: 'app-map',
  template: '<div #mapContainer class="map-container"></div>',
  styles: [`
    .map-container {
      width: 100%;
      height: 400px;
    }
  `]
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: any;

  async ngAfterViewInit() {
    await this.loadYmapsScript();
    await this.initializeMap();
  }

  private loadYmapsScript(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof ymaps3 !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/v3/?apikey=ef7cffb6-6ad2-406b-ad30-1e6048ada555&lang=ru_RU';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private async initializeMap() {
    // Ждем загрузки API
    await ymaps3.ready;

    const { YMap, YMapDefaultSchemeLayer } = ymaps3;

    // Инициализируем карту
    this.map = new YMap(
      this.mapContainer.nativeElement,
      {
        location: {
          center: [37.588144, 55.733842],
          zoom: 10
        }
      }
    );

    // Добавляем слой карты
    this.map.addChild(new YMapDefaultSchemeLayer());
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.destroy();
    }
  }
}