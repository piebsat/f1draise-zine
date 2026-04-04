import "./assets/css/magazine.css";
import "./assets/css/jquery.ui.css";
import "./assets/css/jquery.ui.html4.css";

const $ = window.jQuery;

function injectHTML() {
  document.querySelector("#app").innerHTML = `
	<div id="canvas">

	<div class="zoom-icon zoom-icon-in"></div>

	<div class="magazine-viewport">
		<div class="container">
			<div class="magazine">
				<!-- Next button -->
				<div ignore="1" class="next-button"></div>
				<!-- Previous button -->
				<div ignore="1" class="previous-button"></div>
			</div>
		</div>
		<div class="bottom">
			<div id="slider-bar" class="turnjs-slider">
				<div id="slider"></div>
			</div>
		</div>
	</div>`;
}

window.addEventListener("load", () => {
	document.querySelector("#app").innerHTML = `
		<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
			<div>Thank you for donating!</div>
			<br>
			<label for="fname">Password:</label>
			<input type="password" id="fname" name="fname">
		</div>`;

	document.addEventListener("keydown", function (e) {
		if (e.key === "Enter" && e.target.id === "fname") {
			if (e.target.value === "open") {
				injectHTML();
				loadApp();
			}
		}
	});

    $(".zoom-icon")
      .bind("mouseover", function () {
        if ($(this).hasClass("zoom-icon-in"))
          $(this).addClass("zoom-icon-in-hover");

        if ($(this).hasClass("zoom-icon-out"))
          $(this).addClass("zoom-icon-out-hover");
      })
      .bind("mouseout", function () {
        if ($(this).hasClass("zoom-icon-in"))
          $(this).removeClass("zoom-icon-in-hover");

        if ($(this).hasClass("zoom-icon-out"))
          $(this).removeClass("zoom-icon-out-hover");
      })
      .bind("click", function () {
        if ($(this).hasClass("zoom-icon-in"))
          $(".magazine-viewport").zoom("zoomIn");
        else if ($(this).hasClass("zoom-icon-out"))
          $(".magazine-viewport").zoom("zoomOut");
      });
});

function updateFlipbookLayout(flipbook) {
  if (!flipbook.turn("is")) return;

  const isMobile = window.innerWidth < 1024;

  const pageWidth = isMobile
    ? window.innerWidth * 0.9
    : 461;

  const pageHeight = pageWidth * (600 / 461);

  if (isMobile) {
    flipbook.turn("display", "single");
    flipbook.turn("size", pageWidth, pageHeight);
  } else {
    flipbook.turn("display", "double");
    flipbook.turn("size", pageWidth * 2, pageHeight);
  }

  flipbook.turn("center");
}

function loadApp() {
  $("#canvas").fadeIn(1000);

  const isMobile = window.innerWidth < 1024;

  const pageWidth = isMobile
    ? window.innerWidth * 0.9
    : 461;

  const pageHeight = pageWidth * (600 / 461);

  var flipbook = $(".magazine");

  // Check if the CSS was already loaded

  if (flipbook.width() == 0 || flipbook.height() == 0) {
    setTimeout(loadApp, 10);
    return;
  }

  // Create the flipbook

  flipbook.turn({
    // Magazine width

    width: isMobile ? pageWidth : pageWidth * 2,
    height: pageHeight,
    display: window.innerWidth < 1024 ? "single" : "double",

    // Magazine height


    // Duration in millisecond

    duration: 1000,

    // Enables gradients

    gradients: true,

    // Auto center this flipbook

    autoCenter: false,

    // Elevation from the edge of the flipbook when turning a page

    elevation: 50,

    // The number of pages

    pages: 12,

    // Events

    when: {
      turning: function (event, page, view) {
        var book = $(this),
          currentPage = book.turn("page"),
          pages = book.turn("pages");

        // Update the current URI

        Hash.go("page/" + page).update();

        // Show and hide navigation buttons

        disableControls(page);
      },

      turned: function (event, page, view) {
        disableControls(page);

        $(this).turn("center");

        $("#slider").slider("value", getViewNumber($(this), page));

        if (page == 1) {
          $(this).turn("peel", "br");
        }
      },

      missing: function (event, pages) {
        const htmlPages = [1];

        for (let page of pages) {
          if (htmlPages.includes(page)) {
            addPage(page, $(this), false);
          } else {
            addPage(page, $(this), true);
          }
        }
      },
    },
  });

  updateFlipbookLayout(flipbook);
  // Zoom.js

  $(".magazine-viewport").zoom({
    flipbook: $(".magazine"),

    max: function () {
      return largeMagazineWidth() / $(".magazine").width();
    },

    when: {
      swipeLeft: function () {
        $(this).zoom("flipbook").turn("next");
      },

      swipeRight: function () {
        $(this).zoom("flipbook").turn("previous");
      },

      resize: function (event, scale, page, pageElement) {
        if (scale == 1) loadSmallPage(page, pageElement);
        else loadLargePage(page, pageElement);
      },

      zoomIn: function () {
        $("#slider-bar").hide();
        $(".made").hide();
        $(".magazine").removeClass("animated").addClass("zoom-in");
        $(".zoom-icon").removeClass("zoom-icon-in").addClass("zoom-icon-out");

        if (!window.escTip && !$.isTouch) {
          window.escTip = true;

          $("<div />", { class: "exit-message" })
            .html("<div>Press ESC to exit</div>")
            .appendTo($("body"))
            .delay(2000)
            .animate({ opacity: 0 }, 500, function () {
              $(this).remove();
            });
        }
      },

      zoomOut: function () {
        $("#slider-bar").fadeIn();
        $(".exit-message").hide();
        $(".made").fadeIn();
        $(".zoom-icon").removeClass("zoom-icon-out").addClass("zoom-icon-in");

        setTimeout(function () {
          $(".magazine").addClass("animated").removeClass("zoom-in");
          resizeViewport();
          updateFlipbookLayout($(".magazine"));
        }, 0);
        
      },
    },
  });

  // Zoom event

  if ($.isTouch) $(".magazine-viewport").bind("zoom.doubleTap", zoomTo);
  else $(".magazine-viewport").bind("zoom.tap", zoomTo);

  // Using arrow keys to turn the page

  $(document).keydown(function (e) {
    var previous = 37,
      next = 39,
      esc = 27;

    switch (e.keyCode) {
      case previous:
        // left arrow
        $(".magazine").turn("previous");
        e.preventDefault();

        break;
      case next:
        //right arrow
        $(".magazine").turn("next");
        e.preventDefault();

        break;
      case esc:
        $(".magazine-viewport").zoom("zoomOut");
        e.preventDefault();

        break;
    }
  });

  // URIs - Format #/page/1

  Hash.on("^page\/([0-9]*)$", {
    yep: function (path, parts) {
      var page = parts[1];

      if (page !== undefined) {
        if ($(".magazine").turn("is")) $(".magazine").turn("page", page);
      }
    },
    nop: function (path) {
      if ($(".magazine").turn("is")) $(".magazine").turn("page", 1);
    },
  });

  $(window)
    .resize(function () {
      resizeViewport();
    })
    .bind("orientationchange", function () {
      resizeViewport();
    });

  // Regions

  if ($.isTouch) {
    $(".magazine").bind("touchstart", regionClick);
  } else {
    $(".magazine").click(regionClick);
  }

  // Events for the next button

  $(".next-button")
    .bind($.mouseEvents.over, function () {
      $(this).addClass("next-button-hover");
    })
    .bind($.mouseEvents.out, function () {
      $(this).removeClass("next-button-hover");
    })
    .bind($.mouseEvents.down, function () {
      $(this).addClass("next-button-down");
    })
    .bind($.mouseEvents.up, function () {
      $(this).removeClass("next-button-down");
    })
    .click(function () {
      $(".magazine").turn("next");
    });

  // Events for the next button

  $(".previous-button")
    .bind($.mouseEvents.over, function () {
      $(this).addClass("previous-button-hover");
    })
    .bind($.mouseEvents.out, function () {
      $(this).removeClass("previous-button-hover");
    })
    .bind($.mouseEvents.down, function () {
      $(this).addClass("previous-button-down");
    })
    .bind($.mouseEvents.up, function () {
      $(this).removeClass("previous-button-down");
    })
    .click(function () {
      $(".magazine").turn("previous");
    });

  // Slider

  $("#slider").slider({
    min: 1,
    max: numberOfViews(flipbook),

    start: function (event, ui) {
      if (!window._thumbPreview) {
        window._thumbPreview = $("<div />", { class: "thumbnail" }).html(
          "<div></div>",
        );
        setPreview(ui.value);
        window._thumbPreview.appendTo($(ui.handle));
      } else setPreview(ui.value);

      moveBar(false);
    },

    slide: function (event, ui) {
      setPreview(ui.value);
    },

    stop: function () {
      if (window._thumbPreview) window._thumbPreview.removeClass("show");

      $(".magazine").turn("page", Math.max(1, $(this).slider("value") * 2 - 2));
    },
  });

  $(window)
  .resize(function () {
    resizeViewport();
    updateFlipbookLayout($(".magazine"));
  })
  .bind("orientationchange", function () {
    resizeViewport();
    updateFlipbookLayout($(".magazine"));
  });

  $(".magazine").addClass("animated");
}
