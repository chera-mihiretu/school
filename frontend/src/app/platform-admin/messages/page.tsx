import { redirect } from "next/navigation";
import { listAdminContactMessages } from "@/features/platform-admin/contact-messages-api";
import { ContactMessagesView } from "@/features/platform-admin/contact-messages-view";
import { readIncomingHost } from "@/features/platform-admin/host";
import {
  getPlatformAdminIdentity,
  readSessionToken,
} from "@/features/platform-admin/session";

export default async function PlatformAdminMessagesPage() {
  const session = await getPlatformAdminIdentity();
  if (session === undefined) {
    redirect("/platform-admin/login");
  }

  const token = await readSessionToken();
  const listed =
    token === undefined
      ? {
          messages: [],
          total: 0,
          pending: 0,
          error: "Sign in to read contact messages",
        }
      : await listAdminContactMessages({
          token,
          host: await readIncomingHost(),
        });

  return (
    <ContactMessagesView
      messages={listed.messages}
      total={listed.total}
      pending={listed.pending}
      initialError={listed.error}
    />
  );
}
