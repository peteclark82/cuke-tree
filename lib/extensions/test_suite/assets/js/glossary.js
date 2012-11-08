$(function() {
	var $addToGlossary = $("#addToGlossary");
	var $addToGlossaryDialog = $("#addToGlossaryDialog");
	var $addToGlossaryDialogForm = $("#addToGlossaryDialog form");
	var $closeAddToGlossaryDialog = $("#closeAddToGlossaryDialog");
	
	$addToGlossaryDialogForm.submit(function(e) {
		e.preventDefault();
		
		var url = $addToGlossaryDialogForm.attr("action");
		var data = $addToGlossaryDialogForm.serialize();
		$.ajax({type:'POST', url: url, data: data, success: function(response) {
			alert(response);
			$addToGlossaryDialog.dialog("close");
		}, error: function(res, e, v) {
			alert("Failed to add term:-\n" + res.status +"\n"+ res.responseText);
		}});
	});
	
	$addToGlossary.click(function(e) {
		e.preventDefault();
		var userSelectedText = getSelected().toString();
		console.log(userSelectedText);
		if (userSelectedText) {
			$("#newTermName").val(userSelectedText);
			$("#newTermDescription").val("");	
		}
		$addToGlossaryDialog.dialog({width:440,resizable:false});
		$("#newTermName").focus();
	});	
	
	$closeAddToGlossaryDialog.click(function(e) {
		e.preventDefault();
		$addToGlossaryDialog.dialog("close");
	});	
	
	function getSelected(){
		var t = "";
		if (window.getSelection) {
			t = window.getSelection();
		} else if (document.getSelection) {
			t = document.getSelection();
		} else if (document.selection) {
			t = document.selection.createRange().text;
		}
		return t;
	}
});