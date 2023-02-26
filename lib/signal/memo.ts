import { UnwrapStates } from '../observable/combine-latest';
import { pushNode } from '../graph';
import { MapOperator, pushOperator } from '../operators/map';
import { Rx } from '../rx';
// import { from } from '../utils/from';
import { Computation, compute } from './compute';
import { Signal } from './signal';

export function memo<T>(fn: () => T) {
  const [value, computation] = compute(fn);

  const target = new Signal(value);
  if (computation.length === 0) {
    return target;
  } else {
    const source = combineLatest(computation);
    const mop: any = new MapOperator(fn, target);
    pushNode(source, target, false);
    pushOperator(source, mop);
    return target;
  }
}

function combineLatest<TArgs extends Computation>(nodes: [...TArgs]) {
  const nodesLen = nodes.length;
  if (nodesLen === 0)
    throw Error(
      'I dont know what it means to join empty list of nodes, e.g. what should map after join([]) do?'
    );
  if (nodesLen === 1) return nodes[0];

  const snapshot: any[] = new Array(nodesLen);
  const target = new Signal<UnwrapStates<TArgs>>(snapshot as any);

  for (let i = 0; i < nodesLen; i++) {
    const source = nodes[i];
    pushNode(source, target, false);

    snapshot[i] = source.snapshot;

    const mergeOp: Rx.MergeOperator<any, any> = {
      type: Rx.StateOperatorType.Merge,
      property: i,
      snapshot,
      target,
    };
    pushOperator(source, mergeOp);
  }

  return target;
}
