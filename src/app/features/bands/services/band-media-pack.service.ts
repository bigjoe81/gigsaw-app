import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { firstValueFrom } from 'rxjs';
import { BandService } from './band.service';

@Injectable({ providedIn: 'root' })
export class BandMediaPackService {
  constructor(private readonly bandsApi: BandService) {}

  async downloadZip(id: number, title?: string | null): Promise<string | void> {
    const blob = await this.fetchZip(id);
    const fileName = this.fileName(title);

    if (Capacitor.isNativePlatform()) {
      return this.writeNativeFile(blob, fileName, Directory.Documents);
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
  }

  async shareZip(id: number, title?: string | null): Promise<void> {
    const blob = await this.fetchZip(id);
    const fileName = this.fileName(title);

    if (Capacitor.isNativePlatform()) {
      const uri = await this.writeNativeFile(blob, fileName, Directory.Cache);
      await Share.share({
        title: title ?? 'Media Pack',
        dialogTitle: 'Condividi media pack',
        files: [uri],
      });
      return;
    }

    await this.downloadZip(id, title);
  }

  private async fetchZip(id: number): Promise<Blob> {
    return firstValueFrom(this.bandsApi.mediaPackZip(id));
  }

  private async writeNativeFile(blob: Blob, fileName: string, directory: Directory): Promise<string> {
    const base64 = await this.blobToBase64(blob);
    const path = `media-packs/${fileName}`;
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
    const safe = (title ?? 'media-pack')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safe || 'media-pack'}.zip`;
  }
}
