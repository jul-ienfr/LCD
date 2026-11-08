import { fileURLToPath } from "node:url";
import adapter from "@sveltejs/adapter-node";
import { enhancedImages } from "@sveltejs/enhanced-img";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(async ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  const kit = await sveltekit({ adapter: adapter() });

  return {
    plugins: [tailwindcss(), enhancedImages(), ...kit],
    server: {
      watch: {
        ignored: ["**/test-results*/**", "**/.artifacts/**"],
      },
    },
    resolve: {
      alias: {
        "@": src,
        $core: src,
      },
    },
  };
});
