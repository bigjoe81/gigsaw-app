import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonContent,
  IonHeader,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonMenuButton,
    IonToolbar,
  ],
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
})
export class SupportPage {
  private readonly sanitizer = inject(DomSanitizer);

  readonly widgetUrl = environment.zohoFeedbackWidgetUrl;
  readonly safeWidgetUrl: SafeResourceUrl | null = this.widgetUrl
    ? this.sanitizer.bypassSecurityTrustResourceUrl(this.widgetUrl)
    : null;
}
