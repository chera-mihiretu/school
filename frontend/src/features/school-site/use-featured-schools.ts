"use client";

import { useCallback, useEffect } from "react";
import {
  addFeaturedSchoolAction,
  removeFeaturedSchoolAction,
} from "@/features/platform-admin/featured-schools-actions";
import { useFeaturedSchoolsStore } from "@/stores/featured-schools-store";
import type { FeaturedSchool } from "./featured-schools";

export function useFeaturedSchools(initialSchools: FeaturedSchool[]) {
  const storeSchools = useFeaturedSchoolsStore((state) => state.schools);
  const status = useFeaturedSchoolsStore((state) => state.status);
  const error = useFeaturedSchoolsStore((state) => state.error);
  const hydrated = useFeaturedSchoolsStore((state) => state.hydrated);
  const hydrate = useFeaturedSchoolsStore((state) => state.hydrate);
  const setSchools = useFeaturedSchoolsStore((state) => state.setSchools);
  const setStatus = useFeaturedSchoolsStore((state) => state.setStatus);
  const setError = useFeaturedSchoolsStore((state) => state.setError);

  useEffect(() => {
    hydrate(initialSchools);
  }, [hydrate, initialSchools]);

  const addSchool = useCallback(
    async (name: string, slug: string) => {
      setStatus("loading");
      setError(null);
      const result = await addFeaturedSchoolAction(name, slug);
      if (!result.ok) {
        setStatus("error");
        setError(result.error);
        return result.error;
      }
      setSchools(result.schools);
      setStatus("idle");
      return null;
    },
    [setError, setSchools, setStatus],
  );

  const removeSchool = useCallback(
    async (id: string) => {
      setStatus("loading");
      setError(null);
      const result = await removeFeaturedSchoolAction(id);
      if (!result.ok) {
        setStatus("error");
        setError(result.error);
        return result.error;
      }
      setSchools(result.schools);
      setStatus("idle");
      return null;
    },
    [setError, setSchools, setStatus],
  );

  return {
    schools: hydrated ? storeSchools : initialSchools,
    status,
    error,
    setError,
    addSchool,
    removeSchool,
  };
}
