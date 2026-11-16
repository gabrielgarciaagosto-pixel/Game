package com.deathismybusiness.game;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private Insets latestBars = Insets.NONE;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Draw under the system bars. Insets are published as CSS variables
        // (--safe-area-inset-*) so the hub and computer chrome pad themselves.
        // The first dispatch often lands on about:blank and is wiped when the
        // app document commits, so the page listener publishes again.
        EdgeToEdge.enable(this);
        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (v, insets) -> {
            latestBars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            publishSafeArea(latestBars);
            return insets;
        });
        ViewCompat.requestApplyInsets(decor);
        if (getBridge() != null) {
            getBridge().addWebViewListener(new WebViewListener() {
                @Override
                public void onPageCommitVisible(WebView view, String url) {
                    publishSafeArea(latestBars);
                }

                @Override
                public void onPageLoaded(WebView webView) {
                    publishSafeArea(latestBars);
                    ViewCompat.requestApplyInsets(getWindow().getDecorView());
                }
            });
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    finish();
                    return;
                }
                getBridge().getWebView().evaluateJavascript(
                    "(function(){try{return window.__ossuarianHardwareBack?window.__ossuarianHardwareBack():'exit';}catch(e){return 'exit';}})()",
                    value -> runOnUiThread(() -> {
                        if (value != null && value.contains("handled")) return;
                        finish();
                    })
                );
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        ViewCompat.requestApplyInsets(getWindow().getDecorView());
    }

    private void publishSafeArea(Insets bars) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        float density = getResources().getDisplayMetrics().density;
        if (density <= 0f) density = 1f;
        int top = Math.round(bars.top / density);
        int right = Math.round(bars.right / density);
        int bottom = Math.round(bars.bottom / density);
        int left = Math.round(bars.left / density);
        String js = "try{var d=document.documentElement.style;"
            + "d.setProperty('--safe-area-inset-top','" + top + "px');"
            + "d.setProperty('--safe-area-inset-right','" + right + "px');"
            + "d.setProperty('--safe-area-inset-bottom','" + bottom + "px');"
            + "d.setProperty('--safe-area-inset-left','" + left + "px');"
            + "}catch(e){}";
        getBridge().getWebView().evaluateJavascript(js, null);
    }
}
