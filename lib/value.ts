import { subscribe as _subscribe } from './subscribe';
import { Rx } from './rx';
import { notify } from './notify';
import { map } from './map';
import { prop } from './prop';
import { bind } from './bind';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  public dependent?: Rx.Stateful<any>;
  dirty = false;

  constructor(public snapshot?: T | undefined) {}

  get() {
    return this.snapshot;
  }

  map: Rx.Stateful<T>['map'] = map;
  prop: Rx.Stateful<T>['prop'] = prop;
  bind: Rx.Stateful<T>['bind'] = bind;

  notify: Rx.Stateful<T>['notify'] = notify;
  subscribe: Rx.Stateful<T>['subscribe'] = _subscribe;

  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const state = this;
    let subscription: Rx.Subscription | null = null;

    const pending: T[] = [];
    let _resolver: null | ((next: { value: T }) => void) = null;

    subscription = state.subscribe({
      next(value: T) {
        if (_resolver !== null && _resolver !== undefined) {
          _resolver({ value });
          // resolver of a Promise can only be used once
          _resolver = null;
        } else pending.push(value);
      },
    });

    function sub(resolve: (v: IteratorResult<T>) => void) {
      if (pending.length > 0) {
        resolve({ value: pending.shift() as T });
      } else {
        _resolver = resolve;
      }
    }
    return {
      next() {
        return new Promise(sub);
      },
      return() {
        if (subscription) subscription.unsubscribe();
        return Promise.resolve({ value: state.snapshot, done: true });
      },
      throw(err: any) {
        return Promise.reject(err);
      },
    };
  };
}
