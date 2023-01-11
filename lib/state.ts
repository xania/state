import { Rx } from './rx';
import { Value } from './value';

export class State<T> extends Value<T> {
  constructor(public snapshot?: T) {
    super(snapshot);
  }

  set = (input: T | Updater<T>, scheduler = DefaultSyncScheduler) => {
    const { snapshot } = this;
    const newValue = input instanceof Function ? input(snapshot) : input;

    if (newValue !== snapshot) {
      this.snapshot = newValue;
      this.dirty = true;
    }
    scheduler?.schedule(this);
  };
}

type SyncScheduler = {
  schedule(...state: Rx.Stateful[]): void;
};

type Updater<T> = (t?: T) => undefined | T;

export function sync(...states: Rx.Stateful[]) {
  let statesLen = states.length;
  while (statesLen--) {
    let curr: Rx.Stateful | undefined = states[statesLen];
    while (curr) {
      if (curr.dirty) {
        curr.dirty = false;
        if (curr.observers) curr.notify();

        const { snapshot, operators } = curr;

        if (snapshot !== undefined && operators !== undefined) {
          for (let o = 0, olen = operators.length; o < olen; o++) {
            const operator = operators[o];
            switch (operator.type) {
              case Rx.StateOperatorType.Map:
                const mappedValue = operator.func(snapshot);
                const { target } = operator;
                if (target.snapshot !== mappedValue) {
                  target.snapshot = mappedValue;
                  target.dirty = true;
                }
                break;
              case Rx.StateOperatorType.Bind:
                const bindValue = operator.func(snapshot);
                const bindTarget = operator.target;
                if (bindTarget.snapshot !== bindValue) {
                  bindTarget.snapshot = bindValue;
                  bindTarget.dirty = true;
                }
                break;
              case Rx.StateOperatorType.Merge:
                const { property } = operator;
                if (operator.snapshot[property] !== snapshot) {
                  operator.snapshot[property] = snapshot;
                  const { target } = operator;
                  target.dirty = true;
                }
                break;
            }
          }
        }
      }

      curr = curr.dependent;
    }
  }
}

const DefaultSyncScheduler: SyncScheduler = {
  schedule: sync,
};

export class BatchScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];

  schedule() {
    const { states } = this;
    states.push.apply(states, arguments as any);
  }

  flush() {
    const { states } = this;
    sync(...states);
    states.length = 0;
  }
}

export class AnimationScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];
  private _animationHndl: number = -1;

  schedule() {
    const { states } = this;
    states.push.apply(states, arguments as any);

    if (this._animationHndl < 0)
      this._animationHndl = requestAnimationFrame(this.flush);
  }

  cancel() {
    if (this._animationHndl < 0) cancelAnimationFrame(this._animationHndl);
  }

  flush = () => {
    const { states } = this;
    sync(...states);
    states.length = 0;
    this._animationHndl = -1;
  };
}
