/// <reference types="vite/client" />

/** Fallback when per-file `*.module.css.d.ts` is missing (run `npm run css:types`). */
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
  readonly VITE_UPDATE_MANIFEST_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
