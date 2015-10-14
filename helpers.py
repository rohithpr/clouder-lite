from flask import jsonify
from errorcodes import errorcodes
from random import random
from werkzeug import secure_filename

import config
import netifaces
import os
import qrcode
import requests
import zipfile

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4'])

def get_trunc_path(name, len_strip):
    """ (str, int) -> str, str
    Returns the names of the file/folder and it's parent.
    """
    name = name[len_strip:]
    if name == '':
        name = os.sep
    parent = name.rsplit(os.sep, 1)[0]
    if parent == '':
        parent = os.sep
    return name, parent

def is_allowed_file(filename):
    """ (str) -> bool
    Can be used to specify the file types that can be uploaded.
    """
    return True # Allow all files?
    # return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def get_name(filename, existing):
    """ (str, list) -> str
    Returns a processed name that is secure and doesn't cause any conflict.
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
    """ (str) -> str
    Converts separators to os.sep.
    """
    if os.sep == '/':
        return string
        # return convert_to_forward_slashes(string)
    else:
        return convert_to_backward_slashes(string)

def convert_to_web_slashes(string):
    """ (str) -> str
    Converts separators to /.
    """
    if os.sep == '/':
        return string
    else:
        return convert_to_forward_slashes(string)

def get_config(args):
    """ (list) -> dict
    Loads configurations from config.py.
    """
    configuration = config.configurations['default']
    if len(args) > 1:
        user_specified = config.configurations[args[1]]
        configuration['app'].update(user_specified['app'])
        configuration['flask'].update(user_specified['flask'])
    return configuration

def create_zip_file(source, destination):
    """ (str, str) -> None
    Creates a zipfile of the required directory in the specified destination.
    """
    zipf = zipfile.ZipFile(destination, 'w')
    for root, dirs, files in os.walk(source):
        for file in files:
            zipf.write(os.path.join(root, file))
    zipf.close()

def generate_error(code, comment=''):
    """ (int [, str]) -> str
    Generates a JSON with information about the error so that it can be conveyed to the client.
    """
    try:
        data = {
            'error_code': code,
            'error': errorcodes[code],
            'comment': comment,
        }
    except:
        data = generate_error('1', 'Invalid error code specified.')
    return jsonify(data)

def generate_qr_code_image(data, path, format):
    """ (str, str, str) -> None
    Generates a QR code.
    """
    qr = qrcode.QRCode()
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image()
    img.save(path, format)

def generate_qr_code_external(config):
    """ (dict) -> None
    Finds out the IP address (external) of the server and generates a QR code.
    """
    try:
        address = requests.get('http://my-ip.herokuapp.com/').json()['ip']
        address = 'http://' + address + ':' + str(config['flask']['port'])
        generate_qr_code_image(address, 'static/default/img/external_address.png', 'png')
    except:
        print('Failed to generate QR Code for external address')

def generate_qr_code_internal(config):
    """ (dict) -> None
    Finds out the IP address (internal) of the server and generates a QR code.
    """
    try:
        interface = config['app']['interface']
        address = 'http://' + netifaces.ifaddresses(interface)[2][0]['addr'] + ':' + str(config['flask']['port'])
        generate_qr_code_image(address, 'static/default/img/internal_address.png', 'png')
    except:
        print('Failed to generate QR Code for internal address')

def generate_qr_codes(config):
    """ (dict) -> None
    Generates the required QR codes.
    """
    if config['app']['qr_code_external']:
        generate_qr_code_external(config)
    if config['app']['qr_code_internal']:
        generate_qr_code_internal(config)
