"use client";

import {
  DEMO_NETWORK,
  type NetworkSchool,
  type TenantStatus,
} from "@/lib/network";
import { createAppStore } from "./create-store";

export type SessionEvent = {
  id: string;
  t: string;
  kind: "safe" | "danger";
  text: string;
};

export type ConsoleState = {
  schools: NetworkSchool[];
  events: SessionEvent[];
  flash: string;
  drawerOpen: boolean;
  setFlash: (value: string) => void;
  setDrawerOpen: (open: boolean) => void;
  addSchool: (school: NetworkSchool, rootHost: string) => void;
  setSchools: (schools: NetworkSchool[]) => void;
  setSchoolStatus: (
    id: string,
    status: TenantStatus,
    rootHost: string,
  ) => void;
  registerSearch: (element: HTMLInputElement | null) => void;
  focusSearch: () => boolean;
};

let searchInput: HTMLInputElement | null = null;

function cloneNetwork(): NetworkSchool[] {
  return DEMO_NETWORK.map((school) => ({ ...school }));
}

function schoolLabel(school: Pick<NetworkSchool, "slug" | "email" | "name">, rootHost: string): string {
  if (school.slug !== null && school.slug.length > 0) {
    return `${school.slug}.${rootHost}`;
  }
  return school.email ?? school.name;
}

function stamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function pushEvent(
  events: SessionEvent[],
  kind: SessionEvent["kind"],
  text: string,
): SessionEvent[] {
  const entry: SessionEvent = {
    id: `${Date.now()}-${Math.random()}`,
    t: stamp(),
    kind,
    text,
  };
  return [entry, ...events].slice(0, 6);
}

export const useConsoleStore = createAppStore<ConsoleState>((set, get) => ({
  schools: cloneNetwork(),
  events: [],
  flash: "",
  drawerOpen: false,
  setFlash: (flash) => {
    set({ flash });
  },
  setDrawerOpen: (drawerOpen) => {
    set({ drawerOpen });
  },
  addSchool: (school, rootHost) => {
    const address = schoolLabel(school, rootHost);
    set((state) => ({
      schools: state.schools.some(
        (row) =>
          row.id === school.id ||
          (school.slug !== null && row.slug === school.slug),
      )
        ? state.schools.map((row) =>
            row.id === school.id ||
            (school.slug !== null && row.slug === school.slug)
              ? school
              : row,
          )
        : [...state.schools, school],
      flash: `${address} created · site is live`,
      events: pushEvent(
        state.events,
        "safe",
        `Created ${school.name} at ${address}.`,
      ),
    }));
  },
  setSchools: (schools) => {
    set({ schools });
  },
  setSchoolStatus: (id, status, rootHost) => {
    const target = get().schools.find((school) => school.id === id);
    if (target === undefined) {
      return;
    }

    let flash: string;
    let kind: SessionEvent["kind"];
    let text: string;
    const address = schoolLabel(target, rootHost);
    switch (status) {
      case "suspended":
        flash = `${address} suspended · data kept`;
        kind = "danger";
        text = `Suspended ${target.name}. Site and logins stopped, data kept.`;
        break;
      case "active":
        flash = `${address} reactivated · site is live`;
        kind = "safe";
        text = `Reactivated ${target.name}. Site and logins restored.`;
        break;
      case "pending_setup":
        flash = `${address} setup pending`;
        kind = "safe";
        text = `${target.name} is pending setup.`;
        break;
      default: {
        const _never: never = status;
        return _never;
      }
    }

    set((state) => ({
      schools: state.schools.map((school) =>
        school.id === id ? { ...school, status } : school,
      ),
      flash,
      events: pushEvent(state.events, kind, text),
    }));
  },
  registerSearch: (element) => {
    searchInput = element;
  },
  focusSearch: () => {
    if (searchInput === null) {
      return false;
    }
    searchInput.focus();
    return true;
  },
}));
