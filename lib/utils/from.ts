﻿import { Rx } from '../rx';
import { fromPromise } from './from-promise';
import { fromAsyncIterable, isAsyncIterable } from './async-interable';
import { Value } from '../value';
import { fromObservable, isObservable } from './from-observable';

export function from<T>(input: Rx.StateInput<T>): Rx.Stateful<T> {
  if (input instanceof Value) {
    return input as Rx.Stateful<T>;
  }

  if (input instanceof Promise) {
    return fromPromise(input);
  }

  if (isAsyncIterable(input)) {
    return fromAsyncIterable(input);
  }

  if (isObservable(input)) {
    return fromObservable<T>(input);
  }

  return input;
}
