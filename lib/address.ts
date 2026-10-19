// A delivery address in the fields Printful takes.
//
// The buy form asked for one free-text box until 2026-10-19, and every order
// then had to be split by hand into street, city, postcode and country before
// it could go to Printful. Now the form asks in those fields, from this one
// definition, and the Worker checks against the same one — so the form and
// the server cannot disagree about what a valid address is.
//
// Countries are where Printful ships (data/countries.json, `npm run
// countries`). Five need a state: the US, Canada, Australia, Japan and
// Brazil. Everywhere else the field is not shown.

import data from '../data/countries.json';

export interface State {
  code: string;
  name: string;
}

export interface Country {
  code: string;
  name: string;
  states?: State[];
}

export interface Address {
  address1: string;
  address2: string;
  city: string;
  /** Only where the country has states; empty otherwise. */
  state_code: string;
  zip: string;
  country_code: string;
}

/** South Africa first, because nearly every order goes there; then A to Z. */
export const COUNTRIES: Country[] = (() => {
  const all = data.countries as Country[];
  const home = all.find((c) => c.code === 'ZA');
  return home ? [home, ...all.filter((c) => c !== home)] : all;
})();

export function countryOf(code: string): Country | null {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Whatever arrived, trimmed and capped, as an Address. Never throws. */
export function readAddress(value: unknown): Address {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    address1: text(v.address1, 200),
    address2: text(v.address2, 200),
    city: text(v.city, 100),
    state_code: text(v.state_code, 8).toUpperCase(),
    zip: text(v.zip, 16),
    country_code: text(v.country_code, 2).toUpperCase(),
  };
}

/** What is wrong with it, in words for the customer, or null when nothing is. */
export function addressProblem(address: Address): string | null {
  const country = countryOf(address.country_code);
  if (!country) return 'Choose a country.';
  if (!address.address1) return 'The street address is missing.';
  if (!address.city) return 'The city is missing.';
  if (!address.zip) return 'The postal code is missing.';
  if (country.states?.length) {
    if (!country.states.some((s) => s.code === address.state_code)) {
      return `Choose a ${country.code === 'CA' ? 'province' : 'state'}.`;
    }
  }
  return null;
}

/** One block of text, as an envelope would carry it. For the order's `address` column and for display. */
export function addressText(address: Address): string {
  const country = countryOf(address.country_code);
  const state = country?.states?.find((s) => s.code === address.state_code)?.name ?? '';
  return [
    address.address1,
    address.address2,
    [address.city, state].filter(Boolean).join(', '),
    address.zip,
    country?.name ?? address.country_code,
  ]
    .filter(Boolean)
    .join('\n');
}
