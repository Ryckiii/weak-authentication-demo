# Weak Authentication

An interactive, English-language classroom website about weak authentication.
Built with plain HTML, CSS, JavaScript, and SVG. No build step, package installation, backend, API key, or external CDN is required.

## Deploy to GitHub Pages

1. Extract the ZIP archive on your computer.
2. Create a new **public** GitHub repository, for example `weak-authentication`.
3. Choose **Add file → Upload files**.
4. Upload `index.html`, the entire `assets` folder, and the other files from this package to the **repository root**. Do not upload the ZIP itself or place everything inside an extra folder.
5. Commit the files to the `main` branch.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
8. Select branch **main**, folder **/ (root)**, then click **Save**.
9. Wait for the deployment to complete. GitHub Pages will display the published website URL on that page.

With a repository named `weak-authentication`, the usual address is:

`https://YOUR-USERNAME.github.io/weak-authentication/`

Replace `YOUR-USERNAME` with your actual GitHub username. The URL shown by GitHub Pages is the authoritative address.

The `.nojekyll` file tells GitHub Pages to publish the static files without Jekyll processing. If your file picker hides dotfiles, the site does not rely on `.nojekyll` to work; all required application files are `index.html` and `assets/`.

### Expected repository structure

```text
index.html
assets/
  styles.css
  js/
    app.js
    components.js
    scenarios.js
README.md
.nojekyll
.gitignore
```

All application paths are relative, so the website supports a GitHub Pages repository subpath.

## Local preview (optional)

From the extracted directory, run:

```bash
python3 -m http.server 8000
```

On Windows, you can use `py -m http.server 8000` instead.

Open `http://localhost:8000` in a browser. Because the source uses JavaScript ES modules, use a local HTTP server rather than double-clicking this package's `index.html`.

## Included version

- Simplified light-only presentation; no visible timing labels, references section, or footer.
- Automatically looping homepage animation with pause/resume and reduced-motion support.
- Credential stuffing: the attacker has `maya / maya_happyhappy` from Website A; the same pair fails on Websites B and C and succeeds on Website D.
- Dictionary example with the correct password `Maya20261014`.
- Red for failed logins; green for successful logins.
- Centered comparison sign, step controls, three defense comparisons, and a short quiz.

## Updating the site

Replace the changed files in your repository and commit them. GitHub Pages will redeploy the site. For future CSS or JavaScript changes, increment the `?v=` suffix on stylesheet/script URLs and module imports if you need to invalidate older browser caches.

## Simulation scope

All usernames, passwords, and websites are fictional teaching examples. Everything runs locally in the browser. The site does not contact real login systems or collect passwords.

The small PIN search space and rate-limiting threshold are teaching choices, not real-world security recommendations. Rate limiting slows attempts but does not guarantee that a correct password will never work. MFA protection in the example assumes the attacker does not have the second factor.

## Content and visual references

These references are documented here rather than displayed on the presentation page:

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Multifactor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)
- Visual approach informed by [Ryckiii/web-for-csa](https://github.com/Ryckiii/web-for-csa).
