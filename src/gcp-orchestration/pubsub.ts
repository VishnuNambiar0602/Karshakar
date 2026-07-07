import type { PubSubEnvelope } from './types';

const topicMessages = new Map<string, PubSubEnvelope[]>();

export function publish<T>(topic: string, payload: T): PubSubEnvelope<T> {
  const envelope: PubSubEnvelope<T> = {
    topic,
    messageId: `${topic}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    payload,
  };

  const existing = topicMessages.get(topic) ?? [];
  existing.push(envelope as PubSubEnvelope);
  topicMessages.set(topic, existing);

  return envelope;
}

export function getTopicMessages(topic: string): PubSubEnvelope[] {
  return [...(topicMessages.get(topic) ?? [])];
}

export function getPublishedTopics(): string[] {
  return [...topicMessages.keys()];
}

export function resetPubSubState(): void {
  topicMessages.clear();
}
