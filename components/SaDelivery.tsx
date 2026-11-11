'use client';

import { useEffect, useState } from 'react';

/**
 * What delivery in South Africa costs, said beside the price.
 *
 * The audit's second finding (11 Nov, his yes 12 Nov): most buyers are South
 * African, and they met delivery's cost, about four-fifths of the shirt's,
 * only after typing a full address. /api/delivery-za quotes one reference
 * address in Pretoria and keeps it for 12 hours, so this is an indication and
 * says "about"; checkout still quotes the buyer's own address. Until the
 * answer comes, or if it never does, the line says what it always said.
 */
export default function SaDelivery({ productId, className }: { productId: string; className?: string }) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/delivery-za?productId=${encodeURIComponent(productId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { delivery?: number; minDays?: number | null; maxDays?: number | null } | null) => {
        if (!live || !body || typeof body.delivery !== 'number') return;
        const rands = `R${Math.round(body.delivery).toLocaleString('en-ZA').replace(/[\s  ]/g, ' ')}`;
        const days =
          body.minDays && body.maxDays
            ? body.minDays === body.maxDays
              ? `, then ${body.maxDays} days by courier`
              : `, then ${body.minDays}–${body.maxDays} days by courier`
            : '';
        setLine(`Delivery in South Africa: about ${rands}. Printed to order${days}.`);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [productId]);

  return (
    <p className={className}>
      {line ?? 'Delivery quoted for your address'}
      {line && <span> Elsewhere, quoted for your address.</span>}
    </p>
  );
}
