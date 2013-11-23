/*global document, makeEaseOut, back, linear, jsAnimate, Image, $*/
/*global define*/

define(['modules/jsAnimate', 'modules/PanelCounter', 'modules/imageAsData', 'ImagePreloader'], function(jsAnimate, CountManager, ImageAsData, ImagePreloader){

	var CmxCanvas = (function() {

		// START Helpers
		function halfDiff(a, b) {
			return (a - b)/2;
		}

		//END Helpers

		var i, cnv, ctx, cmxJSON, panelCounter, popupCounter,
			_animating = false,
			img_Pop = new Image();

		var loadingFlag = false;
		var imgLoader = new ImagePreloader();
		imgLoader.onLoadStart = function() {
			//loadingFlag = true;
			console.log('starting to load images');
		};
		imgLoader.onLoadDone = function() {
            //loadingFlag = false;
            console.log('done loading images');
        };
        function writeImgLoaderData() {
        	var imgd = {};
			if (!panelCounter.isLast) {
				imgd.imgObj_next = {
					src: cmxJSON[panelCounter.next].src
				};
			}
			if (!panelCounter.isFirst) {
				imgd.imgObj_prev = {
					src: cmxJSON[panelCounter.prev].src
				}
			}
        	imgd.imgObj = {
    			src: cmxJSON[panelCounter.curr].src,
    			callback: function(imgObj) {
    				console.log(imgObj);
    				ctx.clearRect(0, 0, cnv.width, cnv.height);
					ctx.drawImage(imgObj, halfDiff(cnv.width, imgObj.width), halfDiff(cnv.height, imgObj.height));
    			},
    			cbPriority: true
    		}
    		return imgd;
        };

		// Deal with cross origin nonsense
		img_Pop.crossOrigin = "Anonymous";

		// The Main Event
		var cmxcanvas = {

			// START: methods for making stuff happen on the canvas
			movePanels: function(imgObj, imgObj_target, direction) {
				switch (cmxJSON[panelCounter.curr].transition) {

					case 'jumpcut':
						this.goToPanel(panelCounter.curr);
						break;

					//case 'elastic': //case for this transition if it's not default
					default:
						_animating = true;
						var that = this,
							imgObj_x = halfDiff(cnv.width, imgObj.width),
							imgObj_y = halfDiff(cnv.height, imgObj.height),
							imgObj_target_x = halfDiff(cnv.width, imgObj_target.width),
							imgObj_target_y = halfDiff(cnv.height, imgObj_target.height);

						jsAnimate.animation({
							target: [imgObj, imgObj_target],
							names: [cmxJSON[panelCounter.curr - direction].src, cmxJSON[panelCounter.curr].src],
							from: [{
								x: imgObj_x,
								y: imgObj_y
							},
							{
								x: imgObj_target_x + (direction * cnv.width),
								y: imgObj_target_y
							}],
							to: [{
								x: imgObj_x - (direction * cnv.width),
								y: imgObj_y
							},
		                   	{
								x: imgObj_target_x,
								y: imgObj_target_y
							}],
							canvas: cnv,
							ctx: ctx,
							duration: 400,
							interval: 25,
							friction: 1,
							aFunction: jsAnimate.makeEaseOut(jsAnimate.back),
							onComplete: function() {
								imgLoader.load(writeImgLoaderData(), true);
								/*imgObj.src = cmxJSON[panelCounter.curr].src;
								if (!panelCounter.isLast) {
									imgObj_next.src = cmxJSON[panelCounter.next].src;
								}
								if (!panelCounter.isFirst) {
									imgObj_prev.src = cmxJSON[panelCounter.prev].src;
								}*/
								_animating = false;
							}
						});
						break;
				}
			},
			popUp: function(popup) {
				var that = this;
				img_Pop.onload = function() {
					that.animatePopUp({
						img: img_Pop,
						x: popup.x || 0,
						y: popup.y || 0,
						animation: popup.animation || 'scaleIn'
					});
					loadingFlag.remove();
        		};
        		img_Pop.src = popup.src;
        		loadingFlag.add();
			},
			animatePopUp: function(popup){
				popup.dur = popup.dur || 100;
				popup.totalFrames = popup.totalFrames || 10;
				var _int = popup.dur/popup.totalFrames,
					_bkgPartial = ctx.getImageData(popup.x, popup.y, popup.img.width, popup.img.height),
					_frame = 0;
					
				var _time1 = new Date();
				function killInterval(interval) {
					clearInterval(interval);
					var _time2 = new Date();	
					var _dTime = _time2 - _time1;
					/*console.log('total frames: ', _frame);
					console.log('total milliseconds: ' + Math.ceil(_dTime));
					console.log('fps: ' + Math.ceil(_frame/(_dTime/1000)));*/
				}

				switch (popup.animation) {
					case 'fadeIn':
						ctx.globalAlpha = 0;
				        var _fadeIn = setInterval(function(){

							//increase globalAlpha by 1 / total frames and make it into a normal fraction
							var ga = ctx.globalAlpha + 1/popup.totalFrames;
							ctx.globalAlpha = parseFloat(ga.toFixed(1), 10);

							ctx.clearRect(popup.x, popup.y, popup.img.width, popup.img.height);
							ctx.putImageData(_bkgPartial, popup.x, popup.y);
							ctx.drawImage(popup.img, popup.x, popup.y);

							_frame++;
							if (ctx.globalAlpha === 1) {
								killInterval(_fadeIn);
							}
					    }, _int);
					    break;

					case 'scaleIn':
					default:
						var _scale = 0;
				        var _scaleIn = setInterval(function(){
							
							_scale += 10;
							
							var _scaledW = popup.img.width*(_scale/100),
							_scaledH = popup.img.height*(_scale/100),
							_dX = popup.x + ((popup.img.width - _scaledW)/2),
							_dY = popup.y + ((popup.img.height - _scaledH)/2);

							ctx.clearRect(popup.x, popup.y, popup.img.width, popup.img.height);
							ctx.putImageData(_bkgPartial, popup.x, popup.y);
							ctx.drawImage(popup.img, _dX, _dY, _scaledW, _scaledH);

							_frame++;
							if (_scale === 100) {
								killInterval(_scaleIn);
							}
					    }, _int);
					    break;
			    }
			},

			// These are really the only methods that should be public:
			goToNext: function() {
				var that = this;
				if (!_animating && !loadingFlag) {

					var popups = cmxJSON[panelCounter.curr].popups || null;

					if (!popupCounter.isLast) {
						popupCounter.getNext();
						this.popUp(popups[popupCounter.curr]);
					}

					else if (!panelCounter.isLast) {
						panelCounter.getNext();
						popupCounter = new CountManager(cmxJSON[panelCounter.curr].popups, -1);
						that.movePanels(imgLoader.loadedImages.imgObj, imgLoader.loadedImages.imgObj_next, 1);
					}
				}
				return [panelCounter, popupCounter];
			},
			goToPrev: function() {
				var that = this;
				if (!_animating && !loadingFlag) {
					if (!panelCounter.isFirst){
						panelCounter.getPrev();
						popupCounter = new CountManager(cmxJSON[panelCounter.curr].popups, -1);
						that.movePanels(imgLoader.loadedImages.imgObj, imgLoader.loadedImages.imgObj_prev, - 1);
					}
					else {
						this.goToPanel(0);
					}
				}
				return [panelCounter, popupCounter];
			},
			goToPanel: function(panel) {
				panelCounter.goTo(panel);
				popupCounter = new CountManager(cmxJSON[panelCounter.curr].popups, -1);
				imgObj.src = cmxJSON[panelCounter.curr].src;
				if (!panelCounter.isLast) {
					imgObj_next.src = cmxJSON[panelCounter.next].src;
				}
				if (!panelCounter.isFirst) {
					imgObj_prev.src = cmxJSON[panelCounter.prev].src;
				}
			}
		};

		/*imgObj.onload = function() {
			//ctx.clearRect(0, 0, cnv.width, cnv.height);
			//ctx.drawImage(this, halfDiff(cnv.width, this.width), halfDiff(cnv.height, this.height));
		};*/

		var init = function(data, canvasId) {
			
			//// Get Canvases and Contexts
			cnv = document.getElementById(canvasId);
			ctx = cnv.getContext('2d');
			
			cmxJSON = data.cmxJSON;
			panelCounter = new CountManager(cmxJSON);
			popupCounter = new CountManager(cmxJSON[0].popups, -1);

			imgLoader.load(writeImgLoaderData(), true);
			//imgObj.src = cmxJSON[panelCounter.curr].src;
			//imgObj_next.src = cmxJSON[panelCounter.next].src;
			//loadingFlag.add("imgObj init " + imgObj.src);
			
			return cmxcanvas;
		};

		return init;
	}());

	return CmxCanvas;
});