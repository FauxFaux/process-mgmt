import { check } from './structures_base.js';
import { Stack } from './stack.js';

class Process {
    constructor(id, inputs, outputs, duration, factory_group) {
        check('id', id, 'inputs', inputs, 'outputs', outputs, 'duration', duration, 'factory_group', factory_group);
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
        return 'Process: [factory: ' + this.factory_group
            + ' duration:' + this.duration
            + ' inputs: ' + this.inputs.map(i => i.toString()).join(',')
            + ' outputs: ' + this.outputs.map(i => i.toString()).join(',')
             + ']';
    }
}

class ProcessChain {
    constructor(processes) {
        check('processes', processes);
        this.processes = processes;
        this.processes_by_output = this._build_processes_by_output();
        this.processes_by_input = this._build_processes_by_input();
        this.settings = {};
    }

    disable(process_id) {
        this.processes = this.processes.filter(p => {
            return p.id != process_id;
        });
        this.processes_by_output = this._build_processes_by_output();
        this.processes_by_input = this._build_processes_by_input();
        return this;
    }

    enable(process) {
        this.processes.push(process);
        this.processes_by_output = this._build_processes_by_output();
        this.processes_by_input = this._build_processes_by_input();
        return this;
    }

    _build_processes_by_output() {
        return this.processes.reduce((acc, cur) => {
            cur.outputs.forEach(output => {
                if (!acc[output.item.id]) { acc[output.item.id] = []; }
                acc[output.item.id].push(cur);
            });
            return acc;
        }, {});
    }

    _build_processes_by_input() {
        return this.processes.reduce((acc, cur) => {
            cur.inputs.forEach(input => {
                if (!acc[input.item.id]) { acc[input.item.id] = []; }
                acc[input.item.id].push(cur);
            });
            return acc;
        }, {});
    }

    filter_for_output(output_stack, priorities, ignored = []) {
        let result = [];
        let visited = [];
        let visited_processes = [];
        let queue = [output_stack.item.id];
        while (queue.length > 0) {
            let current = queue.shift();
            visited.push(current);
            if (ignored.includes(current)) {
                continue;
            }
            let processes_for_current = this.processes_by_output[current];
            let process = null;
            if (processes_for_current && processes_for_current.length > 1) {
                if (!priorities) {
                    throw new Error('No priority selector enabled');
                }
                process = priorities(current, processes_for_current);
            }
            if (processes_for_current && processes_for_current.length == 1) {
                process = processes_for_current[0];
            }
            if (process && !visited_processes.includes(process.id)) {
                result.push(process);
                visited_processes.push(process.id);
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

    find_cycles() {
        let tree = {}; // child:parent relationships
        let loops = [];
        let visited_processes = [];
        let queue = [this.processes[0]];
        while (queue.length > 0) {
            let current = queue.pop();
            visited_processes.push(current.id);

            current.outputs.flatMap(output => {
                let r = this.processes_by_input[output.item.id];
                if (r && r.length > 0) {
                    return r;
                } else {
                    return [];
                }
            }).forEach(p => {
                if (visited_processes.includes(p.id)) {
                    let loop = [];
                    let next = current.id;
                    while (true) {
                        loop.push(next);
                        next = tree[next];
                        if (!next) break;
                    }
                    loops.push(loop.reverse());
                } else {
                    tree[p.id] = current.id;
                    queue.push(p);
                }
            });
        }

        return loops;
    }

    _render_processor_node(node_id, process) {
        let inputs = process.inputs.map((input, index) => {
            return '<i' + index + '> ' + input.item.name;
        }).join(' | ');
        let outputs = process.outputs.map((output, index) => {
            return '<o' + index + '> ' + output.item.name;
        }).join(' | ');
        return node_id + ' [' +
            'shape="record" ' +
            'label="{ {' + inputs + '} ' +
                '| ' + process.factory_group.name + ' ' +
                '| ' + process.duration +
                '| {' + outputs + '} }"' +
            ']';
    }

    _render_item_node(item) {
        return item.id + ' [shape="oval" label="' + item.name + '"]';
    }

    _render_edge(node_id, from, to, index) {
        if (from.factory_group) { // XXX need a better way to detect
            // outbound from a process to an item
            return node_id + ':o' + index + ' -> ' + to.item.id + ' [label="' + to.quantity + '"]';
        } else {
            // inbound from an item to a process
            return from.item.id + ' -> ' + node_id + ':i' + index + ' [label="' + from.quantity + '"]';
        }
    }

    to_graphviz() {
        let result = [];
        result.push('digraph {');
        Object.entries(this.all_items().reduce((acc, cur) => {
            let g = cur.group;
            if (!g) {
                g = '__default__';
            }
            if (!acc[g]) {
                acc[g] = [];
            }
            acc[g].push(cur);
            return acc;
        }, {})).forEach(g => {
            let id = g[0];
            let contents = g[1];
            if (id === '__default__') {
                contents.forEach(item => result.push('  ' + this._render_item_node(item)));
            } else {
                if (this.settings.generate_item_groupings) result.push('  subgraph cluster_' + id + " {");
                contents.forEach(item => result.push('    ' + this._render_item_node(item)));
                if (this.settings.generate_item_groupings) result.push('  }');
            }
        })

        this.processes.forEach((process, index) => {
            let node_id = 'process_' + index;

            result.push('  ' + this._render_processor_node(node_id, process));

            result.push(...process.inputs.map((input, index) => {
                return '  ' + this._render_edge(node_id, input, process, index);
            }));
            result.push(...process.outputs.map((output, index) => {
                return '  ' + this._render_edge(node_id, process, output, index);
            }));
        });
        result.push('}');
        return result.join('\n');
    }
}


export { Process, ProcessChain };
