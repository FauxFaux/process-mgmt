import { ProcessChain } from '../process.js';
import { Stack, StackSet } from '../stack.js';
import { ProcessChainVisitor } from './process_chain_visitor.js';

import { select_process } from './process_selection.js';

class RateCalculator extends ProcessChainVisitor {
    requested_stack;
    imported_materials;
    process_selector;
    materials;
    process_counts;
    chain;

    constructor(requested_stack, imported_materials, process_selector) {
        super();
        this.requested_stack = requested_stack;
        this.imported_materials = imported_materials;
        this.process_selector = process_selector;
        this.materials = new StackSet(); // -ive indicates a deficit in the
        this.process_counts = {};
    }

    check(_chain) {
        return {
            init: true,
        };
    }
    init(chain) {
        this.chain = chain;
        const materials = new StackSet();
        const process_counts = {};

        const queue = [this.requested_stack];
        while (queue.length > 0) {
            const current = queue.pop();
            if (chain.processes_by_output[current.item.id]) {
                const process = select_process(
                    chain,
                    current.item.id,
                    this.process_selector,
                );
                const process_count = process.process_count_for_rate(current);
                if (!process_counts[process.id]) {
                    process_counts[process.id] = 0;
                }
                process_counts[process.id] += process_count;
                for (const output of process.outputs) {
                    materials.add(output.mul(process_count));
                }
                for (const input of process.inputs) {
                    // if I have more than enough of this input already
                    // have 0 already, need 1 for this, then push 1 onto the queue. subtract 1 from materials.
                    // have 6 already, need 4 for this, then push nothing onto the queue. subtract 4 from materials.
                    // have 2 already, need 6 for this, then push 4 onto the queue. subtract 6 from the materials.
                    // have -5 already, need 7 for this, then push 7 onto the queue. subtract 7 from the materials.
                    // ==> subtract from materials. if total <= 0, push positive extra requirement onto the queue.
                    const required_for_count = input.mul(process_count);
                    const existing_requirement = materials.total(input.item);
                    let requirement_to_push: Stack | null = null;
                    if (existing_requirement.quantity <= 0) {
                        requirement_to_push = required_for_count;
                    } else {
                        const remaining_required =
                            existing_requirement.sub(required_for_count);
                        // @ts-expect-error
                        if (remaining_required < 0) {
                            requirement_to_push = remaining_required.mul(-1);
                        }
                    }
                    if (
                        requirement_to_push &&
                        !this.imported_materials.includes(input.item.id)
                    ) {
                        queue.push(requirement_to_push);
                    }
                    materials.sub(required_for_count);
                }
            }
        }
        this.materials = materials;
        this.process_counts = process_counts;
    }
    // visit_item(item, chain) { }
    // visit_process(process, chain) { }
    // visit_item_process_edge(item, process, chain, index) { }
    // visit_process_item_edge(process, item, chain, index) { }
    build() {
        const result = new ProcessChain(this.chain.processes);
        result.materials = this.materials;
        result.process_counts = this.process_counts;
        return result;
    }
}

export { RateCalculator };
