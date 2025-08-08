package com.remotearch.applauncher;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;

@CapacitorPlugin(name = "applauncher")
public class ApplauncherPlugin extends Plugin {

    private static final String TAG = "appPlugin";

    /**
     * Créer un raccourci sur l'écran d'accueil
     * params: { title: string, url: string }
     */
    @PluginMethod
    public void createShortcut(PluginCall call) {
        String title = call.getString("title");
        String url = call.getString("url");

        if (title == null || url == null) {
            call.reject("Missing title or url");
            return;
        }

        Context ctx = getContext();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                ShortcutManager shortcutManager = ctx.getSystemService(ShortcutManager.class);

                ShortcutInfo shortcut = new ShortcutInfo.Builder(ctx, title)
                        .setShortLabel(title)
                        .setLongLabel(title)
                        .setIcon(Icon.createWithResource(ctx, android.R.drawable.ic_menu_view))
                        .setIntent(new Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        .build();

                shortcutManager.requestPinShortcut(shortcut, null);
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Error creating shortcut: " + e.getMessage());
            }
        } else {
            // Versions < 8.0 : broadcast classique
            Intent shortcutIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            Intent addIntent = new Intent();
            addIntent.putExtra(Intent.EXTRA_SHORTCUT_INTENT, shortcutIntent);
            addIntent.putExtra(Intent.EXTRA_SHORTCUT_NAME, title);
            addIntent.putExtra(Intent.EXTRA_SHORTCUT_ICON_RESOURCE,
                    Intent.ShortcutIconResource.fromContext(ctx, android.R.drawable.ic_menu_view));
            addIntent.setAction("com.android.launcher.action.INSTALL_SHORTCUT");
            ctx.sendBroadcast(addIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        }
    }

    /**
     * Lire un fichier texte
     * params: { path: string }
     */
    @PluginMethod
    public void readFile(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Missing path");
            return;
        }
        try {
            File file = new File(path);
            if (!file.exists()) {
                call.reject("File does not exist");
                return;
            }

            StringBuilder text = new StringBuilder();
            BufferedReader br = new BufferedReader(new java.io.FileReader(file));
            String line;
            while ((line = br.readLine()) != null) {
                text.append(line).append("\n");
            }
            br.close();

            JSObject ret = new JSObject();
            ret.put("data", text.toString());
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Error reading file: " + e.getMessage());
        }
    }

    /**
     * Créer/écrire un fichier texte
     * params: { path: string, data: string }
     */
    @PluginMethod
    public void createFile(PluginCall call) {
        String path = call.getString("path");
        String data = call.getString("data", "");
        if (path == null) {
            call.reject("Missing path");
            return;
        }
        try {
            File file = new File(path);
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(data.getBytes());
            fos.close();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Error creating file: " + e.getMessage());
        }
    }

    /**
     * Supprimer un fichier
     * params: { path: string }
     */
    @PluginMethod
    public void deleteFile(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Missing path");
            return;
        }
        try {
            File file = new File(path);
            boolean deleted = file.delete();
            JSObject ret = new JSObject();
            ret.put("deleted", deleted);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error deleting file: " + e.getMessage());
        }
    }

    /**
     * Exécuter une commande shell
     * params: { command: string }
     */
    @PluginMethod
    public void execCommand(PluginCall call) {
        String command = call.getString("command");
        if (command == null) {
            call.reject("Missing command");
            return;
        }
        try {
            Process process = Runtime.getRuntime().exec(command);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            reader.close();
            process.waitFor();

            JSObject ret = new JSObject();
            ret.put("output", output.toString());
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Error executing command: " + e.getMessage());
        }
    }
}
