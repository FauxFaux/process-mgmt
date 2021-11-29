import { StackSet } from "../stack.js";
import { Process, ProcessChain } from "../process.js";
import { CycleDetector } from "./cycle_detector.js";
import { EnableDisable } from "./enable_disable_visitor.js";
import { ProcessChainVisitor } from "./process_chain_visitor.js";
import { Factory } from "../factory.js";



class CycleExpander extends ProcessChainVisitor {

    constructor(data) {
        super();
        this.data = data;
        this.processes = [];
        this.materials = new StackSet();
        this.process_counts = {};
    }

    check(_chain) {
        return {
            visit_process: true,
            init: true,
        }
    }
    init(chain) {
        this.chain = chain;
    }

    _is_proxy(process) {
        return (typeof process.cycle) !== 'undefined';
    }

    visit_process(process, chain) {
        if (this._is_proxy(process)) {
            this._expand_proxy_process(process, chain.process_counts[process.id]);
        } else {
            this._add_non_proxy(process, chain.process_counts[process.id]);
        }
    }

    _expand_proxy_process(proxy, count) {
        proxy.cycle.processes.forEach(process => {
            if (this._is_proxy(process)) {
                this._expand_proxy_process(process, count * proxy.process_counts[process.id]);
            } else {
                this._add_non_proxy(process, count * proxy.process_counts[process.id]);
            }
        });
    }

    _handle_process(process, count) {

    }

    _add_non_proxy(process, count) {
        this.processes.push(process);
        this.process_counts[process.id] = count;
        process.outputs.forEach(output => {
            this.materials.add(output.mul(count));
        });
        process.inputs.forEach(input => {
            this.materials.sub(input.mul(count));
        });
    }

    build() {
        let result = new ProcessChain(this.processes);
        result.materials = this.materials;
        result.process_counts = this.process_counts;

        return result;
    }
}


export { CycleExpander };
