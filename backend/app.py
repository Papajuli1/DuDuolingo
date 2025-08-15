from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/data/videos/<filename>')
def serve_video(filename):
    return send_from_directory('data/videos', filename)