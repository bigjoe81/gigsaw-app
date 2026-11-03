import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private static readonly storagePrefix = 'gigsaw.onboarding.completed.v1';
  private readonly auth = inject(AuthService);

  shouldShow(): boolean {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    try {
      return localStorage.getItem(this.storageKey(userId)) !== 'true';
    } catch {
      return true;
    }
  }

  complete(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      localStorage.setItem(this.storageKey(userId), 'true');
    } catch {
      // The onboarding remains usable even when persistent browser storage is unavailable.
    }
  }

  reset(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      localStorage.removeItem(this.storageKey(userId));
    } catch {
      // No action is required when persistent browser storage is unavailable.
    }
  }

  private storageKey(userId: number): string {
    return `${OnboardingService.storagePrefix}:${userId}`;
  }
}
