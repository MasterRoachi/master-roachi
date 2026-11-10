'use client';

import { isDraft } from '@/lib/collections';
import { fieldsFor, warningsFor } from '@/lib/editor-fields';
import { readScalar, splitFile } from '@/lib/frontmatter';
import { isOklch } from '@/lib/oklch';
import type { WorkHubPayload } from '@/lib/work-hub';
import WorkDoors, { type DoorLine } from '../WorkDoors';
import { getJson, useLive } from './live';

// The admin home: the gold doors, each saying what is waiting behind it (his
// pick, 2026-11-10, redesign page, Admin doors: A).
//
// Each number is worked out exactly as the tool behind the door works it out,
// from the same endpoint, so the door and the page it opens never disagree.
// They load independently: Projects reads a file per entry from GitHub and is
// the slowest, and it must not hold up Shop. Until a number arrives, or if it
// cannot be read, the door is the plain gold door with its name.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* --- Shop: Orders.tsx's waiting() ---------------------------------------- */

interface OrderRow {
  status: 'received' | 'paid' | 'fulfilled' | 'dismissed';
  printful_id: number | null;
  printful_status: string | null;
}

/**
 * The orders waiting on him, by the Shop page's own rule (waiting() in
 * app/work/shop/Orders.tsx, the gold rows): received wants checking against
 * PayFast, paid and unsent wants sending, a Printful draft wants confirming.
 * Copied rather than imported because that file is the page, not a library;
 * if the rule there changes, change it here.
 */
function waiting(order: OrderRow): boolean {
  if (order.status === 'received') return true;
  if (order.status !== 'paid') return false;
  return order.printful_id === null || order.printful_status === 'draft';
}

async function shopLine(): Promise<DoorLine | null> {
  const data = await getJson<{ configured: boolean; orders: OrderRow[] }>('/work/api/orders');
  if (!data?.configured) return null;
  const n = data.orders.filter(waiting).length;
  return n > 0 ? { text: `${n} waiting`, waiting: true } : { text: 'Nothing waiting', waiting: false };
}

/* --- Projects and Writing: CollectionEditor.tsx's load -------------------- */

/**
 * Every entry's text in a collection, as the editor loads it: the list, then
 * each file. Null if any of it failed — a count of the files that happened to
 * load would be a wrong number, and a wrong number is worse than none.
 */
async function texts(collection: string): Promise<string[] | null> {
  const list = await getJson<{ configured: boolean; files: { path: string }[] }>(
    `/work/api/content?collection=${collection}`,
  );
  if (!list?.configured) return null;
  const got = await Promise.all(
    (list.files ?? []).map(async (file) => {
      const one = await getJson<{ file: { text: string } }>(
        `/work/api/content?collection=${collection}&path=${encodeURIComponent(file.path)}`,
      );
      return one?.file?.text ?? null;
    }),
  );
  return got.every((text): text is string => text !== null) ? got : null;
}

/**
 * Projects with something the editor would flag — the "N to fix" on a shut
 * card there. The same warningsFor(), fed the same values and the same image
 * list; Projects passes no `projects` list to its editor, so neither does this.
 */
async function projectsLine(): Promise<DoorLine | null> {
  const [entries, art] = await Promise.all([
    texts('projects'),
    getJson<{ files?: { path: string }[] }>('/work/api/content?collection=project-art'),
  ]);
  if (!entries || !art) return null;
  const images = (art.files ?? []).map((file) => file.path.replace(/^public/, ''));
  const fields = fieldsFor('projects');
  const n = entries.filter((text) => {
    const lines = splitFile(text)?.frontmatter ?? [];
    const values = Object.fromEntries(fields.map((field) => [field.key, readScalar(lines, field.key) ?? '']));
    return warningsFor('projects', values, { images, isOklch }).length > 0;
  }).length;
  return n > 0 ? { text: `${n} to fix`, waiting: true } : { text: 'Nothing to fix', waiting: false };
}

async function writingLine(): Promise<DoorLine | null> {
  const entries = await texts('writing');
  if (!entries) return null;
  const n = entries.filter(isDraft).length;
  return n > 0 ? { text: plural(n, 'draft', 'drafts'), waiting: true } : { text: 'No drafts', waiting: false };
}

/* --- Boards: WorkHub.tsx's overdue mark ----------------------------------- */

/**
 * The lists the Boards page does not draw (HIDDEN_LISTS in WorkHub.tsx): a
 * late card sitting in Done is finished, not late. Copied for the reason
 * waiting() is; keep the two in step.
 */
const HIDDEN_LISTS = /^(inbox|done|completed|complete|archive|archived|projects)$/i;

/** Cards past their due date on every board, by the red dot's rule on the Boards page. */
async function boardsLine(): Promise<DoorLine | null> {
  const data = await getJson<WorkHubPayload>('/api/work/');
  if (!data?.configured) return null;
  const now = Date.now();
  const n = data.boards
    .flatMap((board) => board.cards)
    .filter((card) => !HIDDEN_LISTS.test(card.list.trim()))
    .filter((card) => card.due !== null && Date.parse(card.due) < now).length;
  return n > 0 ? { text: `${n} late`, waiting: true } : { text: 'Nothing late', waiting: false };
}

/**
 * Clients is the CRM, on its own address behind its own Access app: the admin
 * app cannot read it, so the door says where it goes instead. Quiet, because
 * gold here means "something is waiting" and this door cannot know.
 */
const CLIENTS: DoorLine = { text: 'Opens the CRM ↗', waiting: false };

export default function AdminHome() {
  const [shop] = useLive(shopLine);
  const [projects] = useLive(projectsLine);
  const [writing] = useLive(writingLine);
  const [boards] = useLive(boardsLine);

  return (
    <WorkDoors
      app="admin"
      lines={{
        shop: shop ?? undefined,
        projects: projects ?? undefined,
        writing: writing ?? undefined,
        boards: boards ?? undefined,
        clients: CLIENTS,
      }}
    />
  );
}
