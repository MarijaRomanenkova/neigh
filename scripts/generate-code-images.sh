#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p documentation/presentation/images

# Function to extract code block from markdown
extract_code_block() {
    local input_file=$1
    local section=$2
    awk -v section="$section" '
        BEGIN { in_section = 0; in_code = 0; }
        /^## '"$section"'$/ { in_section = 1; next; }
        /^## / { if (in_section) in_section = 0; }
        in_section && /^```typescript$/ { in_code = 1; next; }
        in_section && /^```$/ { in_code = 0; }
        in_section && in_code { print; }
    ' "$input_file"
}

# Function to create HTML file with code
create_code_html() {
    local title=$1
    local code=$2
    local output_file=$3

    cat > "$output_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>$title</title>
    <style>
        body {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            background: #f8f9fa;
            padding: 20px;
            margin: 0;
        }
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            font-size: 1.5em;
            margin-bottom: 20px;
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 0;
        }
        code {
            color: #333;
        }
        .keyword { color: #0033b3; }
        .string { color: #008000; }
        .comment { color: #808080; }
        .type { color: #0033b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>$title</h1>
        <pre><code>$code</code></pre>
    </div>
</body>
</html>
EOF
}

# Function to generate code image
generate_code_image() {
    local input_file=$1
    local output_file=$2
    local title=$3
    local section=$4

    # Extract code
    local code=$(extract_code_block "$input_file" "$section")
    
    # Create HTML file
    local html_file="${output_file%.png}.html"
    create_code_html "$title" "$code" "$html_file"
    
    echo "Generated $html_file"
}

# Generate images for each code example
generate_code_image "documentation/presentation/code-examples.md" "documentation/presentation/images/data-structure.png" "Data Structure - Task Type" "1. Data Structure - Task Type"
generate_code_image "documentation/presentation/code-examples.md" "documentation/presentation/images/socket-implementation.png" "Real-time Communication - Socket Implementation" "2. Real-time Communication - Socket Implementation"
generate_code_image "documentation/presentation/code-examples.md" "documentation/presentation/images/form-processing.png" "Form Processing - Task Creation" "3. Form Processing - Task Creation"
generate_code_image "documentation/presentation/code-examples.md" "documentation/presentation/images/authentication.png" "Authentication Flow - Protected Route" "4. Authentication Flow - Protected Route"
generate_code_image "documentation/presentation/code-examples.md" "documentation/presentation/images/api-route.png" "API Route - Task Search" "5. API Route - Task Search"

echo "All code HTML files generated in documentation/presentation/images/" 
