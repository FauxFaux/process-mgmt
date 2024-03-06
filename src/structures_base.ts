function check(...args: unknown[]) {
    for (let i = 0; i < args.length; i += 2) {
        const n = args[i];
        const v = args[i + 1];
        if (typeof v === 'undefined') {
            throw new Error(n + ' must not be undefined');
        }
    }
}

export { check };
