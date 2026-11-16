import { fileURLToPath } from "node:url";
import adapter from "@sveltejs/adapter-node";
import { enhancedImages } from "@sveltejs/enhanced-img";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(async ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  const kit = await sveltekit({
    adapter: adapter(),
    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        "script-src": ["self"],
        "style-src": ["self", "unsafe-inline"],
        "img-src": ["self", "data:", "blob:"],
        "font-src": ["self", "data:"],
        "connect-src": ["self"],
        "manifest-src": ["self"],
        "worker-src": ["self", "blob:"],
        "frame-ancestors": ["none"],
        "object-src": ["none"],
        "base-uri": ["self"],
        "form-action": ["self"],
      },
    },
  });

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
