import { StackSet } from '../stack.ts';

class ProcessCountVisitor {
    check(chain) {
        return {
            init: true,
            visit_item: false,
            visit_process: false,
            visit_item_process_edge: false,
            visit_process_item_edge: false,
        };
    }
    init(chain) {
        this.chain = chain;
    }
    build() {
        this.chain.rebuild_materials = function () {
            const materials = new StackSet();
            for (const proc of this.processes) {
                const process_count = this.process_counts[proc.id];
                for (const output of proc.outputs)
                    materials.add(output.mul(process_count));
                for (const input of proc.inputs)
                    materials.sub(input.mul(process_count));
            }
            this.materials = materials;
        };
        return this.chain;
    }
}

export { ProcessCountVisitor };
