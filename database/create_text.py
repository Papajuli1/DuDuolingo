import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db_helper import get_connection, create_level_entry
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

def get_api_key():
    """Get API key from environment variables"""
    return os.getenv('OPENROUTER_API_KEY')

def create_text(language, level, num_words):
    """
    Create a text string with words from specified language and level
    
    Args:
        language (str): The language of words to retrieve
        level (int): The level of words to retrieve
        num_words (int): Number of words to include
        
    Returns:
        str: Formatted string "words- word1, word2, ..."
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT word FROM word 
        WHERE word_language = ? AND level = ?
        ORDER BY RANDOM()
        LIMIT ?
    ''', (language, level, num_words))
    
    words = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    if not words:
        return f"words- (no words found for {language} level {level})"
    
    word_list = ", ".join(words)
    return f"words- {word_list}"

def create_text_range(language, level_start, level_end, num_words):
    """
    Create a text string with words from specified language and level range
    
    Args:
        language (str): The language of words to retrieve
        level_start (int): Starting level
        level_end (int): Ending level
        num_words (int): Number of words to include
        
    Returns:
        str: Formatted string "words- word1, word2, ..."
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT word FROM word 
        WHERE word_language = ? AND level BETWEEN ? AND ?
        ORDER BY RANDOM()
        LIMIT ?
    ''', (language, level_start, level_end, num_words))
    
    words = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    if not words:
        return f"words- (no words found for {language} levels {level_start}-{level_end})"
    
    word_list = ", ".join(words)
    return f"words- {word_list}"

def create_sentence_with_words(language, level, num_words):
    """
    Create a sentence using AI with words from specified language and level
    
    Args:
        language (str): The language of words to retrieve
        level (int): The level of words to retrieve
        num_words (int): Number of words to include
        
    Returns:
        str: AI-generated sentence using the words along with translations
    """
    # Get the words with their translations
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT word, definition FROM word 
        WHERE word_language = ? AND level = ?
        ORDER BY RANDOM()
        LIMIT ?
    ''', (language, level, num_words))
    
    word_pairs = cursor.fetchall()
    conn.close()
    
    if not word_pairs:
        return f"Error: No words found for {language} level {level}"
    
    # Prepare word list and translations
    words = [pair[0] for pair in word_pairs]
    translations = [pair[1] for pair in word_pairs]
    words_only = ", ".join(translations)  # Use English translations for AI prompt
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        return "Error: OPENROUTER_API_KEY not found in .env file"
    
    try:
        # Create prompt using English translations
        prompt = f"""Input: A list of English words describing objects, actions, or concepts.
Task: Create a single, vivid sentence that describes a realistic or surreal scene, using ALL of the provided words in a clear and obvious way. The sentence should be suitable as a description for generating an image. Make sure the scene is coherent, visually interpretable, positive, and fun - like something from an enjoyable game or adventure. IMPORTANT: Try to include every single word from the list in a way that makes sense and is clearly visible in the scene.

Output format: A single sentence describing a positive, fun visual scene that includes all the words.

Example:
Words: dog, umbrella, rain, street
Sentence: A cheerful dog walks happily on a sunny street after the rain, playfully carrying a bright red umbrella in its mouth while splashing through colorful puddles.

Now try to include ALL these words clearly:
Words: {words_only}"""
        
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
            ai_sentence = response.json()["choices"][0]["message"]["content"].strip()
            
            # Format output with original words and translations
            word_translations = [f"{word} ({translation})" for word, translation in word_pairs]
            words_list = ", ".join(word_translations)
            
            return f"Words: {words_list}\n\nAI-generated scene: {ai_sentence}"
        else:
            return f"Error: API request failed with status {response.status_code}. Response: {response.text}"
    
    except Exception as e:
        return f"Error calling AI API: {str(e)}"

def create_sentence_with_words_range(language, level_start, level_end, num_words):
    """
    Create a sentence using AI with words from specified language and level range
    
    Args:
        language (str): The language of words to retrieve
        level_start (int): Starting level
        level_end (int): Ending level
        num_words (int): Number of words to include
        
    Returns:
        str: AI-generated sentence using the words along with translations
    """
    # Get the words with their translations
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT word, definition FROM word 
        WHERE word_language = ? AND level BETWEEN ? AND ?
        ORDER BY RANDOM()
        LIMIT ?
    ''', (language, level_start, level_end, num_words))
    
    word_pairs = cursor.fetchall()
    conn.close()
    
    if not word_pairs:
        return f"Error: No words found for {language} levels {level_start}-{level_end}"
    
    # Prepare word list and translations
    words = [pair[0] for pair in word_pairs]
    translations = [pair[1] for pair in word_pairs]
    words_only = ", ".join(translations)  # Use English translations for AI prompt
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        return "Error: OPENROUTER_API_KEY not found in .env file"
    
    try:
        # Create prompt using English translations
        prompt = f"""Input: A list of English words describing objects, actions, or concepts.
Task: Create a single, vivid sentence that describes a realistic or surreal scene, using ALL of the provided words in a clear and obvious way. The sentence should be suitable as a description for generating an image. Make sure the scene is coherent, visually interpretable, positive, and fun - like something from an enjoyable game or adventure. IMPORTANT: Try to include every single word from the list in a way that makes sense and is clearly visible in the scene.

Output format: A single sentence describing a positive, fun visual scene that includes all the words.

Example:
Words: dog, umbrella, rain, street
Sentence: A cheerful dog walks happily on a sunny street after the rain, playfully carrying a bright red umbrella in its mouth while splashing through colorful puddles.

Now try to include ALL these words clearly:
Words: {words_only}"""
        
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
            ai_sentence = response.json()["choices"][0]["message"]["content"].strip()
            
            # Format output with original words and translations
            word_translations = [f"{word} ({translation})" for word, translation in word_pairs]
            words_list = ", ".join(word_translations)
            
            return f"Words: {words_list}\n\nAI-generated scene: {ai_sentence}"
        else:
            return f"Error: API request failed with status {response.status_code}. Response: {response.text}"
    
    except Exception as e:
        return f"Error calling AI API: {str(e)}"

def save_level_prompt(language, level, sentence_prompt, word_pairs, image_path=None):
    """Save the generated prompt to the levels table"""
    # Convert word pairs to word IDs
    conn = get_connection()
    cursor = conn.cursor()
    
    word_ids = []
    for word, translation in word_pairs:
        cursor.execute('SELECT id FROM word WHERE word = ? AND definition = ?', (word, translation))
        word_id = cursor.fetchone()
        if word_id:
            word_ids.append(str(word_id[0]))
    
    conn.close()
    
    # Join word IDs as comma-separated string
    word_ids_str = ",".join(word_ids)
    
    # Create level entry
    level_id = create_level_entry(language, level, sentence_prompt, word_ids_str, image_path)
    return level_id

def create_and_save_sentence(language, level, num_words, save_to_db=True):
    """
    Create a sentence and optionally save it to the database
    
    Args:
        language (str): The language of words to retrieve
        level (int): The level of words to retrieve
        num_words (int): Number of words to include
        save_to_db (bool): Whether to save the result to the database
        
    Returns:
        dict: Contains the generated sentence and level_id if saved
    """
    # Get the words with their translations
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT word, definition FROM word 
        WHERE word_language = ? AND level = ?
        ORDER BY RANDOM()
        LIMIT ?
    ''', (language, level, num_words))
    
    word_pairs = cursor.fetchall()
    conn.close()
    
    if not word_pairs:
        return {"error": f"No words found for {language} level {level}"}
    
    # Prepare word list and translations
    translations = [pair[1] for pair in word_pairs]
    words_only = ", ".join(translations)  # Use English translations for AI prompt
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        return {"error": "OPENROUTER_API_KEY not found in .env file"}
    
    try:
        # Create prompt using English translations
        prompt = f"""Input: A list of English words describing objects, actions, or concepts.
Task: Create a single, vivid sentence that describes a realistic or surreal scene, using ALL of the provided words in a clear and obvious way. The sentence should be suitable as a description for generating an image. Make sure the scene is coherent, visually interpretable, positive, and fun - like something from an enjoyable game or adventure. IMPORTANT: Try to include every single word from the list in a way that makes sense and is clearly visible in the scene.

Output format: A single sentence describing a positive, fun visual scene that includes all the words.

Example:
Words: dog, umbrella, rain, street
Sentence: A cheerful dog walks happily on a sunny street after the rain, playfully carrying a bright red umbrella in its mouth while splashing through colorful puddles.

Now try to include ALL these words clearly:
Words: {words_only}"""
        
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
            ai_sentence = response.json()["choices"][0]["message"]["content"].strip()
            
            result = {
                "words": word_pairs,
                "sentence": ai_sentence,
                "translations": words_only
            }
            
            # Save to database if requested
            if save_to_db:
                # Look for image file in data/images directory
                image_filename = f"{language.lower()}-{level}.jpg"
                image_path = f"data/images/{image_filename}"
                
                level_id = save_level_prompt(language, level, ai_sentence, word_pairs, image_path)
                result["level_id"] = level_id
                result["saved_to_db"] = True
            
            return result
        else:
            return {"error": f"API request failed with status {response.status_code}. Response: {response.text}"}
    
    except Exception as e:
        return {"error": f"Error calling AI API: {str(e)}"}

if __name__ == "__main__":
    # Example usage
    print("Generated words:")
    print(create_text("Spanish", 1, 3))
    print(create_text("German", 1, 3))
    print(create_text_range("Spanish", 1, 2, 5))
    
    # print("\nAI-generated sentences:")
    # print(create_sentence_with_words("Spanish", 1, 3))
    # print(create_sentence_with_words("German", 1, 3))
    # print(create_sentence_with_words_range("Spanish", 1, 2, 5))
    
    # print("\nCreating and saving to database:")
    # result = create_and_save_sentence("Spanish", 1, 3, save_to_db=True)
    # print(json.dumps(result, indent=2, default=str))
    
    # print("\nCreating and saving to database:")
    # result = create_and_save_sentence("Spanish", 1, 3, save_to_db=True)
    #print(json.dumps(result, indent=2))
