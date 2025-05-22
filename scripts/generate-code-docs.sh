#!/bin/bash

# Create output directory
mkdir -p documentation/presentation/code-images

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
            line-height: 1.6;
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
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 0;
            border: 1px solid #eee;
        }
        code {
            color: #333;
            font-size: 14px;
        }
        .keyword { color: #0033b3; }
        .string { color: #008000; }
        .comment { color: #808080; }
        .type { color: #0033b3; }
        .function { color: #6f42c1; }
        .number { color: #098658; }
        .explanation {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #0033b3;
        }
        .explanation h2 {
            margin-top: 0;
            color: #333;
            font-size: 1.2em;
        }
        .explanation ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .explanation li {
            margin: 5px 0;
        }
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

# Function to extract code and explanation from markdown
extract_code_and_explanation() {
    local markdown_file=$1
    local section_number=$2
    local title=$3

    # Extract code block
    local code=$(awk -v section="$section_number" '
        /^## '"$section"'\./ { p=1; next }
        /^## / { if(p) exit }
        p && /^```typescript$/ { code=1; next }
        p && /^```$/ { code=0; next }
        p && code { print }
    ' "$markdown_file")

    # Extract explanation
    local explanation=$(awk -v section="$section_number" '
        /^## '"$section"'\./ { p=1; next }
        /^## / { if(p) exit }
        p && !/^```/ { print }
    ' "$markdown_file")

    # Create HTML file
    local output_file="documentation/presentation/code-images/${section_number}-${title// /-}.html"
    create_code_html "$title" "$code" "$output_file"
    echo "Generated $output_file"
}

# Generate HTML files for each code example
extract_code_and_explanation "documentation/presentation/code-examples.md" "1" "Data Structure - Task Type"
extract_code_and_explanation "documentation/presentation/code-examples.md" "2" "Real-time Communication - Socket Implementation"
extract_code_and_explanation "documentation/presentation/code-examples.md" "3" "Form Processing - Task Creation"
extract_code_and_explanation "documentation/presentation/code-examples.md" "4" "Authentication Flow - Protected Route"
extract_code_and_explanation "documentation/presentation/code-examples.md" "5" "API Route - Task Search"
extract_code_and_explanation "documentation/presentation/code-examples.md" "6" "Testing - Task Component Test"
extract_code_and_explanation "documentation/presentation/code-examples.md" "7" "Documentation - Component Documentation"
extract_code_and_explanation "documentation/presentation/code-examples.md" "8" "Database Filtering and Sorting"

echo "All code HTML files generated in documentation/presentation/code-images/" 
