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

> **Tip:** Use `~/Downloads` or `~/Desktop/my-pages` in `outputDirectory` — the `~` is automatically expanded to your home directory.

Use `-v` (`--verbose`) to see a warning when a plain folder name matches multiple locations — it'll suggest the exact path to use.

## Requirements

- **Google Chrome** must be installed at `/Applications/Google Chrome.app` (default macOS location).
- Node.js 18+.

## Output

Downloaded pages are saved as HTML files in the output directory. A `manifest.json` is also created with details on every page:

```json
{
  "folders": ["Age of Aquarius"],
  "total": 26,
  "successful": 20,
  "failed": 6,
  "files": [
    {
      "status": "success",
      "name": "page_name.html",
      "path": "./downloads/page_name.html",
      "originalName": "Original Bookmark Name",
      "sourceFolder": "Age of Aquarius"
    },
    {
      "status": "failed",
      "originalName": "Failed Page Name",
      "url": "https://example.com/page",
      "sourceFolder": "Age of Aquarius",
      "error": "Failed to launch the browser process!"
    }
  ]
}
```
