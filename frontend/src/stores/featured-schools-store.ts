"use client";

import {
  parseFeaturedSchool,
  type FeaturedSchool,
} from "@/features/school-site/featured-schools";
import { createAppStore } from "./create-store";

/** Relative Next path. Change this if the public list route moves. */
export const FEATURED_SCHOOLS_PATH = "/public/featured-schools";

export type { FeaturedSchool };

export type FeaturedSchoolsStatus = "idle" | "loading" | "error";

export type FeaturedSchoolsState = {
  schools: FeaturedSchool[];
  status: FeaturedSchoolsStatus;
  error: string | null;
  hydrated: boolean;
  draftName: string;
  draftSlug: string;
  slugEdited: boolean;
  flash: string;
  removingId: string | null;
  hydrate: (schools: FeaturedSchool[]) => void;
  setSchools: (schools: FeaturedSchool[]) => void;
  setStatus: (status: FeaturedSchoolsStatus) => void;
  setError: (error: string | null) => void;
  setDraftName: (name: string) => void;
  setDraftSlug: (slug: string) => void;
  setSlugEdited: (edited: boolean) => void;
  setFlash: (flash: string) => void;
  setRemovingId: (id: string | null) => void;
  resetDraft: () => void;
  loadPublic: () => Promise<void>;
};

function readSchools(payload: unknown): FeaturedSchool[] {
  const list = Array.isArray(payload)
    ? payload
    : payload !== null &&
        typeof payload === "object" &&
        "schools" in payload &&
        Array.isArray((payload as { schools: unknown }).schools)
      ? (payload as { schools: unknown[] }).schools
      : null;

  if (list === null) {
    return [];
  }

  const schools: FeaturedSchool[] = [];
  for (const item of list) {
    const school = parseFeaturedSchool(item);
    if (school !== undefined) {
      schools.push(school);
    }
  }
  return schools;
}

export const useFeaturedSchoolsStore = createAppStore<FeaturedSchoolsState>(
  (set) => ({
    schools: [],
    status: "idle",
    error: null,
    hydrated: false,
    draftName: "",
    draftSlug: "",
    slugEdited: false,
    flash: "",
    removingId: null,
    hydrate: (schools) => {
      set({
        schools,
        hydrated: true,
        status: "idle",
        error: null,
      });
    },
    setSchools: (schools) => {
      set({ schools, hydrated: true });
    },
    setStatus: (status) => {
      set({ status });
    },
    setError: (error) => {
      set({ error });
    },
    setDraftName: (draftName) => {
      set({ draftName });
    },
    setDraftSlug: (draftSlug) => {
      set({ draftSlug });
    },
    setSlugEdited: (slugEdited) => {
      set({ slugEdited });
    },
    setFlash: (flash) => {
      set({ flash });
    },
    setRemovingId: (removingId) => {
      set({ removingId });
    },
    resetDraft: () => {
      set({
        draftName: "",
        draftSlug: "",
        slugEdited: false,
        error: null,
      });
    },
    loadPublic: async () => {
      set({ status: "loading", error: null });
      try {
        const response = await fetch(FEATURED_SCHOOLS_PATH, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          set({
            status: "error",
            error: `Featured schools request failed (${response.status})`,
          });
          return;
        }

        const payload: unknown = await response.json();
        set({
          schools: readSchools(payload),
          hydrated: true,
          status: "idle",
          error: null,
        });
      } catch {
        set({
          status: "error",
          error: "Backend unreachable",
        });
      }
    },
  }),
);
