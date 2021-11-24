import { ProcessChainVisitor } from './process_chain_visitor.js';


/**
 * Output: Array of lines, containing the digraph.
 */
class RateGraphRenderer extends ProcessChainVisitor {

    constructor() {
        super();
        this.out = [
            "digraph {"
        ];
    }

    check(chain) {
        if (!chain.process_counts) throw new Error("`RateGraphRenderer` requires `process_counts` (Provided by `RateCalculator`)")
        if (!chain.materials) throw new Error("`RateGraphRenderer` requires `materials` (Can be calculated from `process_counts`) (Provided by `RateCalculator`)")
        if (!chain.processes[0].factory_type) throw new Error("`RateGraphRenderer` requires processes with assigned factory types (Provided by `RateVisitor`)");
        return {
            visit_item: true,
            visit_process: true,
            visit_item_process_edge: true,
            visit_process_item_edge: true,
        }
    }

    _determine_item_node_colour(produce, consume) {
        if (produce > consume) return "red";
        if (consume > produce) return "green";
        return "";
    }

    visit_item(item, chain) {
        let produce = (Math.round(chain.materials.total_positive(item).quantity*100)/100);
        let consume = (Math.round(chain.materials.total_negative(item).mul(-1).quantity*100)/100);
        this.out.push('  ' + item.id + ' [shape="record" label="{'
            + item.name
            + ' | { produce: ' + produce + '/s'
            + ' | consume: ' + consume + '/s }'
            + '}" '
            + 'style="filled" fillcolor="' + this._determine_item_node_colour(produce, consume) + '"'
            + ']');
    }

    visit_process(process, chain) {
        let process_count = chain.process_counts[process.id];
        let inputs = process.inputs.map((input, index) => {
            return '<i' + index + '> ' + input.item.name + ' (' + (Math.round(input.quantity * process_count * 100)/100) + ')';
        }).join(' | ');
        let outputs = process.outputs.map((output, index) => {
            return '<o' + index + '> ' + output.item.name + ' (' + (Math.round(output.quantity * process_count * 100)/100) + ')';
        }).join(' | ');
        this.out.push('  ' + this._node_id(process) + ' [' +
            'shape="record" ' +
            'label="{ {' + inputs + '}' +
                ' | process id: ' + process.id +
                ' | { ' + process.factory_type.name + ' (' + process.factory_group.name + ')' +
                     ' | speed: ' + (1/process.factory_type.duration_modifier) + 'x' +
                     ' | output: ' + process.factory_type.output_modifier + 'x }' +
                ' | { ' + Math.round(process.duration*100)/100 + 's/run | ' + Math.round(process_count*100)/100 + ' factories }' +
                ' | {' + outputs + '} }"' +
            ']'
        );
    }

    _node_id(process) {
        return 'process_' + process.id.replace(/[^_a-zA-Z0-9]/g, '');
    }

    visit_item_process_edge(stack, process, chain, index) {
        let process_count = chain.process_counts[process.id];
        let input_rate = process.inputs.find(i => i.item.id === stack.item.id);
        let rate = Math.round(input_rate.quantity * process_count * 100)/100;
        this.out.push('  ' + stack.item.id + ' -> ' + this._node_id(process) + ':i' + index + ' [label="' + rate + '/s"]');
    }

    visit_process_item_edge(process, stack, _chain, index) {
        this.out.push('  ' + this._node_id(process) + ':o' + index + ' -> ' + stack.item.id);
    }

    build() {
        this.out.push("}");
        return this.out;
    }

}

export { RateGraphRenderer };
