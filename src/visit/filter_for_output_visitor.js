import { ProcessChain } from "../../src/process.js";
import { ProcessChainVisitor } from './process_chain_visitor.js';


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
        }
    }

    init(chain) {
        let result = [];
        let visited_item_ids = [];
        let visited_processes = [];
        let queue = [this.output_item.id];
        while (queue.length > 0) {
            let current = queue.shift();
            visited_item_ids.push(current);
            if (this.ignored.includes(current)) {
                continue;
            }
            let process = this._select_process(chain, current, this.priority_cb);

            if (process && !visited_processes.includes(process.id)) {
                result.push(process);
                visited_processes.push(process.id);
                process.inputs
                    .filter(input => !queue.includes(input.item.id))
                    .filter(input => !visited_item_ids.includes(input.item.id))
                    .forEach(input => queue.push(input.item.id));
            }
        }
        this.allowed_processes = result;
    }

    _select_process(chain, item_id, callback) {
        let processes_for_current = chain.processes_by_output[item_id];
        if (processes_for_current && processes_for_current.length > 1) {
            if (!callback) {
                throw new Error('No priority selector enabled');
            }
            return callback(item_id, processes_for_current);
        }
        if (processes_for_current && processes_for_current.length == 1) {
            return processes_for_current[0];
        }
    }

    build() { return new ProcessChain(this.allowed_processes); }
}

export { FilterForOutput };
