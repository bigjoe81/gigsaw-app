import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import { firstValueFrom, timeout } from 'rxjs';
import { SetlistPdfOptions } from '../models/setlist.models';
import { SetlistService } from './setlist.service';

export type SetlistPdfFormat = 'a4' | 'a3' | 'large-print' | 'a3-large-print';

@Injectable({ providedIn: 'root' })
export class SetlistPdfService {
  constructor(private readonly setlistsApi: SetlistService) {}

  async open(id: number, title?: string | null, format: SetlistPdfFormat = 'a4', options?: SetlistPdfOptions): Promise<void> {
    const blob = await this.fetchPdf(id, format, options);
    const fileName = this.fileName(format === 'a3-large-print' ? `${title ?? 'scaletta'}-a3-alta-leggibilita` : format === 'large-print' ? `${title ?? 'scaletta'}-alta-leggibilita` : title);

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

  async download(id: number, title?: string | null, format: SetlistPdfFormat = 'a4', options?: SetlistPdfOptions): Promise<string | void> {
    const blob = await this.fetchPdf(id, format, options);
    const fileName = this.fileName(format === 'a3-large-print' ? `${title ?? 'scaletta'}-a3-alta-leggibilita` : format === 'large-print' ? `${title ?? 'scaletta'}-alta-leggibilita` : title);

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

  async share(id: number, title?: string | null, format: SetlistPdfFormat = 'a4', options?: SetlistPdfOptions): Promise<void> {
    const blob = await this.fetchPdf(id, format, options);
    const fileName = this.fileName(format === 'a3-large-print' ? `${title ?? 'scaletta'}-a3-alta-leggibilita` : format === 'large-print' ? `${title ?? 'scaletta'}-alta-leggibilita` : title);

    if (Capacitor.isNativePlatform()) {
      const uri = await this.writeNativeFile(blob, fileName, Directory.Cache);
      await Share.share({
        title: title ?? 'Setlist PDF',
        dialogTitle: 'Condividi PDF',
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
      await nav.share({
        title: title ?? 'Setlist PDF',
        files: [file],
      });

      return;
    }

    await this.download(id, title, format, options);
  }

  private async fetchPdf(id: number, format: SetlistPdfFormat, options?: SetlistPdfOptions): Promise<Blob> {
    try {
      return await firstValueFrom(this.setlistsApi.pdf(id, format, options).pipe(timeout(20_000)));
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('Il PDF non è arrivato entro 20 secondi. Riprova tra poco.');
      }
      throw error;
    }
  }

  private async writeNativeFile(blob: Blob, fileName: string, directory: Directory): Promise<string> {
    const base64 = await this.blobToBase64(blob);
    const path = `setlists/${fileName}`;
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
    const safe = (title ?? 'setlist')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safe || 'setlist'}.pdf`;
  }
}
