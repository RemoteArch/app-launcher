// Define the structure for web app configuration
export interface WebAppConfig {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  allowedMethods: string[];
}

// Default list of allowed web applications
const DEFAULT_APPS: WebAppConfig[] = [
  {
    id: 'demo',
    name: 'Demo App',
    url: '/demo-app/index.html',
    description: 'A demo application showing Capacitor bridge functionality',
    allowedMethods: ['getLocation', 'takePicture', 'writeFile', 'readFile']
  },
  {
    id: 'app1',
    name: 'Demo App (Remote)',
    url: 'https://example.com/app1',
    description: 'A demo application showing Capacitor bridge functionality',
    allowedMethods: ['getLocation', 'takePicture', 'writeFile', 'readFile']
  },
  {
    id: 'app2',
    name: 'Maps App',
    url: 'https://example.com/maps',
    description: 'A mapping application using geolocation',
    allowedMethods: ['getLocation']
  }
];

class AppConfigService {
  private apps: WebAppConfig[] = [];
  private storageKey = 'app_launcher_config';

  constructor() {
    this.loadApps();
  }

  /**
   * Load apps from storage or use defaults
   */
  private loadApps(): void {
    try {
      const storedApps = localStorage.getItem(this.storageKey);
      if (storedApps) {
        this.apps = JSON.parse(storedApps);
      } else {
        this.apps = DEFAULT_APPS;
        this.saveApps();
      }
    } catch (error) {
      console.error('Error loading apps:', error);
      this.apps = DEFAULT_APPS;
    }
  }

  /**
   * Save apps to storage
   */
  private saveApps(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.apps));
    } catch (error) {
      console.error('Error saving apps:', error);
    }
  }

  /**
   * Get all configured apps
   */
  public getApps(): WebAppConfig[] {
    return [...this.apps];
  }

  /**
   * Get app by ID
   */
  public getAppById(id: string): WebAppConfig | undefined {
    return this.apps.find(app => app.id === id);
  }

  /**
   * Get app by URL
   */
  public getAppByUrl(url: string): WebAppConfig | undefined {
    // Normalize URLs for comparison
    const normalizedUrl = this.normalizeUrl(url);
    return this.apps.find(app => this.normalizeUrl(app.url) === normalizedUrl);
  }

  /**
   * Check if a method is allowed for a specific app
   */
  public isMethodAllowed(appId: string, methodName: string): boolean {
    const app = this.getAppById(appId);
    if (!app) return false;
    return app.allowedMethods.includes(methodName);
  }

  /**
   * Add a new app configuration
   */
  public addApp(app: WebAppConfig): void {
    // Check if app with same ID already exists
    if (this.apps.some(a => a.id === app.id)) {
      throw new Error(`App with ID ${app.id} already exists`);
    }
    
    this.apps.push(app);
    this.saveApps();
  }

  /**
   * Update an existing app configuration
   */
  public updateApp(app: WebAppConfig): void {
    const index = this.apps.findIndex(a => a.id === app.id);
    if (index === -1) {
      throw new Error(`App with ID ${app.id} not found`);
    }
    
    this.apps[index] = app;
    this.saveApps();
  }

  /**
   * Remove an app configuration
   */
  public removeApp(id: string): void {
    const index = this.apps.findIndex(a => a.id === id);
    if (index !== -1) {
      this.apps.splice(index, 1);
      this.saveApps();
    }
  }

  /**
   * Helper to normalize URLs for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  }
}

// Export a singleton instance
export const appConfig = new AppConfigService();
