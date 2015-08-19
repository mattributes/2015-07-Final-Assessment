$("document").ready( function(){
	var addSingle = function(obj){
		var src = obj.images.fixed_width_small.url;
		var img = $("<img src='" + src + "'><img>");
		var tagNameInput = $("<input type='text' placeholder='tag name'></input>");
		var saveButton = $("<button>Save</button>");

		var li = $("<li></li>").append($("<div></div>").append([
			img,
			tagNameInput,
			saveButton
		]));

		saveButton.on("click", function(){
			tagName = tagNameInput.val();
			tagNameInput.hide();
			saveButton.hide();

			$.ajax({
				url: "http://localhost:3000/save?src=" + src + "&tagName=" + tagName
			}).done(function(res){
				//TODO
			});
		});

		$("#ResultsList").append(li);
	}

	var search = function(){
		var inputVal = $("#SearchInput").val();
		$("#SearchInput").val("");

		$.ajax({
			//http://api.giphy.com/v1/gifs/search?q=funny+cat&api_key=dc6zaTOxFJmzC
			url: "http://api.giphy.com/v1/gifs/search?q=" + inputVal + "&api_key=dc6zaTOxFJmzC",
			context: document.body
		}).done(function(res) {
			console.log(res)
			$("#ResultsList").empty();

			for (var i =0; i < res.data.length; i++){
				addSingle(res.data[i]);
			}
		});
	}

	$("#Search").on("click", function(e){
		search();
	});

	$("#SearchInput").on('keypress', function(e){
		if(e.keyCode === 13){
			search();
		}
	});
});