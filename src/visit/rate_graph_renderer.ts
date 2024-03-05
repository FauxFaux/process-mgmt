import { ProcessChainVisitor } from './process_chain_visitor.js';

const fix_identifier = function (id) {
    return id.replace(/-/g, '_').replace(/^([0-9])/, 'id_$1');
};

/**
 * Output: Array of lines, containing the digraph.
 */
class RateGraphRenderer extends ProcessChainVisitor<string[]> {
    out: string[];

    constructor() {
        super();
        this.out = ['digraph {'];
    }

    check(chain) {
        if (!chain.process_counts)
            throw new Error(
                '`RateGraphRenderer` requires `process_counts` (Provided by `RateCalculator`)',
            );
        if (!chain.materials)
            throw new Error(
                '`RateGraphRenderer` requires `materials` (Can be calculated from `process_counts`) (Provided by `RateCalculator`)',
            );
        if (!chain.processes[0].factory_type)
            throw new Error(
                '`RateGraphRenderer` requires processes with assigned factory types (Provided by `RateVisitor`)',
            );
        return {
            visit_item: true,
            visit_process: true,
            visit_item_process_edge: true,
            visit_process_item_edge: true,
        };
    }

    _determine_item_node_colour(produce, consume) {
        if (produce > consume) return 'red';
        if (consume > produce) return 'green';
        return '';
    }

    visit_item(item, chain) {
        const produce =
            Math.round(chain.materials.total_positive(item).quantity * 100) /
            100;
        const consume =
            Math.round(
                chain.materials.total_negative(item).mul(-1).quantity * 100,
            ) / 100;
        this.out.push(
            '  ' +
                fix_identifier(item.id) +
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
                ']',
        );
    }

    visit_process(process, chain) {
        const process_count = chain.process_counts[process.id];
        const inputs = process.inputs
            .map((input, index) => {
                return (
                    '<i' +
                    index +
                    '> ' +
                    fix_identifier(input.item.name) +
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
                    fix_identifier(output.item.name) +
                    ' (' +
                    Math.round(output.quantity * process_count * 100) / 100 +
                    ')'
                );
            })
            .join(' | ');
        this.out.push(
            '  ' +
                this._node_id(process) +
                ' [' +
                'shape="record" ' +
                'label="{ {' +
                inputs +
                '}' +
                ' | process id: ' +
                process.id +
                ' | { ' +
                process.factory_type.name +
                ' (' +
                process.factory_group.name +
                ')' +
                ' | speed: ' +
                1 / process.factory_type.duration_modifier +
                'x' +
                ' | output: ' +
                process.factory_type.output_modifier +
                'x }' +
                ' | { ' +
                Math.round(process.duration * 100) / 100 +
                's/run | ' +
                Math.round(process_count * 100) / 100 +
                ' factories }' +
                ' | {' +
                outputs +
                '} }"' +
                ']',
        );
    }

    _node_id(process) {
        return 'process_' + process.id.replace(/[^_a-zA-Z0-9]/g, '');
    }

    visit_item_process_edge(stack, process, chain, index) {
        const process_count = chain.process_counts[process.id];
        const input_rate = process.inputs.find(
            (i) => i.item.id === stack.item.id,
        );
        const rate =
            Math.round(input_rate.quantity * process_count * 100) / 100;
        this.out.push(
            '  ' +
                fix_identifier(stack.item.id) +
                ' -> ' +
                this._node_id(process) +
                ':i' +
                index +
                ' [label="' +
                rate +
                '/s"]',
        );
    }

    visit_process_item_edge(process, stack, _chain, index) {
        this.out.push(
            '  ' +
                this._node_id(process) +
                ':o' +
                index +
                ' -> ' +
                fix_identifier(stack.item.id),
        );
    }

    build() {
        this.out.push('}');
        return this.out;
    }
}

export { RateGraphRenderer };
