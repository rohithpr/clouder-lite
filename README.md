# clouder-lite

A simple Python3-Flask application to turn a computer into a cloud storage system.

Transfer files at speeds greater than that offfered by Bluetooth or even USB.

## Contents
* [Support](#support)
* [Setup](https://github.com/rohithpr/clouder-lite#setup)
* [Usage](https://github.com/rohithpr/clouder-lite#usage)

### Support

Should work on all devices. It's a website, not an app!

#### Note: Some phone browsers (such as UC browser on Windows Phone) do not support selecting multiple files for upload at once; use browsers that do support it!

### Setup

#### Getting started

* Create a virtual environment (Py3) and install all the dependencies mentioned in requirements.txt
* Activate the venv and run `python3 server.py`
* You can now access the said server from a phone by knowing the machine's inet address
 * `ifconfig` will help you find the inet address

#### Advanced

* Set up port forwarding and make neccessary changes to your firewall settings
* If you have a static IP address you can simply bookmark the address to reach the server
* Consider signing up to a Dynamic DNS such as Duck DNS in case you don't have a static IP address
* Now you can access all your content from anywhere
