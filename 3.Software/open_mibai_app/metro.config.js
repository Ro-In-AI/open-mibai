const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [
      'bin',
      'txt',
      'jpg',
      'png',
      'json',
      'gif',
      'webp',
      'svg',
      'ttf',
      'otf',
      'woff',
      'woff2',
      'mp3',
      'mp4',
      'wav',
      'aac',
      'm4a',
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
