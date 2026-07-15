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
