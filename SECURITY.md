# Security

Neume is a set of icon drawings, two small npm packages (`@neume-icons/svg`, `@neume-icons/react`) and a
static site. The packages have no runtime dependency beyond React, and no install scripts.

## Reporting a vulnerability

Please report it privately through
[GitHub's private vulnerability reporting](https://github.com/florianfaure/neume/security/advisories/new),
not in a public issue. Include the package and version, what an attacker can do, and the smallest example
that shows it. You will get an answer within a week.

## Supported versions

Only the latest published version of each package receives fixes.

## Releases

Both packages are published from this repository's `release` workflow, through npm trusted publishing:
no npm token exists. Every version is staged, then approved by the maintainer with two-factor
authentication before it goes live.
