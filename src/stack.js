import { check } from './structures_base.js';



class Stack {
    constructor(item, quantity) {
        check('item', item, 'quantity', quantity);
        this.item = item;
        this.quantity = quantity;
    }
    clone() {
        return new Stack(this.item, this.quantity);
    }
    add(other) {
        if (other) {
            if (other.item !== this.item) throw new Error('unable to add different item types together, found (this) ' + this.item.id + ' and (other) ' + other.item.id);
            return new Stack(this.item, this.quantity + other.quantity);
        } else {
            return this.clone();
        }
    }
    div(scalar) {
        return new Stack(this.item, this.quantity / scalar);
    }
    mul(scalar) {
        return new Stack(this.item, this.quantity * scalar);
    }
}

class StackSet {
    constructor() {
        this.stacks = {};
    }
    add(stack) {
        this._ensure_stack(stack);
        this.stacks[stack.item.id].push(stack);
    }
    sub(stack) {
        this._ensure_stack(stack);
        this.stacks[stack.item.id].push(stack.mul(-1));
    }
    _ensure_stack(stack) {
        if (!this.stacks[stack.item.id]) {
            this.stacks[stack.item.id] = [];
        }
    }
    total(item) {
        return this.stacks[item.id].reduce((p, c) => p.add(c), new Stack(item, 0));
    }
    total_positive(item) {
        return this.stacks[item.id]
            .filter(s => s.quantity > 0)
            .reduce((p, c) => p.add(c), new Stack(item, 0));
    }
    total_negative(item) {
        return this.stacks[item.id]
            .filter(s => s.quantity < 0)
            .reduce((p, c) => p.add(c), new Stack(item, 0));
    }
}

export { Stack, StackSet };
