// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import vue from '@astrojs/vue';
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), icon()],
  experimental: {
    fonts: [{
      provider: fontProviders.google(),
      name: "Roboto",
      cssVariable: "--font-roboto"
    }]
  }
});
