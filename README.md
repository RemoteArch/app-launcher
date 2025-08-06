# Capacitor App Launcher

Un lanceur d'applications web qui utilise Capacitor pour créer un pont dynamique entre les applications web et les fonctionnalités natives.

## Fonctionnalités

- Chargement d'applications web distantes dans une WebView
- Bridge natif dynamique entre la WebView et les plugins Capacitor
- Communication asynchrone via messages JSON
- Système de détection de secousse (shake) à l'aide de l'accéléromètre
- Sécurisation des appels aux plugins (seuls certains plugins sont autorisés)
- Compatible avec Android et iOS

## Architecture

Le projet est construit avec les technologies suivantes :

- React pour l'interface utilisateur
- Capacitor pour l'accès aux fonctionnalités natives
- WebView pour charger les applications web distantes

### Bridge de Communication

Le bridge permet aux applications web chargées dans la WebView de communiquer avec les plugins Capacitor de manière dynamique :

1. L'application web envoie un message JSON via `window.ReactNativeWebView.postMessage`
2. Le message contient une action au format "PluginName.methodName", des arguments optionnels et un identifiant unique
3. Le lanceur intercepte ce message, appelle dynamiquement la méthode du plugin
4. Le résultat ou l'erreur est renvoyé à la WebView via postMessage

### Sécurité

Seuls les plugins explicitement autorisés peuvent être appelés par l'application web :
- Geolocation
- Camera
- Filesystem

## Installation

```bash
# Installer les dépendances
npm install

# Construire l'application
npm run build

# Ajouter les plateformes
npx cap add android
npx cap add ios

# Synchroniser les fichiers avec les plateformes natives
npx cap sync
```

## Exécution

### Développement

```bash
# Démarrer le serveur de développement
npm run dev
```

### Production

```bash
# Construire l'application pour la production
npm run build

# Synchroniser avec les plateformes natives
npx cap sync

# Ouvrir dans Android Studio
npx cap open android

# Ouvrir dans Xcode
npx cap open ios
```

## Utilisation du Bridge dans une Application Web

Pour qu'une application web puisse utiliser le bridge, elle doit implémenter le code suivant :

```javascript
// Unique ID generator for requests
function generateRequestId() {
  return 'req_' + Math.random().toString(36).substring(2, 15);
}

// Bridge to communicate with native features
class CapacitorBridge {
  constructor() {
    this.callbacks = {};
    
    // Listen for responses from the native side
    window.addEventListener('capacitorBridgeMessage', (event) => {
      try {
        const response = JSON.parse(event.detail);
        const { requestId, result, error } = response;
        
        if (this.callbacks[requestId]) {
          if (error) {
            this.callbacks[requestId].reject(error);
          } else {
            this.callbacks[requestId].resolve(result);
          }
          
          // Clean up the callback
          delete this.callbacks[requestId];
        }
      } catch (err) {
        console.error('Error processing bridge response:', err);
      }
    });
  }
  
  // Call a native plugin method
  async callPlugin(pluginName, methodName, args = []) {
    return new Promise((resolve, reject) => {
      try {
        const requestId = generateRequestId();
        
        // Store the callbacks
        this.callbacks[requestId] = { resolve, reject };
        
        // Format the message for the native side
        const message = JSON.stringify({
          requestId,
          action: `${pluginName}.${methodName}`,
          args
        });
        
        // Send the message to the native side
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        } else {
          reject(new Error('ReactNativeWebView bridge not available'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

// Exemple d'utilisation
const bridge = new CapacitorBridge();

// Appel à la géolocalisation
async function getCurrentPosition() {
  try {
    const position = await bridge.callPlugin('Geolocation', 'getCurrentPosition');
    console.log(`Position: ${position.coords.latitude}, ${position.coords.longitude}`);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Application de Démonstration

Une application de démonstration est incluse dans le projet pour montrer comment utiliser le bridge. Elle est accessible à l'adresse `/demo-app/index.html` et montre comment utiliser :

- La géolocalisation
- L'appareil photo
- Le système de fichiers
- La détection de secousse

## Personnalisation

Pour ajouter ou modifier les applications disponibles dans le lanceur, modifiez le fichier `src/services/AppConfig.ts`.
