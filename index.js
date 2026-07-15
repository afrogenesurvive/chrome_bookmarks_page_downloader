#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const puppeteer = require("puppeteer");

// Chrome bookmarks file path (adjust if needed)
const BOOKMARKS_PATH = path.join(process.env.HOME || process.env.USERPROFILE, "Library/Application Support/Google/Chrome/Default/Bookmarks");
// Windows path
const BOOKMARKS_PATH_WIN = path.join(process.env.USERPROFILE || "", "AppData/Local/Google/Chrome/User Data/Default/Bookmarks");
// Linux path
const BOOKMARKS_PATH_LINUX = path.join(process.env.HOME || "", ".config/google-chrome/Default/Bookmarks");

// Helper to find Chrome bookmarks file
function findBookmarksFile() {
  const possiblePaths = [BOOKMARKS_PATH, BOOKMARKS_PATH_WIN, BOOKMARKS_PATH_LINUX];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Recursively search for bookmarks folder by name
function findFolderByName(node, folderName) {
  if (node.type === "folder" && node.name.toLowerCase() === folderName.toLowerCase()) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const result = findFolderByName(child, folderName);
      if (result) return result;
    }
  }
  return null;
}

// Get all bookmark URLs from a folder
function getBookmarkUrls(folder) {
  const urls = [];

  function traverse(node) {
    if (node.type === "url" && node.url) {
      urls.push({
        name: node.name || "Untitled",
        url: node.url,
      });
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(folder);
  return urls;
}

// Download a page
async function downloadPage(url, outputDir, name) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set timeout for navigation
    await page.setDefaultNavigationTimeout(30000);

    console.log(chalk.blue(`  ⬇ Downloading: ${name || url}`));

    // Navigate to the URL
    const response = await page.goto(url, { waitUntil: "networkidle2" });

    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response ? response.status() : "error"}`);
    }

    // Get the HTML content
    const html = await page.content();

    // Generate filename
    const filename = name ? `${name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 100)}.html` : `page_${Date.now()}.html`;

    const filepath = path.join(outputDir, filename);

    // Save the file
    fs.writeFileSync(filepath, html, "utf-8");

    return { success: true, filepath, filename };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Load configuration from config.json
 */
function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const data = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(data);
}

/**
 * List all bookmark URLs for a list of folder names, returning tagged items
 */
function collectUrlsFromFolders(bookmarks, folderNames) {
  const allBookmarks = [];
  const missingFolders = [];

  for (const name of folderNames) {
    const folder = findFolderByName(bookmarks.roots, name);
    if (!folder) {
      missingFolders.push(name);
      continue;
    }
    const urls = getBookmarkUrls(folder);
    for (const item of urls) {
      allBookmarks.push({ ...item, sourceFolder: name });
    }
  }

  return { allBookmarks, missingFolders };
}

// Main function
async function main() {
  program
    .name("bookmark-downloader")
    .description("Download all pages from Chrome bookmarks folders")
    .version("1.0.0")
    .argument("[folder-names...]", "Names of the bookmarks folders to download")
    .option("-o, --output <dir>", "Directory to save downloaded pages")
    .option("-v, --verbose", "Show detailed output")
    .option("--concurrency <number>", "Number of concurrent downloads", "3")
    .parse();

  const options = program.opts();
  const folderNames = program.args;

  console.log(chalk.green("📚 Bookmark Downloader"));
  console.log(chalk.gray("─".repeat(50)));

  // Determine config source: CLI args take precedence, otherwise use config.json
  let foldersToScan;
  let outputDir;

  if (folderNames.length > 0) {
    // CLI mode: folder names are positional args, output dir from -o option
    foldersToScan = folderNames;
    outputDir = options.output || "./downloads";
    console.log(chalk.gray(`📋 Using CLI arguments`));
  } else {
    // Config mode: read from config.json
    let config;
    try {
      config = loadConfig();
    } catch (error) {
      console.error(chalk.red("❌ Failed to read config.json:"), error.message);
      process.exit(1);
    }

    if (!config) {
      console.error(chalk.red("❌ No folder names provided and no config.json found"));
      console.log(chalk.yellow("Usage: node index.js <folder-name> [folder-name...] [-o <output-dir>]"));
      console.log(chalk.yellow("   or: Create a config.json file with outputDirectory and bookmarkFolders"));
      process.exit(1);
    }

    foldersToScan = config.bookmarkFolders;
    outputDir = options.output || config.outputDirectory || "./downloads";
    console.log(chalk.gray("📋 Using configuration from config.json"));
  }

  if (!foldersToScan || foldersToScan.length === 0) {
    console.error(chalk.red("❌ No bookmark folders specified"));
    process.exit(1);
  }

  // Find bookmarks file
  const bookmarksPath = findBookmarksFile();
  if (!bookmarksPath) {
    console.error(chalk.red("❌ Could not find Chrome bookmarks file"));
    console.log(chalk.yellow("Please make sure Chrome is installed and you have bookmarks"));
    process.exit(1);
  }

  console.log(chalk.gray(`📁 Using bookmarks from: ${bookmarksPath}`));

  // Read and parse bookmarks
  let bookmarks;
  try {
    const data = fs.readFileSync(bookmarksPath, "utf-8");
    bookmarks = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("❌ Failed to read bookmarks file:"), error.message);
    process.exit(1);
  }

  // Collect URLs from all specified folders
  const { allBookmarks, missingFolders } = collectUrlsFromFolders(bookmarks, foldersToScan);

  // Report any missing folders
  for (const name of missingFolders) {
    console.error(chalk.red(`❌ Could not find folder: "${name}"`));
  }

  if (allBookmarks.length === 0) {
    console.error(chalk.yellow(`⚠️  No bookmarks found in specified folders`));
    if (missingFolders.length > 0) {
      console.log(chalk.yellow("Available top-level folders:"));
      const roots = bookmarks.roots;
      for (const key in roots) {
        if (roots[key].type === "folder") {
          console.log(chalk.gray(`  - ${roots[key].name}`));
        }
      }
    }
    process.exit(missingFolders.length > 0 ? 1 : 0);
  }

  const folderList = foldersToScan.join('", "');
  console.log(chalk.green(`📊 Found ${allBookmarks.length} bookmarks across folders: "${folderList}"`));

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(chalk.gray(`📁 Created output directory: ${outputDir}`));
  }

  console.log(chalk.gray("─".repeat(50)));

  // Download pages with concurrency control
  const concurrency = parseInt(options.concurrency) || 3;
  const results = [];
  const spinner = ora("Downloading pages...").start();

  // Process URLs in batches
  for (let i = 0; i < allBookmarks.length; i += concurrency) {
    const batch = allBookmarks.slice(i, i + concurrency);
    const batchPromises = batch.map(({ name, url }) => downloadPage(url, outputDir, name));

    const batchResults = await Promise.allSettled(batchPromises);

    // Log results
    batchResults.forEach((result, index) => {
      const bookmark = batch[index];
      if (result.status === "fulfilled") {
        results.push({ success: true, ...result.value, sourceFolder: bookmark.sourceFolder });
        if (options.verbose) {
          console.log(chalk.green(`  ✅ [${bookmark.sourceFolder}] ${bookmark.name}`));
        }
      } else {
        results.push({ success: false, error: result.reason, sourceFolder: bookmark.sourceFolder });
        console.log(chalk.red(`  ❌ [${bookmark.sourceFolder}] ${bookmark.name}: ${result.reason}`));
      }
    });

    // Update spinner
    spinner.text = `Downloading pages... ${Math.min(i + concurrency, allBookmarks.length)}/${allBookmarks.length}`;
  }

  spinner.succeed(`Download complete!`);

  // Summary
  console.log(chalk.gray("─".repeat(50)));
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(chalk.green(`✅ Successfully downloaded: ${successful}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}`));
  }
  console.log(chalk.gray(`📁 Files saved in: ${outputDir}`));

  // Create a manifest file
  const manifest = {
    folders: foldersToScan,
    downloadDate: new Date().toISOString(),
    total: allBookmarks.length,
    successful,
    failed,
    files: results
      .filter((r) => r.success)
      .map((r) => ({
        name: r.filename,
        path: r.filepath,
        originalName: r.name,
        sourceFolder: r.sourceFolder,
      })),
  };

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(chalk.gray(`📋 Manifest saved: ${manifestPath}`));
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error(chalk.red("❌ Unhandled error:"), error);
  process.exit(1);
});

// Run the app
main();
