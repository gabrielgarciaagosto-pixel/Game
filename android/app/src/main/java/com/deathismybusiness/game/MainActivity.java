package com.deathismybusiness.game;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Pair with Capacitor SystemBars insetsHandling=css so safe-area vars work
        EdgeToEdge.enable(this);
    }
}
