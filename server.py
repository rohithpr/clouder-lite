from flask import Flask, request, jsonify, redirect, url_for, render_template, send_from_directory


import html
import helpers
import os
import shutil
import sys
mynode = ""
config = helpers.get_config(sys.argv)               # Load settings from config.py

CONTENT_FOLDER = config['app']['content_folder']    # The folder where UL/DL happen
LEN_CONTENT_FOLDER = len(CONTENT_FOLDER) - 1

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = CONTENT_FOLDER        # Tell flask that this is where all uploads are supposed to go

@app.route('/dl/<path:filename>') # Legacy support, remove this in the future
@app.route('/download_file/<path:filename>')
def download_file(filename):
    """
    Used for downloading files to client
    """
    filename = html.unescape(filename)              # Convert HTML sequences to their characters &amp; -> &
    return send_from_directory(CONTENT_FOLDER, filename, as_attachment=True) # Send file to client

@app.route('/download_directory/<path:dirname>')
def download_directory(dirname):
    """
    Used for downloading entire directories
    """
    dirname = html.unescape(dirname)
    if dirname[-1] == '/':
        end_name = dirname.split('/')[-2]
    elif '/' in dirname:
        end_name = dirname.split('/')[-1]
    else:
        end_name = dirname
    dirname = os.path.join(CONTENT_FOLDER, dirname)
    output_name = 'static/zip/' + end_name
    shutil.make_archive(output_name, 'zip', dirname)
    return send_from_directory('static/zip/', end_name + '.zip', as_attachment=True)

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
def show_upload_form(path):
    """
    Serve a form to test file uploads.
    """
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_handler():
    """
    End point to upload files. Upload files asynchronously.
    """
    path = request.form.get('path') or ''
    if request.method == 'POST':
        files = request.files.getlist('files')
        filenames = [_ for _ in os.listdir(os.path.join(CONTENT_FOLDER, path ))]
        for file in files:
            if file and helpers.is_allowed_file(file.filename):
                filename = helpers.get_name(file.filename, filenames)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], path, filename))
    return jsonify({'status': 'success'})

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
