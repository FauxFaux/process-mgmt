import { StackSet } from '../stack.js';
import {
    ProcessChainVisitor,
    VisitorOptions,
} from './process_chain_visitor.js';
import { ProcessChain } from '../process.js';

class ProcessCountVisitor extends ProcessChainVisitor {
    chain?: ProcessChain;

    check(chain: ProcessChain): VisitorOptions {
        return {
            init: true,
            visit_item: false,
            visit_process: false,
            visit_item_process_edge: false,
            visit_process_item_edge: false,
        };
    }
    init(chain: ProcessChain) {
        this.chain = chain;
    }
    build() {
        // can't add rebuild_materials to the root because it breaks overload expectations
        (this.chain! as any).rebuild_materials = function (this: ProcessChain) {
            const materials = new StackSet();
            for (const proc of this.processes) {
                const process_count = this.process_counts![proc.id];
                for (const output of proc.outputs)
                    materials.add(output.mul(process_count));
                for (const input of proc.inputs)
                    materials.sub(input.mul(process_count));
            }
            this.materials = materials;
        };
        return this.chain!;
    }
}

export { ProcessCountVisitor };
