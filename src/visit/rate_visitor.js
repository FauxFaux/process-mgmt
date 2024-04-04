import { Process, ProcessChain } from '../process.js';
import { Factory } from '../factory.js';
import { ProcessChainVisitor } from './process_chain_visitor.js';

/**
 * Output: ProcessChain
 */
class RateVisitor extends ProcessChainVisitor {
    constructor(factory_type_cb = (_process) => null) {
        super();
        this.converted = [];
        this.factory_type_cb = factory_type_cb;
    }

    check(_chain) {
        return {
            visit_process: true,
        };
    }

    visit_process(process, _chain) {
        const factory_configured = this.factory_type_cb(process);
        const factory = factory_configured
            ? factory_configured
            : new Factory('__generated__', 'default', []);
        const p = factory.update_process(process);
        const result = p.clone(
            p.id,
            p.inputs.map((input) => input.div(p.duration)),
            p.outputs.map((output) => output.div(p.duration)),
            p.duration / p.duration,
            p.factory_group,
        );
        result.factory_type = factory;
        result.clone_fields.push('factory_type');
        this.converted.push(result);
    }

    build() {
        return new ProcessChain(this.converted);
    }
}

export { RateVisitor };
