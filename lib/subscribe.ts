import { Rx } from './rx';

export function subscribe<U, O extends Rx.NextObserver<U>>(
  this: Rx.Stateful<U>,
  observer: O
) {
  const value = this;
  const { snapshot } = value;

  if (snapshot !== undefined) {
    observer.next(snapshot);
  }

  let { observers } = value;
  if (observers) {
    observers.push(observer);
  } else {
    this.observers = observers = [observer];
  }

  return {
    unsubscribe() {
      const { observers } = value;
      if (observers) {
        const idx = observers.indexOf(observer);
        observers?.splice(idx, 1);
      }
    },
  };
}
