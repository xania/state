import { Rx } from './rx';

export function subscribe<U, O extends Rx.NextObserver<U>>(
  this: Rx.Stateful<U>,
  observer: O
) {
  const { snapshot } = this;
  if (snapshot !== undefined) {
    observer.next(snapshot);
  }
  this.observers.push(observer);
}
