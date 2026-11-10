'use client';

import Link from 'next/link';
import WorkDoors, { type DoorLine } from '../WorkDoors';
import SiteActions from '../SiteActions';
import { useLive } from './live';
import { lateCards, projectsToFix, waitingOrders, writingDrafts, type WaitingOrder } from './sources';
import dash from './dash.module.css';

// The admin home.
//
// ON A PHONE, the gold doors, each saying what is waiting behind it (his pick,
// 2026-11-10, redesign page, Admin doors: A). A door whose number has not
// arrived, or could not be read, is the plain gold door with its name.
//
// ON A COMPUTER, a dashboard after the CRM's (his call, 2026-11-10): a tile
// per tool with its number, then what needs him (the orders and the late
// cards) on the left, and the drafts, the projects to fix and the site on the
// right. dash.module.css shows one of the two.
//
// Every number is worked out in home/sources.ts exactly as the tool behind it
// works it out, and the sidebar's counts read the same loaders, so the home,
// the sidebar and the page they open never disagree.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

/** What an order is waiting for, by lib/order-waiting.ts's three cases. */
function orderMove(order: WaitingOrder): string {
  if (order.status === 'received') return 'Check the payment';
  if (order.printful_id === null) return 'Send to Printful';
  return 'Confirm in Printful';
}

/**
 * Clients is the CRM, on its own address behind its own Access app: the admin
 * app cannot read it, so the door says where it goes instead. Quiet, because
 * gold here means "something is waiting" and this door cannot know.
 */
const CLIENTS: DoorLine = { text: 'Opens the CRM ↗', waiting: false };

function line(n: number | undefined, some: string, none: string): DoorLine | undefined {
  if (n === undefined) return undefined;
  return n > 0 ? { text: some, waiting: true } : { text: none, waiting: false };
}

export default function AdminHome() {
  const [orders] = useLive(waitingOrders);
  const [projects] = useLive(projectsToFix);
  const [drafts] = useLive(writingDrafts);
  const [late] = useLive(lateCards);

  const n = {
    shop: orders?.length,
    projects: projects?.length,
    writing: drafts?.length,
    boards: late?.length,
  };
  const needs = (orders?.length ?? 0) + (late?.length ?? 0);

  return (
    <>
      <div className={dash.phone}>
        <WorkDoors
          app="admin"
          lines={{
            shop: line(n.shop, `${n.shop} waiting`, 'Nothing waiting'),
            projects: line(n.projects, `${n.projects} to fix`, 'Nothing to fix'),
            writing: line(n.writing, plural(n.writing ?? 0, 'draft', 'drafts'), 'No drafts'),
            boards: line(n.boards, `${n.boards} late`, 'Nothing late'),
            clients: CLIENTS,
          }}
        />
      </div>

      <div className={dash.dash}>
        <ul className={dash.tiles}>
          <li>
            <Link className={`${dash.tile} card-link`} href="/work/shop/">
              <span className={dash.tileK}>
                <i className={n.shop ? dash.dotGold : dash.dot} /> Orders waiting
              </span>
              <span className={dash.tileV}>{n.shop ?? '–'}</span>
              <span className={dash.tileS}>to check or send</span>
            </Link>
          </li>
          <li>
            <Link className={`${dash.tile} card-link`} href="/work/projects/">
              <span className={dash.tileK}>
                <i className={n.projects ? dash.dotGold : dash.dot} /> Projects
              </span>
              <span className={dash.tileV}>{n.projects ?? '–'}</span>
              <span className={dash.tileS}>with something to fix</span>
            </Link>
          </li>
          <li>
            <Link className={`${dash.tile} card-link`} href="/work/writing/">
              <span className={dash.tileK}>
                <i className={n.writing ? dash.dotGold : dash.dot} /> Drafts
              </span>
              <span className={dash.tileV}>{n.writing ?? '–'}</span>
              <span className={dash.tileS}>not yet published</span>
            </Link>
          </li>
          <li>
            <Link className={`${dash.tile} card-link`} href="/work/boards/">
              <span className={dash.tileK}>
                <i className={n.boards ? dash.dotBad : dash.dot} /> Late cards
              </span>
              <span className={n.boards ? dash.tileVBad : dash.tileV}>{n.boards ?? '–'}</span>
              <span className={dash.tileS}>across the boards</span>
            </Link>
          </li>
          <li>
            <a className={`${dash.tile} card-link`} href="https://clients.masterroachi.com/">
              <span className={dash.tileK}>
                <i className={dash.dot} /> Clients
              </span>
              <span className={dash.tileV}>CRM ↗</span>
              <span className={dash.tileS}>prospects and renewals</span>
            </a>
          </li>
        </ul>

        <div className={dash.grid}>
          <div className={dash.col}>
            <section className={dash.panel} aria-label="Needs you now">
              <h2 className={dash.head}>
                Needs you now <span>{orders && late ? needs : ''}</span>
              </h2>
              {orders && late && needs === 0 && <p className={dash.empty}>Nothing needs you.</p>}
              <ul className={dash.rows}>
                {(orders ?? []).map((order) => (
                  <li key={order.ref}>
                    <Link className={dash.row} href="/work/shop/">
                      <i className={dash.dotGold} />
                      <span className={dash.rowText}>
                        <b>{orderMove(order)}</b>
                        <span>
                          {order.ref} · {order.name} · {order.product} {order.size}
                        </span>
                      </span>
                      <span className={dash.note}>{day(order.created_at)}</span>
                    </Link>
                  </li>
                ))}
                {(late ?? []).map((card) => (
                  <li key={card.id}>
                    <a className={dash.row} href={card.url} target="_blank" rel="noreferrer">
                      <i className={dash.dotBad} />
                      <span className={dash.rowText}>
                        <b>{card.name}</b>
                        <span>{card.board}</span>
                      </span>
                      <span className={dash.noteBad}>was {day(card.due)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className={dash.panel} aria-label="Drafts">
              <h2 className={dash.head}>
                Drafts <Link href="/work/writing/">Writing ›</Link>
              </h2>
              {drafts && drafts.length === 0 && <p className={dash.empty}>No drafts.</p>}
              <ul className={dash.rows}>
                {(drafts ?? []).map((entry) => (
                  <li key={entry.path}>
                    <Link className={dash.row} href="/work/writing/">
                      <i className={dash.dotGold} />
                      <span className={dash.rowText}>
                        <b>{entry.title}</b>
                        <span>{entry.path.replace(/^content\/writing\//, '')}</span>
                      </span>
                      <span className={dash.note}>Draft</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className={dash.col}>
            <section className={dash.panel} aria-label="Projects to fix">
              <h2 className={dash.head}>
                Projects to fix <Link href="/work/projects/">Projects ›</Link>
              </h2>
              {projects && projects.length === 0 && <p className={dash.empty}>Every project page is complete.</p>}
              <ul className={dash.rows}>
                {(projects ?? []).map((entry) => (
                  <li key={entry.path}>
                    <Link className={dash.row} href="/work/projects/">
                      <i className={dash.dotGold} />
                      <span className={dash.rowText}>
                        <b>{entry.title}</b>
                      </span>
                      <span className={dash.noteGold}>{entry.warnings} to fix</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className={dash.panel} aria-label="The site">
              <h2 className={dash.head}>The site</h2>
              <SiteActions plain />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
