/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

interface ImportMetaEnv {
  readonly VITE_SUPPORT_GIFS_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
