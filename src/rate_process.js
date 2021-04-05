import { StackSet } from "./stack.js";
import { Factory } from "./factory.js";
import { Process, ProcessChain } from "./process.js";


class RateProcess extends Process {
    constructor(p, factory_type) {
        let p_ = factory_type.update_process(p);
        super(
            p_.id,
            p_.inputs.map(input => input.div(p_.duration)),
            p_.outputs.map(output => output.div(p_.duration)),
            p_.duration,
            p_.factory_group
            );
        this.factory_type = factory_type;
    }

    process_count_for_rate(input_stack) {
        let output_stack = this.outputs.find(o => o.item.id === input_stack.item.id);
        return input_stack.quantity / output_stack.quantity;
    }
}

class RateChain extends ProcessChain {
    constructor(chain, factory_types) {
        super(chain.processes.map(p => {
            let factory = new Factory('__generated__', 'generated default', 1);
            if (factory_types[p.factory_group.id]) {
                factory = factory_types[p.factory_group.id];
            }
            if (factory_types[p.id]) {
                factory = factory_types[p.id];
            }
            return new RateProcess(p, factory);
        }));
        this.materials = new StackSet();
        this.process_counts = {};
    }

    update(stack) {
        let materials = new StackSet();
        let process_counts = {};

        let queue = [stack];
        while(queue.length > 0) {
            let current = queue.pop();
            if (this.processes_by_output[current.item.id]) {
                let process = this.processes_by_output[current.item.id][0]; // XXX "pick the first"
                let process_count = process.process_count_for_rate(current);
                if (!process_counts[process.id]) { process_counts[process.id] = 0; }
                process_counts[process.id] += process_count;
                process.outputs.forEach(input => {
                    materials.add(input.mul(process_count));
                });
                process.inputs.forEach(input => {
                    queue.push(input.mul(process_count));
                    materials.sub(input.mul(process_count));
                });
            }
        }
        this.materials = materials;
        this.process_counts = process_counts;
    }

    _render_item_node(item) {
        return item.id + " [shape=\"record\" label=\"{"
            + item.name
            + " | { produce: " + this.materials.total_positive(item).quantity + "/s"
            + " | consume: " + this.materials.total_negative(item).mul(-1).quantity + "/s }"
            + "}\"]"
    }

    _render_processor_node(node_id, process) {
        let process_count = this.process_counts[process.id];
        let inputs = process.inputs.map((input, index) => {
            return "<i" + index + "> " + input.item.name + " (" + (input.quantity * process_count) + ")";
        }).join(" | ");
        let outputs = process.outputs.map((output, index) => {
            return "<o" + index + "> " + output.item.name + " (" + (output.quantity * process_count) + ")";
        }).join(" | ");
        return node_id + " [" +
            "shape=\"record\" " +
            "label=\"{ {" + inputs + "}" +
                " | " + process.factory_group.name +
                " | { " + process.duration + "s/run | " + process_count + " factories }" +
                " | {" + outputs + "} }\"" +
            "]";
    }


    _render_edge(node_id, from, to, index) {
        if (from.factory_group) { // XXX need a better way to detect the orientation of the edge.
            // outbound from a process to an item
            return node_id + ":o" + index + " -> " + to.item.id;// + " [label=\"" + to.quantity + "\"]";
        } else {
            // inbound from an item to a process
            let process_count = this.process_counts[to.id];
            let input_rate = to.inputs.find(i => i.item.id === from.item.id);
            let rate = input_rate.quantity * process_count;
            return from.item.id + " -> " + node_id + ":i" + index + " [label=\"" + rate + "/s\"]";
        }
    }
}

export { RateProcess, RateChain }
