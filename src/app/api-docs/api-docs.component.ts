import { Component, OnInit, effect } from '@angular/core';
import { ApiDocsService, ApiServiceInfo } from './api-docs.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-api-docs',
  templateUrl: './api-docs.component.html',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  styleUrls: ['./api-docs.component.css']
})
export class ApiDocsComponent implements OnInit {
  services: ApiServiceInfo[] = [];

  constructor(public apiDocsService: ApiDocsService) {
    effect(() => {
      const service = this.apiDocsService.selectedService();
      if (!service) return;
      this.renderSwagger(service);
    });
  }

  ngOnInit(): void {
    this.services = this.apiDocsService.getServices();

    if (this.services.length > 0 && !this.apiDocsService.selectedService()) {
      this.apiDocsService.selectService(this.services[1]);
    }
  }

  renderSwagger(service: ApiServiceInfo) {
    const SwaggerUIBundle = (window as any).SwaggerUIBundle;
    const SwaggerUIStandalonePreset = (window as any).SwaggerUIStandalonePreset;

    const container = document.getElementById('swagger-ui');
    if (container) container.innerHTML = '';

    SwaggerUIBundle({
      dom_id: '#swagger-ui',
      url: service.url,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset]
    });
  }
}
