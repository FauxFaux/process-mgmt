import { check } from './structures_base.js';
import { Stack } from './stack.js';

class Process {
    constructor(id, inputs, outputs, duration, factory_group) {
        check(
            'id',
            id,
            'inputs',
            inputs,
            'outputs',
            outputs,
            'duration',
            duration,
            'factory_group',
            factory_group,
        );
        this.id = id;
        this.inputs = inputs;
        this.outputs = outputs;
        this.duration = duration;
        this.factory_group = factory_group;
        this.clone_fields = [];
    }

    clone(
        id = this.id,
        inputs = this.inputs,
        outputs = this.outputs,
        duration = this.duration,
        factory_group = this.factory_group,
    ) {
        const result = new Process(
            id,
            inputs,
            outputs,
            duration,
            factory_group,
        );
        this.clone_fields.forEach((f) => (result[f] = this[f]));
        return result;
    }

    production_rate(item, factory_count = 1) {
        return (
            (factory_count *
                this.outputs.find((e) => e.item == item).quantity) /
            this.duration
        );
    }

    process_count_for_rate(input_stack) {
        const output_stack = this.outputs.find(
            (o) => o.item.id === input_stack.item.id,
        );
        return (this.duration * input_stack.quantity) / output_stack.quantity;
    }

    requirements_for_count(factory_count) {
        return this.inputs.map(
            (i) => new Stack(i.item, i.quantity * factory_count),
        );
    }

    toString() {
        return (
            'Process: [factory: ' +
            this.factory_group +
            ' duration:' +
            this.duration +
            ' inputs: ' +
            this.inputs.map((i) => i.toString()).join(',') +
            ' outputs: ' +
            this.outputs.map((i) => i.toString()).join(',') +
            ']'
        );
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

    /**
     * @param arguments process_id, process_id, ...
     */
    disable() {
        this._disable(arguments);
        this._rebuild();
        return this;
    }
    _disable(args) {
        this.processes = this.processes.filter((p) => {
            return !args.includes(p.id);
        });
    }

    /**
     * @param arguments process, process, ...
     */
    enable() {
        this._enable(arguments);
        this._rebuild();
        return this;
    }
    _enable(args) {
        this.processes.push(...args);
    }

    _rebuild() {
        this.processes_by_output = this._build_processes_by_output();
        this.processes_by_input = this._build_processes_by_input();
    }

    /**
     *
     * @param {Array[process_id, ...]} original
     * @param {Array[Process, ...]} replacements
     */
    replace(original, replacements) {
        this._disable(original);
        this._enable(replacements);
        this._rebuild();
        return this;
    }

    _build_processes_by_output() {
        return this.processes.reduce((acc, cur) => {
            cur.outputs.forEach((output) => {
                if (!acc[output.item.id]) {
                    acc[output.item.id] = [];
                }
                acc[output.item.id].push(cur);
            });
            return acc;
        }, {});
    }

    _build_processes_by_input() {
        return this.processes.reduce((acc, cur) => {
            cur.inputs.forEach((input) => {
                if (!acc[input.item.id]) {
                    acc[input.item.id] = [];
                }
                acc[input.item.id].push(cur);
            });
            return acc;
        }, {});
    }

    /**
     *
     * @param {*} output_stack
     * @param {callback} priorities fn(process_id, list_of_processes_that_can_be_used) => single_process
     * @param {*} ignored
     * @returns
     */
    filter_for_output(output_stack, priorities, ignored = []) {
        const result = [];
        const visited = [];
        const visited_processes = [];
        const queue = [output_stack.item.id];
        while (queue.length > 0) {
            const current = queue.shift();
            visited.push(current);
            if (ignored.includes(current)) {
                continue;
            }
            const process = this._select_process(current, priorities);

            if (process && !visited_processes.includes(process.id)) {
                result.push(process);
                visited_processes.push(process.id);
                process.inputs
                    .filter((input) => !queue.includes(input.item.id))
                    .filter((input) => !visited.includes(input.item.id))
                    .forEach((input) => queue.push(input.item.id));
            }
        }
        return new ProcessChain(result);
    }

    _select_process(item_id, callback) {
        const processes_for_current = this.processes_by_output[item_id];
        if (processes_for_current && processes_for_current.length > 1) {
            if (!callback) {
                throw new Error('No priority selector enabled');
            }
            return callback(item_id, processes_for_current);
        }
        if (processes_for_current && processes_for_current.length == 1) {
            return processes_for_current[0];
        }
    }

    require_output(stack) {
        return (
            stack.quantity /
            this.processes_by_output[stack.item][0].production_rate(stack.item)
        );
    }

    all_items() {
        return [
            ...new Set(
                this.processes.flatMap((cur) => {
                    return cur.inputs
                        .map((stack) => stack.item)
                        .concat(cur.outputs.map((stack) => stack.item));
                }),
            ),
        ];
    }

    _render_processor_node(node_id, process) {
        const inputs = process.inputs
            .map((input, index) => {
                return '<i' + index + '> ' + input.item.name;
            })
            .join(' | ');
        const outputs = process.outputs
            .map((output, index) => {
                return '<o' + index + '> ' + output.item.name;
            })
            .join(' | ');
        return (
            node_id +
            ' [' +
            'shape="record" ' +
            'label="{ {' +
            inputs +
            '} ' +
            '| ' +
            process.factory_group.name +
            ' ' +
            '| ' +
            process.duration +
            '| {' +
            outputs +
            '} }"' +
            ']'
        );
    }

    _render_item_node(item) {
        return item.id + ' [shape="oval" label="' + item.name + '"]';
    }

    _render_edge(node_id, from, to, index) {
        if (from.factory_group) {
            // XXX need a better way to detect
            // outbound from a process to an item
            return (
                node_id +
                ':o' +
                index +
                ' -> ' +
                to.item.id +
                ' [label="' +
                to.quantity +
                '"]'
            );
        } else {
            // inbound from an item to a process
            return (
                from.item.id +
                ' -> ' +
                node_id +
                ':i' +
                index +
                ' [label="' +
                from.quantity +
                '"]'
            );
        }
    }

    accept(visitor) {
        const options = visitor.check(this);
        if (options.init) visitor.init(this);
        if (options.visit_item)
            this.all_items().forEach((e) => visitor.visit_item(e, this));
        if (
            options.visit_process ||
            options.visit_item_process_edge ||
            options.visit_process_item_edge
        ) {
            this.processes.forEach((p) => {
                if (options.visit_process) visitor.visit_process(p, this);
                if (options.visit_item_process_edge)
                    p.inputs.forEach((i, ix) =>
                        visitor.visit_item_process_edge(i, p, this, ix),
                    );
                if (options.visit_process_item_edge)
                    p.outputs.forEach((o, ox) =>
                        visitor.visit_process_item_edge(p, o, this, ox),
                    );
            });
        }
        return visitor.build();
    }

    to_graphviz() {
        const result = [];
        result.push('digraph {');
        Object.entries(
            this.all_items().reduce((acc, cur) => {
                let g = cur.group;
                if (!g) {
                    g = '__default__';
                }
                if (!acc[g]) {
                    acc[g] = [];
                }
                acc[g].push(cur);
                return acc;
            }, {}),
        ).forEach((g) => {
            const id = g[0];
            const contents = g[1];
            if (id === '__default__') {
                contents.forEach((item) =>
                    result.push('  ' + this._render_item_node(item)),
                );
            } else {
                if (this.settings.generate_item_groupings)
                    result.push('  subgraph cluster_' + id + ' {');
                contents.forEach((item) =>
                    result.push('    ' + this._render_item_node(item)),
                );
                if (this.settings.generate_item_groupings) result.push('  }');
            }
        });

        this.processes.forEach((process, index) => {
            const node_id = 'process_' + index;

            result.push('  ' + this._render_processor_node(node_id, process));

            result.push(
                ...process.inputs.map((input, index) => {
                    return (
                        '  ' + this._render_edge(node_id, input, process, index)
                    );
                }),
            );
            result.push(
                ...process.outputs.map((output, index) => {
                    return (
                        '  ' +
                        this._render_edge(node_id, process, output, index)
                    );
                }),
            );
        });
        result.push('}');
        return result.join('\n');
    }
}

export { Process, ProcessChain };
