import { defineConfig, fontProviders, memoryCache } from 'astro/config';
import netlify from '@astrojs/netlify';

import vue from '@astrojs/vue';
import icon from "astro-icon";

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
      provider: memoryCache(),
    },
  },
});
