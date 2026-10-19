// Writes data/countries.json: where Printful ships, and which countries need a
// state or province on the address.
//
// From Printful's own /countries endpoint, which is public — no token. Run by
// hand when the list might have moved (`npm run countries`); it changes on the
// scale of sanctions, not weeks, so it is not part of the build.
//
// The buy form's country list and the Worker's address check both read the
// committed file, so they cannot disagree about what a valid country is.
import fs from 'node:fs';

const response = await fetch('https://api.printful.com/countries', { signal: AbortSignal.timeout(20000) });
if (!response.ok) {
  console.log(`countries: Printful returned ${response.status} — keeping the committed data/countries.json`);
  process.exit(0);
}
const { result = [] } = await response.json();
const countries = result
  .map((country) => ({
    code: country.code,
    name: country.name,
    ...(country.states?.length
      ? { states: country.states.map((state) => ({ code: state.code, name: state.name })) }
      : {}),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync('data/countries.json', JSON.stringify({ fetchedAt: new Date().toISOString(), countries }, null, 1) + '\n');
console.log(`countries: ${countries.length}, ${countries.filter((c) => c.states).length} with states`);
