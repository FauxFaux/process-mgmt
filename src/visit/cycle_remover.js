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
            let cycle_processes = cycle.processes;
            let proxy = this._create_proxy2(cycle);
            let removed = chain.accept(new EnableDisable(null, [], cycle_processes.map(p => p.id)));
            chain = new ProcessChain(removed.processes.concat([proxy]));

            cycles = chain.accept(new CycleDetector());
        }
        this.chain = chain;
    }

    _find_linking_item(from, requirements) {
        let f = from.outputs.map(stack => stack.item.id);
        let t = requirements.map(stack => stack.item.id);
        let intersection = f.filter(id => t.includes(id));
        return requirements.filter(stack => intersection.includes(stack.item.id))[0]; // assume there is only one linking item
    }

    _calculate_process_counts(cycle) {
        return cycle.processes
            .reduceRight((acc, cur, idx, arr) => {
                if (Object.keys(acc).length == 0) { acc[cur.id] = 1; return acc; }
                let prev = arr[idx+1];
                let required_inputs = prev.requirements_for_count(acc[prev.id]);
                let linking_stack = this._find_linking_item(cur, required_inputs);
                acc[cur.id] = cur.process_count_for_rate(linking_stack);
                return acc;
            }, {});
    }

    _calculate_proxy_materials(cycle, counts) { 
        let inputs = new StackSet();
        let outputs = new StackSet();

        cycle.processes.forEach(existing => {
            let count = counts[existing.id];
            existing.inputs.forEach(i => {
                inputs.add(i.mul(count));
                outputs.sub(i.mul(count));
            });
            existing.outputs.forEach(o => {
                outputs.add(o.mul(count));
                inputs.sub(o.mul(count));
            });
        });
        return {
            'input': inputs.items()
                .map(i => inputs.total(i))
                .filter(i => i.quantity > 0),
            'output': inputs.items()
                .map(o => outputs.total(o))
                .filter(o => o.quantity > 0)
        };
    }

    _create_proxy2(cycle) {
        let counts = this._calculate_process_counts(cycle);

        let materials = this._calculate_proxy_materials(cycle, counts);

        let proxy = new Process(
            "proxy_for_" + cycle.processes.map(p => p.id).join("_"),
            materials['input'],
            materials['output'],
            1, // rate-process is always 1
            'proxy'
        );
        proxy.cycle = cycle;
        proxy.process_counts = counts;
        proxy.factory_type = new Factory('__generated__', 'default', -1);
        return proxy;
    }

    _create_proxy(cycle) {
        let inputs = new StackSet();
        let outputs = new StackSet();

        cycle.processes.forEach(existing => {
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
            "proxy_for_" + cycle.processes.map(p => p.id).join("_"),
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
