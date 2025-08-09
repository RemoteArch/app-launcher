import { defineConfig } from 'vite';

// Construire en mode "lib" pour produire un seul fichier JS
export default defineConfig({
  build: {
    lib: {
      entry: 'src/services/appPlugin.ts',     // chemin vers ton fichier
      name: 'AppLauncher',       // nom global pour l’IIFE/UMD
      formats: ['iife'],   // ES module + IIFE pour <script>
    },
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
