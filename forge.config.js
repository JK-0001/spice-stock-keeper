const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'SpiceIn',
    executableName: 'SpiceIn',
    icon: './build-resources/icon',
    // Keep the packaged asar lean — exclude source code, dev artifacts, and
    // stray files that sometimes sit in the project root. The runtime only
    // needs dist/, dist-electron/, package.json, and production node_modules.
    ignore: [
      /^\/src($|\/)/,
      /^\/electron($|\/)/,
      /^\/build-resources($|\/)/,
      /^\/out($|\/)/,
      /^\/public($|\/)/,
      /^\/\.claude($|\/)/,
      /^\/\.git($|\/)/,
      /\.zip$/,
      /^\/app-.*\.log$/,
      /^\/.*\.md$/,
      /^\/.*\.txt$/,
      /^\/tsconfig.*\.json$/,
      /^\/vite\.config\.(ts|js|d\.ts)$/,
      /^\/tailwind\.config\.ts$/,
      /^\/postcss\.config\.js$/,
      /^\/components\.json$/,
      /^\/electron-builder\.json$/,
      /^\/forge\.config\.js$/,
      /^\/test_triggers\.js$/,
      /^\/index\.html$/,
      /^\/package-lock\.json$/,
    ],
  },
  rebuildConfig: {},
  hooks: {
    prePackage: async () => {
      const { execSync } = require('child_process');
      console.log('Running Vite build (includes TypeScript)...');
      execSync('npx vite build', { stdio: 'inherit' });
      console.log('Building Electron main process...');
      execSync('npx tsc --project tsconfig.node.json', { stdio: 'inherit' });
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'SpiceIn',
        authors: 'Jatin Khatri',
        description: 'Spice Stock Inventory Management',
        exe: 'SpiceIn.exe',
        setupExe: 'SpiceIn-Setup.exe',
        noMsi: true,
        remoteReleases: '',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
