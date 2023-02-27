import { memo } from './memo';

export function effect(fn: () => any) {
  return memo(fn);
}
