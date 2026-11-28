'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Our own checkout: step one takes the buyer's details and holds a seat, step two
 * mounts Stripe's Payment Element styled to match the site. Card and bank details
 * go straight from Stripe's fields to Stripe; this page never sees them.
 *
 * Stripe.js is loaded from js.stripe.com (it must be, for PCI), pinned to the
 * release that matches the API version of the server's Stripe library.
 */
const STRIPE_JS = 'https://js.stripe.com/endive/stripe.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type StripeJs = any;
declare global {
  interface Window {
    Stripe?: (key: string) => StripeJs;
  }
}

let loading: Promise<void> | null = null;
function loadStripeJs(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = STRIPE_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('Stripe.js failed to load'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap';

/** Mirrors the tokens in globals.css: paper, ink, alu borders, 6px corners, Instrument Sans. */
const APPEARANCE = {
  theme: 'flat',
  variables: {
    colorPrimary: '#141518',
    colorBackground: '#ffffff',
    colorText: '#141518',
    colorTextSecondary: '#6a6d74',
    colorTextPlaceholder: '#9a9ca2',
    colorDanger: '#c2311f',
    colorIcon: '#6a6d74',
    fontFamily: "'Instrument Sans', Helvetica, Arial, sans-serif",
    fontSizeBase: '16px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    borderRadius: '6px',
    spacingUnit: '4px',
    gridRowSpacing: '16px',
    gridColumnSpacing: '16px',
    focusBoxShadow: '0 0 0 1px #141518',
    focusOutline: 'none',
  },
  rules: {
    '.Input': { border: '1px solid #d6d8d1', boxShadow: 'none', padding: '10px 12px', lineHeight: '1.4' },
    '.Input:focus': { border: '1px solid #141518', boxShadow: '0 0 0 1px #141518' },
    '.Input--invalid': { border: '1px solid #c2311f', boxShadow: 'none' },
    '.Label': { fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#141518' },
    '.Tab': { border: '1px solid #d6d8d1', boxShadow: 'none', backgroundColor: '#ffffff' },
    '.Tab:hover': { border: '1px solid #141518' },
    '.Tab--selected, .Tab--selected:hover, .Tab--selected:focus': {
      border: '1px solid #141518',
      boxShadow: '0 0 0 1px #141518',
      backgroundColor: '#ffffff',
      color: '#141518',
    },
    '.TabIcon--selected': { fill: '#141518' },
    '.AccordionItem': { border: '1px solid #d6d8d1', boxShadow: 'none' },
    '.Error': { fontSize: '13px' },
  },
};

type Step = { kind: 'details' } | { kind: 'payment'; clientSecret: string; expiresAt: number; email: string; name: string };

const fmtTime = (ms: number) =>
  new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', minute: '2-digit', hour12: true })
    .format(new Date(ms))
    .replace(' ', '')
    .toLowerCase();

export function CheckoutForm({ slug, publishableKey, priceLabel }: { slug: string; publishableKey: string; priceLabel: string }) {
  const [step, setStep] = useState<Step>({ kind: 'details' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(['name', 'email', 'company', 'abn', 'dietary'].map((k) => [k, String(f.get(k) ?? '')]));
    try {
      // Start fetching Stripe.js while the seat is being held.
      const js = loadStripeJs();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? "Payment didn't open. Nothing was charged. Please try again in a minute.");
        setBusy(false);
        return;
      }
      await js;
      setStep({ kind: 'payment', clientSecret: data.clientSecret, expiresAt: data.expiresAt, email: body.email, name: body.name });
    } catch {
      setError("Payment didn't open. Check your connection and try again. Nothing was charged.");
    }
    setBusy(false);
  }

  if (step.kind === 'payment') {
    return <PaymentStep {...step} publishableKey={publishableKey} />;
  }

  return (
    <form onSubmit={submitDetails} className="stack co-form">
      <p className="co-step">
        <span className="co-n">1</span> Your details
      </p>
      <div className="grid2">
        <label>
          Name <input name="name" required autoComplete="name" />
        </label>
        <label>
          Email <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <div className="grid2">
        <label>
          Company <span className="muted">(optional, for the invoice)</span>
          <input name="company" autoComplete="organization" maxLength={120} />
        </label>
        <label>
          ABN <span className="muted">(optional)</span>
          <input name="abn" inputMode="numeric" autoComplete="off" maxLength={14} pattern="[0-9 ]{11,14}" title="11 digits" />
        </label>
      </div>
      <label>
        Dietary needs for lunch <span className="muted">(optional)</span>
        <input name="dietary" maxLength={255} />
      </label>
      {error && <p className="notice bad">{error}</p>}
      <div className="row">
        <button className="btn primary" disabled={busy} aria-busy={busy}>
          {busy && <span className="spin" aria-hidden="true" />}
          {busy ? 'Holding your seat…' : 'Continue to payment'}
        </button>
        <span className="small muted">{priceLabel}. Your seat is held for 30 minutes while you pay.</span>
      </div>
    </form>
  );
}

function PaymentStep({
  clientSecret,
  expiresAt,
  email,
  name,
  publishableKey,
}: {
  clientSecret: string;
  expiresAt: number;
  email: string;
  name: string;
  publishableKey: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [total, setTotal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let element: any;
    (async () => {
      try {
        await loadStripeJs();
        const stripe = window.Stripe!(publishableKey);
        const init = (stripe.initCheckoutElementsSdk ?? stripe.initCheckout).bind(stripe);
        const checkout = init({
          clientSecret,
          elementsOptions: { appearance: APPEARANCE, fonts: [{ cssSrc: FONT_CSS }], loader: 'never' },
          // The session already carries the email (customer_email), so it isn't set again here.
          defaultValues: { billingAddress: { name } },
        });
        element = checkout.createPaymentElement({ layout: { type: 'tabs' } });
        element.on?.('ready', () => !cancelled && setReady(true));
        if (mountRef.current) element.mount(mountRef.current);
        const loaded = await checkout.loadActions();
        if (cancelled) return;
        if (loaded.type === 'error') {
          setError(loaded.error?.message ?? "Payment didn't load. Nothing was charged.");
          return;
        }
        actionsRef.current = loaded.actions;
        const session = loaded.actions.getSession();
        setTotal(session?.total?.total?.amount ?? null);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Payment didn't load. Refresh the page to try again. Nothing was charged.");
      }
    })();
    return () => {
      cancelled = true;
      element?.destroy?.();
    };
  }, [clientSecret, name, publishableKey]);

  useEffect(() => {
    const t = setTimeout(() => setExpired(true), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(t);
  }, [expiresAt]);

  async function pay() {
    if (!actionsRef.current) return;
    setPaying(true);
    setError(null);
    const result = await actionsRef.current.confirm();
    // On success Stripe redirects to the success page; we only get here on an error.
    if (result?.type === 'error' || result?.error) {
      setError(result.error?.message ?? 'The payment did not go through. Nothing was charged.');
      setPaying(false);
    }
  }

  if (expired) {
    return (
      <div className="stack">
        <p className="notice bad">Your 30-minute hold ran out and the seat was released. Nothing was charged.</p>
        <p>
          <a className="btn quiet" href="">
            Start again
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="stack co-form">
      <p className="co-step">
        <span className="co-n">2</span> Payment
      </p>
      <dl className="co-who">
        <div>
          <dt>Name</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt>Receipt to</dt>
          <dd>{email}</dd>
        </div>
        <div>
          <dt>Seat held until</dt>
          <dd>{fmtTime(expiresAt)}</dd>
        </div>
      </dl>
      <div ref={mountRef} className="co-pe" aria-busy={!ready} />
      {!ready && !error && <p className="small muted">Loading secure payment fields…</p>}
      {error && <p className="notice bad">{error}</p>}
      <div className="row">
        <button type="button" className="btn primary" onClick={pay} disabled={!ready || !total || paying} aria-busy={paying}>
          {paying && <span className="spin" aria-hidden="true" />}
          {paying ? 'Confirming payment…' : total ? `Pay ${total}` : 'Pay'}
        </button>
        <span className="small muted">Payments are processed by Stripe. Card details never touch this site.</span>
      </div>
    </div>
  );
}
