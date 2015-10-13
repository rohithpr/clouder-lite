# clouder-lite

[![Code Climate](https://codeclimate.com/github/rohithpr/clouder-lite/badges/gpa.svg)](https://codeclimate.com/github/rohithpr/clouder-lite)

A simple Python3-Flask application to turn a computer into a cloud storage system.

Transfer files at speeds greater than that offered by Bluetooth or even USB.

## Contents
* [Support](#support)
* [Setup](#setup)
* [API](#api)

### Support

Works on all devices. It's a website, not an app! Let us know if there is an issue.

###### Note: Some phone browsers (such as UC browser on Windows Phone) do not support selecting multiple files for upload at once; use browsers that do support it!

### Setup

#### Getting started

* Create a virtual environment (Py3) and install all the dependencies mentioned in requirements.txt
* Activate the venv and run `python3 server.py`
* You can now access the said server from a phone by knowing the machine's inet address
 * `ifconfig` or `ipconfig` will help you find the inet address

#### Advanced

* Set up port forwarding and make neccessary changes to your firewall settings
* If you have a static IP address you can simply bookmark the address to reach the server
* Consider signing up to a Dynamic DNS such as Duck DNS in case you don't have a static IP address
* Now you can access all your content from anywhere

### API

#### /nav/[<path:initial_path>]
  Renders `{{theme_name}}/index.html` template.  
  Optional: `initial_path` the file/directory that must be open on start up. Root of the content directory by default.

#### /api/upload_files
  POST data:  
    `files` - list of files named.  
    `path` - path of the directory where the uploaded files should be saved.  
  Returns JSON with `error` as 0 if successful.

#### /api/add_directory
  POST data:  
    `name` - name of the directory being created.  
    `parent` - path to the directory under which the new directory must be created.  
  Returns JSON with `error` as 0 if successful.

#### /api/get_tree/[<path:path>]
  Returns JSON with information about the contents of the tree.  
  Optional: `path` the directory whose contents are required. Root of the content directory is the default.

#### /api/download_file/<path:filename>
  Download the file specified by `filename`.

#### /api/download_directory/<path:dirname>
  Download the directory specified by dirname as a zipfile.
