#!/usr/bin/env python3
"""Test script to debug ISP counting algorithm"""
import re

# Test cases from actual interfaces
test_cases = [
    {
        "name": "ReviewQueueParams",
        "lines": [
            "export interface ReviewQueueParams {",
            "  stage?: 'unreviewed' | 'in_progress' | 'complete';",
            "  venture?: 'SWS' | 'CRL' | 'ERA' | 'SAE' | 'Personal';",
            "  domain?: string;",
            "  limit?: number; // default: 50, max: 100",
            "  offset?: number; // default: 0",
            "  sort_by?: 'momentum_score' | 'created' | 'age_days';",
            "  order?: 'asc' | 'desc'; // default: 'desc'",
            "}"
        ],
        "expected": 7
    },
    {
        "name": "NoteFrontmatter",
        "lines": [
            "export interface NoteFrontmatter {",
            "  id: string;",
            "  title: string;",
            "  status: string;",
            "  venture: string;",
            "  domain: string;",
            "  tags: string[];",
            "  ai_summary: string;",
            "  momentum_score: number;",
            "  age_days: number;",
            "  aging_stage: string;",
            "  first_action?: string;",
            "  effort_estimate_min?: number;",
            "  resume_hint?: string;",
            "  completion_date?: string;",
            "  review_notes?: string;",
            "  follow_up_date?: string;",
            "  [key: string]: unknown; // Allow other frontmatter fields",
            "}"
        ],
        "expected": 17
    },
    {
        "name": "ReviewItem",
        "lines": [
            "export interface ReviewItem {",
            "  note_id: string;",
            "  title: string;",
            "  venture: string;",
            "  domain: string;",
            "  status: string;",
            "  age_days: number;",
            "  momentum_score: number;",
            "}"
        ],
        "expected": 7
    },
    {
        "name": "Pagination",
        "lines": [
            "export interface Pagination {",
            "  page: number;",
            "  page_size: number;",
            "  total_items: number;",
            "  total_pages: number;",
            "  has_next: boolean;",
            "  has_previous: boolean;",
            "}"
        ],
        "expected": 6
    }
]

def count_properties_old(lines):
    """Old algorithm - what we're currently using"""
    brace_count = 0
    method_count = 0
    
    for i, line in enumerate(lines):
        if i == 0:  # Interface declaration line
            brace_count = line.count('{') - line.count('}')
            continue
        
        brace_count += line.count('{') - line.count('}')
        
        stripped = line.strip()
        if (stripped and 
            not stripped.startswith('//') and 
            not stripped.startswith('/*') and 
            not stripped.startswith('*') and
            not stripped.startswith('}') and
            not stripped.startswith('[') and
            re.search(r'^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\??\s*:\s*.+[;,]\s*', line)):
            method_count += 1
        
        if brace_count < 0:
            break
    
    return method_count

def count_properties_new(lines):
    """New algorithm - improved counting"""
    brace_count = 0
    method_count = 0
    in_interface = False
    
    for i, line in enumerate(lines):
        # Check if this is the interface declaration
        if re.search(r'interface\s+\w+', line):
            brace_count = line.count('{') - line.count('}')
            in_interface = brace_count > 0
            continue
        
        if not in_interface:
            continue
        
        brace_count += line.count('{') - line.count('}')
        
        # Check if we've closed the interface
        if brace_count < 0:
            break
        
        # Skip empty lines, comments, closing braces
        stripped = line.strip()
        if not stripped or stripped == '}':
            continue
        
        # Skip comments
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            continue
        
        # Skip index signatures like [key: string]: unknown;
        if stripped.startswith('[') and ']:' in stripped:
            continue
        
        # Match property definition: identifier, optional ?, colon, type, semicolon/comma
        # Must have: word, optional ?, colon, type ending with ; or ,
        # Pattern: start of line, whitespace, identifier, optional ?, colon, type, semicolon/comma
        property_pattern = r'^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\??\s*:\s*.+[;,]\s*'
        if re.search(property_pattern, line):
            method_count += 1
    
    return method_count

# Run tests
print("Testing ISP counting algorithms:\n")
for test in test_cases:
    old_count = count_properties_old(test["lines"])
    new_count = count_properties_new(test["lines"])
    expected = test["expected"]
    
    print(f"Interface: {test['name']}")
    print(f"  Expected: {expected}")
    print(f"  Old algorithm: {old_count} {'✓' if old_count == expected else '✗'}")
    print(f"  New algorithm: {new_count} {'✓' if new_count == expected else '✗'}")
    print()

