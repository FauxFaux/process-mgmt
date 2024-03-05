import { ProcessChain } from '../process.js';

export interface VisitorOptions {
    init?: boolean;
    visit_item?: boolean;
    visit_process?: boolean;
    visit_item_process_edge?: boolean;
    visit_process_item_edge?: boolean;
}

class ProcessChainVisitor<T = ProcessChain> {
    check(chain: ProcessChain): VisitorOptions {
        return {
            init: true,
            visit_item: true,
            visit_process: true,
            visit_item_process_edge: true,
            visit_process_item_edge: true,
        };
    }
    init(chain) {}
    visit_item(item, chain) {}
    visit_process(process, chain) {}
    visit_item_process_edge(item, process, chain, index) {}
    visit_process_item_edge(process, item, chain, index) {}
    build(): T {
        throw new Error('not implemented');
    }
}

export { ProcessChainVisitor };
