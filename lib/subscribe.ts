import { Rx } from './rx';

export function subscribe<U, O extends Rx.NextObserver<U>>(
  this: Rx.Stateful<U>,
  observer: O
) {
  const { snapshot } = this;
  if (snapshot !== undefined) {
    observer.next(snapshot);
  }

  const { observers } = this;
  if (observers) {
    observers.push(observer);
  } else {
    this.observers = [observer];
  }
}
