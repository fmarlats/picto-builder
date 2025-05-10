#!/usr/bin/env python3
"""
Script to add unique contiguous IDs to each element in the pictos_list.json file.
"""

import json
import os

def add_ids_to_pictos(input_file, output_file=None):
    """
    Add a unique contiguous ID to each element in the JSON list.
    
    Args:
        input_file (str): Path to the input JSON file
        output_file (str, optional): Path to the output JSON file. If None, will overwrite the input file.
    
    Returns:
        int: Number of elements processed
    """
    # If output_file is not specified, overwrite the input file
    if output_file is None:
        output_file = input_file
    
    # Read the JSON file
    with open(input_file, 'r', encoding='utf-8') as f:
        pictos = json.load(f)
    
    # Check if it's a list
    if not isinstance(pictos, list):
        raise ValueError("The JSON file does not contain a list at the root level")
    
    # Add IDs to each element
    for i, picto in enumerate(pictos):
        picto['id'] = i + 1  # Start IDs from 1
    
    # Write the updated JSON back to file with proper formatting
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(pictos, f, indent=2, ensure_ascii=False)
    
    return len(pictos)

def main():
    # Define file paths
    input_file = 'src/assets/pictos_list.json'
    
    # Check if the input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return 1
    
    try:
        # Process the file
        count = add_ids_to_pictos(input_file)
        print(f"Successfully added IDs to {count} pictos in '{input_file}'.")
        return 0
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())
