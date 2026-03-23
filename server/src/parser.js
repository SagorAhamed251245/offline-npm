'use strict';

/**
 * Parses a package string like "express", "express@4.18.2", "@scope/pkg@1.0.0"
 * Returns { name, version } where version defaults to 'latest'.
 */
function parsePackage(input) {
  input = input.trim();

  // Handle scoped packages: @scope/name or @scope/name@version
  if (input.startsWith('@')) {
    const secondAt = input.indexOf('@', 1);
    if (secondAt === -1) {
      return { name: input, version: 'latest', raw: input };
    }
    return {
      name: input.slice(0, secondAt),
      version: input.slice(secondAt + 1),
      raw: input,
    };
  }

  // Unscoped: name or name@version
  const atIndex = input.indexOf('@');
  if (atIndex === -1) {
    return { name: input, version: 'latest', raw: input };
  }

  return {
    name: input.slice(0, atIndex),
    version: input.slice(atIndex + 1),
    raw: input,
  };
}

/**
 * Returns a display-friendly label e.g. "express@4.18.2"
 */
function packageLabel(name, version) {
  return `${name}@${version}`;
}

module.exports = { parsePackage, packageLabel };
