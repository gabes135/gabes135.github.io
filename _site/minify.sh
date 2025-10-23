#!/bin/bash
# Exit on any error
set -e

# Choose folder depending on argument
if [ "$1" == "local" ]; then
  JS_DIR="assets/js/traj"
else
  JS_DIR="_site/assets/js/traj"
fi

# List of JS files to minify (without folder path)
FILES_TO_MINIFY=(
  "ode.js"
  "pitch-visualizer.js"
  "pitch-search.js"
  "spin_axis.js"
  "plotter.js"
)


 FILES_TO_OBFUS=(
  "pitch-editor.js"
  "traj.js"
)


# Check if folder exists
if [ ! -d "$JS_DIR" ]; then
  echo "Folder $JS_DIR does not exist!"
  exit 1
fi

# Loop over the list of files
for filename in "${FILES_TO_MINIFY[@]}"; do
  input_file="$JS_DIR/$filename"

  # Skip if the file does not exist
  if [ ! -f "$input_file" ]; then
    echo "File $input_file does not exist, skipping..."
    continue
  fi

  # Remove .js extension for output filename
  base_name="${filename%.js}"
  output_file="$JS_DIR/${base_name}.min.js"

  echo "Minifying $filename -> ${base_name}.min.js ..."


  # Use terser to compress and mangle
  terser "$input_file" \
    --compress \
    --mangle \
    --output "$output_file"
done

# Loop over the list of files
for filename in "${FILES_TO_OBFUS[@]}"; do
  input_file="$JS_DIR/$filename"

  # Skip if the file does not exist
  if [ ! -f "$input_file" ]; then
    echo "File $input_file does not exist, skipping..."
    continue
  fi

  # Remove .js extension for output filename
  base_name="${filename%.js}"
  output_file="$JS_DIR/${base_name}.min.js"


  npx javascript-obfuscator "$input_file" \
    --output "$output_file" \
    --compact true \
    --control-flow-flattening true \
    --control-flow-flattening-threshold 0.3 \
    --string-array true \
    --string-array-encoding base64 \
    --string-array-threshold 0.3 \
    --self-defending false \
    --disable-console-output true



done




echo "Selected JS files have been minified and obfuscated."
