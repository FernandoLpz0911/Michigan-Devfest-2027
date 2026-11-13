import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; Carbon's TextArea uses it.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
