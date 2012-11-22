// render all of this using a handlebars template in the markup from the server,
// and a view model created here!!!

$(function () {
	$.fn.reportDetail = function() {
		var $detail = $(this).hide();
		var $name = $detail.find(".detail-name");
		var $info = $detail.find(".detail-info");
		var $viewMingle = $detail.find("a[data-action='viewMingle']").hide();
				
		$detail.on("reportDetail.render", function(e, options) {
			render(options);
		});
		
		return $detail;
		
		function render(options) {
			$name.text(options.name);
			$viewMingle.hide();
			if (options.mingleUrl) { 
				$viewMingle.show().attr("href", options.mingleUrl);
			}
			
			var $node = options.node;
			var $errors = $node.find("li[data-error]");
			if ($node.data("error")) {
				$errors = $node;
			}
			
			if ($errors.length > 0) {
				renderInfo($errors.parent("ul"));
			} else {
				renderInfo($node.children("ul"));	
			}
			if (options.callback) {
				options.callback();
			}
		}
		
		/* Private */
		function renderInfo($items) {
			$info.empty().hide();
			$items.each(function() {
				var $item = $(this);
				var parentPath = "";
				$item.parents("li").each(function() {
					if (parentPath !== "") { parentPath = "-&nbsp;&gt;&nbsp;" + parentPath; }
					parentPath = $(this).find("a").eq(0).text().trim() + parentPath;
				});
				var $cloned = $item.clone();
				$cloned.find("li").removeClass("jstree-closed");
				$cloned.find("ins").remove();
				$info.append("<div>"+ parentPath +"</div>").append($cloned);
				var error = $item.data("error") ? $item.data("error") : $item.find("li[data-error]").data("error");
				if (error) {
					$info.append("<div class='error'><pre>" + error + "</pre></div>");
				}
			});			
			
			$info.show();
		}
	};
});