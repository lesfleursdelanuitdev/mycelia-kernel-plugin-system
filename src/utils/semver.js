/**
 * Semantic Versioning (Semver) Utilities
 * 
 * Provides validation and comparison for semantic version strings.
 * Supports semver 2.0.0 specification with simplified ranges.
 * 
 * Supported version formats:
 * - '1.0.0' - Exact version
 * - '^1.0.0' - Compatible with version (>=1.0.0 <2.0.0)
 * - '~1.0.0' - Approximately equivalent (>=1.0.0 <1.1.0)
 * - '>=1.0.0' - Greater than or equal
 * - '>1.0.0' - Greater than
 * - '<=1.0.0' - Less than or equal
 * - '<1.0.0' - Less than
 * - '*' - Any version
 */

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const RANGE_REGEX = /^([\^~><=*]*)(.*)$/;

/**
 * Parse a semver string into components
 * 
 * @param {string} version - Version string (e.g., '1.2.3-alpha.1+build.123')
 * @returns {Object|null} Parsed version or null if invalid
 * @returns {number} result.major - Major version number
 * @returns {number} result.minor - Minor version number
 * @returns {number} result.patch - Patch version number
 * @returns {string} result.prerelease - Prerelease identifier (e.g., 'alpha.1')
 * @returns {string} result.build - Build metadata (e.g., 'build.123')
 * @returns {string} result.raw - Original version string
 */
export function parseVersion(version) {
  if (typeof version !== 'string') {
    return null;
  }

  const match = version.match(SEMVER_REGEX);
  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
    build: match[5] || '',
    raw: version
  };
}

/**
 * Check if a string is a valid semver version
 * 
 * @param {string} version - Version string to validate
 * @returns {boolean} True if valid semver
 */
export function isValidSemver(version) {
  return parseVersion(version) !== null;
}

/**
 * Compare two semver versions
 * 
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 * @throws {Error} If either version is invalid
 */
export function compareVersions(v1, v2) {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (!parsed1) {
    throw new Error(`Invalid semver: ${v1}`);
  }
  if (!parsed2) {
    throw new Error(`Invalid semver: ${v2}`);
  }

  // Compare major
  if (parsed1.major !== parsed2.major) {
    return parsed1.major < parsed2.major ? -1 : 1;
  }

  // Compare minor
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor < parsed2.minor ? -1 : 1;
  }

  // Compare patch
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch < parsed2.patch ? -1 : 1;
  }

  // Compare prerelease (versions without prerelease are greater)
  if (parsed1.prerelease !== parsed2.prerelease) {
    if (!parsed1.prerelease) return 1;
    if (!parsed2.prerelease) return -1;
    return parsed1.prerelease < parsed2.prerelease ? -1 : 1;
  }

  return 0;
}

/**
 * Check if version satisfies a range
 * 
 * Supported ranges:
 * - '1.0.0' - Exact match
 * - '^1.0.0' - Compatible (>=1.0.0 <2.0.0)
 * - '~1.0.0' - Approximately (>=1.0.0 <1.1.0)
 * - '>=1.0.0', '>1.0.0', '<=1.0.0', '<1.0.0' - Comparisons
 * - '*' - Any version
 * 
 * @param {string} version - Version to check
 * @param {string} range - Range specification
 * @returns {boolean} True if version satisfies range
 * @throws {Error} If version or range is invalid
 */
export function satisfiesRange(version, range) {
  if (typeof range !== 'string') {
    throw new Error('Range must be a string');
  }

  // Wildcard matches any version
  if (range === '*') {
    return true;
  }

  const versionParsed = parseVersion(version);
  if (!versionParsed) {
    throw new Error(`Invalid semver: ${version}`);
  }

  const match = range.match(RANGE_REGEX);
  if (!match) {
    throw new Error(`Invalid range: ${range}`);
  }

  const operator = match[1] || '';
  const targetVersion = match[2].trim();

  const targetParsed = parseVersion(targetVersion);
  if (!targetParsed) {
    throw new Error(`Invalid semver in range: ${targetVersion}`);
  }

  // Caret range: ^1.2.3 means >=1.2.3 <2.0.0
  if (operator === '^') {
    return (
      versionParsed.major === targetParsed.major &&
      compareVersions(version, targetVersion) >= 0
    );
  }

  // Tilde range: ~1.2.3 means >=1.2.3 <1.3.0
  if (operator === '~') {
    return (
      versionParsed.major === targetParsed.major &&
      versionParsed.minor === targetParsed.minor &&
      compareVersions(version, targetVersion) >= 0
    );
  }

  // Greater than or equal
  if (operator === '>=') {
    return compareVersions(version, targetVersion) >= 0;
  }

  // Greater than
  if (operator === '>') {
    return compareVersions(version, targetVersion) > 0;
  }

  // Less than or equal
  if (operator === '<=') {
    return compareVersions(version, targetVersion) <= 0;
  }

  // Less than
  if (operator === '<') {
    return compareVersions(version, targetVersion) < 0;
  }

  // Exact match (no operator)
  if (operator === '') {
    return compareVersions(version, targetVersion) === 0;
  }

  throw new Error(`Unsupported range operator: ${operator}`);
}

/**
 * Get the default version (0.0.0)
 * 
 * @returns {string} Default version string
 */
export function getDefaultVersion() {
  return '0.0.0';
}

/**
 * Validate that a version string is a valid semver
 * Throws an error with a helpful message if invalid
 * 
 * @param {string} version - Version string to validate
 * @param {string} [context=''] - Context for error message (e.g., 'hook useRouter')
 * @throws {Error} If version is invalid
 */
export function validateVersion(version, context = '') {
  if (!isValidSemver(version)) {
    const prefix = context ? `${context}: ` : '';
    throw new Error(
      `${prefix}Invalid semver version "${version}". ` +
      'Must follow format: MAJOR.MINOR.PATCH (e.g., "1.0.0", "2.1.3-alpha")'
    );
  }
}

