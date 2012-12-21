// render all of this using a handlebars template in the markup from the server,
// and a view model created here!!!

$(function () {
	$.fn.reportDetail = function() {
		var $detail = $(this).hide();
		var $detailContent = $detail.find("#detailContent");
		var $detailCount = $detail.find("#detailCount");
		var $name = $detail.find(".detail-name");
		var $info = $detail.find(".detail-info");
		var $resize = $("#detailResize");
		var $viewMingle = $detail.find("a[data-action='viewMingle']").hide();
				
		$detail.on("reportDetail.render", function(e, options) {
			render(options);
		});
		
		$.stateManager
			.add({ name : "detailWidth", type : "page.client", defaultValue : ($("body").width() * 0.5) });
		$resize.dragbar({
			moved : function(delta) { $.stateManager.set("detailWidth", parseInt($detail.width() - delta)); },
			ghostCreated : function($ghost) { $ghost.addClass("drag-ghost"); }
		});
		$(window).resize(function() { redrawResizeBar(); });
		$(window.document).on("stateManager.stateUpdated.detailWidth", function(e, options) { redrawResizeBar(); });
						
		return $detail;
		
		function redrawResizeBar() {
			var width = $.stateManager.get("detailWidth");
			var bodyWidth = $("body").width();
			if (width < parseInt(bodyWidth * 0.2)) {
				$.stateManager.set("detailWidth", parseInt(bodyWidth * 0.2));
			} else if (width > parseInt(bodyWidth * 0.8)) {
				$.stateManager.set("detailWidth", parseInt(bodyWidth * 0.8));
			} else {
				$detail.width(width);
				//$resize.height($detailContent.height());
			}
		}
		
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
				$detailCount.text($errors.length + " error(s)");
				renderInfo($errors.parent("ul"));
			} else {
				$detailCount.text($node.children("ul").children("li").length +" item(s)");
				renderInfo($node.children("ul"));	
			}
			redrawResizeBar();
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