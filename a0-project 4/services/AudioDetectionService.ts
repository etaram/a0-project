import { BehaviorSubject } from 'rxjs';
import { AudioSource } from '../types';
import * as BatteryManager from 'expo-battery';

class AudioDetectionService {
  private audioSources = new BehaviorSubject<AudioSource[]>([]);
  private backgroundUpdateInterval: number = 15000; // 15 seconds default
  private batteryLevel: number = 100;
  private isCharging: boolean = false;
  private powerSavingMode: boolean = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    await this.checkBatteryStatus();
    await this.initializePowerManagement();
    this.startAudioSessionMonitoring();
  }

  private async initializePowerManagement() {
    const batteryLevel = await BatteryManager.getBatteryLevelAsync();
    const isCharging = await BatteryManager.isChargingAsync();
    
    this.batteryLevel = batteryLevel * 100;
    this.isCharging = isCharging;
    
    BatteryManager.addBatteryLevelListener(({ batteryLevel }) => {
      this.batteryLevel = batteryLevel * 100;
      this.optimizePerformance();
    });
  }

  private calculateOptimalInterval(): number {
    if (this.powerSavingMode) return 60000; // 1 minute in power saving
    if (this.batteryLevel <= 5) return 45000; // 45 seconds on critical
    if (this.batteryLevel <= 15) return 30000; // 30 seconds on low
    if (this.batteryLevel <= 30) return 20000; // 20 seconds on moderate
    if (!this.isCharging) return 15000; // 15 seconds on battery
    return 10000; // 10 seconds while charging
  }

  private async optimizePerformance() {
    const newInterval = this.calculateOptimalInterval();
    if (newInterval !== this.backgroundUpdateInterval) {
      this.backgroundUpdateInterval = newInterval;
      await this.restartBackgroundMonitoring();
    }
  }

  private async restartBackgroundMonitoring() {
    // Implementation for restarting monitoring with new interval
    try {
      // Stop current monitoring if any
      // Start new monitoring with updated interval
      await this.startAudioSessionMonitoring();
    } catch (error) {
      console.error('Error restarting monitoring:', error);
    }
  }

  private async checkBatteryStatus() {
    try {
      const batteryLevel = await BatteryManager.getBatteryLevelAsync();
      const isCharging = await BatteryManager.isChargingAsync();
      
      this.batteryLevel = batteryLevel * 100;
      this.isCharging = isCharging;
      
      this.backgroundUpdateInterval = this.calculateOptimalInterval();
    } catch (error) {
      console.error('Battery status check failed:', error);
    }
  }

  private startAudioSessionMonitoring() {
    // Mock implementation for demo purposes
    setInterval(() => {
      const mockSources: AudioSource[] = [
        {
          id: '1',
          name: 'Spotify',
          isPlaying: true,
          volume: 0.8,
          output: 'speakers'
        },
        {
          id: '2',
          name: 'YouTube',
          isPlaying: false,
          volume: 0.5,
          output: 'headphones'
        }
      ];
      
      this.audioSources.next(mockSources);
    }, this.backgroundUpdateInterval);
  }

  // Public methods
  public getActiveSources() {
    return this.audioSources.asObservable();
  }

  public async setSourceVolume(sourceId: string, volume: number) {
    const currentSources = this.audioSources.value;
    const updatedSources = currentSources.map(source => 
      source.id === sourceId ? { ...source, volume } : source
    );
    this.audioSources.next(updatedSources);
  }

  public async setSourceOutput(sourceId: string, output: AudioSource['output']) {
    const currentSources = this.audioSources.value;
    const updatedSources = currentSources.map(source => 
      source.id === sourceId ? { ...source, output } : source
    );
    this.audioSources.next(updatedSources);
  }

  public async toggleSourcePlayback(sourceId: string) {
    const currentSources = this.audioSources.value;
    const updatedSources = currentSources.map(source => 
      source.id === sourceId ? { ...source, isPlaying: !source.isPlaying } : source
    );
    this.audioSources.next(updatedSources);
  }
}

export const audioService = new AudioDetectionService();