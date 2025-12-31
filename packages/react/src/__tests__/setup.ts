import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock localStorage for Dynamic SDK which accesses it at module load time
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Dynamic SDK to avoid needing DynamicContextProvider in tests
vi.mock('@dynamic-labs/sdk-react-core', () => ({
  useDynamicContext: () => ({
    primaryWallet: null,
  }),
}));
