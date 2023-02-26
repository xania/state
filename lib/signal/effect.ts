import { memo } from './memo';

export function effect(fn: () => any) {
  const effect = memo(fn);
  effect.subscribe({
    next: fn,
  });
}
