import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const TUNNEL_HOSTS = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.dev']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: TUNNEL_HOSTS,
  },
})
