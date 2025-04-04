package com.splitsound;

import android.content.Context;
import android.media.AudioManager;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;

public class AudioControlModule extends ReactContextBaseJavaModule {
    private AudioManager audioManager;
    private MediaSessionManager mediaSessionManager;
    private final ReactApplicationContext reactContext;

    public AudioControlModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        this.mediaSessionManager = (MediaSessionManager) reactContext.getSystemService(Context.MEDIA_SESSION_SERVICE);
    }

    @Override
    public String getName() {
        return "AudioControl";
    }

    @ReactMethod
    public void getActiveSources(Promise promise) {
        try {
            WritableArray sources = Arguments.createArray();
            for (MediaController controller : mediaSessionManager.getActiveSessions(null)) {
                WritableMap source = Arguments.createMap();
                source.putString("id", controller.getSessionToken().toString());
                source.putString("name", controller.getPackageName());
                source.putBoolean("isPlaying", controller.getPlaybackState().getState() == PlaybackState.STATE_PLAYING);
                sources.pushMap(source);
            }
            promise.resolve(sources);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setVolume(String sourceId, float volume, Promise promise) {
        try {
            audioManager.setStreamVolume(
                AudioManager.STREAM_MUSIC,
                (int) (audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC) * volume),
                0
            );
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void routeAudio(String sourceId, String output, Promise promise) {
        try {
            switch (output) {
                case "speaker":
                    audioManager.setMode(AudioManager.MODE_NORMAL);
                    audioManager.stopBluetoothSco();
                    audioManager.setBluetoothScoOn(false);
                    audioManager.setSpeakerphoneOn(true);
                    break;
                case "headphones":
                    audioManager.setMode(AudioManager.MODE_NORMAL);
                    audioManager.stopBluetoothSco();
                    audioManager.setBluetoothScoOn(false);
                    audioManager.setSpeakerphoneOn(false);
                    break;
                case "bluetooth":
                    audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                    audioManager.startBluetoothSco();
                    audioManager.setBluetoothScoOn(true);
                    break;
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}