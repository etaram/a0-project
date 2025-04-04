package com.soundmaster;

import android.service.quicksettings.TileService;
import android.service.quicksettings.Tile;
import android.content.Intent;
import android.media.AudioManager;
import android.widget.RemoteViews;
import android.graphics.drawable.Icon;
import android.os.Build;

public class QuickSettingsService extends TileService {
    private AudioManager audioManager;
    private static final int LONG_PRESS_TIMEOUT = 500; // ms
    private long pressStartTime;
    private boolean isLongPress = false;

    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
    }

    @Override
    public void onTileAdded() {
        super.onTileAdded();
        updateTile();
    }

    @Override
    public void onStartListening() {
        super.onStartListening();
        updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        Tile tile = getQsTile();
        if (tile != null) {
            if (isLongPress) {
                // Long press - open app
                Intent intent = new Intent(this, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivityAndCollapse(intent);
                isLongPress = false;
                return;
            }
            
            // Normal click - toggle audio state with expanded options
            int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
            int volumePercentage = (currentVolume * 100) / maxVolume;
            String outputState = getAudioOutputState();
            
            // Update tile with rich information
            tile.setLabel("Volume: " + volumePercentage + "%");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.setSubtitle(outputState);
            }
            
            boolean isActive = !audioManager.isStreamMute(AudioManager.STREAM_MUSIC);
            
            if (isActive) {
                // Currently active, show volume panel
                audioManager.adjustVolume(AudioManager.ADJUST_SAME, AudioManager.FLAG_SHOW_UI);
            } else {
                // Currently inactive, toggle mute
                tile.setState(Tile.STATE_ACTIVE);
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0);
            }
            
            // Update quick settings UI
            updateTileWithAudioInfo(tile);
            
            // Open app for full control
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivityAndCollapse(intent);
        }
    }
    
    @Override
    public void onTileRemoved() {
        super.onTileRemoved();
        // Cleanup any resources
        audioManager = null;
    }
    
    private void updateTileWithAudioInfo(Tile tile) {
        // Get current volume percentage
        int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
        int volumePercentage = (currentVolume * 100) / maxVolume;
        
        // Get current audio output
        String currentOutput = getAudioOutputState();
        
        // Update tile state
        tile.setState(audioManager.isStreamMute(AudioManager.STREAM_MUSIC) ? Tile.STATE_INACTIVE : Tile.STATE_ACTIVE);
        
        // Use custom layout if supported
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                RemoteViews customLayout = new RemoteViews(getPackageName(), R.layout.quick_settings_tile);
                customLayout.setTextViewText(R.id.volume_percentage, volumePercentage + "%");
                customLayout.setTextViewText(R.id.output_text, currentOutput);
                customLayout.setProgressBar(R.id.volume_slider, 100, volumePercentage, false);
                
                // Update icons based on state
                boolean isMuted = audioManager.isStreamMute(AudioManager.STREAM_MUSIC);
                int volumeIcon = isMuted ? R.drawable.ic_volume_mute : 
                                (volumePercentage > 50 ? R.drawable.ic_volume_up : R.drawable.ic_volume_down);
                customLayout.setImageViewResource(R.id.volume_icon, volumeIcon);
                
                // Set output icon
                int outputIcon = currentOutput.equals("Bluetooth") ? R.drawable.ic_bluetooth :
                                currentOutput.equals("Headphones") ? R.drawable.ic_headset : R.drawable.ic_speaker;
                customLayout.setImageViewResource(R.id.output_icon, outputIcon);
                
                tile.setContentDescription("SoundMaster: " + volumePercentage + "%, Output: " + currentOutput);
            } catch (Exception e) {
                // Fallback if custom layout fails
                tile.setLabel("SoundMaster: " + volumePercentage + "%");
                tile.setSubtitle(currentOutput);
            }
        } else {
            // For older Android versions
            tile.setLabel("SoundMaster: " + volumePercentage + "%");
        }
        
        tile.updateTile();
    }

    private void updateTile() {
        Tile tile = getQsTile();
        if (tile != null) {
            // Get current volume info
            int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
            int volumePercentage = (currentVolume * 100) / maxVolume;
            
            // Update tile info
            boolean isActive = !audioManager.isStreamMute(AudioManager.STREAM_MUSIC);
            tile.setState(isActive ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
            tile.setLabel(isActive ? "Volume: " + volumePercentage + "%" : "Muted");
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.setSubtitle(getAudioOutputState());
            }
            
            try {
                tile.setIcon(Icon.createWithResource(this, R.mipmap.ic_launcher));
            } catch (Exception e) {
                // Ignore icon setting errors
            }
            
            tile.updateTile();
        }
    }

    private String getAudioOutputState() {
        try {
            if (audioManager.isBluetoothA2dpOn()) {
                return "Bluetooth";
            } else if (audioManager.isWiredHeadsetOn()) {
                return "Headphones";
            } else {
                return "Speaker";
            }
        } catch (Exception e) {
            return "Speaker";
        }
    }
}