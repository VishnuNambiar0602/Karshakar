import type { DeadLetterMessage } from './types';

const deadLetters: DeadLetterMessage[] = [];

export function pushDeadLetter(message: DeadLetterMessage): void {
  deadLetters.push(message);
}

export function getDeadLetters(): DeadLetterMessage[] {
  return [...deadLetters];
}

export function resetDeadLetters(): void {
  deadLetters.length = 0;
}
