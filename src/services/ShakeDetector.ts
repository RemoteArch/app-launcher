
interface ShakeOptions {
  threshold: number;  // Acceleration threshold to trigger shake
  timeout: number;    // Minimum time between shakes (ms)
  onShake: () => void; // Callback function when shake is detected
}

export class ShakeDetector {
  private options: ShakeOptions;
  private lastTime: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;
  private lastZ: number = 0;
  private isListening: boolean = false;

  constructor(options?: Partial<ShakeOptions>) {
    // Default options
    this.options = {
      threshold: 15, // Default acceleration threshold
      timeout: 1000, // Default timeout between shakes (ms)
      onShake: () => {}, // Empty callback by default
      ...options
    };
  }

  /**
   * Start listening for shake events using the Web API
   */
  public start(): void {
    if (this.isListening) return;

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.handleMotion);
      this.isListening = true;
      console.log('Shake detector started using Web API');
    } else {
      console.error('Device motion not supported in this browser');
    }
  }

  /**
   * Stop listening for shake events
   */
  public stop(): void {
    if (!this.isListening) return;

    window.removeEventListener('devicemotion', this.handleMotion);
    this.isListening = false;
    console.log('Shake detector stopped');
  }

  /**
   * Update shake detection options
   */
  public updateOptions(options: Partial<ShakeOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Handle motion events from the browser
   */
  private handleMotion = (event: DeviceMotionEvent): void => {
    if (!event.accelerationIncludingGravity) return;
    
    const acceleration = {
      x: event.accelerationIncludingGravity.x || 0,
      y: event.accelerationIncludingGravity.y || 0,
      z: event.accelerationIncludingGravity.z || 0
    };
    
    this.processAcceleration(acceleration);
  };

  /**
   * Process acceleration data to detect shakes
   */
  private processAcceleration(acceleration: {x: number, y: number, z: number}): void {
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - this.lastTime;

    // Only detect shake if enough time has passed
    if (timeDifference > 100) {
      const { x, y, z } = acceleration;
      
      // Calculate change in acceleration
      const deltaX = Math.abs(this.lastX - x);
      const deltaY = Math.abs(this.lastY - y);
      const deltaZ = Math.abs(this.lastZ - z);

      // Detect shake based on acceleration threshold
      if ((deltaX > this.options.threshold && deltaY > this.options.threshold) || 
          (deltaX > this.options.threshold && deltaZ > this.options.threshold) || 
          (deltaY > this.options.threshold && deltaZ > this.options.threshold)) {
        
        // Check if enough time has passed since last shake
        if (timeDifference > this.options.timeout) {
          this.lastTime = currentTime;
          this.options.onShake();
        }
      }
      
      // Save current values
      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
      this.lastTime = currentTime;
    }
  }
}

// Export a singleton instance with default options
export const shakeDetector = new ShakeDetector();
