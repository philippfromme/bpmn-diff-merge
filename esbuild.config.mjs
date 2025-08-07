// esbuild.config.mjs
import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

const common = {
  bundle: true,
  plugins: [sassPlugin()],
  loader: {
    '.svg': 'file',
    '.woff2': 'file',
    '.woff': 'file',
    '.ttf': 'file',
  },
  external: [
    '*.woff',
    '*.woff2',
    '*.ttf',
    '*.eot',
    '*.otf',
  ],
};

async function build({ watch }) {
  // Create contexts for each build target
  const diffContext = await esbuild.context({
    ...common,
    entryPoints: ['src/diff/index.js'],
    outfile: 'dist/diff/bundle.js',
  });

  const mergeContext = await esbuild.context({
    ...common,
    entryPoints: ['src/merge/index.jsx'],
    outfile: 'dist/merge/bundle.js',
    jsx: 'automatic',
  });

  // If watch mode is enabled, start watching both and keep process alive
  if (watch) {
    await Promise.all([
      diffContext.watch(),
      mergeContext.watch(),
    ]);
    console.log('Watching for changes. Press Ctrl+C to stop.');

    // Graceful exit on Ctrl+C
    process.on('SIGINT', async () => {
      console.log('Stopping watch...');
      await Promise.all([diffContext.dispose(), mergeContext.dispose()]);
      process.exit(0);
    });

    // Keep the process alive indefinitely
    return new Promise(() => {});
  } else {
    // Single build for both then dispose contexts
    await Promise.all([
      diffContext.rebuild(),
      mergeContext.rebuild(),
    ]);
    await Promise.all([diffContext.dispose(), mergeContext.dispose()]);
  }
}

// Parse CLI argument for watch
const watch = process.argv.includes('--watch');

build({ watch }).catch((err) => {
  console.error(err);
  process.exit(1);
});
