import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { META_DATA } from './data/meta-data';
import { MATCH_DATA } from './data/match-data';
import { MatButtonModule } from '@angular/material/button';

interface MetaData {
  kind: 'q' | 'qneg' | 'db';
  lat: number;
  lon: number;
  filename?: string;
  pano_id?: string;
  thumb?: string;
  uncertainty_m?: number;
}

@Component({
  selector: 'app-master-map',
  templateUrl: './master-map.component.html',
  imports: [MatButtonModule],
  styleUrl: './master-map.component.css'
})
export class MasterMapComponent implements AfterViewInit {
  private map: L.Map | null = null;
  private coverageLayer = L.layerGroup();
  private markersLayer = L.layerGroup();

  private META: any[] = META_DATA;

  // Режим отображения
  currentView: 'coverage' | 'markers' = 'coverage';

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      this.showCoverageAreas();
    }, 0);
  }

  private initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = L.map('map', {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false // Полностью отключаем
    });

    // Немецкий tile-сервер (без украинской символики)
    L.tileLayer("https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      subdomains: 'abcd'
    }).addTo(this.map);

    // Добавляем zoom control
    L.control.zoom({
      position: 'topleft'
    }).addTo(this.map);

    // Добавляем слои
    this.map.addLayer(this.coverageLayer);
    this.map.addLayer(this.markersLayer);

    // Устанавливаем начальный вид
    this.fitToCoverage();

    console.log('Map initialized in coverage mode');
  }

  /**
   * Показывает области покрытия вместо маркеров
   */
  private showCoverageAreas() {
    this.coverageLayer.clearLayers();

    // Фильтруем только точки из базы данных
    const dbPoints = this.META
      .filter(m => m.kind === 'db')
      .map(m => [m.lat, m.lon] as [number, number]);

    if (dbPoints.length === 0) return;

    // Создаем несколько областей покрытия (можно группировать по регионам)
    this.createCoverageRegions(dbPoints);
  }

  /**
   * Создает прямоугольные области покрытия
   */
  private createCoverageRegions(points: [number, number][]) {
    if (points.length === 0) return;

    // Простой bounding box для всех точек
    const lats = points.map(p => p[0]);
    const lons = points.map(p => p[1]);

    const bounds: L.LatLngBoundsExpression = [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)]
    ];

    // Основная область покрытия
    L.rectangle(bounds, {
      color: '#1f6feb',
      weight: 2,
      fillColor: '#1f6feb',
      fillOpacity: 0.3,
      className: 'coverage-area'
    })
      .bindPopup(`
      <div style="text-align: center;">
        <b>Область покрытия</b><br/>
        Фотографий: ${points.length}<br/>
        Площадь: ${this.calculateArea(bounds)} км²
      </div>
    `)
      .addTo(this.coverageLayer);

    // Дополнительно: показываем кластеры точек внутри области
    this.createPointClusters(points);
  }

  /**
   * Создает кластеры точек для больших областей
   */
  private createPointClusters(points: [number, number][]) {
    // Группируем точки по квадратам
    const clusterSize = 0.02; // Размер кластера в градусах
    const clusters = new Map<string, number>();

    points.forEach(([lat, lon]) => {
      const clusterKey = `${Math.floor(lat / clusterSize)},${Math.floor(lon / clusterSize)}`;
      clusters.set(clusterKey, (clusters.get(clusterKey) || 0) + 1);
    });

    // Рисуем круги для кластеров
    clusters.forEach((count, key) => {
      const [x, y] = key.split(',').map(Number);
      const centerLat = (x + 0.5) * clusterSize;
      const centerLon = (y + 0.5) * clusterSize;

      L.circle([centerLat, centerLon], {
        radius: Math.min(count * 10, 100), // Радиус зависит от количества точек
        color: '#FFA500',
        weight: 1,
        fillColor: '#FFA500',
        fillOpacity: 0.2
      })
        .bindPopup(`Кластер: ${count} фотографий`)
        .addTo(this.coverageLayer);
    });
  }

  /**
   * Расчет примерной площади области
   */
  private calculateArea(bounds: L.LatLngBoundsExpression): number {
    const [[south, west], [north, east]] = bounds as [[number, number], [number, number]];
    const latDiff = north - south;
    const lonDiff = east - west;

    // Примерный расчет в км²
    return Math.round(latDiff * lonDiff * 111 * 111 * 100) / 100;
  }

  /**
   * Автоматическое приближение к области покрытия
   */
  private fitToCoverage() {
    const dbPoints = this.META
      .filter(m => m.kind === 'db')
      .map(m => [m.lat, m.lon] as [number, number]);

    if (dbPoints.length > 0) {
      const bounds = L.latLngBounds(dbPoints);
      this.map?.fitBounds(bounds.pad(0.1));
    } else {
      // Вид по умолчанию
      this.map?.setView([55.7558, 37.6173], 10);
    }
  }

  /**
   * Переключение между режимами
   */
  switchView(view: 'coverage' | 'markers') {
    this.currentView = view;

    if (view === 'coverage') {
      this.markersLayer.clearLayers();
      this.showCoverageAreas();
      this.map?.addLayer(this.coverageLayer);
    } else {
      this.coverageLayer.clearLayers();
      this.showMarkers();
      this.map?.addLayer(this.markersLayer);
    }
  }

  /**
   * Показывает отдельные маркеры (старый режим)
   */
  private showMarkers() {
    this.META.forEach(m => {
      const color = m.kind === 'db' ? '#FFA500' : '#1f6feb';
      const icon = this.createCircleIcon(color);

      L.marker([m.lat, m.lon], { icon })
        .bindPopup(this.createPopupContent(m))
        .addTo(this.markersLayer);
    });
  }

  private createCircleIcon(color: string): L.Icon {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='15' height='15'>
      <circle cx='7.5' cy='7.5' r='6' fill='${color}' stroke='white' stroke-width='1.5'/>
    </svg>`;

    return L.icon({
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      iconSize: [15, 15],
      iconAnchor: [7.5, 7.5]
    });
  }

  private createPopupContent(m: MetaData): string {
    return `
      <b>${m.kind.toUpperCase()}</b><br/>
      Широта: ${m.lat.toFixed(6)}<br/>
      Долгота: ${m.lon.toFixed(6)}<br/>
      ${m.filename ? `Файл: ${m.filename.split('/').pop()}` : ''}
    `;
  }
}