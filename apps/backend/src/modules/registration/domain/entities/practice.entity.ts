export class Practice {
    constructor(
        public readonly id: string,
        public readonly name: string,
    ) {};
    
    static create(id: string, name: string): Practice {
        return new Practice(
            id,
            name
        )
    }
}