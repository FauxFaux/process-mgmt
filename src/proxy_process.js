import { StackSet } from './stack.js';
import { Process } from './process.js';

class ProxyProcess extends Process {
    constructor(cycle) {
        let existing = cycle[0];
        let inputs = new StackSet();
        let outputs = new StackSet();

        existing.inputs.forEach(i => {
            inputs.add(i);
            outputs.sub(i);
        });
        existing.outputs.forEach(o => {
            outputs.add(o);
            inputs.sub(o);
        });

        var result_in = inputs.items()
            .map(i => inputs.total(i))
            .filter(i => i.quantity > 0);

        var result_out = inputs.items()
            .map(o => outputs.total(o))
            .filter(o => o.quantity > 0);

        super(
            "proxy_for_" + cycle.join("_"),
            result_in,
            result_out,
            1, // rate-process is always 1
            'proxy'
        );
    }
}

export { ProxyProcess };
