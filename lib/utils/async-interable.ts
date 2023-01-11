import { Rx } from '../rx';
import { State } from '../state';

export function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return (
    Symbol.asyncIterator && obj?.[Symbol.asyncIterator] instanceof Function
  );
}

export function fromAsyncIterable<T>(
  asyncIterable: AsyncIterable<T>
): Rx.Stateful<T> {
  const target = new State<T>();

  iterableNext(asyncIterable[Symbol.asyncIterator]());
  function iterableNext(iterator: AsyncIterator<T>) {
    iterator.next().then((result) => {
      target.set(result.value);
      if (!result.done) {
        iterableNext(iterator);
      }
    });
  }

  return target;
}
