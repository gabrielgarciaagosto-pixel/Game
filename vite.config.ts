import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function writeRoleFile(role: 'player' | 'master'): Plugin {
  return {
    name: 'ossuarian-role-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'ossuarian-role.json',
        source: JSON.stringify({ role }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const role = mode === 'master' ? 'master' : 'player'
  return {
    define: {
      __OSSUARIAN_ROLE__: JSON.stringify(role),
    },
    plugins: [react(), tailwindcss(), writeRoleFile(role)],
  }
})
