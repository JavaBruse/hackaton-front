import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { META_DATA } from './data/meta-data';
import { MATCH_DATA } from './data/match-data';
import { CommonModule } from '@angular/common'; // Добавьте эту строку

// Объявите тип для leaflet heat
declare global {
  interface Window {
    L: any;
  }
}

interface MetaData {
  kind: 'q' | 'qneg' | 'db';
  lat: number;
  lon: number;
  filename?: string;
  pano_id?: string;
  thumb?: string;
  uncertainty_m?: number;
}

interface MatchData {
  rank: number;
  db_index: number;
  db_path: string;
  db_easting: number;
  db_northing: number;
  db_lat: number;
  db_lon: number;
  faiss_dist: number;
  geo_dist_m: number;
  correct: boolean;
}
@Component({
  selector: 'app-master-map',
  imports: [],
  templateUrl: './master-map.component.html',
  styleUrl: './master-map.component.css'
})
export class MasterMapComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private base: L.TileLayer | null = null;

  // Layer groups
  private layerQ = L.layerGroup();
  private layerQneg = L.layerGroup();
  private layerDB = L.layerGroup();
  private layerHeat = L.layerGroup();
  private matchLayer = L.layerGroup();
  private uncLayer = L.layerGroup();

  // Icons
  private iconQ = this.createStarIcon('#1f6feb', '#0b3d91', 22, 1.0);
  private iconDB = this.createStarIcon('rgba(255,165,0,0.45)', '#b36b00', 22, 0.95);

  private META: any[] = META_DATA;
  private MATCH_LUT: any = MATCH_DATA;

  private TOPK = 3;

  // UI State
  currentMode: 'db' | 'match' = 'db';
  showThumbnails = true;

  // Checkbox states
  checkboxStates = {
    q: true,
    qneg: true,
    db: true,
    heat: false,
    unc: true
  };

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 0);
    this.setupEventListeners();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    // console.log('META data sample:', this.META.slice(0, 3));

    // if (this.META.length === 0) {
    //   console.warn('No META data available');
    // }
    // console.log('Initializing map...');

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found!');
      return;
    }

    // Проверяем размеры элемента
    console.log('Map element dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    this.map = L.map('map', {
      preferCanvas: true,
      zoomControl: true // Добавляем контролы зума
    });

    // Initialize base layer
    this.base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);



    // Add layer groups to map
    this.map.addLayer(this.matchLayer);
    this.map.addLayer(this.uncLayer);

    // Build markers
    this.buildMarkers();

    // Fit bounds только если есть данные
    if (this.META.length > 0) {
      const allLatLngs = this.META.map(d => [d.lat, d.lon] as [number, number]);
      const bounds = L.latLngBounds(allLatLngs);
      this.map.fitBounds(bounds.pad(0.10));
      console.log('Fitted bounds to markers');
    } else {
      // Устанавливаем дефолтный вид если нет данных
      this.map.setView([55.7558, 37.6173], 13);
    }

    // Start in DB view
    this.enterDB();

    console.log('Map initialized successfully');
  }

  private createStarIcon(fill: string, stroke: string, size: number, opacity: number): L.Icon {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='-10 -10 20 20'>
    <path d='M0,-9 L1.6,-1.6 L9,0 L1.6,1.6 L0,9 L-1.6,1.6 L-9,0 L-1.6,-1.6 Z' fill='${fill}' stroke='${stroke}' stroke-width='1'/></svg>`;

    return L.icon({
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
      // opacity удалено из здесь, так как это не стандартное свойство IconOptions
    });
  }

  private createCrossIcon(size: number): L.DivIcon {
    return L.divIcon({
      className: 'icon-cross',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  private buildMarkers() {
    console.log('Building markers from', this.META.length, 'items');

    const qMarkers: any[] = [];
    const qnMarkers: any[] = [];
    const dbMarkers: any[] = [];

    for (const m of this.META) {
      const latlng: [number, number] = [m.lat, m.lon];

      if (m.kind === 'q') {
        const marker = L.marker(latlng, { icon: this.iconQ })
          .bindPopup(this.popupHtml(m, this.showThumbnails));

        qMarkers.push({ marker, meta: m });
        this.layerQ.addLayer(marker);

        marker.on('click', () => this.onQueryClick(marker, m));

      } else if (m.kind === 'qneg') {
        const marker = L.marker(latlng, { icon: this.createCrossIcon(20) })
          .bindPopup(this.popupHtml(m, this.showThumbnails));

        qnMarkers.push({ marker, meta: m });
        this.layerQneg.addLayer(marker);

      } else if (m.kind === 'db') {
        const marker = L.marker(latlng, { icon: this.iconDB })
          .bindPopup(this.popupHtml(m, this.showThumbnails));

        dbMarkers.push({ marker, meta: m });
        this.layerDB.addLayer(marker);
      }
    }

    console.log('Markers created:', {
      q: qMarkers.length,
      qneg: qnMarkers.length,
      db: dbMarkers.length
    });

    // ВАЖНО: ЗАКОММЕНТИРУЙТЕ ЭТУ СТРОКУ ПОЛНОСТЬЮ!
    // const heatPoints = dbMarkers.map(o => [o.meta.lat, o.meta.lon, 0.8] as [number, number, number]);
    // const heat = (L as any).heatLayer(heatPoints, { radius: 25, blur: 20, maxZoom: 17 });
    // this.layerHeat.addLayer(heat);
  }

  private popupHtml(m: MetaData, showThumb: boolean): string {
    let s = `<b>${m.kind}</b><br/>lat: ${m.lat.toFixed(6)}<br/>lon: ${m.lon.toFixed(6)}`;
    if (m.filename) s += `<br/>file: ${m.filename.split('/').slice(-1)[0]}`;
    if (showThumb && m.thumb) s += `<br/><img class="thumb" src="${m.thumb}"/>`;
    return s;
  }

  private onQueryClick(marker: L.Marker, meta: MetaData) {
    if (this.currentMode !== 'match') return;

    this.matchLayer.clearLayers();
    this.uncLayer.clearLayers();

    // Draw uncertainty circle
    if (this.checkboxStates.unc && meta.uncertainty_m && meta.uncertainty_m > 0) {
      L.circle(marker.getLatLng(), {
        radius: meta.uncertainty_m,
        color: '#1f6feb',
        weight: 1,
        fill: true,
        opacity: 0.85
      }).addTo(this.uncLayer);
    }

    // Find matches
    const keys = [];
    if (meta.filename) {
      keys.push(meta.filename);
      keys.push(meta.filename.split('/').slice(-1)[0]);
    }
    if (meta.pano_id) keys.push(meta.pano_id);

    let matches: MatchData[] | null = null;
    for (let i = 0; i < keys.length; i++) {
      if (this.MATCH_LUT[keys[i]]) {
        matches = this.MATCH_LUT[keys[i]];
        break;
      }
    }

    if (!matches || matches.length === 0) {
      L.popup()
        .setLatLng(marker.getLatLng())
        .setContent("<b>No matches in report</b>")
        .openOn(this.map!);
      return;
    }

    const top = matches.slice(0, this.TOPK);
    this.drawMatches(marker, meta, top);
  }

  private drawMatches(marker: L.Marker, meta: MetaData, matches: MatchData[]) {
    let html = `<b>${matches.length} matches</b><br/>`;

    matches.forEach((m, i) => {
      if (m.db_lat != null && m.db_lon != null) {
        const ll: [number, number] = [m.db_lat, m.db_lon];
        L.polyline([marker.getLatLng(), ll], {
          color: '#e67e22',
          weight: 2,
          opacity: 0.9
        }).addTo(this.matchLayer);

        L.circleMarker(ll, {
          radius: 7,
          color: '#e67e22',
          fill: true,
          fillOpacity: 0.95,
          weight: 2
        }).addTo(this.matchLayer);
      }

      let desc = `#${i} `;
      if (m.db_path) {
        const bn = m.db_path.split('/').slice(-1)[0];
        desc += bn + " ";
      }
      if (m.faiss_dist != null) {
        desc += "dist=" + (typeof m.faiss_dist === 'number' ? m.faiss_dist.toFixed(3) : m.faiss_dist);
      }
      if (m.geo_dist_m != null) {
        desc += ", geo=" + Math.round(m.geo_dist_m) + "m";
      }
      html += desc + "<br/>";
    });

    L.popup()
      .setLatLng(marker.getLatLng())
      .setContent(html)
      .openOn(this.map!);
  }

  private setupEventListeners() {
    // This will be handled by Angular's data binding
  }

  // UI Methods
  onBasemapChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const url = select.value;

    if (this.base && this.map) {
      this.map.removeLayer(this.base);
      this.base = L.tileLayer(url, { maxZoom: 19 }).addTo(this.map);
    }
  }

  onModeChange(mode: 'db' | 'match') {
    this.currentMode = mode;
    if (mode === 'db') {
      this.enterDB();
    } else {
      this.enterMatch();
    }
  }

  onCheckboxChange(type: keyof typeof this.checkboxStates) {
    this.syncDBCheckboxes();
  }

  onThumbnailsChange() {
    this.updateAllPopups();
  }

  private enterDB() {
    this.matchLayer.clearLayers();
    this.uncLayer.clearLayers();
    this.syncDBCheckboxes();
  }

  private enterMatch() {
    this.syncDBCheckboxes();
  }

  private syncDBCheckboxes() {
    if (!this.map) return;

    if (this.checkboxStates.q) {
      if (!this.map.hasLayer(this.layerQ)) this.map.addLayer(this.layerQ);
    } else {
      if (this.map.hasLayer(this.layerQ)) this.map.removeLayer(this.layerQ);
    }

    if (this.checkboxStates.qneg) {
      if (!this.map.hasLayer(this.layerQneg)) this.map.addLayer(this.layerQneg);
    } else {
      if (this.map.hasLayer(this.layerQneg)) this.map.removeLayer(this.layerQneg);
    }

    if (this.checkboxStates.db) {
      if (!this.map.hasLayer(this.layerDB)) this.map.addLayer(this.layerDB);
    } else {
      if (this.map.hasLayer(this.layerDB)) this.map.removeLayer(this.layerDB);
    }

    if (this.checkboxStates.heat) {
      if (!this.map.hasLayer(this.layerHeat)) this.map.addLayer(this.layerHeat);
    } else {
      if (this.map.hasLayer(this.layerHeat)) this.map.removeLayer(this.layerHeat);
    }
  }

  private updateAllPopups() {
    const updateLayer = (layer: L.LayerGroup) => {
      layer.eachLayer((marker: any) => {
        // Find meta data for marker
        let meta: MetaData | null = null;
        // This would need to be implemented based on how you store marker-meta relationships
        // For now, it's a simplified version
        if (marker.getPopup()) {
          marker.setPopupContent(this.popupHtml(meta || { kind: 'db', lat: 0, lon: 0 }, this.showThumbnails));
        }
      });
    };

    updateLayer(this.layerQ);
    updateLayer(this.layerQneg);
    updateLayer(this.layerDB);
  }
}
