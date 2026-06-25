/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly MODE: string;
  readonly VITE_ADAPTER_MODE?: string;
  readonly VITE_SIP_SERVER?: string;
  readonly VITE_SIP_DOMAIN?: string;
  readonly VITE_SIP_USERNAME?: string;
  readonly VITE_SIP_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
