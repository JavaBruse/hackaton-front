import { Component, AfterViewInit } from '@angular/core';
import { ApiDocsService } from './api-docs.service';
import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';


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
    SwaggerUI({
      dom_id: '#swagger-ui',
      url: 'http://5.129.246.42:1818/security/v3/api-docs'
    });
  }
}
