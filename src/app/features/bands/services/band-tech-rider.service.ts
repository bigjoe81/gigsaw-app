import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import { firstValueFrom } from 'rxjs';
import { BandService } from './band.service';

@Injectable({ providedIn: 'root' })
export class BandTechRiderService {
  constructor(private readonly bandsApi: BandService) {}

  async openPdf(id: number, title?: string | null): Promise<void> {
    const blob = await this.fetchPdf(id);
    const fileName = this.fileName(title);

    if (Capacitor.isNativePlatform()) {
      const uri = await this.writeNativeFile(blob, fileName, Directory.Cache);
      await FileOpener.open({
        filePath: uri,
        contentType: 'application/pdf',
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async sharePdf(id: number, title?: string | null): Promise<void> {
    const blob = await this.fetchPdf(id);
    const fileName = this.fileName(title);

    if (Capacitor.isNativePlatform()) {
      const uri = await this.writeNativeFile(blob, fileName, Directory.Cache);
      await Share.share({
        title: title ?? 'Tech Rider',
        dialogTitle: 'Condividi tech rider',
        files: [uri],
      });
      return;
    }

    const file = new File([blob], fileName, { type: 'application/pdf' });
    const nav = navigator as Navigator & {
      canShare?: (data?: { files?: File[] }) => boolean;
      share?: (data?: { title?: string; files?: File[] }) => Promise<void>;
    };

    if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      await nav.share({ title: title ?? 'Tech Rider', files: [file] });
      return;
    }

    await this.openPdf(id, title);
  }

  private async fetchPdf(id: number): Promise<Blob> {
    return firstValueFrom(this.bandsApi.techRiderPdf(id));
  }

  private async writeNativeFile(blob: Blob, fileName: string, directory: Directory): Promise<string> {
    const base64 = await this.blobToBase64(blob);
    const path = `tech-riders/${fileName}`;
    const result = await Filesystem.writeFile({
      path,
      data: base64,
      directory,
      recursive: true,
    });

    return result.uri;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const dataUrl = String(reader.result ?? '');
        resolve(dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl);
      };
      reader.readAsDataURL(blob);
    });
  }

  private fileName(title?: string | null): string {
    const safe = (title ?? 'tech-rider')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safe || 'tech-rider'}.pdf`;
  }
}
