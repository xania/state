﻿export namespace Rx {
  export interface Stateful<T = any> {
    dependent?: Stateful<any | void>;
    snapshot?: T;
    dirty: boolean;
    observers?: NextObserver<T>[];
    operators?: StateOperator<T>[];
  }

  export type Observable<T> = {
    subscribe(observer: NextObserver<T>): Subscription;
  };

  export type StateOperator<T = any> =
    | MapOperator<T>
    | MergeOperator<T>
    | ConnectOperator<T>
    | PropertyOperator<T, keyof T>
    | BindOperator<T>
    | SignalOperator<T>;

  export enum StateOperatorType {
    Map,
    Bind,
    Connect,
    Property,
    /**
     * merge is used when a target state has multiple sources,
     * each assign a different key of the target state.
     */
    Merge,
    Signal,
  }

  export interface MergeOperator<T, U = any> {
    type: StateOperatorType.Merge;
    property: keyof U extends T ? keyof U : never;
    snapshot: U;
    target: Rx.Stateful<U>;
  }

  export interface SignalOperator<T = any> {
    type: StateOperatorType.Signal;
    target: Rx.Stateful<T>;
    deps: Rx.Stateful[];
    update(): void;
  }

  export interface MapOperator<T, U = any> {
    type: StateOperatorType.Map;
    func: (t: T) => U;
    target: Stateful<U>;
  }

  export interface BindOperator<T, U = any> {
    type: StateOperatorType.Bind;
    func: (t: T) => U;
    target: Stateful<U>;
  }

  export interface ConnectOperator<T> {
    type: StateOperatorType.Connect;
    target: Stateful<T>;
  }

  export interface PropertyOperator<T, K extends keyof T> {
    type: StateOperatorType.Property;
    name: K;
    target: Stateful<T[K]>;
  }

  export type StateObserver<T> = NextObserver<T>;

  export interface NextObserver<T> {
    next: (value: T) => void;
    error?: (err: any) => void;
    complete?: () => void;
  }

  export interface Subscription {
    unsubscribe(): void;
  }

  export interface Subscribable<T> {
    observers?: NextObserver<T>[];
  }
}
