import { defineConfig } from 'vite';

// Construire en mode "lib" pour produire un seul fichier JS
export default defineConfig({
  build: {
    lib: {
      entry: 'src/services/appPlugin.ts',     // chemin vers ton fichier
      name: 'AppLauncher',       // nom global pour l’IIFE/UMD
      formats: ['iife'],   // ES module + IIFE pour <script>
    },
    rollupOptions: {
      // Capacitor doit rester externe (fourni par ton app)
      external: ['@capacitor/core'],
      output: {
        // Si tu charges @capacitor/core via <script>, voici le global
        globals: {
          '@capacitor/core': 'Capacitor',
        },
      },
    },
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
