#!/bin/bash
set -e

# -----------------------------
# CONFIG
# -----------------------------
# Source and target directories
PUBLIC_DIR="_site/"

# List of JS files to include in the public repo (minified only)

MIN_JS_FILES=("ode.min.js" "plotter.min.js" "traj.min.js" "pitch-editor.min.js" "pitch-visualizer.min.js" "pitch-search.min.js" "spin_axis.min.js")
DEL_JS_FILES=("ode.js" "plotter.js" "traj.js" "pitch-editor.js" "pitch-visualizer.js" "pitch-search.js" "spin_axis.js")



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


# Remove non-minified JS
for file in "${DEL_JS_FILES[@]}"; do
    rm -f "assets/js/traj/$file"
done
