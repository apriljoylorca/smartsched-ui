const { overrideDevServer } = require('customize-cra');

// This is the fix for the "Invalid options object" error AND the proxy
const devServerConfig = () => config => {
  return {
    ...config,
    // 1. Fixes the "Invalid options object" bug
    allowedHosts: ['all'],
    
    // 2. Explicitly re-configures the proxy that was broken
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  };
};

module.HMR = false;

module.exports = {
  devServer: overrideDevServer(devServerConfig()),
};

