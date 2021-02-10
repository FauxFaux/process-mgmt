
class Data {
    constructor(game, version) {
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
        this.id = id;
        this.name = name;
    }
    toString() {
        return "Item: [name: " + this.name + "]";
    }
}

class FactoryGroup {
    constructor(name) {
        this.id = name;
        this.name = name;
    }

    toString() {
        return "FactoryGroup: [name: " + this.name + "]";
    }
}

class Factory {
    constructor(name, group, duration_modifier = 1) {
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
        this.item = item;
        this.quantity = quantity;
    }
}

class Process {
    constructor(id, inputs, outputs, duration, factory_group) {
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
        this.processes = processes;
        this.processes_by_output = processes.reduce((acc, cur) => {
            cur.outputs.forEach(output => {
                if (!acc[output.item]) { acc[output.item] = []; }
                acc[output.item].push(cur)
            });
            return acc;
        }, {});
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
