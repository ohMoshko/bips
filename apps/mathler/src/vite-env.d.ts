/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENVIRONMENT_ID: string;
  readonly VITE_BIPS_RECEIVER_ADDRESS: string;
  readonly VITE_BIPS_NETWORK: 'base-sepolia' | 'base';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
