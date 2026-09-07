import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPlatformAdminIdentity } from "@/features/platform-admin/session";
import { AppLandingView } from "@/features/school-account/app-landing-view";
import {
  getCampusAccountSession,
  getSchoolAccountSession,
} from "@/features/school-account/session";
import { AdminLandingView } from "@/features/school-site/admin-landing-view";
import { ApexView } from "@/features/school-site/apex-view";
import { CampusView } from "@/features/school-site/campus-view";
import { listPublicFeaturedSchools } from "@/features/school-site/featured-schools-api";
import { fetchPublicHostView } from "@/features/school-site/public-host-api";
import { SuspendedView } from "@/features/school-site/suspended-view";
import { UnknownView } from "@/features/school-site/unknown-view";
import { parseSchoolHost } from "@/lib/host";
import { resolvePublicSchoolView, type PublicSchoolView } from "@/lib/network";

async function readSchoolHost() {
  const headerList = await headers();
  const hostHeader =
    headerList.get("x-school-host") ?? headerList.get("host") ?? "";
  return parseSchoolHost(hostHeader);
}

async function resolveIncomingView(): Promise<PublicSchoolView> {
  const parsed = await readSchoolHost();
  const remote = await fetchPublicHostView(parsed.hostname);
  return remote ?? resolvePublicSchoolView(parsed);
}

export async function generateMetadata(): Promise<Metadata> {
  const view = await resolveIncomingView();

  switch (view.kind) {
    case "apex":
      return {
        title: view.rootHost,
        description: "One platform, many independent schools.",
      };
    case "admin":
      return {
        title: `admin.${view.rootHost}`,
        description: "Operator console for the school platform.",
      };
    case "app":
      return {
        title: `app.${view.rootHost}`,
        description: "School account on this network.",
      };
    case "campus":
      return {
        title: view.name,
        description: `${view.name} is a campus on the ${view.rootHost} network.`,
      };
    case "unknown":
      return {
        title: "No school at this address",
        description: `${view.host} is not a school on this network.`,
      };
    case "suspended":
      return {
        title: `${view.name} is unavailable`,
        description: `${view.name} is paused by the platform operator.`,
      };
    default: {
      const _never: never = view;
      return _never;
    }
  }
}

export default async function Home() {
  const view = await resolveIncomingView();

  switch (view.kind) {
    case "apex": {
      const featured = await listPublicFeaturedSchools();
      return <ApexView rootHost={view.rootHost} schools={featured} />;
    }
    case "admin": {
      const session = await getPlatformAdminIdentity();
      if (session !== undefined) {
        redirect("/platform-admin");
      }
      return <AdminLandingView host={view.host} rootHost={view.rootHost} />;
    }
    case "app": {
      const session = await getSchoolAccountSession();
      if (session !== undefined) {
        redirect("/first-login");
      }
      return <AppLandingView host={view.host} rootHost={view.rootHost} />;
    }
    case "campus": {
      const session = await getCampusAccountSession();
      if (session !== undefined) {
        switch (session.kind) {
          case "director":
            redirect("/dashboard");
          case "teacher":
          case "staff":
            break;
          default: {
            const _never: never = session.kind;
            return _never;
          }
        }
      }
      return (
        <CampusView
          name={view.name}
          host={view.host}
          rootHost={view.rootHost}
          slug={view.slug}
          founded={view.founded}
          monogram={view.monogram}
        />
      );
    }
    case "unknown":
      return <UnknownView host={view.host} rootHost={view.rootHost} />;
    case "suspended":
      return (
        <SuspendedView
          name={view.name}
          host={view.host}
          monogram={view.monogram}
          rootHost={view.rootHost}
        />
      );
    default: {
      const _never: never = view;
      return _never;
    }
  }
}
