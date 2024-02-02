const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Compile views (EJS templates and LocalModel JS)
execSync('node build/compile_views.js', {stdio: 'inherit'});

const main_path = path.join(__dirname, '..', 'dist', 'main.js');
const manifest_path = path.join(__dirname, '..', 'manifest.json');
const styles_path = path.join(__dirname, '..', 'src', 'styles.css');
// copy manifest and styles to dist
fs.copyFileSync(manifest_path, path.join(__dirname, '..', 'dist', 'manifest.json'));
fs.copyFileSync(styles_path, path.join(__dirname, '..', 'dist', 'styles.css'));
// Update manifest.json version
const package_json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')));
const manifest_json = JSON.parse(fs.readFileSync(manifest_path));
manifest_json.version = package_json.version;
fs.writeFileSync(manifest_path, JSON.stringify(manifest_json, null, 2));

const destination_vaults = [
  'sc-test-vault',
  'obsidian-1',
];

// Build the project
esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/main.js',
  format: 'cjs',
  bundle: true,
  write: true,
  sourcemap: 'inline',
  target: "es2018",
	logLevel: "info",
  treeShaking: true,
  platform: 'node',
  external: [
    'obsidian',
    'crypto',
    '@xenova/transformers',
  ],
}).then(() => {
  // Copy the dist folder to ./DESTINATION_VAULT/.obsidian/plugins/smart-connections/
  const release_file_paths = [manifest_path, styles_path, main_path];
  for(let vault of destination_vaults) {
    const destDir = path.join(__dirname, '..', '..', vault, '.obsidian', 'plugins', 'smart-connections');
    fs.mkdirSync(destDir, { recursive: true });
    release_file_paths.forEach(file_path => {
      fs.copyFileSync(file_path, path.join(destDir, path.basename(file_path)));
    });
  }
}).catch(() => process.exit(1));