# Safety Data Sheet (SDS) Portal

A simple, fast, and searchable portal for Safety Data Sheets, designed to be hosted on GitHub Pages and updated automatically from a central spreadsheet.

## Features

- **Live Search**: Instantly filter products by name, manufacturer, category, and more.
- **Responsive Design**: Works on any device.
- **Expandable Details**: Click any row to see more detailed information.
- **Nightly Sync**: Automatically updates data from a published Google Sheet every night.
- **Link Checking**: Automatically checks for broken SDS and Spec file links every night.

## Getting Started

This project is designed to be deployed on GitHub Pages. Follow these steps to set up your own instance.

### 1. Publish Your Google Sheet to the Web

The portal is driven by a CSV file that is automatically generated from a Google Sheet.

1.  Open your Google Sheet containing the SDS data.
2.  Go to **File > Share > Publish to web**.
3.  In the dialog box:
    - Under the **Link** tab, select the specific sheet (e.g., `Sheet1`) that contains your data.
    - Change the format from "Web page" to **Comma-separated values (.csv)**.
4.  Click the **Publish** button.
5.  Copy the generated URL. This is your public CSV URL.

> **Note:** Anyone with this link can access the data. Ensure it does not contain sensitive information.

### 2. Set Up GitHub Secrets

The nightly workflow needs the public CSV URL to fetch the data.

1.  In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2.  Click **New repository secret**.
3.  For the **Name**, enter `SHEET_CSV_URL`.
4.  For the **Value**, paste the public CSV URL you copied from Google Sheets.
5.  Click **Add secret**.

### 3. Enable GitHub Pages

1.  In your GitHub repository, go to **Settings > Pages**.
2.  Under "Build and deployment", for the **Source**, select **Deploy from a branch**.
3.  Under "Branch", select `main` (or your default branch) and `/ (root)`.
4.  Click **Save**.

Your site should be live at `https://<your-username>.github.io/<your-repo-name>/` within a few minutes.

## Local Development

To run the portal locally for development or testing:

1.  Clone this repository.
2.  Make sure you have Python 3 installed.
3.  Run a simple web server from the root of the project directory:

    ```bash
    python3 -m http.server
    ```
4.  Open your web browser and navigate to `http://localhost:8000`.

The site will load using the sample data located in `data/sds.csv`. Any changes you make to the local files will be reflected when you reload the page.
