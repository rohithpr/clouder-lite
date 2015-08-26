from random import random
from werkzeug import secure_filename

import config
import os
import zipfile

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4'])

def get_trunc_path(name, len_strip):
    """
    Returns the names of the file/folder and it's parent
    """
    name = name[len_strip:]
    if name == '':
        name = os.sep
    parent = name.rsplit(os.sep, 1)[0]
    if parent == '':
        parent = os.sep
    return name, parent

def is_allowed_file(filename):
    """
    Can be used to specify the file types that can be uploaded
    """
    return True # Allow all files?
    # return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def get_name(filename, existing):
    """
    Returns a processed name that is secure and doesn't cause any conflict
    """
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

def convert_to_forward_slashes(string):
    return '/'.join(string.split('\\'))

def convert_to_backward_slashes(string):
    return '\\'.join(string.split('/'))

def convert_to_os_slashes(string):
    """
    Converts separators to os.sep
    """
    if os.sep == '/':
        return string
        # return convert_to_forward_slashes(string)
    else:
        return convert_to_backward_slashes(string)

def convert_to_web_slashes(string):
    """
    Converts separators to /
    """
    if os.sep == '/':
        return string
    else:
        return convert_to_forward_slashes(string)

def get_config(args):
    """
    Loads configurations from config.py
    """
    if len(args) > 1:
        configuration = config.configurations[args[1]]
    else:
        configuration = config.configurations['default']
    return configuration

def create_zip_file(source, destination):
    zipf = zipfile.ZipFile(destination, 'w')
    for root, dirs, files in os.walk(source):
        for file in files:
            zipf.write(os.path.join(root, file))
    zipf.close()
