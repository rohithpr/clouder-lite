import os

def get_trunc_path(name, len_strip):
    name = name[len_strip:]
    if name == '':
        name = os.sep
    parent = name.rsplit(os.sep, 1)[0]
    if parent == '':
        parent = os.sep
    return name, parent
