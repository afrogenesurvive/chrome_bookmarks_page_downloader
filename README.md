# chrome_bookmarks_page_downloader

Does what it says on the box — downloads all web pages from your Chrome bookmarks folders.

## Usage

### Option 1: CLI args (one or more folders)

```bash
node index.js "Folder Name" -o ./downloads
node index.js "Folder One" "Folder Two" -o ./downloads
```

### Option 2: Config file (no args)

Create a `config.json` (already git-ignored) in the project root:

```json
{
  "outputDirectory": "./downloads",
  "bookmarkFolders": ["Bookmarks Bar", "Other Bookmarks"]
}
```

Then simply run:

```bash
node index.js
```

### Using the binary after npm link

```bash
npm link
bookmark-downloader "Folder One" "Folder Two" -o ./downloads
```

### Options

| Flag                     | Description                                 |
| ------------------------ | ------------------------------------------- |
| `-o, --output <dir>`     | Directory to save downloaded pages          |
| `-v, --verbose`          | Show detailed output per page               |
| `--concurrency <number>` | Number of concurrent downloads (default: 3) |

### Examples

```bash
# Single folder via CLI
node index.js "Tech Articles" -o ./tech-articles

# Multiple folders via CLI
node index.js "Tech Articles" "Blogs" -o ./articles-and-blogs

# Using config file (no args)
node index.js

# Verbose with high concurrency
node index.js "Bookmarks Bar" -o ./all-pages --verbose --concurrency 5
```

## Handling duplicate folder names

If you have multiple bookmark folders with the same name in different parts of your bookmarks tree, you can use a **path** instead of just a folder name — separate segments with `/`.

```bash
# Download from a specific subfolder using its full path
node index.js "Bookmarks Bar/Tech Articles" -o ./tech-articles

# Download from two different folders that share the same name
node index.js "Bookmarks Bar/Dev" "Other Bookmarks/Dev" -o ./dev-pages
```

The same works in `config.json`:

```json
{
  "outputDirectory": "./downloads",
  "bookmarkFolders": ["Bookmarks Bar/Tech Articles", "Other Bookmarks/Dev"]
}
```

Use `-v` (`--verbose`) to see a warning when a plain folder name matches multiple locations — it'll suggest the exact path to use.
