import { Stack, StackSet } from './stack.js';
import { Factory } from './factory.js';
import { Process, ProcessChain } from './process.js';
import { Item, ItemId } from './item.js';

class RateProcess extends Process {
    factory_type;
    rate_process;

    constructor(p: Process, factory_type: Factory) {
        const p_ = factory_type.update_process(p);
        super(
            p_.id,
            p_.inputs.map((input) => input.div(p_.duration)),
            p_.outputs.map((output) => output.div(p_.duration)),
            p_.duration / p_.duration,
            p_.factory_group,
        );
        this.factory_type = factory_type;
        this.rate_process = true;
    }
}

class RateChain extends ProcessChain {
    materials: StackSet;

    /**
     *
     * @param {ProcessChain} chain Existing ProcessChain
     * @param {function} factory_type_cb `fn(process, factory_group): factory` Select a factory for the given process. Callback returns `null` for a default
     */
    constructor(chain: ProcessChain, factory_type_cb = (p) => null) {
        super(
            chain.processes.map((p) => {
                if (p.rate_process) return p;
                const factory_configured = factory_type_cb(p);
                const factory = factory_configured
                    ? factory_configured
                    : new Factory('__generated__', 'default', null);
                return new RateProcess(p, factory);
            }),
        );
        this.materials = new StackSet();
        this.process_counts = {};
    }

    // Calculate the rates and factury counts required
    // to produce 'stack' as a rate per second.
    // 'imported_materials' are materials that are
    // produced elsewhere and can be transported
    // to this part of the process.
    update(stack: Stack, imported_materials: ItemId[], process_selector) {
        const materials = new StackSet();
        const process_counts = {};

        const queue = [stack];
        while (queue.length > 0) {
            const current = queue.pop()!;
            if (this.processes_by_output[current.item.id]) {
                const process = this._select_process(
                    current.item.id,
                    process_selector,
                );
                const process_count = process.process_count_for_rate(current);
                if (!process_counts[process.id]) {
                    process_counts[process.id] = 0;
                }
                process_counts[process.id] += process_count;
                for (const input of process.outputs) {
                    materials.add(input.mul(process_count));
                }
                for (const input of process.inputs) {
                    // if I have more than enough of this input already
                    // have 6 already, need 4 for this, then push nothing onto the queue. subtract 4 from materials.
                    // have 2 already, need 6 for this, then push 4 onto the queue. subtract 6 from the materials.
                    // have -5 already, need 7 for this, then push 7 onto the queue. subtract 7 from the materials.
                    // ==> subtract from materials. if total <= 0, push onto queue.
                    const required_for_count = input.mul(process_count);
                    materials.sub(required_for_count);
                    const remaining_required = materials.total(input.item);
                    if (remaining_required.quantity <= 0) {
                        if (!imported_materials.includes(input.item.id)) {
                            queue.push(remaining_required.mul(-1));
                        }
                    }
                }
            }
        }
        this.materials = materials;
        this.process_counts = process_counts;
        return this;
    }

    rebuild_materials() {
        const materials = new StackSet();
        for (const proc of this.processes) {
            const process_count = this.process_counts![proc.id];
            for (const output of proc.outputs)
                materials.add(output.mul(process_count));
            for (const input of proc.inputs)
                materials.sub(input.mul(process_count));
        }
        this.materials = materials;
    }

    _determine_item_node_colour(produce: number, consume: number) {
        if (produce > consume) return 'red';
        if (consume > produce) return 'green';
        return '';
    }

    _render_item_node(item: Item) {
        const produce =
            Math.round(this.materials.total_positive(item).quantity * 100) /
            100;
        const consume =
            Math.round(
                this.materials.total_negative(item).mul(-1).quantity * 100,
            ) / 100;
        return (
            item.id +
            ' [shape="record" label="{' +
            item.name +
            ' | { produce: ' +
            produce +
            '/s' +
            ' | consume: ' +
            consume +
            '/s }' +
            '}" ' +
            'style="filled" fillcolor="' +
            this._determine_item_node_colour(produce, consume) +
            '"' +
            ']'
        );
    }

    _render_processor_node(node_id: unknown, process: Process) {
        const process_count = this.process_counts![process.id];
        const inputs = process.inputs
            .map((input, index) => {
                return (
                    '<i' +
                    index +
                    '> ' +
                    input.item.name +
                    ' (' +
                    Math.round(input.quantity * process_count * 100) / 100 +
                    ')'
                );
            })
            .join(' | ');
        const outputs = process.outputs
            .map((output, index) => {
                return (
                    '<o' +
                    index +
                    '> ' +
                    output.item.name +
                    ' (' +
                    Math.round(output.quantity * process_count * 100) / 100 +
                    ')'
                );
            })
            .join(' | ');
        return (
            node_id +
            ' [' +
            'shape="record" ' +
            'label="{ {' +
            inputs +
            '}' +
            ' | process id: ' +
            process.id +
            ' | { ' +
            process.factory_type!.name +
            ' (' +
            process.factory_group.name +
            ')' +
            ' | speed: ' +
            1 / process.factory_type!.duration_modifier +
            'x' +
            ' | output: ' +
            process.factory_type!.output_modifier +
            'x }' +
            ' | { ' +
            Math.round(process.duration * 100) / 100 +
            's/run | ' +
            Math.round(process_count * 100) / 100 +
            ' factories }' +
            ' | {' +
            outputs +
            '} }"' +
            ']'
        );
    }

    _render_edge(node_id, from, to, index) {
        if (from.factory_group) {
            // XXX need a better way to detect the orientation of the edge.
            // outbound from a process to an item
            return node_id + ':o' + index + ' -> ' + to.item.id; // + ' [label=\'' + to.quantity + '\']';
        } else {
            // inbound from an item to a process
            const process_count = this.process_counts![to.id];
            const input_rate = to.inputs.find(
                (i) => i.item.id === from.item.id,
            );
            const rate =
                Math.round(input_rate.quantity * process_count * 100) / 100;
            return (
                from.item.id +
                ' -> ' +
                node_id +
                ':i' +
                index +
                ' [label="' +
                rate +
                '/s"]'
            );
        }
    }
}

export { RateProcess, RateChain };
