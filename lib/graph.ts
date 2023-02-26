import { Rx } from './rx';

export function pushNode(
  source: Rx.GraphNode,
  dependent: Rx.GraphNode,
  checkCircular: boolean = true
): boolean {
  if (source === dependent) return false;

  if (checkCircular) {
    let d: Rx.GraphNode | undefined = dependent;
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
  return true;
}

export function removeNode(
  source: Rx.GraphNode,
  dependent: Rx.GraphNode
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
