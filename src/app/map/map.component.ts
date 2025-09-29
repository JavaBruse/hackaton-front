import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

declare var ymaps3: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: any;
  private LOCATION = { center: [37.617494, 55.755826], zoom: 10 };

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
    await ymaps3.ready;

    // Используем нативный API Яндекс Карт без React
    const { YMap, YMapDefaultSchemeLayer } = ymaps3;

    // Создаем карту
    this.map = new YMap(this.mapContainer.nativeElement, {
      location: this.LOCATION
    });

    // Добавляем слои
    this.map.addChild(new YMapDefaultSchemeLayer());
  }

  ngOnDestroy() {
    // Уничтожаем карту при удалении компонента
    if (this.map) {
      this.map.destroy();
    }
  }
}