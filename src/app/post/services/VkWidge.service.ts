// services/vk-widget.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare global {
    interface Window {
        VK: any;
    }
}

@Injectable({
    providedIn: 'root'
})
export class VkWidgetService {

    constructor(private sanitizer: DomSanitizer) { }

    // Правильный метод для создания embed URL VK
    getVkEmbedUrl(url: string): SafeResourceUrl {
        const videoId = this.extractVideoId(url);
        if (videoId) {
            // Формат: https://vk.com/video_ext.php?oid=OWNER_ID&id=VIDEO_ID
            const embedUrl = `https://vk.com/video_ext.php?oid=${videoId.split('_')[0]}&id=${videoId.split('_')[1]}`;
            return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

    extractVideoId(url: string): string | null {
        if (!url) return null;

        // Для URL: https://vk.com/video763313991_456240982
        const match = url.match(/video(-?\d+_\d+)/);
        return match ? match[1] : null;
    }
}