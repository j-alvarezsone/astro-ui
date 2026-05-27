import { defineConfig, fontProviders } from 'astro/config';
import netlify from '@astrojs/netlify';

import vue from '@astrojs/vue';
import icon from "astro-icon";
import { netlifyCache } from './src/share/utils/cache/netlifyCache.ts';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  integrations: [vue(), icon()],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    domains: ["i.pravatar.cc"],
  },
  fonts: [{
    provider: fontProviders.google(),
    name: "Roboto",
    cssVariable: "--font-roboto",
    weights: [400, 500, 600, 700],
    fallbacks: ["sans-serif"],
  }],
  experimental: {
    cache: {
      provider: netlifyCache({
        siteId: process.env.NETLIFY_SITE_ID,
        authToken: process.env.NETLIFY_AUTH_TOKEN,
        durable: true,
        debug: process.env.NODE_ENV !== 'production',
      }),
    },
  },
});
