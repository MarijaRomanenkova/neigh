#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p documentation/architecture/images

# Function to generate diagram
generate_diagram() {
    local input_file=$1
    local output_file=$2
    local diagram_number=$3

    # Extract the Mermaid diagram from the markdown file
    awk -v diagram_number=$diagram_number '
        BEGIN { count = 0; in_diagram = 0; }
        /```mermaid/ { count++; if (count == diagram_number) in_diagram = 1; next; }
        /```/ { if (in_diagram) in_diagram = 0; next; }
        in_diagram { print; }
    ' "$input_file" > temp.mmd

    # Generate the image
    mmdc -i temp.mmd -o "$output_file"

    echo "Generated $output_file"
}

# Generate all diagrams
generate_diagram "documentation/architecture/c4-model.md" "documentation/architecture/images/system-context.png" 1
generate_diagram "documentation/architecture/c4-model.md" "documentation/architecture/images/container.png" 2
generate_diagram "documentation/architecture/c4-model.md" "documentation/architecture/images/component.png" 3
generate_diagram "documentation/architecture/c4-model.md" "documentation/architecture/images/code.png" 4

# Clean up
rm temp.mmd

echo "All diagrams generated in documentation/architecture/images/" 
