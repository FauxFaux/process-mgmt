import { ProcessChainVisitor } from "./process_chain_visitor.js";


/**
 * Depth-first search of the process graph; when the search
 * encounters an already visited node, it walks back up the
 * discovered tree until it finds the already visited node,
 * adding the intermediate steps to the current cycle.
 *
 * Flaws:
 *  * Won't detect cycles that are "upstream" of process at index 0.
 *
 * @returns [[process_id, ... ], [process_id, ... ]] each inner array is a cycle in the process graph
 */
class CycleDetector extends ProcessChainVisitor {
    constructor() {
        super();
        this.cycles = [];
    }

    check(_chain) {
        return {
            init: true,
        }
    }

    _normalise_cycle(cycle) {
        let smallest_idx = cycle.reduce((prev, _cur, idx, arr) => {
            if (prev == -1) {
                return idx;
            } else {
                if (arr[prev] < arr[idx]) {
                    return prev;
                } else {
                    return idx;
                }
            }
        }, -1);

        let a = cycle.slice(0, smallest_idx);
        let b = cycle.slice(smallest_idx);
        return b.concat(a);
    }

    init(chain) {
        let cycles = [];
        let stack = chain.processes.map(p => [p]);

        while (stack.length > 0) {
            let current = stack.pop();
            current[current.length-1].outputs.flatMap(output => {
                let r = chain.processes_by_input[output.item.id];
                if (r && r.length > 0) {
                    return r;
                } else {
                    return [];
                }
            }).forEach(p => {
                if (!current.includes(p)) {
                    stack.push( current.concat( [p] ) );
                } else {
                    let idx = current.indexOf(p);
                    let cycle = this._normalise_cycle(current.slice(idx));
                    let cycle_exists = cycles.findIndex(c => {
                        if (c.length != cycle.length) return false;
                        return c.every((elem, idx) => elem == cycle[idx]);
                    });
                    if (cycle_exists === -1) {
                        cycles.push(cycle);
                    }
                }
            });
        }
        this.cycles = cycles.map(cycle => cycle.map(p => p.id));
    }
    build() { return this.cycles; }
}


export { CycleDetector };
