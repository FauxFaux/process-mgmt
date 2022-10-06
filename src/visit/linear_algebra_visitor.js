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

    _print_columns() {
        this.columns.forEach(col => {
            console.log(col.process.id, 'items: ', col.entries.items().flatMap(ssi => {
                let total = col.entries.total(ssi);
                return [total.item.name, total.quantity];
            }).join(', '));
        });
    }
    _print_matrix(identifier, matrix) {
        console.log(identifier);
        console.table(matrix.data);
    }

    _add_row_column_headers(matrix, extra_columns = []) {
        return new Matrix([' '])
                .combineHorizontal(new Matrix([this.columns.map(c => c.process.id)])
                .combineHorizontal(new Matrix([extra_columns]))
        ).combineVertical(
            new Matrix([this.items.map(i => i.id)]).transpose().combineHorizontal(matrix)
        );
    }

    build() {
        this._print_columns();
        this._sort_columns_and_rows();
        let rows = this.items.map(item => {
            return this.columns.map(col => {
                return col.count_for(item);
            });
        });
		this.initial_matrix = new Matrix(...rows);

        this._print_matrix('initial matrix:', this._add_row_column_headers(this.initial_matrix));
		let requirements = this.items.map((v, i) => {
            if (v.id == this.requirement.item.id) {
                return [this.requirement.quantity];
            }
            return [0];
        });
        let imported_items = this.imported.map(item => {
            return this.items.map(it => {
                if (it.id == item) return 1;
                return 0;
            });
        }).map(arr => new Matrix([arr]).transpose()
        ).reduce((prev, mtx) => {
            if (prev) {
                return prev.combineHorizontal(mtx);
            } else {
                return mtx;
            }
        });

		this.augmented_matrix = this.initial_matrix
                .combineHorizontal(imported_items)
                .combineHorizontal(new Matrix(...requirements));
        this._print_matrix('augmented matrix:', this._add_row_column_headers(this.augmented_matrix, this.imported.concat(['req'])));

        this.reduced_matrix = this.reduce_matrix(this.augmented_matrix);

        return this.chain;
    }

    reduce_matrix(m) {
        let m1 = m.scale(1);
        let lead = 0;
        for (let r = 0; r < m1.numRows(); ++r) {
            if (m1.numColumns() <= lead) {
                return m1;
            }
            let i = r;
            while (m1.get(i, lead) === 0) {
                i = i + 1;
                if (i === m1.numRows()) {
                    i = r;
                    lead = lead + 1;
                    if (m1.numColumns() === lead) {
                        return m1;
                    }
                }
            }
            this._print_matrix('before swap r='+r+', lead='+lead+', i='+i+':', this._add_row_column_headers(m1, this.imported.concat(['req'])));
            if (i !== r) { // swap rows i and r.
                console.log('rows swapped', i, r);
                let ri = m1.getRow(i).data[0];
                let rr = m1.getRow(r).data[0];
                m1 = this.replace_row(m1, rr, i);
                m1 = this.replace_row(m1, ri, r);
                let item_i = this.items[i];
                let item_r = this.items[r];
                this.items[r] = item_i;
                this.items[i] = item_r;
            }
            this._print_matrix('after swap r='+r+', lead='+lead+', i='+i+':', this._add_row_column_headers(m1, this.imported.concat(['req'])));
            console.log('row ', r, 'scaled by ', 1/m1.get(r, lead))
            m1 = this.replace_row(m1, m1.getRow(r).scale(1/m1.get(r, lead)).data[0], r);
            this._print_matrix('after scale r='+r+', lead='+lead+', i='+i+':', this._add_row_column_headers(m1, this.imported.concat(['req'])));
            for (let ii = 0; ii < m1.numRows(); ++ii) {
                if (ii !== r) {
                    let sub = m1.getRow(r).scale(m1.get(ii, lead));
                    let replacement = m1.getRow(ii).subtract(sub).data[0];
                    console.log('row ', ii, '= row (', this.items[ii].id ,')', ii, '- ', m1.get(ii, lead), 'row (', this.items[r].id, ')', r)
                    m1 = this.replace_row(m1, replacement, ii)
                }
            }
            this._print_matrix('after subtractions r='+r+', lead='+lead+', i='+i+':', this._add_row_column_headers(m1, this.imported.concat(['req'])));

        }
        return m1;
    }

    replace_row(m, row, idx) {
        let m1 = m.scale(1);
        let c = 0;
        while (c < row.length) {
            m1 = m1.replace(idx, c, row[c]);
            c++;
        }
        return m1;
    }
}

export { LinearAlgebra };

/*

[1, 2, 3] .  [1,0,0,0] =
[2, 2, 3] .  [0,1,0,0] =
[3, 2, 3] .  [0,0,1,0] =
[4, 2, 3] .            =

*/

/*
function ToReducedRowEchelonForm(Matrix M) is
    lead := 0
    rowCount := the number of rows in M
    columnCount := the number of columns in M
    for 0 ≤ r < rowCount do
        if columnCount ≤ lead then
            stop function
        end if
        i = r
        while M[i, lead] = 0 do
            i = i + 1
            if rowCount = i then
                i = r
                lead = lead + 1
                if columnCount = lead then
                    stop function
                end if
            end if
        end while
        if i ≠ r then Swap rows i and r
        Divide row r by M[r, lead]
        for 0 ≤ i < rowCount do
            if i ≠ r do
                Subtract M[i, lead] multiplied by row r from row i
            end if
        end for
        lead = lead + 1
    end for
end function
*/
