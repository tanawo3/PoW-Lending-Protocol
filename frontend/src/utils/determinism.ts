/**
 * GenLayer UI Determinism Utilities
 * Extracted from the 445-project master patterns (e.g. Neural-Terminal.md)
 * 
 * Replaces non-deterministic Math.random() calls with a seeded, sine-based PRNG
 * to guarantee that all users see the exact same UI state, avoiding consensus divergence.
 */

export function dRand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function generateDeterministicHash(seedStr: string): string {
  // Convert string to a numeric seed
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  
  // Generate deterministic alphanumeric string
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    const r = dRand(seed + i);
    hash += chars[Math.floor(r * chars.length)];
  }
  return hash;
}
