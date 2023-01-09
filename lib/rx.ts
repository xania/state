export namespace Rx {
  export interface Stateful<T = any> {
    dependent?: Stateful;
    snapshot?: T;
    dirty: boolean;
    observers?: NextObserver<T>[];
    operators?: StateOperator<T>[];
    map<U>(func: (t: T) => U): Stateful<U>;
    notify(): void;
    get(): T | undefined;
    subscribe<U, O extends NextObserver<U>>(
      this: Rx.Stateful<U>,
      observer: O
    ): Subscription;
  }

  export type StateOperator<T> =
    | MapOperator<T>
    | MergeOperator<T>
    | ConnectOperator<T>
    | PropertyOperator<T, keyof T>
    | BindOperator<T>;

  export enum StateOperatorType {
    Map,
    Bind,
    Connect,
    Property,
    Merge,
  }

  export interface MergeOperator<T, U = any> {
    type: StateOperatorType.Merge;
    property: keyof U extends T ? keyof U : never;
    snapshot: U;
    target: Rx.Stateful<U>;
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
}
