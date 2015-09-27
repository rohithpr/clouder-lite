from flask import Flask, request, jsonify, redirect, url_for, render_template, send_from_directory
from werkzeug import secure_filename

import helpers
import html
import os
import sys
import time

CONFIGURATION = helpers.get_config(sys.argv)               # Load settings from config.py

CONTENT_FOLDER = CONFIGURATION['app']['content_folder']    # The folder where UL/DL happen
LEN_CONTENT_FOLDER = len(CONTENT_FOLDER) - 1

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = CONTENT_FOLDER        # Tell flask that this is where all uploads are supposed to go

@app.route('/dl/<path:filename>') # Legacy support, remove this in the future
@app.route('/download_file/<path:filename>') # Legacy support, remove this in the future
@app.route('/api/download_file/<path:filename>')
def download_file(filename):
    """
    Used for downloading files to client
    """
    filename = html.unescape(filename)              # Convert HTML sequences to their characters &amp; -> &
    return send_from_directory(CONTENT_FOLDER, filename, as_attachment=True) # Send file to client

@app.route('/download_directory/<path:dirname>') # Legacy support, remove this in the future
@app.route('/api/download_directory/<path:dirname>')
def download_directory(dirname):
    """
    Used for downloading entire directories
    """
    dirname = html.unescape(dirname)
    if dirname[-1] == '/':
        dirname = dirname[:-1]
    if '/' in dirname:
        end_name = dirname.split('/')[-1]
    else:
        end_name = dirname
    dirname = os.path.join(CONTENT_FOLDER, dirname)
    output_name = 'zip/' + end_name
    helpers.create_zip_file(dirname, output_name + '.zip')
    return send_from_directory(os.getcwd() + '/zip/', end_name + '.zip', as_attachment=True)

@app.route('/api/get_tree/', defaults = {'name': '/'})
@app.route('/api/get_tree/<path:name>')
def tree_api(name):
    """
    Returns the tree of the CONTENT_FOLDER
    """
    print('tree: ', name)
    if name == '/':
        path = app.config['UPLOAD_FOLDER']
    else:
        path = os.path.join(app.config['UPLOAD_FOLDER'], name)
    if path[-1] == os.sep:
        path = path[:-1]
    tree = {}
    for (dirpath, directories, files) in os.walk(path):
        dirpath = helpers.convert_to_web_slashes(dirpath)
        name, parent = helpers.get_trunc_path(dirpath, LEN_CONTENT_FOLDER)
        file_info = {}
        for file in files:
            filename = os.path.join(dirpath, file)
            stats = os.stat(filename)
            if '.' in filename:
                file_type = filename.rsplit('.', 1)[-1]
            else:
                file_type = ''
            file_info[file] = {
                    'mtime': time.ctime(stats.st_mtime),
                    'ctime': time.ctime(stats.st_ctime),
                    'size': stats.st_size / (1024 * 1024),
                    'file_type': file_type,
            }
        tree[name] = {
            'directories': directories,
            'files': files,
            'clean': True,
            'parent': parent,
            'file_info': file_info,
        }
    try:
        if '.do-not-delete-this-file' in tree['/']['files']:
            tree['/']['files'].remove('.do-not-delete-this-file')
            tree['/']['file_info'].pop('.do-not-delete-this-file')
    except:
        pass
    return jsonify(tree)

@app.route('/api/add_directory', methods=['POST'])
def add_directory():
    """
    End point to create a new directory.
    Name of the new directory and the directory under which it should be created
    must be sent via POST.
    Required arguments: parent, name
    """
    if request.method != 'POST':
        return helpers.generate_error('2')
    name = request.form.get('name')
    parent = request.form.get('parent')

    # Clean the names received from client
    name = secure_filename(name)
    parent = secure_filename(parent)
    parent = helpers.convert_to_os_slashes(parent)
    parent = os.path.join(CONTENT_FOLDER, parent)

    # Do not overwrite if directory exists
    if name in next(os.walk(parent))[1]:
        return helpers.generate_error('3', 'Directory of that name already exists.')
    name = os.path.join(parent, name)
    os.makedirs(name)
    return helpers.generate_error('0', 'Directory created.')

@app.route('/api/upload_files', methods=['POST'])
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
    return helpers.generate_error('0', 'Upload successful.')

@app.route('/', defaults = {'initial_path': ''})
@app.route('/<path:initial_path>')
def redirect_to_home(initial_path):
    """
    Redirect to the endpoint /nav/initial_path.
    """
    return redirect('/nav/' + initial_path)

@app.route('/nav/', defaults = {'initial_path': '/'})
@app.route('/nav/<path:initial_path>')
def home(initial_path):
    """
    The homepage.
    """
    if initial_path[-1] == '/':
        initial_path = initial_path[:-1]
    if initial_path != '/':
        initial_path = '/' + initial_path
    context = {
        'initial_path': initial_path,
    }
    homepage = CONFIGURATION['app']['theme'] + '/index.html'
    return render_template(homepage, **context)

if __name__ == '__main__':
    helpers.generate_qr_codes(CONFIGURATION)
    app.run(**CONFIGURATION['flask'])
