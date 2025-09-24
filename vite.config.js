import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        vue(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    publicDir: 'public',
    server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: [
            'localhost',
            '127.0.0.1',
            '.ngrok-free.app',
            // 允許局域網 IP 訪問（用於手機測試）
            /^192\.168\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        ],
        proxy: {
            // 代理所有 /api 開頭的請求到後端 API
            '/api': {
                target: 'https://stg-line-crm.fanpokka.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                secure: true,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('Sending Request to:', proxyReq.getHeader('host') + proxyReq.path);
                    });
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        console.log('Received Response:', proxyRes.statusCode, req.url);
                    });
                }
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: (assetInfo) => {
                    if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
                        return 'images/[name].[hash][extname]'
                    }
                    return 'assets/[name].[hash][extname]'
                }
            }
        },
        assetsInlineLimit: 4096,
        copyPublicDir: false  // 不複製 public 資料夾，只使用 import 的圖片（有雜湊）
    }
});
