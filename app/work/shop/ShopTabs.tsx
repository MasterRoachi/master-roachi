'use client';

import { useEffect, useState, type ReactNode } from 'react';
import styles from './orders.module.css';
import ui from '../ui.module.css';

// Orders and Products, one page — his ruling, 2026-10-19. Orders opens first,
// because a waiting order is the thing on this page that costs money to miss.
//
// Both panels stay mounted and the hidden one is only hidden: the copy editor
// holds unsaved text in state, and switching tabs must not throw it away.
//
// The tab is in the hash, so /work/shop/#products is a link to the editor and
// a reload stays where it was.
//
// Each panel fills the rest of the pane, so the products' Save bar can sit at
// its foot even when there are only a few tiles above it.
//
// The tabs are ui.module.css's, lit in the app's colour — his call,
// 2026-11-10 (design pass: the public site's styling, the CRM's desktop
// layout). The page's name is the frame's title above, so no heading here.

const TABS = [
  { key: 'orders', name: 'Orders' },
  { key: 'products', name: 'Products' },
] as const;

type Tab = (typeof TABS)[number]['key'];

function fromHash(): Tab {
  return typeof window !== 'undefined' && window.location.hash === '#products' ? 'products' : 'orders';
}

export default function ShopTabs({ orders, products }: { orders: ReactNode; products: ReactNode }) {
  const [tab, setTab] = useState<Tab>('orders');

  useEffect(() => {
    const sync = () => setTab(fromHash());
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const choose = (next: Tab) => {
    setTab(next);
    history.replaceState(null, '', next === 'orders' ? window.location.pathname : '#products');
  };

  return (
    <>
      <div className={`${ui.tabs} ${styles.tabs}`} role="tablist" aria-label="Shop">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            className={`${ui.tab} ${styles.tab}`}
            onClick={() => choose(t.key)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={styles.panel} id="panel-orders" aria-labelledby="tab-orders" hidden={tab !== 'orders'}>
        {orders}
      </div>
      <div role="tabpanel" className={styles.panel} id="panel-products" aria-labelledby="tab-products" hidden={tab !== 'products'}>
        {products}
      </div>
    </>
  );
}
