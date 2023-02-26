import { memo } from './memo';

export function effect(fn: () => any) {
  const effect = memo(fn);
  effect.observers = [
    {
      next: fn,
    },
  ];
}
