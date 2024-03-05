import { ProcessChainVisitor } from './process_chain_visitor.js';

/**
 * Output: Array of lines, containing the digraph.
 */
class StandardGraphRenderer extends ProcessChainVisitor<string[]> {
    out: string[];

    constructor() {
        super();
        this.out = ['digraph {'];
    }

    check(chain) {
        return super.check(chain);
    }

    visit_item(item, _chain) {
        this.out.push(
            '  ' + item.id + ' [shape="oval" label="' + item.name + '"]',
        );
    }

    visit_process(process, _chain) {
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
        this.out.push(
            '  ' +
                this._node_id(process) +
                ' [' +
                'shape="record" ' +
                'label="{ {' +
                inputs +
                '} ' +
                '| ' +
                process.id +
                ' ' +
                '| ' +
                process.factory_group.name +
                ' ' +
                '| ' +
                process.duration +
                '| {' +
                outputs +
                '} }"' +
                ']',
        );
    }

    _node_id(process) {
        return 'process_' + process.id.replace(/[^_a-zA-Z0-9]/g, '');
    }

    visit_item_process_edge(stack, process, _chain, index) {
        this.out.push(
            '  ' +
                stack.item.id +
                ' -> ' +
                this._node_id(process) +
                ':i' +
                index +
                ' [label="' +
                stack.quantity +
                '"]',
        );
    }

    visit_process_item_edge(process, stack, _chain, index) {
        this.out.push(
            '  ' +
                this._node_id(process) +
                ':o' +
                index +
                ' -> ' +
                stack.item.id +
                ' [label="' +
                stack.quantity +
                '"]',
        );
    }

    build() {
        this.out.push('}');
        return this.out;
    }
}

export { StandardGraphRenderer };
