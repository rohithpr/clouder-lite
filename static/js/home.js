var GLOBALS = {
  tree: undefined,
  clean: false,
  current_parent: undefined
}

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
          callback(GLOBALS.tree)
        },
        error: function(xhr, textStatus, errorThrown){
          alert('Something went wrong! Please report the error message displayed in the console.')
          console.log(xhr, textStatus, errorThrown)
        }
      })
    }
  }

  /* Creates the thumbnail that holds the icons
   */
  var create_thumbnail = function(name, icon, type, outer_folder) {
    // console.log(name, icon, type, outer_folder)
    var folder = $('<div class="col-lg-2 col-xs-5 icon" type="' + type + '"></div>')
    var icon = $('<span class="glyphicon glyphicon-' + icon + '"></span>')
    var name = $('<p class="item-name">' + name + '</p>')
    folder.append(icon)
    folder.append(name)
    outer_folder.append(folder)
  }

  /* Responsible for calling relevant functions for fetching the tree
   * and creating icons on the screen
   */
  var populate = function(new_parent) {
    get_tree(function(tree) {
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

  var main = function() {
    /* Home screen shows the contents of the user's root directory
     */
    populate('/')
  }
  main()

  /* Event handlers */

  /* Changes directory or transfers file on clicking on an icon
   */
  $('#main-area, #special-links').on('click', '.icon', function(e){
    var selected = $(this).find('p').html()
    var type = $(this).attr('type')
    // console.log(type)
    get_tree(function(tree) {
      if (type === 'directory') {
        var new_parent = generate_new_path(selected)
        // console.log(new_parent)
        populate(new_parent)
      }
      else if (type === 'file') {
        var file_path = generate_new_path(selected)
        window.location.href = '/dl' + file_path
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
        alert('Something went wrong on clicking this icon! Please report it.')
      }
    })
  })
})
