declare namespace NodeJS {
  interface ProcessEnv {
    APP_VERSION?: string
    NODE_ENV?: "development" | "production" | "test"
  }
}
