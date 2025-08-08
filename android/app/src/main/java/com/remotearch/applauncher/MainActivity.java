package com.remotearch.applauncher;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

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
        String url = uri.toString();
        Log.d("AppLauncher", "URL reçue: " + url);

        // Si tu veux convertir ton deeplink applauncher://... en https://...
        // Par ex: applauncher://url?u=https%3A%2F%2Fexample.com
        if ("applauncher".equals(uri.getScheme())) {
          String uParam = uri.getQueryParameter("u");
          if (uParam != null) {
            url = uParam;
          }
        }

        // Charger l'URL dans la WebView de Capacitor
        if (bridge != null && bridge.getWebView() != null) {
          bridge.getWebView().loadUrl(url);
        }
      }
    }
  }
}
