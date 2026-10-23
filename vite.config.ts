import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
export default defineConfig(({mode})=>({base:'./',plugins:[react()],define:{__EDITION__:JSON.stringify(mode==='reverie'?'reverie':mode==='classic'?'classic':JSON.parse(readFileSync(new URL('./edition.json',import.meta.url),'utf8')).edition)},build:{outDir:'dist'}}));
