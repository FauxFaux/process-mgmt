import { check } from './structures_base.js';




class RatedProcess extends Process {
    constructor(p) {
        super(p.id, p.inputs, p.outputs, p.duration, p.factory_group);
        this.factory_type = new Factory("TODO", "any", 1);
        this.factory_count = 0;
    }

    input_requirements() {
        return this.inputs.map(input => {
            let result = input.clone();
            result.quantity = result.quantity * this.factory_cousnt / this.duration;
            return result;
        });
    }
}

class RateChain extends ProcessChain {
    constructor(chain) {
        super(chain.processes.map(p => new RatedProcess(p)));
        this.rates = {};
        this.edge_rates = {};
    }


    update2(product_stack) {
        let queue = [];
        let process_counts = {}; // process_id => required count of the process.
        queue.push(product_stack.clone());
        while(queue.length > 0) {
            let stack = queue.pop();
            if (this.processes_by_output[stack.item.id]) {
                let process = this.processes_by_output[stack.item.id][0]; // XXX "pick the first"
                process.inputs.forEach(input => {
                    
                });
            }
        }
    }

    update(product_stack) {
        let queue = [];
        queue.push(product_stack.clone());
        this.rates[product_stack.item.id] = product_stack.clone();
        while (queue.length > 0) {
            let stack = queue.pop();
            if (this.processes_by_output[stack.item.id]) {
                let process = this.processes_by_output[stack.item.id][0]; // XXX "pick the first"
                process.factory_count += process.count_for_rate(stack);
                let req = process.input_requirements();
                req.forEach(r => {
                    this._set_edge_rate(r.item, process, r);
                    this.rates[r.item.id] = r.add(this.rates[r.item.id]);
                    queue.push(r);
                });
            }
        }
    }

    _get_edge_rate(from, to) {
        return this.edge_rates[from.id][to.id];
    }
    _set_edge_rate(from, to, stack) {
        if (!this.edge_rates[from.id]) {
            this.edge_rates[from.id] = {};
        }
        this.edge_rates[from.id][to.id] = stack;
    }

    _render_item_node(item) {
        return item.id + " [shape=\"record\" label=\"{" 
            + item.name
            + " | " + ( this.rates[item.id] ? this.rates[item.id].quantity : "???????????" ) + "/s"
            + "}\"]"
    }

    _render_edge(node_id, from, to, index) {
        if (from.factory_group) { // XXX need a better way to detect 
            // outbound from a process to an item
            return node_id + ":o" + index + " -> " + to.item.id;// + " [label=\"" + to.quantity + "\"]";
        } else {
            // inbound from an item to a process
            let rate = this._get_edge_rate(from.item, to);
            return from.item.id + " -> " + node_id + ":i" + index + " [label=\"" + rate.quantity + "/s\"]";
        }
    }

    _render_processor_node(node_id, process) {
        let inputs = process.inputs.map((input, index) => {
            return "<i" + index + "> " + input.item.name + " (" + input.quantity + ")";
        }).join(" | ");
        let outputs = process.outputs.map((output, index) => {
            return "<o" + index + "> " + output.item.name + " (" + output.quantity + ")";
        }).join(" | ");
        return node_id + " [" +
            "shape=\"record\" " +
            "label=\"{ {" + inputs + "}" +
                " | " + process.factory_group.name +
                " | { " + process.duration + "s/run | " + process.factory_count + " factories }" + 
                " | {" + outputs + "} }\"" +
            "]";
    }

}

import { Factory, FactoryGroup } from './factory.js'
import { Data } from './data.js'
import { Stack, StackSet } from './stack.js'
import { Item } from './item.js'
import { Process, ProcessChain } from './process.js'

export {Data, Item, Stack, FactoryGroup, Factory, Process, ProcessChain, RateChain}
