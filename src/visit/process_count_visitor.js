import { StackSet } from '../stack.js';

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
            let materials = new StackSet();
            this.processes.forEach(proc => {
                let process_count = this.process_counts[proc.id];
                proc.outputs.forEach(output => materials.add(output.mul(process_count)));
                proc.inputs.forEach(input => materials.sub(input.mul(process_count)));
            });
            this.materials = materials;
        };
        return this.chain;
    }
}

export { ProcessCountVisitor };
