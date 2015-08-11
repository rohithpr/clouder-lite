from flask import Flask, request, jsonify, redirect, url_for, render_template, send_from_directory
import os
import helpers
from random import random

CONTENT_FOLDER = os.getcwd() + '/content/'
LEN_CONTENT_FOLDER = len(CONTENT_FOLDER) - 1

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = CONTENT_FOLDER


@app.route('/dl/<path:filename>')
def file_transfer(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route('/api/get_tree/<path:name>')
def api(name):
    if name == 'root':
        path = app.config['UPLOAD_FOLDER']
    else:
        path = os.path.join(app.config['UPLOAD_FOLDER'], name)
    if path[-1] == os.sep:
        path = path[:-1]
    tree = {}
    for (dirpath, directories, files) in os.walk(path):
        name, parent = helpers.get_trunc_path(dirpath, LEN_CONTENT_FOLDER)
        tree[name] = {
            'directories': directories,
            'files': files,
            'clean': True,
            'parent': parent,
        }
    tree[os.sep]['files'].remove('.do-not-delete-this-file')
    return jsonify(tree)

@app.route('/c/<path:path>', methods=['GET', 'POST'])
def content_file(path):
    if request.method == 'POST':
        files = request.files.getlist('files')
        filenames = [_ for _ in os.listdir('./content')]
        for file in files:
            if file and helpers.is_allowed_file(file.filename):
                filename = helpers.get_name(file.filename, filenames)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return render_template('index.html')

@app.route('/', defaults = {'path': '/'})
@app.route('/<path:path>')
def home(path):
    if path[-1] == '/':
        path = path[:-1]
    if path != '/':
        path = '/' + path
    context = {
        'initial': path,
    }
    return render_template('home.html', **context)

if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True, debug=True)
