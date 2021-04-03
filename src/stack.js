import { check } from './structures_base.js';



class Stack {
    constructor(item, quantity) {
        check("item", item, "quantity", quantity);
        this.item = item;
        this.quantity = quantity;
    }
    clone() {
        return new Stack(this.item, this.quantity);
    }
    add(other) {
        if (other) {
            if (other.item !== this.item) throw new Error("unable to add different item types together, found (this) " + this.item.id + " and (other) " + other.item.id);
            return new Stack(this.item, this.quantity + other.quantity);
        } else {
            return this.clone();
        }
    }
}

class StackSet {
    constructor() {
        this.stacks = {};
    }
    add(stack) {
        if (!this.stacks[stack.item.id]) {
            this.stacks[stack.item.id] = [];
        }
        this.stacks[stack.item.id].push(stack);
    }

    total(item) {
        return this.stacks[item.id].reduce((p, c) => p.add(c), new Stack(item, 0));
    }
}

export {Stack, StackSet}
