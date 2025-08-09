// appPlugin.ts
import { WebPlugin, registerPlugin } from '@capacitor/core';

/** ==== Types / Definitions ==== */
export interface CreateShortcutOptions {
  title: string;
  url: string;
}
export interface ReadFileOptions {
  /** Chemin virtuel dans l’OPFS (ex: "docs/notes.txt") */
  path: string;
}
export interface CreateFileOptions {
  path: string;
  data: string;
}
export interface DeleteFileOptions {
  path: string;
}
export interface ExecCommandOptions {
  command: string;
}

export interface AppPlugin {
  createShortcut(options: CreateShortcutOptions): Promise<{ success: boolean; message?: string }>;
  readFile(options: ReadFileOptions): Promise<{ data: string }>;
  createFile(options: CreateFileOptions): Promise<{ success: boolean }>;
  deleteFile(options: DeleteFileOptions): Promise<{ deleted: boolean }>;
  execCommand(options: ExecCommandOptions): Promise<{ output: string }>;
}

/** ==== Implémentation Web (Chromium/HTTPS avec OPFS) ==== */
type DirHandle = FileSystemDirectoryHandle;
type FileHandle = FileSystemFileHandle;

export class AppWeb extends WebPlugin implements AppPlugin {
  private deferredPrompt: any | null = null;

  constructor() {
    super();

    // Capture l’événement PWA d’installation si dispo
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // @ts-ignore
      e.preventDefault?.();
      this.deferredPrompt = e;
    });
  }

  // ---- Shortcuts / PWA ----
  async createShortcut({ title, url }: CreateShortcutOptions): Promise<{ success: boolean; message?: string }> {
    // Si prompt PWA dispo, le déclencher
    if (this.deferredPrompt?.prompt) {
      try {
        await this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice?.catch(() => null);
        this.deferredPrompt = null;
        return {
          success: true,
          message: choice?.outcome === 'accepted' ? `Install prompt accepted: ${title}` : 'Install prompt dismissed',
        };
      } catch {
        this.deferredPrompt = null;
        return { success: false, message: 'Install prompt failed or was dismissed' };
      }
    }

    // Fallback: ouvrir l’URL. (Pas d’API standard pour créer un raccourci arbitraire sur le Web)
    window.open(url, '_blank', 'noopener');
    return {
      success: false,
      message:
        'Aucune API web standard pour créer un raccourci automatiquement. Utilisez l’installation PWA via le navigateur.',
    };
  }

  // ---- File System via OPFS (Origin Private File System) ----
  private async getRootDir(): Promise<DirHandle> {
    // OPFS nécessite HTTPS + Chromium récent
    const nav: any = navigator as any;
    if (!nav?.storage?.getDirectory) {
      throw this.unavailable('File System Access API indisponible : utilisez Chrome/Edge récents en HTTPS.');
    }
    return await nav.storage.getDirectory();
  }

  private static splitPath(path: string): { parts: string[]; fileName: string } {
    const norm = path.replace(/^\/+/, '');
    const parts = norm.split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('Chemin invalide');
    const fileName = parts.pop() as string;
    return { parts, fileName };
  }

  private async ensureDir(root: DirHandle, parts: string[]): Promise<DirHandle> {
    let dir = root;
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: true });
    }
    return dir;
  }

  private async getDir(root: DirHandle, parts: string[]): Promise<DirHandle> {
    let dir = root;
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: false });
    }
    return dir;
  }

  async readFile({ path }: ReadFileOptions): Promise<{ data: string }> {
    const root = await this.getRootDir();
    const { parts, fileName } = AppWeb.splitPath(path);
    const dir = await this.getDir(root, parts);
    const fileHandle: FileHandle = await dir.getFileHandle(fileName, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return { data: text };
  }

  async createFile({ path, data }: CreateFileOptions): Promise<{ success: boolean }> {
    const root = await this.getRootDir();
    const { parts, fileName } = AppWeb.splitPath(path);
    const dir = await this.ensureDir(root, parts);
    const fileHandle: FileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable({ keepExistingData: false });
    await writable.write(data);
    await writable.close();
    return { success: true };
  }

  async deleteFile({ path }: DeleteFileOptions): Promise<{ deleted: boolean }> {
    const root = await this.getRootDir();
    const { parts, fileName } = AppWeb.splitPath(path);
    const dir = await this.getDir(root, parts);
    await dir.removeEntry(fileName, { recursive: false }).catch((err: any) => {
      if (err?.name === 'NotFoundError') return;
      throw err;
    });
    return { deleted: true };
  }

  // ---- Exec (non dispo sur le Web) ----
  async execCommand({ command }: ExecCommandOptions): Promise<{ output: string }> {
    throw this.unavailable(`execCommand("${command}") indisponible sur le Web.`);
  }
}

/** ==== Enregistrement Capacitor (web + natif) ==== */
export const app = registerPlugin<AppPlugin>('applauncher', {
  web: () => new AppWeb(),
});

(window as any).appPlugin = app;

// console.log(app);

// (Optionnel) export * si tu veux réutiliser les types ailleurs
export default app;
