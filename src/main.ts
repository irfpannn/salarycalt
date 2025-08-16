import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Register the service worker (vite-plugin-pwa injects the registration helper)
if ('serviceWorker' in navigator) {
  // The plugin will auto-inject registration if injectRegister is 'auto',
  // but this is a safe explicit fallback in case of SSR or CSP constraints.
  window.addEventListener('load', async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      registerSW({ immediate: true })
    } catch (e) {
      // no-op if plugin not available in dev
    }
  })
}
