$(document).ready( function(){

	var populate = function(node, name) {
		$.ajax({
			type: "GET",
      url: node,
      dataType: "text",
      cache: false,
      success: function(response) {
        response = $.parseJSON(response)
        console.log(response)
        var outer_folder = $('<div></div>')
        response[name].directories.forEach( function(directory){
          console.log(directory)
          var folder = $('<div class="col-lg-2 col-xs-5 icon" name="' + directory + '"></div>')
          var icon = $('<span class="glyphicon glyphicon-folder-open"></span>')
          var name = $('<p>' + directory + '</p>')
          folder.append(icon)
          folder.append(name)
          outer_folder.append(folder)
        })
        response[name].files.forEach( function(file){
          console.log(file)
          var folder = $('<div class="col-lg-2 col-xs-5 icon" style="text-align:center;" name="' + file + '"></div>')
          var icon = $('<span class="glyphicon glyphicon-file"></span>')
          var name = $('<p>' + file + '</p>')
          folder.append(icon)
          folder.append(name)
          outer_folder.append(folder)
        })
        $('#main-area').append(outer_folder)
      },
      error: function(xhr, textStatus, errorThrown){
        alert('Something went wrong! Please report the error message displayed in the console.')
        console.log(xhr, textStatus, errorThrown)
      }
		})
	}

	populate("/api/get_tree/root", "/")
})
