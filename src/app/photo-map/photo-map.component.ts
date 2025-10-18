import { Component, AfterViewInit, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { PhotoResponse } from '../photo/service/photo-response';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PhotoService } from '../photo/service/photo.service';


export interface MapConfig {
  showControls?: boolean;
}
@Component({
  selector: 'app-photo-map',
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './photo-map.component.html',
  styleUrl: './photo-map.component.css'
})
export class PhotoMapComponent implements AfterViewInit {
  private map: L.Map | null = null;
  private markersLayer = L.layerGroup();
  private baseLayers: { [key: string]: L.TileLayer } = {};
  private photoService = inject(PhotoService);

  photos = this.photoService.currentMapPhotos();
  selectedLayer: string = 'scheme';
  availableLayers = [
    { value: 'scheme', label: 'Схема' },
    { value: 'satellite', label: 'Спутник' },
    { value: 'hybrid', label: 'Гибрид' }
  ];

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      if (this.photos.length > 0) {
        this.processPhotos();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && changes['photos']) {
      this.processPhotos();
    }
  }

  private initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = L.map('map', {
      zoomControl: false,
      preferCanvas: true
    });

    this.baseLayers['scheme'] = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap contributors' }
    );

    this.baseLayers['satellite'] = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '© Esri' }
    );

    this.baseLayers['hybrid'] = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '© Esri' }
    );

    this.baseLayers[this.selectedLayer].addTo(this.map);

    L.control.zoom({
      position: 'topleft'
    }).addTo(this.map);

    this.map.addLayer(this.markersLayer);
  }

  onLayerChange() {
    if (!this.map) return;

    this.map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        this.map?.removeLayer(layer);
      }
    });

    if (this.selectedLayer === 'hybrid') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri'
      }).addTo(this.map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        maxZoom: 25,
        attribution: '© CartoDB',
        opacity: 1
      }).addTo(this.map);
    } else {
      this.baseLayers[this.selectedLayer].addTo(this.map);
    }

    this.map.addLayer(this.markersLayer);
  }

  private processPhotos() {
    this.markersLayer.clearLayers();

    if (!this.photos || this.photos.length === 0) return;

    const colors = this.generateColors(this.photos.length);

    this.photos.forEach((photo, index) => {
      const color = colors[index];

      // Метка камеры
      if (photo.camMetadataResponse?.latitude && photo.camMetadataResponse?.longitude) {
        this.addMarker(
          photo.camMetadataResponse.latitude,
          photo.camMetadataResponse.longitude,
          color,
          photo,
          'Камера',
          'C'
        );
      }

      // Метки конструкций
      photo.constructMetadataResponses.forEach((construct) => {
        if (construct.latitude && construct.longitude) {
          this.addMarker(
            construct.latitude,
            construct.longitude,
            color,
            photo,
            `Сооружение ${construct.position || ''}`.trim(),
            construct.position ? construct.position.toString() : '?'
          );
        }
      });
    });

    this.fitToBounds();
  }

  private addMarker(
    lat: number,
    lon: number,
    color: string,
    photo: PhotoResponse,
    title: string,
    markerText: string
  ) {
    const icon = this.createCircleIcon(color, markerText);

    const marker = L.marker([lat, lon], { icon })
      .bindPopup(this.createPopupContent(photo, title, lat, lon));

    this.markersLayer.addLayer(marker);
  }

  private createCircleIcon(color: string, text: string): L.DivIcon {
    return L.divIcon({
      html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${text}</div>
    `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: ''
    });
  }

  private createPopupContent(photo: PhotoResponse, title: string, lat: number, lon: number): string {
    const isCamera = title === 'Камера';
    const photoUrl = photo.filePathComplete ? photo.filePathComplete : photo.filePathOriginal;

    return `
  <div style="min-width: 300px; max-width: 400px; text-align: center;">
    <b>${isCamera ? '📷 ' : '🏗️ '}${title}</b><br/>
    Координаты: ${lat.toFixed(6)}, ${lon.toFixed(6)}<br/>
    ${photo.camMetadataResponse?.address ? `Адрес: ${photo.camMetadataResponse.address}` : ''}
    
    ${photoUrl ? `
      <hr style="margin: 0px 0;">
      <img src="${photoUrl}" 
           style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 4px;" 
           alt="${photo.name}">
    ` : ''}
  </div>
  `;
  }

  private generateColors(count: number): string[] {
    const colors = [];
    const hueStep = 360 / count;

    for (let i = 0; i < count; i++) {
      const hue = (i * hueStep) % 360;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }

    return colors;
  }

  private fitToBounds() {
    const points: [number, number][] = [];

    this.photos.forEach(photo => {
      if (photo.camMetadataResponse?.latitude && photo.camMetadataResponse?.longitude) {
        points.push([photo.camMetadataResponse.latitude, photo.camMetadataResponse.longitude]);
      }

      photo.constructMetadataResponses.forEach(construct => {
        if (construct.latitude && construct.longitude) {
          points.push([construct.latitude, construct.longitude]);
        }
      });
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      this.map?.fitBounds(bounds.pad(0.1));
    } else {
      this.map?.setView([55.7558, 37.6173], 10);
    }
  }
}