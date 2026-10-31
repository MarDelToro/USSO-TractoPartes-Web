import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'gallery.spec.ts',timeout:25000,workers:1,use:{channel:'chrome',baseURL:'http://127.0.0.1:4181',viewport:{width:393,height:852}},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4181 --strictPort',url:'http://127.0.0.1:4181/tests/gallery-fixture.html',reuseExistingServer:false}});
