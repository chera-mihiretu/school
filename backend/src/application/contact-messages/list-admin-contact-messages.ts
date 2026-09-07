import type { ContactMessageStorePort } from "../../domain/ports/contact-message-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { toContactMessageView, type ContactMessageView } from "./views.ts";

export const DEFAULT_CONTACT_PAGE = 1;
export const DEFAULT_CONTACT_PAGE_SIZE = 50;
export const MAX_CONTACT_PAGE_SIZE = 100;

export type ListAdminContactMessagesInput = {
  hostHeader: string;
  page?: number;
  pageSize?: number;
};

export type ListAdminContactMessagesResult =
  | {
      ok: true;
      messages: ContactMessageView[];
      page: number;
      pageSize: number;
      total: number;
      pending: number;
    }
  | { ok: false; status: 403; error: string };

export type ListAdminContactMessages = (
  input: ListAdminContactMessagesInput,
) => Promise<ListAdminContactMessagesResult>;

export function normalizeContactPage(page: number | undefined): number {
  if (page === undefined || !Number.isInteger(page) || page < 1) {
    return DEFAULT_CONTACT_PAGE;
  }
  return page;
}

export function normalizeContactPageSize(pageSize: number | undefined): number {
  if (pageSize === undefined || !Number.isInteger(pageSize) || pageSize < 1) {
    return DEFAULT_CONTACT_PAGE_SIZE;
  }
  return Math.min(pageSize, MAX_CONTACT_PAGE_SIZE);
}

export function createListAdminContactMessages(deps: {
  rootHost: string;
  store: ContactMessageStorePort;
}): ListAdminContactMessages {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const page = normalizeContactPage(input.page);
    const pageSize = normalizeContactPageSize(input.pageSize);
    const listed = await store.listNewest({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      ok: true,
      messages: listed.messages.map(toContactMessageView),
      page,
      pageSize,
      total: listed.total,
      pending: listed.pending,
    };
  };
}
