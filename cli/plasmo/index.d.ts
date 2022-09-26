declare namespace NodeJS {
  interface ProcessEnv {
    APP_VERSION?: string
    VERBOSE?: "true" | "false"
    NODE_ENV?: "development" | "production" | "test"
  }
}
