import { create, type StateCreator } from "zustand";

export type AppStateCreator<T> = StateCreator<T, [], []>;

export function createAppStore<T>(initializer: AppStateCreator<T>) {
  return create<T>()(initializer);
}
