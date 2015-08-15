from werkzeug import secure_filename
import os

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4'])

def get_trunc_path(name, len_strip):
    name = name[len_strip:]
    if name == '':
        name = os.sep
    parent = name.rsplit(os.sep, 1)[0]
    if parent == '':
        parent = os.sep
    return name, parent

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

def convert_to_forward_slashes(string):
    return '/'.join(string.split('\\'))

def convert_to_backward_slashes():
    return '\\'.join(string.split('/'))
