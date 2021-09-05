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

    check(chain) {
        return {
            init: true,
            visit_item: true,
            visit_process: true,
            visit_item_process_edge: true,
            visit_process_item_edge: true,
        }
    }
    init(chain) {
        let tree = {}; // child->parent relationships
        let visited_processes = [];

        let stack = [chain.processes[0]];
        while (stack.length > 0) {
            let current = stack.pop();
            visited_processes.push(current.id);

            current.outputs.flatMap(output => {
                let r = chain.processes_by_input[output.item.id];
                if (r && r.length > 0) {
                    return r;
                } else {
                    return [];
                }
            }).forEach(p => {
                if (visited_processes.includes(p.id)) {
                    let loop = [];
                    let next = current.id;
                    while (true) {
                        loop.push(next);
                        if (next == p.id) break;
                        next = tree[next];
                        if (!next) break;
                    }
                    this.cycles.push(loop.reverse());
                } else {
                    tree[p.id] = current.id;
                    stack.push(p);
                }
            });
        }
    }
    visit_item(item, chain) { }
    visit_process(process, chain) { }
    visit_item_process_edge(item, process, chain, index) { }
    visit_process_item_edge(process, item, chain, index) { }
    build() { return this.cycles; }
}


export { CycleDetector };
