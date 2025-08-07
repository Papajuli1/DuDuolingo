import sys
import os
import csv
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db_helper import get_connection

def get_word_groups_exact(language, level, groups_count, words_per_group=5):
    """
    Get exact number of word groups from the database
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get all words for this language and level
    cursor.execute('''
        SELECT word, definition FROM word 
        WHERE word_language = ? AND level = ?
        ORDER BY RANDOM()
    ''', (language, level))
    
    all_words = cursor.fetchall()
    conn.close()
    
    needed_words = groups_count * words_per_group
    
    if len(all_words) < needed_words:
        print(f"Warning: {language} level {level} has only {len(all_words)} words, need {needed_words}")
        # Cycle through words if we don't have enough
        extended_words = []
        while len(extended_words) < needed_words:
            extended_words.extend(all_words)
        all_words = extended_words[:needed_words]
    else:
        all_words = all_words[:needed_words]
    
    # Create groups
    groups = []
    for i in range(groups_count):
        start_idx = i * words_per_group
        end_idx = start_idx + words_per_group
        group = all_words[start_idx:end_idx]
        groups.append(group)
    
    return groups

def create_word_groups():
    """
    Create all word groups as specified:
    - Spanish: 15 groups from each level 1-15 (225 groups)
    - German: 15 groups from each level 1-5 (75 groups)
    Total: 300 groups
    """
    all_groups = []
    
    # Spanish levels 1-15 (15 groups each)
    print("Generating Spanish word groups...")
    for level in range(1, 16):
        print(f"  Processing Spanish level {level}")
        groups = get_word_groups_exact("Spanish", level, 15, 5)
        for group_num, group in enumerate(groups, 1):
            group_data = {
                'language': 'Spanish',
                'level': level,
                'group_number': group_num,
                'words': group
            }
            all_groups.append(group_data)
    
    # German levels 1-5 (15 groups each)
    print("Generating German word groups...")
    for level in range(1, 6):
        print(f"  Processing German level {level}")
        groups = get_word_groups_exact("German", level, 15, 5)
        for group_num, group in enumerate(groups, 1):
            group_data = {
                'language': 'German',
                'level': level,
                'group_number': group_num,
                'words': group
            }
            all_groups.append(group_data)
    
    return all_groups

def save_groups_to_csv(groups, filename):
    """Save word groups to CSV file"""
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'group_id', 'language', 'level', 'group_number',
            'word1', 'definition1',
            'word2', 'definition2', 
            'word3', 'definition3',
            'word4', 'definition4',
            'word5', 'definition5',
            'scene', 'image'
        ]
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for idx, group in enumerate(groups, 1):
            row = {
                'group_id': idx,
                'language': group['language'],
                'level': group['level'],
                'group_number': group['group_number']
            }
            
            # Add words and definitions (pad with empty if less than 5 words)
            for i in range(1, 6):
                if i <= len(group['words']):
                    word, definition = group['words'][i-1]
                    row[f'word{i}'] = word
                    row[f'definition{i}'] = definition
                else:
                    row[f'word{i}'] = ''
                    row[f'definition{i}'] = ''
            
            # Add new columns as null/empty for now
            row['scene'] = ''
            row['image'] = ''
            
            writer.writerow(row)

if __name__ == "__main__":
    print("Creating all word groups...")
    print("Spanish: 15 groups per level for levels 1-15 (225 groups)")
    print("German: 15 groups per level for levels 1-5 (75 groups)")
    print("Expected total: 300 groups")

    groups = create_word_groups()
    print(f"\nGenerated {len(groups)} word groups")
    
    # Save to CSV
    output_file = "word_groups.csv"
    save_groups_to_csv(groups, output_file)
    
    print(f"Word groups saved to {output_file}")
    
    # Print detailed summary
    spanish_groups = [g for g in groups if g['language'] == 'Spanish']
    german_groups = [g for g in groups if g['language'] == 'German']
    
    print(f"\nDetailed Summary:")
    print(f"Spanish groups: {len(spanish_groups)}")
    if spanish_groups:
        spanish_levels = set(g['level'] for g in spanish_groups)
        print(f"  Levels: {sorted(spanish_levels)}")
        print(f"  Expected: 225 groups (15 × 15 levels)")
    
    print(f"German groups: {len(german_groups)}")
    if german_groups:
        german_levels = set(g['level'] for g in german_groups)
        print(f"  Levels: {sorted(german_levels)}")
        print(f"  Expected: 75 groups (15 × 5 levels)")
    
    print(f"Total groups: {len(groups)}")
    print(f"German groups: {len(german_groups)}")
    if german_groups:
        german_levels = set(g['level'] for g in german_groups)
        print(f"  Levels: {sorted(german_levels)}")
    
    print(f"Total groups: {len(groups)}")
