import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

export default defineConfig(({ command, mode }) => {
  // The developer's own USDA key from .env, for the dev server only — never baked into a build
  // (`npm run deploy` builds locally, so gating on the mode alone wouldn't be enough). The Food
  // check page itself is dev-only too (gated on import.meta.env.DEV in App/TopBar/MobileMenu).
  const devUsdaApiKey = command === 'serve' ? loadEnv(mode, process.cwd(), '').USDA_API_KEY ?? '' : ''

  return {
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __DEV_USDA_API_KEY__: JSON.stringify(devUsdaApiKey),
    },
    server: {
      port: 7171,
      strictPort: true,
    },
    preview: {
      port: 7171,
      strictPort: true,
    },
  }
})
