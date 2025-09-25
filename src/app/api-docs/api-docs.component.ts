import { Component, AfterViewInit } from '@angular/core';
import { ApiDocsService } from './api-docs.service';

declare const SwaggerUI: any;

@Component({
  selector: 'app-api-docs',
  template: `<div id="swagger-ui"></div>`,
  styles: [`
    #swagger-ui {
      margin: 20px;
    }
  `]
})
export class ApiDocsComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const SwaggerUIBundle = (window as any).SwaggerUIBundle;
    const SwaggerUIStandalonePreset = (window as any).SwaggerUIStandalonePreset;

    SwaggerUIBundle({
      dom_id: '#swagger-ui',
      url: 'http://5.129.246.42:1818/security/v3/api-docs',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset]
    });
  }
}