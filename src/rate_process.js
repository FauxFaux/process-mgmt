import { StackSet } from './stack.js';
import { Factory } from './factory.js';
import { Process, ProcessChain } from './process.js';

class RateProcess extends Process {
    constructor(p, factory_type) {
        let p_ = factory_type.update_process(p);
        super(
            p_.id,
            p_.inputs.map(input => input.div(p_.duration)),
            p_.outputs.map(output => output.div(p_.duration)),
            p_.duration / p_.duration,
            p_.factory_group,
        );
        this.factory_type = factory_type;
        this.rate_process = true;
    }
}

class RateChain extends ProcessChain {
    /**
     *
     * @param {ProcessChain} chain Existing ProcessChain
     * @param {function} factory_type_cb `fn(process, factory_group): factory` Select a factory for the given process. Callback returns `null` for a default
     */
    constructor(chain, factory_type_cb = () => null) {
        super(
            chain.processes.map(p => {
                if (p.rate_process) return p;
                let factory_configured = factory_type_cb(p);
                let factory = factory_configured ? factory_configured : new Factory('__generated__', 'default', -1);
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
    update(stack, imported_materials, process_selector) {
        let materials = new StackSet();
        let process_counts = {};

        let queue = [stack];
        while (queue.length > 0) {
            let current = queue.pop();
            if (this.processes_by_output[current.item.id]) {
                let process = this._select_process(current.item.id, process_selector);
                let process_count = process.process_count_for_rate(current);
                if (!process_counts[process.id]) {
                    process_counts[process.id] = 0;
                }
                process_counts[process.id] += process_count;
                process.outputs.forEach(input => {
                    materials.add(input.mul(process_count));
                });
                process.inputs.forEach(input => {
                    // if I have more than enough of this input already
                    // have 6 already, need 4 for this, then push nothing onto the queue. subtract 4 from materials.
                    // have 2 already, need 6 for this, then push 4 onto the queue. subtract 6 from the materials.
                    // have -5 already, need 7 for this, then push 7 onto the queue. subtract 7 from the materials.
                    // ==> subtract from materials. if total <= 0, push onto queue.
                    let required_for_count = input.mul(process_count);
                    materials.sub(required_for_count);
                    let remaining_required = materials.total(input.item);
                    if (remaining_required.quantity <= 0) {
                        if (!imported_materials.includes(input.item.id)) {
                            queue.push(remaining_required.mul(-1));
                        }
                    }
                });
            }
        }
        this.materials = materials;
        this.process_counts = process_counts;
        return this;
    }

    // target is to produce stack
    // imported_materials are allowed to have any -ive material count.
    // exported_materials are allowed to have any +ive material count.
    update2(stack, imported_materials, exported_materials) {
        let materials = new StackSet();
        materials.sub(stack);
        let process_counts = {};

        let current = materials.min_total(imported_materials);
        while (current.quantity < 0) {
            // deal with 'current'
            let processes = this.processes_by_output[current.item.id];
            if (processes.length > 1) {
                throw new Error('p > 1');
            } else {
                process = processes[0];
                if (!process_counts[process.id]) {
                    process_counts[process.id] = 0;
                }
                process_counts[process.id] += 1;
                process.outputs.forEach(input => {
                    materials.add(input.mul(1));
                });
                process.inputs.forEach(input => {
                    let required_for_count = input.mul(1);
                    materials.sub(required_for_count);
                });
            }
            current = materials.min_total(imported_materials);
        }
        this.materials = materials;
        this.process_counts = process_counts;
    }

    // target is to produce stack
    // imported_materials are allowed to have any -ive material count.
    // exported_materials are allowed to have any +ive material count.
    update0(stack, imported_materials, exported_materials) {
        let process_counts = this.processes.reduce((acc, cur) => {
            acc[cur.id] = 1;
            return acc;
        }, {});

        // let process_counts = {};
        // process_counts['coolant'] = 6;
        // process_counts['coolant'] *= 21.43/30;
        // process_counts['liquid_mineral_oil_catalyst'] = 1;
        // process_counts['liquid_mineral_oil_catalyst'] *= 8.88 / 10;
        // process_counts['residual_oil_refining'] = 1;
        // process_counts['residual_oil_refining'] *= (10/3)/(20/3);
        // process_counts['residual_oil_refining'] *= (10/4)/(10/3);
        // process_counts['residual_oil_refining'] *= (2.3)/(2.5);
        // process_counts['residual_oil_refining'] *= (2.2)/(2.3);
        // process_counts['carbon_separation_1'] = 1;
        // process_counts['carbon_separation_1'] *= 2.96/25;
        // process_counts['steam_cracking_oil_residual'] = 1;
        // process_counts['steam_cracking_oil_residual'] *= (1/3)/(5/2);
        // process_counts['steam_cracking_oil_residual'] *= (1/4)/(1/3);
        // process_counts['steam_cracking_oil_residual'] *= (0.23)/(1/4);
        // process_counts['steam_cracking_oil_residual'] *= (0.22)/(0.23);
        // process_counts['carbon'] = 1;
        // process_counts['carbon'] *= 0.06/1;
        // process_counts['oil_refining'] = 1;
        // process_counts['angels_steam_water'] = 1;
        // process_counts['angels_steam_water'] *= 2.2/40;

        let materials = new StackSet();
        this.processes.forEach(p => {
            p.outputs.forEach(input => {
                materials.add(input.mul(process_counts[p.id]));
            });
            p.inputs.forEach(input => {
                materials.sub(input.mul(process_counts[p.id]));
            });
        });
        let margins = materials.margins([].concat(imported_materials).concat(exported_materials));
        let min_stack = margins.min_total();
        let total_p = materials.total_positive(min_stack.item);
        let total_n = materials.total_negative(min_stack.item);
        let process = this.processes_by_input[min_stack.item.id][0]; // XXX assume first only.
        let multiplier = 1;
        if (total_p.quantity < total_n.quantity * -1) {
            multiplier = (total_p.quantity / total_n.quantity) * -1;
        } else {
            multiplier = (total_n.quantity / total_p.quantity) * -1;
        }
        process_counts[process.id] *= multiplier;

        this.materials = materials;
        this.process_counts = process_counts;
    }

    // target is to produce stack
    // imported_materials are allowed to have any -ive material count.
    // exported_materials are allowed to have any +ive material count.
    update3(stack, imported_materials, exported_materials) {
        let process_counts = this.processes.reduce((acc, cur) => {
            acc[cur.id] = 1;
            return acc;
        }, {});

        let materials = new StackSet();
        let iterations = 10000;
        while (iterations-- > 0) {
            // effectively `while (true)`
            materials = new StackSet();
            this.processes.forEach(p => {
                p.outputs.forEach(input => {
                    materials.add(input.mul(process_counts[p.id]));
                });
                p.inputs.forEach(input => {
                    materials.sub(input.mul(process_counts[p.id]));
                });
            });
            let margins = materials.margins([].concat(imported_materials).concat(exported_materials));
            let min_stack = margins.min_total();
            if (min_stack.quantity > -0.0001) break;
            let total_p = materials.total_positive(min_stack.item);
            let total_n = materials.total_negative(min_stack.item);
            let process = this.processes_by_input[min_stack.item.id][0]; // XXX assume first only.
            let multiplier = 1;
            if (total_p.quantity < total_n.quantity * -1) {
                multiplier = (total_p.quantity / total_n.quantity) * -1;
            } else {
                multiplier = (total_n.quantity / total_p.quantity) * -1;
            }
            process_counts[process.id] *= multiplier;
        }

        // iterations = 10000;
        // while (iterations-- > 0) { // effectively `while (true)`
        //     materials = new StackSet();
        //     this.processes.forEach(p => {
        //         p.outputs.forEach(input => {
        //             materials.add(input.mul(process_counts[p.id]));
        //         });
        //         p.inputs.forEach(input => {
        //             materials.sub(input.mul(process_counts[p.id]));
        //         });
        //     });
        //     let margins = materials.margins([].concat(imported_materials).concat(exported_materials));
        //     let max_stack = margins.max_total();
        //     if (max_stack.quantity < 0.0001) break;
        //     let total_p = materials.total_positive(max_stack.item);
        //     let total_n = materials.total_negative(max_stack.item);
        //     let process = this.processes_by_input[max_stack.item.id][0]; // XXX assume first only.
        //     let multiplier = 1;
        //     if (total_p.quantity < (total_n.quantity*-1)) {
        //         multiplier = total_p.quantity / total_n.quantity * -1;
        //     } else {
        //         multiplier = total_n.quantity / total_p.quantity * -1;
        //     }
        //     process_counts[process.id] *= multiplier;
        // }

        // console.error("=== Margins ===");
        // Object.values(margins.stacks).forEach(m => {
        //     console.error(m[0].item.id, m[0].quantity);
        // });
        // console.error("=== Process Counts ===");
        // Object.entries(process_counts).forEach(pc => {
        //     console.error(pc[0] + " => " + pc[1]);
        // });

        this.materials = materials;
        this.process_counts = process_counts;
    }

    // target is to produce stack
    // imported_materials are allowed to have any -ive material count.
    // exported_materials are allowed to have any +ive material count.
    update4(stack, imported_materials, exported_materials) {
        let process_counts = this.processes.reduce((acc, cur) => {
            acc[cur.id] = 1;
            return acc;
        }, {});

        let materials = new StackSet();
        let total_iterations = 10000;
        let iterations = total_iterations;
        while (iterations-- > 0) {
            // `while (true)` with a limit.
            materials = new StackSet();
            this.processes.forEach(p => {
                p.outputs.forEach(input => {
                    materials.add(input.mul(process_counts[p.id]));
                });
                p.inputs.forEach(input => {
                    materials.sub(input.mul(process_counts[p.id]));
                });
            });

            let margins = materials.margins_squared([].concat(imported_materials).concat(exported_materials));
            let stack_to_balance = margins.max_total();
            if (stack_to_balance.quantity < 0.0001) break;
            let item_to_balance = stack_to_balance.item;
            let total_p = materials.total_positive(item_to_balance).quantity; // produced
            let total_n = materials.total_negative(item_to_balance).quantity * -1; // consumed
            let multiplier = (total_p / total_n) ** 0.5; // p.m = c.m; p/c = m**2; m = (p/c)**0.5
            let processes_in = this.processes_by_input[item_to_balance.id]; // processes that take this type as an input
            let processes_out = this.processes_by_output[item_to_balance.id]; // processes that have this type as an output
            if (processes_in) {
                processes_in.forEach(p => {
                    process_counts[p.id] *= multiplier;
                });
            }
            if (processes_out) {
                processes_out.forEach(p => {
                    process_counts[p.id] /= multiplier;
                });
            }
        }

        this.materials = materials;
        this.process_counts = process_counts;
        return this;
    }

    expand_proxies() {
        this.processes
            .filter(p => p.proxy_process)
            .forEach(proxy_proc => {
                let replacements = proxy_proc.cycle;
                this._disable([proxy_proc.id]);
                this._enable(replacements);
                replacements.forEach(repl => {
                    this.process_counts[repl.id] = this.process_counts[proxy_proc.id];
                });
                delete this.process_counts[proxy_proc.id];
            });
        this._rebuild();
        this.rebuild_materials();
        return this;
    }

    rebuild_materials() {
        let materials = new StackSet();
        this.processes.forEach(proc => {
            let process_count = this.process_counts[proc.id];
            proc.outputs.forEach(output => materials.add(output.mul(process_count)));
            proc.inputs.forEach(input => materials.sub(input.mul(process_count)));
        });
        this.materials = materials;
    }

    _determine_item_node_colour(produce, consume) {
        if (produce > consume) return 'red';
        if (consume > produce) return 'green';
        return '';
    }

    _render_item_node(item) {
        let produce = Math.round(this.materials.total_positive(item).quantity * 100) / 100;
        let consume = Math.round(this.materials.total_negative(item).mul(-1).quantity * 100) / 100;
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

    _render_processor_node(node_id, process) {
        let process_count = this.process_counts[process.id];
        let inputs = process.inputs
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
        let outputs = process.outputs
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
            let process_count = this.process_counts[to.id];
            let input_rate = to.inputs.find(i => i.item.id === from.item.id);
            let rate = Math.round(input_rate.quantity * process_count * 100) / 100;
            return from.item.id + ' -> ' + node_id + ':i' + index + ' [label="' + rate + '/s"]';
        }
    }
}

export { RateProcess, RateChain };
