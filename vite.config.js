export default { base: './', build: { chunkSizeWarningLimit: 1500 }, server: { proxy: { '/ws': { target: 'ws://localhost:8787', ws: true } } } };
