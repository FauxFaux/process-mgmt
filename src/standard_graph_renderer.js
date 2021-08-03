import { ProcessChainVisitor } from './process_chain_visitor.js';


class StandardGraphRenderer extends ProcessChainVisitor {

    constructor() {
        super();
        this.out = [
            "digraph {"
        ];
    }

    check(_chain) {}

    visit_item(item, _chain) {
        this.out.push('  ' + item.id + ' [shape="oval" label="' + item.name + '"]')
    }

    visit_process(process, _chain) {
        let inputs = process.inputs.map((input, index) => {
            return '<i' + index + '> ' + input.item.name;
        }).join(' | ');
        let outputs = process.outputs.map((output, index) => {
            return '<o' + index + '> ' + output.item.name;
        }).join(' | ');
        this.out.push('  ' + this._node_id(process) + ' [' +
            'shape="record" ' +
            'label="{ {' + inputs + '} ' +
                '| ' + process.factory_group.name + ' ' +
                '| ' + process.duration +
                '| {' + outputs + '} }"' +
            ']');
    }

    _node_id(process) {
        return 'process_' + process.id.replace(/[^_a-zA-Z0-9]/g, '');
    }

    visit_item_process_edge(stack, process, _chain, index) {
        this.out.push('  ' + stack.item.id + ' -> ' + this._node_id(process) + ':i' + index + ' [label="' + stack.quantity + '"]');
    }

    visit_process_item_edge(process, stack, _chain, index) {
        this.out.push('  ' + this._node_id(process) + ':o' + index + ' -> ' + stack.item.id + ' [label="' + stack.quantity + '"]');
    }

    build() {
        this.out.push("}");
        return this.out;
    }

}

export { StandardGraphRenderer };
