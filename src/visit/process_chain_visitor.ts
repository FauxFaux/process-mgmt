import { Process, ProcessChain } from '../process.js';
import type { Item } from '../item.js';
import type { Stack } from '../stack.js';

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
    init(chain: ProcessChain): void {}
    visit_item(item: Item, chain: ProcessChain): void {}
    visit_process(process: Process, chain: ProcessChain): void {}
    visit_item_process_edge(
        stack: Stack,
        process: Process,
        chain: ProcessChain,
        index: number,
    ): void {}
    visit_process_item_edge(
        process: Process,
        stack: Stack,
        chain: ProcessChain,
        index: number,
    ): void {}
    build(): T {
        throw new Error('not implemented');
    }
}

export { ProcessChainVisitor };
