#!/usr/bin/env bash

# a bash script that traverse the examples directory and mv all prettier cjs files to mjs

dir="examples"

# Use a for loop to traverse the directory
for subdir in $(find $dir -type d); do
    # Check if the file exists
    if [ -f "$subdir/.prettierrc.cjs" ]; then
        # If the file exists, rename it
        mv "$subdir/.prettierrc.cjs" "$subdir/.prettierrc.mjs"
        echo "Renamed .prettierrc.cjs to .prettierrc.mjs in directory $subdir"
    fi
done
