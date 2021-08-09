import { Process, ProcessChain } from "../process.js";
import { Factory } from "../factory.js";
import { ProcessChainVisitor } from "./process_chain_visitor.js"



class RateVisitor extends ProcessChainVisitor {

    constructor(factory_type_cb = () => null) {
        super();
        this.converted = [];
        this.factory_type_cb = factory_type_cb;
    }

    check(_chain) {
        return {
            visit_process: true,
        }
    }

    visit_process(process, _chain) {
        let factory_configured = this.factory_type_cb(process);
        let factory = (factory_configured ? factory_configured : new Factory('__generated__', 'default', []));
        let p = factory.update_process(process);
        this.converted.push(new Process(
            p.id,
            p.inputs.map(input => input.div(p.duration)),
            p.outputs.map(output => output.div(p.duration)),
            p.duration/p.duration,
            p.factory_group
        ));
    }

    build() { return new ProcessChain(this.converted); }

}


export { RateVisitor };
