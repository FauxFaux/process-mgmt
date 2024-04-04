import { ProcessChain } from '../../src/process.js';
import { ProcessChainVisitor } from './process_chain_visitor.js';

import { select_process } from './process_selection.js';

/**
 * Output: ProcessChain
 */
class FilterForOutput extends ProcessChainVisitor {
    constructor(output_item, priority_cb = () => null, ignored = []) {
        super();
        this.output_item = output_item;
        this.priority_cb = priority_cb;
        this.ignored = ignored;
        this.allowed_processes = [];
    }

    check(_chain) {
        return {
            init: true,
        };
    }

    init(chain) {
        const result = [];
        const visited_item_ids = [];
        const visited_processes = [];
        const queue = [this.output_item.id];
        while (queue.length > 0) {
            const current = queue.shift();
            visited_item_ids.push(current);
            if (this.ignored.includes(current)) {
                continue;
            }
            const process = select_process(chain, current, this.priority_cb);

            if (process && !visited_processes.includes(process.id)) {
                result.push(process);
                visited_processes.push(process.id);
                process.inputs
                    .filter((input) => !queue.includes(input.item.id))
                    .filter(
                        (input) => !visited_item_ids.includes(input.item.id),
                    )
                    .forEach((input) => queue.push(input.item.id));
            }
        }
        this.allowed_processes = result;
    }

    build() {
        return new ProcessChain(this.allowed_processes);
    }
}

export { FilterForOutput };
