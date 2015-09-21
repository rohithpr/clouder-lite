$(document).ready( function(){
  /* Fetches the entire tree 
   */
  var get_tree = function(callback) {
    if (GLOBALS.tree && GLOBALS.clean) {
      callback(GLOBALS.tree)
    }
    else {
      var node = '/api/get_tree/root'
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
  var create_thumbnail = function(name, icon, type, outer_folder) {
    //console.log(name, icon, type, outer_folder)
    var node = $('<div class="col-xs-12 node" type="' + type + '"></div>')
    var row = $('<div class="row"></div>')
    var icon = $('<div class="col-xs-1"><span class="glyphicon glyphicon-' + icon + '"></span></div>')
    var download_button = $('<div class="col-xs-1 downloader"><span class="glyphicon glyphicon-download"></span></div>')
    var node_name = $('<div class="col-xs-9 col-sm-10"><div class="item-name">' + name + '</div></div>')
    row.append(icon)
    row.append(node_name)
    row.append(download_button)
    node.append(row)
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
        create_thumbnail(name, 'file', 'file', outer_folder)
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
        // var file_path = generate_new_path(selected)
        // window.location.href = '/dl' + file_path
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
})

//.......Event to upload to particular directory..................
$(document).on('click','#upload-file-btn',function(e){
          var n = GLOBALS.current_parent
          var form_data = new FormData($('#upload-form')[0])
          if(n[0] == '/')
                n = n.slice(1,(n.length)) 
          form_data.append('path',n)
          console.log('Starting upload')
          $.ajax({
              type: 'POST',
              url: '/upload',
              data: form_data,
              contentType: false,
              processData: false,
              success: function(response) {
                console.log(response)
              },

              error: function() {
                console.log('Error uploading file.')
              }
          });
      });
 




 
