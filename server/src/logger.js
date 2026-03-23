'use strict';

const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';
const YELLOW= '\x1b[33m';
const RED   = '\x1b[31m';
const BLUE  = '\x1b[34m';

function info(msg)    { console.log(`${CYAN}ℹ${RESET}  ${msg}`); }
function success(msg) { console.log(`${GREEN}✔${RESET}  ${msg}`); }
function warn(msg)    { console.log(`${YELLOW}⚠${RESET}  ${msg}`); }
function error(msg)   { console.error(`${RED}✖${RESET}  ${msg}`); }
function step(msg)    { console.log(`${BLUE}›${RESET}  ${msg}`); }
function dim(msg)     { console.log(`${DIM}   ${msg}${RESET}`); }
function bold(msg)    { return `${BOLD}${msg}${RESET}`; }
function header(msg)  { console.log(`\n${BOLD}${CYAN}${msg}${RESET}\n`); }

function table(rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const widths = cols.map(c =>
    Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length))
  );

  const line = widths.map(w => '─'.repeat(w + 2)).join('┼');
  const header = cols.map((c, i) => ` ${BOLD}${c.padEnd(widths[i])}${RESET} `).join('│');

  console.log('┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐');
  console.log('│' + header + '│');
  console.log('├' + line + '┤');
  rows.forEach(row => {
    const cells = cols.map((c, i) => ` ${String(row[c] ?? '').padEnd(widths[i])} `).join('│');
    console.log('│' + cells + '│');
  });
  console.log('└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘');
}

module.exports = { info, success, warn, error, step, dim, bold, header, table };
