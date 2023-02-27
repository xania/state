import { Rx } from './rx';

export function pushNode(
  source: Rx.Stateful<void> | Rx.Stateful<any>,
  dependent: Rx.Stateful<void> | Rx.Stateful<any>,
  checkCircular: boolean = true
): boolean {
  if (source === dependent) return false;

  if (checkCircular) {
    let d: Rx.Stateful | undefined = dependent;
    do {
      if (d === source) throw Error('circular');
      d = d.dependent;
    } while (d);
  }

  while (source.dependent) {
    source = source.dependent;
  }

  if (source === dependent) return false;

  source.dependent = dependent;

  // We always use the root of the graph for scheduling
  if (Rx.root in source) {
    dependent[Rx.root] = source[Rx.root]!;
  } else {
    dependent[Rx.root] = source;
  }

  return true;
}

export function removeNode(
  source: Rx.Stateful,
  dependent: Rx.Stateful
): boolean {
  while (source.dependent) {
    if (source.dependent === dependent) {
      source.dependent = dependent.dependent;

      return true;
    }
    source = source.dependent;
  }
  return false;
}
