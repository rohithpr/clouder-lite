$(document).ready( function(){
  /* Fetches the entire tree 
   */
  var get_tree = function(callback) {
    if (GLOBALS.tree && GLOBALS.clean) {
      callback(GLOBALS.tree)
    }
    else {
      var node = '/api/get_tree/'
      $.ajax({
        type: "GET",
        url: node,
        dataType: "text",
        cache: false,
        success: function(response) {
          response = $.parseJSON(response)
          // console.log(response)
          GLOBALS.tree = response
          GLOBALS.clean = true
          callback(GLOBALS.tree)
        },
        error: function(xhr, textStatus, errorThrown){
          error_message = 'Error code: 1\n'
          error_message += 'Check if the content folder exists in the location specified by config.py\n'
          error_message += 'Please report the error if the above steps don\'t help'
          alert(error_message)
          console.log(xhr, textStatus, errorThrown)
        }
      })
    }
  }

  /* Creates the thumbnail that holds the icons
   */
  var create_thumbnail = function(name, icon, type, outer_folder, fileinfo={}) {
    //c_time='', filetype='', m_time='', size_file=''
    //console.log(name, icon, type, outer_folder)
    var node = $('<div class="col-xs-12 node" type="' + type + '"></div>')
    var row = $('<div class="row"></div>')
    var icon = $('<div class="col-xs-1"><span class="glyphicon glyphicon-' + icon + '"></span></div>')
    var download_button = $('<div class="col-xs-1 downloader"><span class="glyphicon glyphicon-download"></span></div>')
    var node_name = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + name + '</div></div>')
    row.append(icon)
    row.append(node_name)
    row.append(download_button)
    row.append(ctime_f)
    node.append(row)
    if (type == 'file') {
          var row_f = $('<div class="row" style="display:none"></div>')
          $(row_f).addClass("rf_class")
          var ctime_f = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["c_time"] + '</div></div>')
          var filetype_f = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["file_type"] + '</div></div>')
          var mtime_f = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["mtime"] + '</div></div>')
          var size_f = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["size"] + '</div></div>')
          row_f.append(ctime_f)      
          row_f.append(filetype_f)
          row_f.append(mtime_f)
          row_f.append(size_f)
          node.append(row_f)
    }
    outer_folder.append(node)
  }

  /* Responsible for calling relevant functions for fetching the tree
   * and creating icons on the screen
   */
  var populate = function(new_parent) {
    get_tree(function(tree) {
      // console.log(tree)
      // Special links
      var outer_folder = $('<div></div>')
      create_thumbnail('Move up', 'level-up', 'parent', outer_folder)
      create_thumbnail('Root', 'home', 'root', outer_folder)
      $('#special-links').empty().append(outer_folder)

      // Directory contents
      var outer_folder = $('<div></div>')
      outer_folder.append('<br/>')
      tree[new_parent].directories.forEach(function(name){
        create_thumbnail(name, 'folder-open', 'directory', outer_folder)
      })
      tree[new_parent].files.forEach(function(name){
        create_thumbnail(name, 'file', 'file', outer_folder,tree[new_parent].file_info[name])
      })
      //,tree[new_parent].file_info[name]["ctime"],tree[new_parent].file_info[name]["file_type"],tree[new_parent].file_info[name]["mtime"],tree[new_parent].file_info[name]["size"]
      $('#main-area').empty().append(outer_folder)
      GLOBALS.current_parent = new_parent
      window.history.pushState({}, '', '/nav' + GLOBALS.current_parent)
    })
  }

  var generate_new_path = function(selected) {
    var new_parent = GLOBALS.current_parent
    if (new_parent[new_parent.length - 1] != '/') {
      new_parent += '/'
    }
    new_parent += selected
    //alert(node_name)
    return new_parent
  }
 
  var main = function() {
    /* Home screen shows the contents of the user's root directory
     */
     // document.write(GLOBALS.current_parent)
    populate(GLOBALS.start_node)
  }
  main()

  /* Event handlers */

  /* Download file or directory
   */
  $(document).on('click', '.downloader', function(e){
    e.stopPropagation()
    var node = $(this).parent().parent()
    var selected = $(node).find('.item-name').html()
    var type = $(node).attr('type')
    // console.log(type)
    get_tree(function(tree) {
      if (type === 'directory') {
        var dir_path = generate_new_path(selected)
        window.location.href = '/download_directory' + dir_path
      }
      else if (type === 'file') {
        var file_path = generate_new_path(selected)
        window.location.href = '/download_file' + file_path
      }
      else {
        error_message = 'Error code: 2.\n'
        error_message += 'Something went wrong on clicking this icon! Please report it.'
        alert(error_message)
      }
    })
  })

  /* Changes directory
   */
  $(document).on('click', '.node', function(e){
    var node = $(this) //.parent().parent()
    var selected = $(node).find('.item-name').html()
    var type = $(node).attr('type')
    get_tree(function(tree) {
      if (type === 'directory') {
        var new_parent = generate_new_path(selected)
        populate(new_parent)    
        }
      else if (type === 'file') {
        $(node).find('.rf_class').toggle()
        console.log($(node).css('display'))
        // // var file_path = generate_nw_path(selected)
        // // window.location.href = '/dl' + file_path
      }
      else if (type === 'root') {
        var new_parent = '/'
        populate(new_parent)
      }
      else if (type === 'parent') {
        var new_parent = GLOBALS.tree[GLOBALS.current_parent].parent;
        populate(new_parent)
      }
      else {
        error_message = 'Error code: 3.\n'
        error_message += 'Something went wrong on clicking this icon! Please report it.'
        alert(error_message)
      }
    })
  })

  /* File upload handler
   */
  $(document).on('click','#upload-file-btn',function(e){
    var n = GLOBALS.current_parent
    var form_data = new FormData($('#upload-form')[0])
    if (n[0] == '/')
      n = n.slice(1,(n.length))
    form_data.append('path',n)
    console.log('Starting upload')

    $('#upload-progress-div').css('display', 'inherit')
    var upload_form = $('#upload-form')
    upload_form.css('display', 'none')
    var upload_status_message = $('#upload-status-message')
    var upload_progress_bar = $('#upload-progress-bar')

    $.ajax({
      xhr: function() {
        var xhr = new window.XMLHttpRequest()
        xhr.upload.addEventListener('progress', function(e) {
          if (e.lengthComputable) {
            var percent_complete = e.loaded / e.total
            percent_complete = parseInt(percent_complete * 100)
            $(upload_progress_bar).attr('aria-valuenow', percent_complete)
            $(upload_progress_bar).css('width', percent_complete + '%')
            $(upload_status_message).html(percent_complete + '%')
            if (percent_complete === 100) {
              $(upload_status_message).html('Almost there...')
            }
          }
        }, false)
        return xhr
      },
      type: 'POST',
      url: '/api/upload_files',
      data: form_data,
      contentType: false,
      processData: false,
      success: function(response) {
        if (response.error_code == '0') {
          $(upload_status_message).html('Upload successful. Click to upload more files.')
          $(upload_progress_bar).addClass('progress-bar-success')
        }
      },
      error: function() {
        console.log('Error uploading file.')
        $(upload_form).css('display', 'inherit')
        $(upload_progress_bar).css('display', 'none')
      }
    })
  })

  /* Hides upload-progress-bar and shows upload-form
   */
  $(document).on('click', '#upload-progress-bar', function() {
    var upload_form = $('#upload-form')
    var upload_progress_bar = $('#upload-progress-bar')
    var upload_progress_div = $('#upload-progress-div')
    if ($(upload_progress_bar).hasClass('progress-bar-success')) {
      $(upload_progress_bar).removeClass('progress-bar-success')
      $(upload_progress_div).css('display', 'none')
      $(upload_form).css('display', 'inherit')
    }
  })
})
