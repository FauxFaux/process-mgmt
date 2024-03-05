import { ProcessChain } from '../process.js';
import {
    ProcessChainVisitor,
    VisitorOptions,
} from './process_chain_visitor.js';

import { select_process } from './process_selection.js';

/**
 * Output: ProcessChain
 */
class FilterForOutput extends ProcessChainVisitor {
    output_item;
    priority_cb;
    ignored;
    allowed_processes;

    constructor(output_item, priority_cb = () => null, ignored = []) {
        super();
        this.output_item = output_item;
        this.priority_cb = priority_cb;
        this.ignored = ignored;
        this.allowed_processes = [];
    }

    check(_chain): VisitorOptions {
        return {
            init: true,
        };
    }

    init(chain) {
        const result: any[] = [];
        const visited_item_ids: any[] = [];
        const visited_processes: any[] = [];
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
                for (const input of process.inputs
                    .filter((input) => !queue.includes(input.item.id))
                    .filter(
                        (input) => !visited_item_ids.includes(input.item.id),
                    ))
                    queue.push(input.item.id);
            }
        }
        this.allowed_processes = result;
    }

    build() {
        return new ProcessChain(this.allowed_processes);
    }
}

export { FilterForOutput };
