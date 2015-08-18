from flask import Flask, request, jsonify, redirect, url_for, render_template, send_from_directory

import html
import helpers
import os
import sys

config = helpers.get_config(sys.argv)

CONTENT_FOLDER = config['app']['content_folder']
LEN_CONTENT_FOLDER = len(CONTENT_FOLDER) - 1

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = CONTENT_FOLDER

@app.route('/dl/<path:filename>') # Legacy support, remove this in the future
@app.route('/download/<path:filename>')
def file_transfer(filename):
    """
    Used for downloading files to client
    """
    filename = html.unescape(filename)
    return send_from_directory(CONTENT_FOLDER, filename, as_attachment=True)

@app.route('/api/get_tree/<path:name>')
def api(name):
    """
    Returns the tree of the CONTENT_FOLDER
    """
    if name == 'root':
        path = app.config['UPLOAD_FOLDER']
    else:
        path = os.path.join(app.config['UPLOAD_FOLDER'], name)
    if path[-1] == os.sep:
        path = path[:-1]
    tree = {}
    for (dirpath, directories, files) in os.walk(path):
        dirpath = helpers.convert_to_web_slashes(dirpath)
        name, parent = helpers.get_trunc_path(dirpath, LEN_CONTENT_FOLDER)
        tree[name] = {
            'directories': directories,
            'files': files,
            'clean': True,
            'parent': parent,
        }
    if '.do-not-delete-this-file' in tree['/']['files']:
        tree['/']['files'].remove('.do-not-delete-this-file')
    return jsonify(tree)

@app.route('/c/<path:path>', methods=['GET', 'POST']) # Legacy support, remove this in the future
@app.route('/upload/<path:path>', methods=['GET', 'POST'])
def content_file(path):
    """
    Used for uploading files
    """
    path = helpers.convert_to_os_slashes(path)
    if request.method == 'POST':
        files = request.files.getlist('files')
        filenames = [_ for _ in os.listdir(os.path.join('.', 'content', path ))]
        for file in files:
            if file and helpers.is_allowed_file(file.filename):
                filename = helpers.get_name(file.filename, filenames)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], path, filename))
    return render_template('index.html')

@app.route('/', defaults = {'path': '/'})
@app.route('/<path:path>')
def home(path):
    """
    The homepage
    """
    if path[-1] == '/':
        path = path[:-1]
    if path != '/':
        path = '/' + path
    context = {
        'initial': path,
    }
    return render_template('home.html', **context)

if __name__ == '__main__':
    app.run(**config['flask'])
