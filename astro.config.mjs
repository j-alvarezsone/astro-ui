import { defineConfig, fontProviders } from 'astro/config';

import vue from '@astrojs/vue';
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), icon()],
  image: {
    domains: ["i.pravatar.cc"],
  },
  fonts: [{
    provider: fontProviders.google(),
    name: "Roboto",
    cssVariable: "--font-roboto",
    weights: [400, 500, 600, 700],
    fallbacks: ["sans-serif"],
  }]
});
