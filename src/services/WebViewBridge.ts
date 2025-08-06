import { AppPlugin } from 'app-plugin';

interface WebViewMessage {
  requestId: string;
  action: string;
  args?: any;
}

interface WebViewResponse {
  requestId: string;
  result?: any;
  error?: {
    message: string;
    code?: string;
  };
}

class WebViewBridge {
  private webViewRef: any = null;

  setWebViewRef(ref: any) {
    this.webViewRef = ref;
  }

  async handleMessage(message: string): Promise<void> {
    try {
      const parsedMessage: WebViewMessage = JSON.parse(message);
      const { requestId, action, args = {} } = parsedMessage;

      if (!action || typeof action !== 'string') {
        return this.sendResponse({
          requestId,
          error: { message: 'Invalid action format. Expected a method name' }
        });
      }

      if (typeof AppPlugin.call !== 'function') {
        return this.sendResponse({
          requestId,
          error: { message: `Method "${action}" not found in App plugin` }
        });
      }

      try {
        const result = await AppPlugin.call({
          method: action,
          params: args
        });
        this.sendResponse({ requestId, result });
      } catch (error: any) {
        this.sendResponse({
          requestId,
          error: { 
            message: error.message || 'Unknown error',
            code: error.code
          }
        });
      }
    } catch (error: any) {
      console.error('Error processing WebView message:', error);
      if (typeof message === 'string' && message.includes('requestId')) {
        try {
          const { requestId } = JSON.parse(message);
          this.sendResponse({
            requestId,
            error: { message: 'Error processing message' }
          });
        } catch {
          console.error('Cannot extract requestId from malformed message');
        }
      }
    }
  }

  // Send response back to WebView
  private sendResponse(response: WebViewResponse): void {
    if (!this.webViewRef) {
      console.error('WebView reference not set');
      return;
    }

    try {
      const responseString = JSON.stringify(response);
      
      // Send the response back to the WebView
      if (this.webViewRef.postMessage) {
        this.webViewRef.postMessage(responseString);
      } else if (this.webViewRef.injectJavaScript) {
        // For React Native WebView on some platforms
        const jsCode = `
          (function() {
            window.dispatchEvent(new MessageEvent('message', {
              data: ${responseString}
            }));
            true;
          })();
        `;
        this.webViewRef.injectJavaScript(jsCode);
      } else {
        console.error('WebView reference does not support messaging');
      }
    } catch (error) {
      console.error('Error sending response to WebView:', error);
    }
  }
}

// Export a singleton instance
export const webViewBridge = new WebViewBridge();
