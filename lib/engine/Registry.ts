// lib/engine/Registry.ts
import { StatusQuizEngine } from './games/StatusQuizEngine';

const registry = new Map<string, any>();

// Register StatusQuiz Engine
registry.set('statusquiz', new StatusQuizEngine());

export function getGameEngine(slug: string) {
  const engine = registry.get(slug);
  if (!engine) {
    throw new Error(`Unregistered game engine slug: ${slug}`);
  }
  return engine;
}
