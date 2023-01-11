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

  constructor(
    public snapshot?: T | undefined,
    public subscribe: Rx.Stateful<T>['subscribe'] = _subscribe
  ) {}

  get() {
    return this.snapshot;
  }

  map: Rx.Stateful<T>['map'] = map;
  prop: Rx.Stateful<T>['prop'] = prop;
  bind: Rx.Stateful<T>['bind'] = bind;

  notify: Rx.Stateful<T>['notify'] = notify;

  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const state = this;
    let subscription: Rx.Subscription | null = null;
    function sub(resolver: (v: IteratorResult<T>) => void) {
      if (subscription == null) {
        if (state.snapshot !== undefined) resolver({ value: state.snapshot });
      }
      subscription = state.subscribe({
        next(value: T) {
          resolver({ value });
        },
      });
    }
    return {
      next() {
        return new Promise(sub).then((v) => (subscription?.unsubscribe(), v));
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
