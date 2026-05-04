const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Zustand v5 is ESM-first: its package `exports` field points to an ESM build
// that uses `import.meta`, which Metro cannot handle outside native ES modules.
// Disabling unstable_enablePackageExports makes Metro fall back to the `main`
// field (CJS build) for all packages, avoiding the `import.meta` crash.
config.resolver.unstable_enablePackageExports = false;

// On web builds, redirect @react-native-async-storage/async-storage to our
// plain localStorage shim so the native package never enters the web bundle.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    moduleName === '@react-native-async-storage/async-storage'
  ) {
    return {
      filePath: path.resolve(__dirname, 'src/store/storage.web.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
