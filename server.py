from flask import Flask, request, jsonify, redirect, url_for, render_template, send_from_directory
from werkzeug import secure_filename
import os
from helpers import get_trunc_path
from random import random

CONTENT_FOLDER = os.getcwd() + '/content/'
LEN_CONTENT_FOLDER = len(CONTENT_FOLDER) - 1
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = CONTENT_FOLDER

@app.route('/c/<path:filename>')
def file_transfer(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)


@app.route('/api/get_tree/<path:name>')
def api(name):
    if name == 'root':
        path = app.config['UPLOAD_FOLDER']
    else:
        path = os.path.join(app.config['UPLOAD_FOLDER'], name)
    if path[-1] == '/':
        path = path[:-1]
    tree = {}
    for (dirpath, directories, files) in os.walk(path):
        print('a')
        name, parent = get_trunc_path(dirpath, LEN_CONTENT_FOLDER)
        print('b')
        tree[name] = {
            'directories': directories,
            'files': files,
            'clean': True,
            'parent': parent,
        }
    return jsonify(tree)

def is_allowed_file(filename):
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

@app.route('/content', methods=['GET', 'POST'])
def content_file():
    if request.method == 'POST':
        files = request.files.getlist('files')
        filenames = [_ for _ in os.listdir('./contents')]
        for file in files:
            if file and is_allowed_file(file.filename):
                filename = get_name(file.filename, filenames)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True)
