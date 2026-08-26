import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

// Vue is wired in for later — anything genuinely interactive (a hover
// effect that needs state, a small animation, etc.) becomes a Vue island
// via client:idle / client:visible. Everything static stays plain Astro.
export default defineConfig({
  integrations: [vue()],
});
