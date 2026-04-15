import { Injectable, inject, NgZone } from '@angular/core';
import { GameStateService } from '../state/game-state.service';

const STORAGE_KEY = 'speed-shapes-time-breach.game-state';

@Injectable({ providedIn: 'root' })
export class CrossTabSyncService {
  private readonly gameState = inject(GameStateService);
  private readonly zone = inject(NgZone);

  startListening(): void {
    window.addEventListener('storage', this.onStorageEvent);
  }

  stopListening(): void {
    window.removeEventListener('storage', this.onStorageEvent);
  }

  private readonly onStorageEvent = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY || event.newValue === null) {
      return;
    }
    this.zone.run(() => {
      this.gameState.reloadFromStorage();
    });
  };
}