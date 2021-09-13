import { StackSet } from "../stack.js";
import { Process, ProcessChain } from "../process.js";
import { CycleDetector } from "./cycle_detector.js";
import { EnableDisable } from "./enable_disable_visitor.js";
import { ProcessChainVisitor } from "./process_chain_visitor.js";
import { Factory } from "../factory.js";


class CycleRemover extends ProcessChainVisitor {

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
        let cycles = chain.accept(new CycleDetector());
        while (cycles.length > 0) {
            cycles.sort((a, b) => a.length > b.length);

            let cycle = cycles[0];
            let cycle_processes = cycle.map(id => {
                return chain.processes.find(p => p.id === id);
            })
            let proxy = this._create_proxy(cycle_processes);
            let removed = chain.accept(new EnableDisable(null, [], cycle));
            chain = new ProcessChain(removed.processes.concat([proxy]));

            cycles = chain.accept(new CycleDetector());
        }
        this.chain = chain;
    }

    _create_proxy(cycle) {
        let inputs = new StackSet();
        let outputs = new StackSet();

        cycle.forEach(existing => {
            existing.inputs.forEach(i => {
                inputs.add(i);
                outputs.sub(i);
            });
            existing.outputs.forEach(o => {
                outputs.add(o);
                inputs.sub(o);
            });
        });

        var result_in = inputs.items()
            .map(i => inputs.total(i))
            .filter(i => i.quantity > 0);

        var result_out = inputs.items()
            .map(o => outputs.total(o))
            .filter(o => o.quantity > 0);

        let proxy = new Process(
            "proxy_for_" + cycle.map(p => p.id).join("_"),
            result_in,
            result_out,
            1, // rate-process is always 1
            'proxy'
        );
        proxy.cycle = cycle;
        proxy.factory_type = new Factory('__generated__', 'default', -1);
        return proxy;
    }

    build() { return this.chain; }
}


export { CycleRemover };
