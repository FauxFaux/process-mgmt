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
    }

    check(_chain) {
        return {
            init: true,
        }
    }
    init(in_chain) {
        let chain = in_chain;
        let proxy_found = true;
        while (chain.processes.some(v => (typeof v.cycle) !== 'undefined' )) {
            chain.processes
                .filter(p => (typeof v.cycle) !== 'undefined' )
                .forEach(proxy => {
                    
                });
        }

        this.chain = chain;
    }

    build() { return this.chain; }
}


export { CycleExpander };
