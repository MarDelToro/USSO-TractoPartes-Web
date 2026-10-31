import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/miembros/',publicDir:false,plugins:[react()],build:{outDir:'dist/web',rollupOptions:{input:'web.html'}}});
