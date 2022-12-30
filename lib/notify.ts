import { Rx } from './rx';

export function notify<T>(this: Rx.Stateful<T>) {
  const { observers, snapshot } = this;
  if (observers !== undefined && snapshot !== undefined)
    for (const obs of observers as any) {
      obs.next(snapshot);
    }
}
