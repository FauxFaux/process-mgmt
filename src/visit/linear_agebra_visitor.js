import { Item } from '../item.js';
import { ProcessChainVisitor } from './process_chain_visitor.js';

import Matrix from 'node-matrices';
import { StackSet } from '../stack.js';


class Column {
    constructor(process) {
        this.process = process;
        this.entries = new StackSet();
        process.inputs.forEach(s => this.entries.sub(s));
        process.outputs.forEach(s => this.entries.add(s));
    }

    items() {
        return this.entries.items();
    }

    count_for(item) {
        return this.entries.total(item).quantity;
    }
}

class LinearAlgebra extends ProcessChainVisitor {

    constructor(requirement, imported, exported) {
		super();
		this.requirement = requirement;
		this.imported = imported;
		this.exported = exported;
    }

    check(_chain) {
        return {
            init: true,
            visit_process: true,
        }
    }

    init(chain) {
        this.chain = chain;
        this.initial_matrix = null;
        this.columns = [];
        this.items = [];
    }
    
    visit_process(process, _chain) {
        let c = new Column(process);
        this.columns.push(c);
        c.items().forEach(i => {
            if (!this.items.includes(i)) {
                this.items.push(i);
            }
        })
    }

    _sort_columns_and_rows() {
        this.columns.sort((col_a, col_b) => {
            if (col_a.process.id > col_b.process.id) return 1;
            if (col_a.process.id < col_b.process.id) return -1;
            return 0;
        });
        this.items.sort((item_a, item_b) => {
            if (item_a.id > item_b.id) return 1;
            if (item_a.id < item_b.id) return -1;
            return 0;
        });
    }

    build() {
        this._sort_columns_and_rows();
        let rows = this.items.map(item => {
            return this.columns.map(col => {
                return col.count_for(item);
            });
        });
		this.initial_matrix = new Matrix(...rows);
		this.augmented_matrix = this.initial_matrix.combineHorizontal(requirements);


        return this.chain;
    }
}

export { LinearAlgebra };
