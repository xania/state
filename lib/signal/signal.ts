import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { schedule } from '../scheduler';
import { register } from './compute';

export class Signal<T = any> implements Rx.Stateful<T> {
  constructor(public snapshot: T, public label?: string) {}

  dependent?: Rx.Stateful<any> | undefined;
  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: Rx.StateOperator<T>[] | undefined;

  subscribe = subscribe;

  get = () => {
    register(this);
    return this.snapshot as T;
  };

  set = (newValue: T) => {
    const { snapshot } = this;
    if (newValue === snapshot) {
      return false;
    }
    this.snapshot = newValue;
    if (this.dirty) {
      return false;
    }
    this.dirty = true;
    schedule(this);
    return true;
  };

  toString() {
    const operators = this.operators;
    let retval = this.label + ' [';
    for (let i = 0, len = operators?.length || 0; i < len; i++) {
      retval += ' ' + operators![i].target;
    }
    retval += ' ]';
    return retval;
  }
}

export function signal<T>(value: T, label?: string) {
  return new Signal(value, label);
}
