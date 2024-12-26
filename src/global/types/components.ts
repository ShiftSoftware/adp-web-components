export type AppStates = 'idle' | 'loading' | 'data' | 'error' | 'error-loading' | 'data-loading';

export type MockJson<T> = { [key: string]: T };
