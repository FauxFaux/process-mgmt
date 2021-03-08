
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
            if (processes_for_current && processes_for_current.length > 1) {
                throw new Error("TODO enable priorities for " + current);
            } else if (processes_for_current && processes_for_current.length == 1) {
                result.push(processes_for_current[0]);
                processes_for_current[0].inputs
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

    to_graphviz() {
        let result = [];
        result.push("digraph {")
        this.all_items().forEach(item => {
            result.push("  " + item.id + " [shape=\"oval\" label=\"" + item.name + "\"]")
        });
        this.processes.forEach((process, index) => {
            let node_id = "process_" + index;
            let inputs = process.inputs.map((input, index) => {
                return "<i" + index + "> " + input.item.name;
            }).join(" | ");
            let outputs = process.outputs.map((output, index) => {
                return "<o" + index + "> " + output.item.name;
            }).join(" | ");
            result.push("  " + node_id + " [shape=\"record\" label=\"{ {" + inputs + "} | " + process.factory_group.name + " | {" + outputs + "} }\"]");

            result.push(...
                process.inputs.map((input, index) => {
                    return "  " + input.item.id + " -> " + node_id + ":i" + index + " [label=\"" + input.quantity + "\"]";
                })
            )
            result.push(...
                process.outputs.map((output, index) => {
                    return "  " + node_id + ":o" + index + " -> " + output.item.id + " [label=\"" + output.quantity + "\"]";
                })
            )
        });
        result.push("}")
        return result.join('\n')
    }
}



export {Data, Item, Stack, FactoryGroup, Factory, Process, ProcessChain}
