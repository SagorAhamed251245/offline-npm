#!/usr/bin/env node

"use strict";

const { program } = require("commander");
const { addPackage } = require("../src/add.js");
const { installPackage } = require("../src/install.js");
const { listPackages } = require("../src/list.js");
const { removePackage } = require("../src/remove.js");
const { version } = require("../package.json");

program
  .name("offline-npm")
  .description(
    "📦 Download npm packages when online, install them offline later",
  )
  .version(version);

program
  .command("add <package>")
  .description("Download a package and store it locally (requires internet)")
  .option("-d, --deps", "Also download all dependencies recursively", false)
  .option("-s, --storage <path>", "Custom storage directory")
  .action(async (pkg, options) => {
    await addPackage(pkg, options);
  });

program
  .command("install <package>")
  .description("Install a package from local offline storage")
  .option("-s, --storage <path>", "Custom storage directory")
  .option("--save", "Add to package.json dependencies", false)
  .option("--save-dev", "Add to package.json devDependencies", false)
  .action(async (pkg, options) => {
    await installPackage(pkg, options);
  });

program
  .command("list")
  .alias("ls")
  .description("List all locally stored packages")
  .option("-s, --storage <path>", "Custom storage directory")
  .action(async (options) => {
    await listPackages(options);
  });

program
  .command("remove <package>")
  .alias("rm")
  .description("Remove a package from local offline storage")
  .option("-s, --storage <path>", "Custom storage directory")
  .action(async (pkg, options) => {
    await removePackage(pkg, options);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
