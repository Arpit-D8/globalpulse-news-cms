import { NewsProvider } from "./types";

const providers: NewsProvider[] = [];

export function registerProvider(provider: NewsProvider) {
  providers.push(provider);
}

export function getProviders() {
  return providers;
}