import { Injectable, computed, signal } from '@angular/core';

export type QuestionBank = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class QuestionBankService {
  private readonly bankSignal = signal<QuestionBank>({});
  private readonly loadedSignal = signal(false);

  readonly bank = this.bankSignal.asReadonly();
  readonly isLoaded = this.loadedSignal.asReadonly();
  readonly totalQuestions = computed(() => Object.keys(this.bankSignal()).length);

  constructor() {
    void this.load();
  }

  getQuestionText(questionId: number | string): string {
    const key = String(questionId);
    return this.bankSignal()[key] ?? `سؤال رقم ${key}`;
  }

  async load(): Promise<void> {
    if (this.loadedSignal()) {
      return;
    }

    try {
      const response = await fetch('/questions.ar.json');
      if (!response.ok) {
        this.bankSignal.set({});
        this.loadedSignal.set(true);
        return;
      }

      const raw = (await response.json()) as unknown;
      if (!raw || typeof raw !== 'object') {
        this.bankSignal.set({});
        this.loadedSignal.set(true);
        return;
      }

      const normalized: QuestionBank = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string') {
          normalized[key] = value;
        }
      }

      this.bankSignal.set(normalized);
      this.loadedSignal.set(true);
    } catch {
      this.bankSignal.set({});
      this.loadedSignal.set(true);
    }
  }
}
