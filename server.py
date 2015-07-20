from flask import Flask, request, jsonify, redirect, url_for, render_template
from werkzeug import secure_filename
import os
from random import random

UPLOAD_FOLDER = os.getcwd() + '/uploads/'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return True # Allow all files?
    # return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def get_name(filename, existing):
    filename = secure_filename(filename)
    new_name = filename
    while new_name in existing:
        new_name = filename
        padding = ' - ' +  str(int(random()*100000))
        if '.' in new_name:
            parts = new_name.split('.')
            parts[-2] += padding
            new_name = '.'.join(parts)
        else:
            new_name += padding
    existing.append(new_name)
    return new_name

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        files = request.files.getlist('files')
        filenames = [_ for _ in os.listdir('./uploads')]
        for file in files:
            if file and allowed_file(file.filename):
                filename = get_name(file.filename, filenames)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True)
