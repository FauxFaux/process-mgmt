import { Process, ProcessChain } from "./process";
import { ProcessChainVisitor } from "./process_chain_visitor"



class RateVisitor extends ProcessChainVisitor {

    constructor(factory_type_cb = () => null) {
        super();
        this.converted = [];
        this.factory_type_cb = factory_type_cb;
    }

    visit_process(process, _chain) {
        let factory_configured = factory_type_cb(p);
        let factory = (factory_configured ? factory_configured : new Factory('__generated__', 'default', -1));
        let p = factory.update_process(process);
        this.converted.push(new Process(
            p.id,
            p.inputs.map(input => input.div(p.duration)),
            p.outputs.map(output => output.div(p.duration)),
            p.duration,
            p.factory_group
        ));
    }

    build() { return new ProcessChain(this.converted); }

}


export { RateVisitor };
