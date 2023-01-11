import { Rx } from '../rx';
import { fromPromise } from './from-promise';
import { fromAsyncIterable, isAsyncIterable } from './async-interable';

export function from<T>(input: Rx.StateInput<T>): Rx.Stateful<T> {
  if (input instanceof Promise) {
    return fromPromise(input);
  }

  if (isAsyncIterable(input)) {
    return fromAsyncIterable(input);
  }

  return input;
}
