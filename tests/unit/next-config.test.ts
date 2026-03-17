jest.mock('next-intl/plugin', () => jest.fn(() => (config: unknown) => config));

describe('next.config webpack settings', () => {
  it('does not override client pdfjs-dist resolution', () => {
    const nextConfig = require('../../next.config.js');

    const baseConfig = {
      resolve: {
        alias: {},
      },
      module: {
        rules: [],
      },
      plugins: [],
    };

    const result = nextConfig.webpack(baseConfig, {
      isServer: false,
      dev: true,
    });

    expect(result.resolve.alias['pdfjs-dist']).toBeUndefined();
  });
});
