import { ProcessChain } from '../process.js';
import {
    ProcessChainVisitor,
    VisitorOptions,
} from './process_chain_visitor.js';

class EnableDisable extends ProcessChainVisitor {
    data;
    enable;
    disable;

    chain;

    constructor(data, enable, disable) {
        super();
        this.data = data;
        this.enable = enable;
        this.disable = disable;
    }

    check(_chain): VisitorOptions {
        return {
            init: true,
        };
    }
    init(chain) {
        this.chain = chain;
    }
    build() {
        return new ProcessChain(
            this.chain.processes
                .concat(this.enable.map((p) => this.data.processes[p]))
                .filter((p) => !this.disable.includes(p.id)),
        );
    }
}

export { EnableDisable };
