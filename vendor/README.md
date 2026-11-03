# Local recipe import dependencies

PDF.js (Apache-2.0), Mammoth (BSD-2-Clause) and Tesseract.js/Tesseract.js-core
(Apache-2.0) are delivered with the app. The German and English Tesseract language
models are the `4.0.0_best_int` models from the corresponding npm data packages.
See the adjacent license and language README files.

The browser reads recipe files locally. No file upload or paid AI API is used.
Text extraction and OCR are followed by a deterministic section parser; imported
quantities and preparation steps must be reviewed in the recipe form.

`manifest.json` records exact package versions, npm tarball integrity values and
SHA256 checksums of all vendored runtime files. Packages were installed with
scripts disabled and standard npm integrity/TLS verification enabled.

The matching pinned dependency declaration and lockfile are in
`tools/importers/package.json` and `tools/importers/package-lock.json`.
