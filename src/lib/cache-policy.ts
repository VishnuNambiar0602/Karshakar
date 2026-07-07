export type EndpointCachePolicy = {
  endpoint: string;
  strategy: 'memory-ttl' | 'no-store' | 'revalidate';
  ttlSeconds?: number;
  revalidateSeconds?: number;
};

export const ENDPOINT_CACHE_POLICIES: EndpointCachePolicy[] = [
  { endpoint: 'open-meteo.current', strategy: 'memory-ttl', ttlSeconds: 300 },
  { endpoint: 'open-meteo.historical', strategy: 'memory-ttl', ttlSeconds: 1800 },
  { endpoint: 'soil.lookup', strategy: 'memory-ttl', ttlSeconds: 900 },
  { endpoint: 'timelapse.generate', strategy: 'no-store' },
  { endpoint: 'ai.fallback', strategy: 'no-store' },
];
