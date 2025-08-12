import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import moondream as md
from PIL import Image
import io

load_dotenv()
MOONDREAM_API_KEY = os.getenv('MOONDREAM_API_KEY')

detect_bp = Blueprint('detect', __name__)

@detect_bp.route('/detect', methods=['POST'])
def detect_object():
    target = request.args.get('target')
    if not target:
        return jsonify({
            'found': False,
            'label': '',
            'confidence': 0.0,
            'bbox': [],
            'error': 'Missing target parameter.'
        }), 400
    # Use only the first definition if comma-separated
    target_first = target.split(',')[0].strip()
    if 'file' not in request.files:
        return jsonify({
            'found': False,
            'label': '',
            'confidence': 0.0,
            'bbox': [],
            'error': 'Missing image file.'
        }), 400
    image_file = request.files['file']
    try:
        # Read image file into PIL Image
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        # Use Moondream SDK for detection
        model = md.vl(api_key=MOONDREAM_API_KEY)
        result = model.detect(image, target_first)
        objects = result.get('objects', [])
        if objects:
            obj = objects[0]
            x_min = obj.get('x_min', 0)
            y_min = obj.get('y_min', 0)
            x_max = obj.get('x_max', 0)
            y_max = obj.get('y_max', 0)
            bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
            return jsonify({
                'found': True,
                'label': target_first,
                'confidence': 1.0,
                'bbox': bbox,
                'error': ''
            })
        else:
            return jsonify({
                'found': False,
                'label': target_first,
                'confidence': 0.0,
                'bbox': [],
                'error': f'Object "{target_first}" not found.'
            })
    except Exception as e:
        import traceback
        print("Error in /detect endpoint:", str(e))
        traceback.print_exc()
        return jsonify({
            'found': False,
            'label': '',
            'confidence': 0.0,
            'bbox': [],
            'error': str(e)
        }), 500
        # Parse response
        objects = result.get('objects', [])
        if objects:
            obj = objects[0]
            # Convert normalized box to [x, y, w, h]
            x_min = obj.get('x_min', 0)
            y_min = obj.get('y_min', 0)
            x_max = obj.get('x_max', 0)
            y_max = obj.get('y_max', 0)
            bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
            return jsonify({
                'found': True,
                'label': target,
                'confidence': 1.0,
                'bbox': bbox,
                'error': ''
            })
        else:
            return jsonify({
                'found': False,
                'label': target,
                'confidence': 0.0,
                'bbox': [],
                'error': f'Object "{target}" not found.'
            })
    except Exception as e:
        import traceback
        print("Error in /detect endpoint:", str(e))
        traceback.print_exc()
        if hasattr(e, 'response') and e.response is not None:
            print("Response content:", getattr(e.response, 'content', None))
        return jsonify({
            'found': False,
            'label': '',
            'confidence': 0.0,
            'bbox': [],
            'error': str(e)
        }), 500
