package com.remotearch.applauncher;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ApplauncherPlugin.class);
    super.onCreate(savedInstanceState);

    // Gérer l'Intent si l'appli est lancée par un deeplink
    handleDeepLink(getIntent());
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent); // Important pour que Capacitor.App appUrlOpen fonctionne aussi
    handleDeepLink(intent);
  }

  private void handleDeepLink(Intent intent) {
    if (Intent.ACTION_VIEW.equals(intent.getAction())) {
      Uri uri = intent.getData();
      if (uri != null) {
        String urlToOpen = uri.toString();

        if ("applauncher".equals(uri.getScheme())) {
          String uParam = uri.getQueryParameter("u");
          if (uParam != null) urlToOpen = uParam;
        }

      if (bridge != null && bridge.getWebView() != null) {
        WebView webView = bridge.getWebView();

        // 1) charger la page cible si besoin
        webView.loadUrl(urlToOpen);

        // 2) injecter ton fichier JS après (par URL locale de Capacitor)
        String base = bridge.getLocalUrl(); // ex: http://localhost/
        String scriptUrl = base + "app-launcher.iife.js";

        String injectTag =
          "(function(){var s=document.createElement('script');" +
          "s.src='" + scriptUrl + "';" +
          "s.defer=true;document.head.appendChild(s);}());";

        webView.post(() -> webView.evaluateJavascript(injectTag, null));
      }
    }
  }
}

}
