import { StatusQuizEngine } from './games/StatusQuizEngine';
import { StatusCrashEngine } from './games/StatusCrashEngine';
import { StatusWheelEngine } from './games/StatusWheelEngine';

const registry = new Map<string, any>();

registry.set('statusquiz', new StatusQuizEngine());
registry.set('statuscrash', new StatusCrashEngine());
registry.set('statuswheel', new StatusWheelEngine());

export function getGameEngine(slug: string) {
  const engine = registry.get(slug);
  if (!engine) {
    throw new Error(`Unregistered game engine slug: ${slug}`);
  }
  return engine;
}
