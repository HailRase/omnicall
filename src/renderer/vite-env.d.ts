/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADAPTER_MODE?: string;
  readonly VITE_SIP_REGISTRAR?: string;
  readonly VITE_SIP_USERNAME?: string;
  readonly VITE_SIP_PASSWORD?: string;
  readonly VITE_SIP_URI?: string;
  readonly VITE_SIP_DISPLAY_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
