export namespace Rx {
  export interface Root {
    append(state: Stateful<any>): void;
  }

  export interface Stateful<T> {
    root: Root;
    snapshot?: T;
    observers: NextObserver<T>[];
    operators: StateOperator<T>[];
    notify(): void;
  }

  export type UnwrapState<T> = T extends Stateful<infer U> ? U : never;
  export type UnwrapStates<T> = { [P in keyof T]: UnwrapState<T[P]> };

  export type StateOperator<T> = MapOperator<T> | MergeOperator<T>;
  export enum StateOperatorType {
    Map,
    Property,
    Merge,
  }

  interface MergeOperator<T, U = any> {
    type: StateOperatorType.Merge;
    property: keyof U extends T ? keyof U : never;
    snapshot: U;
    dependencies: Rx.Stateful<U>[];
    target: Rx.Stateful<U>;
  }

  interface MapOperator<T, U = any> {
    type: StateOperatorType.Map;
    func: (t: T) => U;
    target: Stateful<U>;
  }

  interface PropertyOperator<T, K extends keyof T> {
    type: StateOperatorType.Property;
    property: K;
    target: Stateful<T[K]>;
  }

  export type StateObserver<T> = NextObserver<T>;

  export interface NextObserver<T> {
    next: (value: T) => void;
    error?: (err: any) => void;
    complete?: () => void;
  }
}
