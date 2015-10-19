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
  var create_thumbnail = function(name, icon, type, outer_folder, fileinfo) {
    var node = $('<div>') .addClass('col-xs-12 node')
                          .attr('type', type)
    var row = $('<div>').addClass('row')
    var icon = $('<div>') .addClass('col-xs-1')
                          .append('<span>')
                            .addClass('glyphicon glyphicon-' + icon)
    var node_name = $('<div>').addClass('col-xs-9 col-sm-10')
                              .append('<div>')
                                .addClass('item-name')
                                .html(name)
    var download_button = $('<div>').addClass('col-xs-1 downloader')
                                    .append('<span>')
                                      .addClass('glyphicon glyphicon-download')
    row.append(icon)
    row.append(node_name)
    row.append(download_button)
    node.append(row)
    if (type == 'file') {
      var row_file_info = $('<div class="row" style="display:none"></div>')
      $(row_file_info).addClass("row_file_class")
      var ctime = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["c_time"] + '</div></div>')
      var filetype_f = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["file_type"] + '</div></div>')
      var mtime = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["mtime"] + '</div></div>')
      var size = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + fileinfo["size"] + '</div></div>')
      row_file_info.append(ctime)      
      row_file_info.append(filetype_f)
      row_file_info.append(mtime)
      row_file_info.append(size)
      node.append(row_file_info)
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
      var outer_folder = $('<div>')
      create_thumbnail('Move up', 'level-up', 'parent', outer_folder)
      create_thumbnail('Root', 'home', 'root', outer_folder)
      $('#special-links').empty().append(outer_folder)

      // Directory contents
      var outer_folder = $('<div>')
      outer_folder.append('<br/>')
      tree[new_parent].directories.forEach(function(name){
        create_thumbnail(name, 'folder-open', 'directory', outer_folder)
      })
      tree[new_parent].files.forEach(function(name){
        create_thumbnail(name, 'file', 'file', outer_folder,tree[new_parent].file_info[name])
      })
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
    return new_parent
  }
 
  /* Display the contents of the required directory
   */
  var main = function() {
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
        $(node).find('.row_file_class').toggle()
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
    var path = GLOBALS.current_parent
    if ($('#files')['0'].files.length == 0) {
      // No file selected
      return
    }
    var form_data = new FormData($('#upload-form')[0])
    if (path[0] == '/')
      path = path.slice(1,(path.length))
    form_data.append('path', path)
    console.log('Starting upload')

    $('#upload-progress-div').css('display', 'inherit')
    var upload_form = $('#upload-form').css('display', 'none')
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

  /* Toggle the upload form on clicking the upload button in the sidebar
   */
  $('#toggle-upload-form-area').click( function(e) {
    $('#upload-form-area').toggle()
  })

  /* Create a new directory on click the Create button
   */
  $('#create-directory').click( function(e) {
    var dirname = $(this).parent().children()[0].value
    var data = {
      name: dirname,
      parent: GLOBALS.current_parent
    }
    $.ajax({
      url: '/api/add_directory',
      method: 'POST',
      data: data,
      success: function(response) {
        console.log(response)
      },
      error: function(xhr, b, c) {
        console.log(xhr, b, c)
      }
    })
  })

  /* Toggle the add directory form on clicking the add directory button in the sidebar
   */
  $('#toggle-add-directory-form-area').click( function(e) {
    $('#add-directory-form-area').toggle()
  })
})
