# Codeforces Auto-Fill Problem Code

A lightweight Chrome Extension (Manifest V3) that remembers the last problem you viewed on Codeforces and automatically fills in the problem code whenever you open the submit page.

---

## Features

- **Auto-Detection**: Saves the problem code (e.g., `4A`, `1800C1`) when visiting problemset, contest, or gym pages.
- **Auto-Fill**: Automatically populates empty problem fields on `/problemset/submit` and contest submit pages.
- **Popup Control**: View, edit, or clear your saved problem code anytime from the extension toolbar.

---

## Installation

1- Clone or download this repository.

2- Open Chrome and navigate to `chrome://extensions`.

3- Enable Developer mode using the toggle in the top-right corner.

4- Click Load unpacked in the top-left corner.

5- Select the project folder.

---

## How to Use

Open any problem on Codeforces (e.g., https://codeforces.com/problemset/problem/4/A).

Go to the submission page (https://codeforces.com/problemset/submit).

The Problem: input field will be automatically filled with the corresponding code (4A).