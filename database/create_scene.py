import sys
import os
import csv
import pandas as pd
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

def get_api_key():
    """Get API key from environment variables"""
    return os.getenv('OPENROUTER_API_KEY')

def create_scene_with_words(group_id, csv_file_path="word_groups.csv"):
    """
    Create a scene using AI with words from a specific group in the CSV file
    and update the CSV with the generated scene

    Args:
        group_id (int): The group ID from the CSV file
        csv_file_path (str): Path to the CSV file
        
    Returns:
        dict: Contains the generated scene and success status
    """
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)
        
        # Find the specific group
        group_row = df[df['group_id'] == group_id]
        if group_row.empty:
            return {"error": f"Group ID {group_id} not found in CSV"}
        
        # Get the first matching row
        row = group_row.iloc[0]
        
        # Extract words and definitions - only "Good" words (words 1-4)
        word_pairs = []
        for i in range(1, 9):
            word_col = f'word{i}'
            def_col = f'definition{i}'
            type_col = f'type{i}'
            
            if (pd.notna(row[word_col]) and row[word_col].strip() and 
                pd.notna(row[type_col]) and row[type_col] == "Good"):
                word_pairs.append((row[word_col], row[def_col]))
        
        if not word_pairs:
            return {"error": f"No 'Good' words found for group {group_id}"}
        
        # Prepare translations for AI prompt
        translations = [pair[1] for pair in word_pairs]
        words_only = ", ".join(translations)
        
        # Get API key
        api_key = get_api_key()
        if not api_key:
            return {"error": "OPENROUTER_API_KEY not found in .env file"}
        
        # Create prompt using English translations
        prompt = f"""Create a MidJourney image prompt using the following English words: {words_only}.

Instructions:
- Imagine a fun, positive, and coherent scene that includes ALL the words, in a way that's visually interpretable.
- Use nouns and verbs (e.g., "cat", "rain") as actual elements in the image.
- For difficult/abstract words (e.g., "are", "his", "you're"), include them as **text elements** in the scene (e.g., signs, tattoos, posters, book pages, speech bubbles, etc.).
- The scene can be surreal, cartoon-like, or realistic, but should always be coherent and suitable for a visual image.
- Format the output as a **single descriptive sentence**, suitable as a MidJourney prompt.
- Avoid excessive explanation — just write the final prompt.
"""
        
        # Send request to OpenRouter
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "DuDuolingo"
            },
            json={
                "model": "moonshotai/kimi-k2:free",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 150,
                "temperature": 0.7
            }
        )
        
        if response.status_code == 200:
            ai_scene = response.json()["choices"][0]["message"]["content"].strip()
            
            # Update the CSV with the generated scene
            df.loc[df['group_id'] == group_id, 'scene'] = ai_scene
            
            # Save the updated CSV
            df.to_csv(csv_file_path, index=False, encoding='utf-8')
            
            # Format output
            word_translations = [f"{word} ({translation})" for word, translation in word_pairs]
            words_list = ", ".join(word_translations)
            
            return {
                "success": True,
                "group_id": group_id,
                "language": row['language'],
                "level": row['level'],
                "group_number": row['group_number'],
                "words": words_list,
                "scene": ai_scene,
                "updated_csv": True
            }
        else:
            return {"error": f"API request failed with status {response.status_code}. Response: {response.text}"}
    
    except Exception as e:
        return {"error": f"Error processing group {group_id}: {str(e)}"}

if __name__ == "__main__":
    # Process the first 15 groups
    print("Processing first 10 groups for scene generation...")
    
    successful_groups = []
    failed_groups = []
    
    for group_id in range(1, 11):
        print(f"\nProcessing Group {group_id}...")
        result = create_scene_with_words(group_id)
        
        if "error" in result:
            print(f"Error for Group {group_id}: {result['error']}")
            failed_groups.append(group_id)
        else:
            print(f"✓ Generated scene for Group {result['group_id']}")
            print(f"  Language: {result['language']}, Level: {result['level']}")
            print(f"  Words: {result['words']}")
            print(f"  Scene: {result['scene'][:100]}...")  # Show first 100 chars
            successful_groups.append(group_id)
    
    # Summary
    print(f"\n{'='*50}")
    print(f"SUMMARY:")
    print(f"Successfully processed: {len(successful_groups)} groups")
    print(f"Failed: {len(failed_groups)} groups")
    if failed_groups:
        print(f"Failed group IDs: {failed_groups}")
    print(f"{'='*50}")
