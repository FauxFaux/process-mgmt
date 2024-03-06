import { check } from './structures_base.js';
import { Item, ItemId } from './item.js';

class Stack {
    item: Item;
    quantity: number;

    constructor(item: Item, quantity: number) {
        check('item', item, 'quantity', quantity);
        this.item = item;
        this.quantity = quantity;
    }
    clone() {
        return new Stack(this.item, this.quantity);
    }

    // TODO: insane type
    add(other: Stack | undefined | null): Stack {
        if (other) {
            if (other.item !== this.item)
                throw new Error(
                    'unable to add different item types together, found (this) ' +
                        this.item.id +
                        ' and (other) ' +
                        other.item.id,
                );
            return new Stack(this.item, this.quantity + other.quantity);
        } else {
            return this.clone();
        }
    }
    sub(other: Stack) {
        return this.add(other.mul(-1));
    }
    div(scalar: number) {
        return new Stack(this.item, this.quantity / scalar);
    }
    mul(scalar: number) {
        return new Stack(this.item, this.quantity * scalar);
    }
    pow(scalar: number) {
        return new Stack(this.item, this.quantity ** scalar);
    }
    toString() {
        return (
            'Stack: [item:' +
            this.item.id +
            ', quantity: ' +
            this.quantity +
            ']'
        );
    }
}

class StackSet {
    stacks: Record<ItemId, Stack[]>;

    constructor() {
        this.stacks = {};
    }
    add(stack: Stack) {
        this._ensure_stack(stack);
        this.stacks[stack.item.id].push(stack);
    }
    sub(stack: Stack) {
        this._ensure_stack(stack);
        this.stacks[stack.item.id].push(stack.mul(-1));
    }
    _ensure_stack(stack: Stack) {
        if (!this.stacks[stack.item.id]) {
            this.stacks[stack.item.id] = [];
        }
    }
    total(item: Item) {
        if (this.stacks[item.id]) {
            return this.stacks[item.id].reduce(
                (p, c) => p.add(c),
                new Stack(item, 0),
            );
        } else {
            return new Stack(item, 0);
        }
    }

    item_ids() {
        return Object.keys(this.stacks);
    }

    items() {
        return Object.values(this.stacks).map((a) => a[0].item);
    }

    max_total(ignoring = []) {
        // Find the item type that has the largest +ive total. Return that stack.
        return this._min_max_total(ignoring, (a, b) => a.quantity > b.quantity);
    }
    min_total(ignoring = []) {
        // Find the item type that has the largest -ive total. Return that stack.
        return this._min_max_total(ignoring, (a, b) => a.quantity < b.quantity);
    }
    _min_max_total(ignoring: ItemId[], fn: (a: Stack, b: Stack) => boolean) {
        return (
            Object.keys(this.stacks)
                // .map(e => {console.log(e); return e;})
                .filter((i) => !ignoring.includes(i))
                .map((id) => this.total(this.stacks[id][0].item))
                // .map(e => {console.log(e); return e;})
                .reduce((acc, cur) => {
                    if (fn(acc, cur)) return acc;
                    return cur;
                })
        );
    }

    // calculate the error margins for each stack type
    // Relative difference between the inputs and outputs.
    // Used to find which type has the largest difference
    // between the +ives and -ives irrelevent of the
    // magnitudes: e.g.
    // type A has +3 & -4.
    // type B has +50 & -60.
    // Type A has the larger effective difference.
    margins(ignoring: any[] = []) {
        return Object.keys(this.stacks)
            .filter((i) => !ignoring.includes(i))
            .map((id) => this.stacks[id][0].item)
            .map((item) => {
                const total_p = this.total_positive(item);
                const total_n = this.total_negative(item);
                const total = total_p.add(total_n);
                const margin = total.div(total_p.sub(total_n).quantity); // m = total / (p + (-1*n))
                return margin;
            })
            .reduce((acc, m) => {
                acc.add(m);
                return acc;
            }, new StackSet());
    }

    // See 'margins'; except the values are squared to get the magnitudes.
    margins_squared(ignoring: any[] = []) {
        return Object.keys(this.stacks)
            .filter((i) => !ignoring.includes(i))
            .map((id) => this.stacks[id][0].item)
            .map((item) => {
                const total_p = this.total_positive(item);
                const total_n = this.total_negative(item);
                const total = total_p.add(total_n);
                const margin = total.div(total_p.sub(total_n).quantity); // m = total / (p + (-1*n))
                return margin;
            })
            .map((m) => m.pow(2))
            .reduce((acc, m) => {
                acc.add(m);
                return acc;
            }, new StackSet());
    }

    total_positive(item: Item) {
        if (this.stacks[item.id]) {
            return this.stacks[item.id]
                .filter((s) => s.quantity > 0)
                .reduce((p, c) => p.add(c), new Stack(item, 0));
        } else {
            return new Stack(item, 0);
        }
    }
    total_negative(item: Item) {
        if (this.stacks[item.id]) {
            return this.stacks[item.id]
                .filter((s) => s.quantity < 0)
                .reduce((p, c) => p.add(c), new Stack(item, 0));
        } else {
            return new Stack(item, 0);
        }
    }
}

export { Stack, StackSet };
