#!/bin/bash
set -e

# -----------------------------
# CONFIG
# -----------------------------
# Source and target directories
PRIVATE_DIR=$(pwd)  # your private-website folder
PUBLIC_REPO="git@github.com:gabes135/gabes135.github.io.git"
PUBLIC_DIR="$PRIVATE_DIR/_site"

# List of JS files to include in the public repo (minified only)
MIN_JS_FILES=("ode.min.js" "plotter.min.js" "traj.min.js" "pitch-editor.min.js" "pitch-visualizer.min.js" "spin_axis.min.js")
DEL_JS_FILES=("ode.js" "plotter.js" "traj.js" "pitch-editor.js" "pitch-visualizer.js" "spin_axis.js")



# -----------------------------
# 1) Build the site
# -----------------------------
echo "Building site..."
JEKYLL_ENV=production jekyll build

# -----------------------------
# 2) Minify/obfuscate JS
# -----------------------------
echo "Running minify script..."
./minify.sh  # make sure this handles local vs _site and obfuscates traj.js

# -----------------------------
# 3) Prepare _site for push
# -----------------------------
echo "Preparing deployment folder..."
cd "$PUBLIC_DIR"

# Init repo if not already
git init
git remote add origin "$PUBLIC_REPO"

# Set identity
git config user.name "github-actions"
git config user.email "github-actions@github.com"

# Ensure branch main exists
git checkout -B main

# Remove non-minified JS
for file in "${DEL_JS_FILES[@]}"; do
    rm -f "assets/js/traj/$file"
done

# Add and commit
git add -A
git commit -m "Deploy site: $(date +"%Y-%m-%d %H:%M:%S")" || true

# Push
git push -u origin main --force

echo "Deployment complete!"
