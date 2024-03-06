import { check } from './structures_base.js';
import { Stack, StackSet } from './stack.js';
import { ProcessChainVisitor } from './visit/process_chain_visitor.js';
import { Factory, FactoryGroup } from './factory.js';
import { Item, ItemId } from './item.js';

export type ProcessId = string;

class Process {
    id: ProcessId;
    inputs: Stack[];
    outputs: Stack[];
    duration: number;
    factory_group: FactoryGroup;
    clone_fields: (keyof Process)[];

    // stashed here by RateVisitor during computation
    factory_type?: Factory;

    rate_process?: unknown;

    constructor(
        id: string,
        inputs: Stack[],
        outputs: Stack[],
        duration: number,
        factory_group: FactoryGroup,
    ) {
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
        for (const f of this.clone_fields) (result[f] as any) = this[f];
        return result;
    }

    production_rate(item: Item, factory_count = 1) {
        return (
            (factory_count *
                this.outputs.find((e) => e.item == item)!.quantity) /
            this.duration
        );
    }

    process_count_for_rate(input_stack: Stack) {
        const output_stack = this.outputs.find(
            (o) => o.item.id === input_stack.item.id,
        )!;
        return (this.duration * input_stack.quantity) / output_stack.quantity;
    }

    requirements_for_count(factory_count: number) {
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
    processes: Process[];
    // TODO: insane type
    processes_by_output: Record<ItemId, unknown> | unknown[];
    // TODO: insane type
    processes_by_input: Record<ItemId, unknown> | unknown[];
    settings: { generate_item_groupings?: boolean };

    materials?: StackSet;
    process_counts?: Record<string, number>;

    constructor(processes: Process[]) {
        check('processes', processes);
        this.processes = processes;
        this.processes_by_output = this._build_processes_by_output();
        this.processes_by_input = this._build_processes_by_input();
        this.settings = {};
    }

    /**
     * @param args process_id, process_id, ...
     */
    disable(...args: ProcessId[]) {
        this._disable(...args);
        this._rebuild();
        return this;
    }
    _disable(...args: ProcessId[]) {
        this.processes = this.processes.filter((p) => {
            return !args.includes(p.id);
        });
    }

    /**
     * @param args process, process, ...
     */
    enable(...args: Process[]) {
        this._enable(...args);
        this._rebuild();
        return this;
    }
    _enable(...args: Process[]) {
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
    replace(original: ProcessId[], replacements: Process[]) {
        this._disable(...original);
        this._enable(...replacements);
        this._rebuild();
        return this;
    }

    _build_processes_by_output() {
        return this.processes.reduce(
            (acc, cur) => {
                for (const output of cur.outputs) {
                    if (!acc[output.item.id]) {
                        acc[output.item.id] = [];
                    }
                    acc[output.item.id].push(cur);
                }
                return acc;
            },
            {} as Record<ItemId, Process[]>,
        );
    }

    _build_processes_by_input() {
        return this.processes.reduce(
            (acc, cur) => {
                for (const input of cur.inputs) {
                    if (!acc[input.item.id]) {
                        acc[input.item.id] = [];
                    }
                    acc[input.item.id].push(cur);
                }
                return acc;
            },
            {} as Record<ItemId, Process[]>,
        );
    }

    /**
     *
     * @param {*} output_stack
     * @param {callback} priorities fn(process_id, list_of_processes_that_can_be_used) => single_process
     * @param {*} ignored
     * @returns
     */
    filter_for_output(
        output_stack: Stack,
        priorities: PriorityCallback,
        ignored: ItemId[] = [],
    ) {
        const result: Process[] = [];
        const visited: ItemId[] = [];
        const visited_processes: ProcessId[] = [];
        const queue = [output_stack.item.id];
        while (queue.length > 0) {
            const current = queue.shift()!;
            visited.push(current);
            if (ignored.includes(current)) {
                continue;
            }
            const process = this._select_process(current, priorities);

            if (process && !visited_processes.includes(process.id)) {
                result.push(process);
                visited_processes.push(process.id);
                for (const input of process.inputs
                    .filter((input) => !queue.includes(input.item.id))
                    .filter((input) => !visited.includes(input.item.id)))
                    queue.push(input.item.id);
            }
        }
        return new ProcessChain(result);
    }

    _select_process(item_id: ItemId, callback: PriorityCallback): Process {
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

        throw new Error('No process found for item: ' + item_id);
    }

    require_output(stack: Stack) {
        return (
            stack.quantity /
            // @ts-expect-error
            this.processes_by_output[stack.item][0].production_rate(stack.item)
        );
    }

    all_items(): Item[] {
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

    _render_processor_node(node_id: unknown, process: Process) {
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

    _render_item_node(item: Item) {
        return item.id + ' [shape="oval" label="' + item.name + '"]';
    }

    _render_edge(
        node_id: unknown,
        from: Stack | Process,
        to: Stack | Process,
        index: number,
    ): string {
        if ('factory_group' in from) {
            // XXX need a better way to detect
            // outbound from a process to an item
            const so = to as Stack;
            return (
                node_id +
                ':o' +
                index +
                ' -> ' +
                so.item.id +
                ' [label="' +
                so.quantity +
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

    accept<T>(visitor: ProcessChainVisitor<T>): T {
        const options = visitor.check(this);
        if (options.init) visitor.init(this);
        if (options.visit_item)
            for (const e of this.all_items()) visitor.visit_item(e, this);
        if (
            options.visit_process ||
            options.visit_item_process_edge ||
            options.visit_process_item_edge
        ) {
            for (const p of this.processes) {
                if (options.visit_process) visitor.visit_process(p, this);
                if (options.visit_item_process_edge)
                    for (const [ix, i] of p.inputs.entries())
                        visitor.visit_item_process_edge(i, p, this, ix);
                if (options.visit_process_item_edge)
                    for (const [ox, o] of p.outputs.entries())
                        visitor.visit_process_item_edge(p, o, this, ox);
            }
        }
        return visitor.build();
    }

    to_graphviz() {
        const result: any[] = [];
        result.push('digraph {');
        for (const g of Object.entries(
            this.all_items().reduce(
                (acc, cur) => {
                    let g = cur.group;
                    if (!g) {
                        g = '__default__';
                    }
                    if (!acc[g]) {
                        acc[g] = [];
                    }
                    acc[g].push(cur);
                    return acc;
                },
                {} as Record<string, Item[]>,
            ),
        )) {
            const id = g[0];
            const contents = g[1];
            if (id === '__default__') {
                for (const item of contents)
                    result.push('  ' + this._render_item_node(item));
            } else {
                if (this.settings.generate_item_groupings)
                    result.push('  subgraph cluster_' + id + ' {');
                for (const item of contents)
                    result.push('    ' + this._render_item_node(item));
                if (this.settings.generate_item_groupings) result.push('  }');
            }
        }

        for (const [index, process] of this.processes.entries()) {
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
        }
        result.push('}');
        return result.join('\n');
    }
}

export type PriorityCallback = (
    process_id: ProcessId,
    list_of_processes_that_can_be_used: Process[],
) => Process;

export { Process, ProcessChain };
