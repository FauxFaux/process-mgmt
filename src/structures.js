
function check() {
    for (let i = 0; i < arguments.length; i += 2) {
        let n = arguments[i];
        let v = arguments[i+1];
        if (typeof v === "undefined") {
            throw new Error(n + " must not be undefined");
        }
    }
}

class Data {
    constructor(game, version) {
        check("game", game, "version", version);
        this.game = game;
        this.version = version;
        this.items = {};
        this.factory_groups = {};
        this.factories = {};
        this.processes = {};
    }
    
    _check_add(type, thing) {
        if (!(typeof this[type][thing.id] === "undefined")) {
            throw new Error("duplicate " + type + " id created: " + thing)
        }
        this[type][thing.id] = thing;
    }

    add_item(item) { this._check_add("items", item); }
    add_factory_group(factory_group) { this._check_add("factory_groups", factory_group); }
    add_process(process) { this._check_add("processes", process); }

    add_items(items) { items.forEach(i => this.add_item(i)); } 
    add_factory_groups(factory_groups) { factory_groups.forEach(f => this.add_factory_group(f)); }
    add_processes(processes) { processes.forEach(p => this.add_process(p)); }

}

class Item {
    constructor(id, name) {
        check("id", id, "name", name);
        this.id = id;
        this.name = name;
    }
    toString() {
        return "Item: [name: " + this.name + "]";
    }
}

class FactoryGroup {
    constructor(name) {
        check("name", name);
        this.id = name;
        this.name = name;
    }

    toString() {
        return "FactoryGroup: [name: " + this.name + "]";
    }
}

class Factory {
    constructor(name, group, duration_modifier = 1) {
        check("name", name, "group", group, "duration_modifier", duration_modifier);
        this.name = name;
        this.group = group;
        this.duration_modifier = duration_modifier;
    }

    toString() {
        return "Factory: [name: " + this.name + ", group: " + this.group + "]";
    }
}

class Stack {
    constructor(item, quantity) {
        check("item", item, "quantity", quantity);
        this.item = item;
        this.quantity = quantity;
    }
    clone() {
        return new Stack(this.item, this.quantity);
    }
    add(other) {
        if (other) {
            return new Stack(this.item, this.quantity + other.quantity);
        } else {
            return this.clone();
        }
    }
}

class StackSet {
    constructor() {
        this.stacks = {};
    }
    add(stack) {
        if (!this.stacks[stack.item.id]) {
            this.stacks[stack.item.id] = [];
        }
        this.stacks[stack.item.id].push(stack);
    }

    total(item) {
        return this.stacks[item.id].reduce((p, c) => p.add(c), new Stack(item, 0));
    }
}

class Process {
    constructor(id, inputs, outputs, duration, factory_group) {
        check("id", id, "inputs", inputs, "outputs", outputs, "duration", duration, "factory_group", factory_group);
        this.id = id;
        this.inputs = inputs;
        this.outputs = outputs;
        this.duration = duration;
        this.factory_group = factory_group;
    }

    production_rate(item, factory_count = 1) {
        return factory_count * this.outputs.find(e => e.item == item).quantity / this.duration;
    }

    count_for_rate(stack) {
        return stack.quantity / this.production_rate(stack.item);
    }

    requirements_for_count(factory_count) {
        return this.inputs.map(i => new Stack(i.item, i.quantity * factory_count));
    }

    toString() {
        return "Process: [factory: " + this.factory_group + " duration:" + this.duration + " inputs: " + this.inputs + " outputs: " + this.outputs + "]";
    }
}

class ProcessChain {
    constructor(processes) {
        check("processes", processes);
        this.processes = processes;
        this.processes_by_output = processes.reduce((acc, cur) => {
            cur.outputs.forEach(output => {
                if (!acc[output.item.id]) { acc[output.item.id] = []; }
                acc[output.item.id].push(cur)
            });
            return acc;
        }, {});
    }

    filter_for_output(output_stack, priorities) {
        let result = [];
        let visited = [];
        let queue = [output_stack.item.id];
        while (queue.length > 0) {
            let current = queue.shift();
            visited.push(current);
            let processes_for_current = this.processes_by_output[current];
            process = null;
            if (processes_for_current && processes_for_current.length > 1) {
                if (!priorities) {
                    throw new Error("No priority selector enabled");
                }
                process = priorities(current, processes_for_current);
            }    
            if (processes_for_current && processes_for_current.length == 1) {
                process = processes_for_current[0];
            }
            if (process) {
                result.push(process);
                process.inputs
                        .filter(input => !queue.includes(input.item.id))
                        .filter(input => !visited.includes(input.item.id))
                        .forEach(input => queue.push(input.item.id));
            }
        }
        return new ProcessChain(result);
    }

    require_output(stack) {
        return stack.quantity / this.processes_by_output[stack.item][0].production_rate(stack.item);
    }

    all_items() {
        return [...new Set(
            this.processes.flatMap((cur) => {
                return cur.inputs.map(stack => stack.item)
                    .concat(cur.outputs.map(stack => stack.item));
            })
        )];
    }

    _render_processor_node(node_id, process) {
        let inputs = process.inputs.map((input, index) => {
            return "<i" + index + "> " + input.item.name;
        }).join(" | ");
        let outputs = process.outputs.map((output, index) => {
            return "<o" + index + "> " + output.item.name;
        }).join(" | ");
        return node_id + " [" +
            "shape=\"record\" " +
            "label=\"{ {" + inputs + "} " +
                "| " + process.factory_group.name + " " +
                "| " + process.duration + 
                "| {" + outputs + "} }\"" +
            "]";
    }

    _render_item_node(item) {
        return item.id + " [shape=\"oval\" label=\"" + item.name + "\"]"
    }

    _render_edge(node_id, from, to, index) {
        if (from.factory_group) { // XXX need a better way to detect 
            // outbound from a process to an item
            return node_id + ":o" + index + " -> " + to.item.id + " [label=\"" + to.quantity + "\"]";
        } else {
            // inbound from an item to a process
            return from.item.id + " -> " + node_id + ":i" + index + " [label=\"" + from.quantity + "\"]";
        }
    }

    to_graphviz() {
        let result = [];
        result.push("digraph {")
        this.all_items().forEach(item => {
            result.push("  " + this._render_item_node(item));
        });
        this.processes.forEach((process, index) => {
            let node_id = "process_" + index;

            result.push("  " + this._render_processor_node(node_id, process))

            result.push(...
                process.inputs.map((input, index) => {
                    return "  " + this._render_edge(node_id, input, process, index);
                })
            )
            result.push(...
                process.outputs.map((output, index) => {
                    return "  " + this._render_edge(node_id, process, output, index);
                    // return "  " + this._render_edge(node_id + ":o" + index, output.item.id, process, output);
                })
            )
        });
        result.push("}")
        return result.join('\n')
    }
}

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



export {Data, Item, Stack, FactoryGroup, Factory, Process, ProcessChain, RateChain}
