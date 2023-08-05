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

    is_process_column() {
        return true;
    }
}

class LinearAlgebra extends ProcessChainVisitor {
    constructor(requirements, imported, exported, print_matricies = false) {
        super();
        this.requirements = requirements;
        this.imported = imported;
        this.exported = exported;
        this.print_matricies = print_matricies;
    }

    check(chain) {
        if (!chain.rebuild_materials)
            throw new Error('`LinearAlgebra` requires `rebuild_materials` (Provided by `ProcessCountVisitor`)');
        return {
            init: true,
            visit_process: true,
        };
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
        });
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
        if (!this.print_matricies) return;
        this.columns.forEach(col => {
            console.log(
                col.process.id,
                'items: ',
                col.entries
                    .items()
                    .flatMap(ssi => {
                        let total = col.entries.total(ssi);
                        return [total.item.name, total.quantity];
                    })
                    .join(', '),
            );
        });
    }

    _print_matrix(identifier, matrix) {
        if (!this.print_matricies) return;
        console.log(identifier);
        console.log('columns', matrix.numColumns(), 'rows', matrix.numRows());
        if (!!!this.items) {
            console.table(matrix.data);
            return;
        }
        let res = {};
        let lookup = [];
        for (let i = 0; i < this.items.length; ++i) {
            res[this.items[i].id] = {};
            lookup[i] = this.items[i].id;
        }
        for (let r = 0; r < matrix.data.length; ++r) {
            for (let c = 0; c < matrix.data[r].length; ++c) {
                res[lookup[r]][this.columns[c].process.id] = matrix.data[r][c];
            }
        }
        console.table(res);
    }

    _add_row_column_headers(matrix, extra_columns = []) {
        return new Matrix([' '])
            .combineHorizontal(
                new Matrix([this.columns.map(c => c.process.id)]).combineHorizontal(new Matrix([extra_columns])),
            )
            .combineVertical(new Matrix([this.items.map(i => i.id)]).transpose().combineHorizontal(matrix));
    }

    _create_import_export_matrix(io, items, value) {
        if (io.length == 0) return new Matrix();
        return io
            .map(item => {
                // array[item]
                return items.map(it => {
                    if (it.id == item) return value;
                    return 0; // [...,0,0,0,value,0,...]
                });
            })
            .map(arr => new Matrix([arr]).transpose()) // column matrix
            .reduce((prev, mtx) => {
                // combine into one matrix
                if (prev) {
                    return prev.combineHorizontal(mtx);
                } else {
                    return mtx;
                }
            });
    }

    _build_initial_matrix() {
        let rows = this.items.map(item => {
            return this.columns.map(col => {
                return col.count_for(item);
            });
        });
        return new Matrix(...rows);
    }

    _build_requirements() {
        let this_reqs_map = this.requirements.reduce((prev, cur) => {
            prev[cur.item.id] = cur.quantity;
            return prev;
        }, {});
        let req = this.items.map((v, i) => {
            if (this_reqs_map[v.id]) {
                return [this_reqs_map[v.id]];
            }
            return [0];
        });
        return new Matrix(...req);
    }

    _augment_matrix_with_imports_or_exports(augmented, arr, items, value) {
        if (arr.length > 0) {
            return augmented.combineHorizontal(this._create_import_export_matrix(arr, items, value));
        }
        return augmented;
    }

    _create_imports_exports_columns(arr, name) {
        return arr.map(im => {
            return { process: { id: name + ': ' + im } };
        });
    }

    build() {
        this._sort_columns_and_rows();
        this.initial_matrix = this._build_initial_matrix();

        this.augmented_matrix = this.initial_matrix;
        this.augmented_matrix = this._augment_matrix_with_imports_or_exports(
            this.augmented_matrix,
            this.imported,
            this.items,
            1,
        );
        this.columns.push(...this._create_imports_exports_columns(this.imported, 'import'));
        this.augmented_matrix = this._augment_matrix_with_imports_or_exports(
            this.augmented_matrix,
            this.exported,
            this.items,
            -1,
        );
        this.columns.push(...this._create_imports_exports_columns(this.exported, 'export'));

        this.columns.push({ process: { id: 'req' } });
        this.augmented_matrix = this.augmented_matrix.combineHorizontal(this._build_requirements());

        this.reduced_matrix = this.reduce_matrix(this.augmented_matrix, -1);

        this.chain.process_counts = this._calculate_process_counts();
        this.chain.rebuild_materials();

        return this.chain;
    }

    _calculate_process_counts() {
        let req_column = this.reduced_matrix.getColumn(this.reduced_matrix.numColumns() - 1).transpose().data[0];
        return this.columns
            .filter(c => c.is_process_column)
            .map((c, idx) => [c.process.id, req_column[idx]])
            .reduce((p, a) => {
                p[a[0]] = a[1];
                return p;
            }, {});
    }

    reduce_matrix(m, column_slice = 0) {
        let m1 = m.scale(1);
        let lead = 0;
        for (let r = 0; r < m1.numRows(); ++r) {
            if (m1.numColumns() + column_slice <= lead) {
                return m1;
            }
            let i = r;
            while (m1.get(i, lead) === 0) {
                i = i + 1;
                if (i === m1.numRows()) {
                    i = r;
                    lead = lead + 1;
                    if (m1.numColumns() + column_slice === lead) {
                        return m1;
                    }
                }
            }
            if (i !== r) {
                // swap rows i and r.
                let ri = m1.getRow(i).data[0];
                let rr = m1.getRow(r).data[0];
                m1 = this.replace_row(m1, rr, i);
                m1 = this.replace_row(m1, ri, r);
            }
            m1 = this.replace_row(m1, m1.getRow(r).scale(1 / m1.get(r, lead)).data[0], r);
            for (let ii = 0; ii < m1.numRows(); ++ii) {
                if (ii !== r) {
                    let sub = m1.getRow(r).scale(m1.get(ii, lead));
                    let replacement = m1.getRow(ii).subtract(sub).data[0];
                    m1 = this.replace_row(m1, replacement, ii);
                }
            }
            this._print_matrix('lead: ' + lead + ' r: ' + r, m1);
        }
        return m1;
    }

    replace_row(m, row, idx) {
        let m1 = m.scale(1);
        let c = 0;
        while (c < row.length) {
            // fix floating point things here?
            let val = Math.abs(row[c]) < 1e-12 ? 0 : row[c];
            m1 = m1.replace(idx, c, val);
            c++;
        }
        return m1;
    }
}

export { LinearAlgebra };
