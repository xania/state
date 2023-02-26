import { Rx } from './rx';

export function notify<T>(state: Rx.GraphNode<T>) {
  const { observers, snapshot } = state;
  if (observers !== undefined && snapshot !== undefined)
    for (const obs of observers as any) {
      obs.next(snapshot);
    }
}
