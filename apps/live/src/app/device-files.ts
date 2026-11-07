import { Capacitor } from '@capacitor/core';

async function nativeFile(blob: Blob, name: string): Promise<string> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const file = await Filesystem.writeFile({
    path: `live-exports/${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
  return file.uri;
}
/** On a native device, offer the OS share sheet so the user can save the actual file. */
export async function downloadBlob(blob: Blob, name: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const uri = await nativeFile(blob, name);
    const { Share } = await import('@capacitor/share');
    await Share.share({ title: name, files: [uri] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function openNativePdf(blob: Blob): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const uri = await nativeFile(blob, `parte-${crypto.randomUUID()}.pdf`);
  const { FileOpener } = await import('@capacitor-community/file-opener');
  await FileOpener.open({ filePath: uri, contentType: 'application/pdf' });
  return true;
}
