export type NonFunctionProperties<T> = {
    [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never : K]: T[K];
};