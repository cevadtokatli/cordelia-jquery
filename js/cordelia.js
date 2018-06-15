/**
 *   Cordelia color picker
 *   version: 1.0.0
 *    author: Cevad Tokatli <cevadtokatli@hotmail.com>
 *   website: http://cevadtokatli.com
 *    github: https://github.com/cevadtokatli/cordelia-jquery
 *   license: MIT
 */

(function(factory) {
	if(typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if(typeof exports === 'object' && typeof module === 'object') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}(function($) {
	'use strict';

    var events = {
        open: createEvent('open'),
        close: createEvent('close'),
        save: createEvent('save'),
        cancel: createEvent('cancel'),
        changed: createEvent('changed')
    };

    var defaults = { //Stores the default settings.
        size: 'medium',
        embed: true,
        pickerStyle: 0,
        allowOpacity: true,
        allowClearColor: false,
        showColorValue: true,
        colorFormat: 'hex',
        color: '#FF0000',
        showButtons: true,
        showPalette: true,
        paletteColors: ['#FFFFB5', '#FBBD87', '#F45151', '#7AEA89', '#91C8E7', '#8EB4E6', '#B0A7F1'],
        allowPaletteAddColor: true
    },
		pickers = []; //Stores the initialized pickers.

    /**
     * Installation with jQuery
     * Calls the given method
     *
     * @param {Object|String} o
     * @param {String} arg
     * @returns {Object|undefined}
     */
    $.fn.cordelia = function(o, arg) {
    	var r;

        this.each(function(t) {
            if(typeof o !== 'string') {
				new Cordelia(this, o);
            } else {
                var picker = pickers.filter(function(p) {
                    if(p.elm.main[0] == this) {
                        return p;
                    }

                    return null;
                }.bind(this));

				if(picker.length == 0) {
					throw new Error('Element could not be found');
				}

				picker = picker[0];

                // methods
                if(o == 'get') {
                    r = picker.get();
                } else if(o == 'set') {
                	picker.set(arg);
                } else if(o == 'show') {
                    picker.show();
                } else if(o == 'hide') {
                    picker.hide();
                } else if(o == 'save') {
                	picker.save();
				} else if(o == 'cancel') {
					picker.cancel();
				} else {
                    throw new Error('Method could not be found');
                }
            }
        });

        return r;
    }

    // Identifies Cordelia tags and attributes when page is loaded.
    addEventListener('load', function() {
        var tag = document.querySelectorAll('cordelia');
        for(var i=0; i<tag.length; i++) {
            (function(i){
                newElementWithTag(tag[i]);
            }(i))
        }

        var attr = document.querySelectorAll('*[cordelia]');
        for(var i=0; i<attr.length; i++) {
            (function(i){
                newElementWithAttribute(attr[i]);
            }(i))
        }
    });

    // Provides that picker can be installed with html tag and attribute after the page is loaded.
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if(MutationObserver) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(mutation.type == 'attributes') {
                    var elm = mutation.target;
                    if(elm.getAttribute('cordelia')) {
                        newElementWithAttribute(elm);
                    }
                } else {
                    for(var i=0; i<mutation.addedNodes.length; i++) {
                        (function(i) {
                            var elm = mutation.addedNodes[i];
                            if(elm.nodeName.indexOf('#') == -1) {
                                if(elm.nodeName == 'CORDELIA') {
                                    newElementWithTag(elm);
                                } else if(elm.getAttribute('cordelia')) {
                                    newElementWithAttribute(elm);
                                }
                            }
                        }(i))
                    }
                }
            });
        });
        observer.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /**
     * Installation with HTML tag
     *
     * @param {HTML Element} elm
     */
    function newElementWithTag(elm) {
        var o = extractHtmlAttributes(elm),
            pickerElm = document.createElement('div');

        if($(elm).attr('id')) {
            $(pickerElm).attr('id', $(elm).attr('id'));
        }
        $(elm).replaceWith(pickerElm);

        new Cordelia(pickerElm, o);
    }

    /**
     * Installation with HTML attribute
     *
     * @param {HTML Element} elm
     */
    function newElementWithAttribute(elm) {
        $(elm).removeAttr('cordelia');
        var o = extractHtmlAttributes(elm);
        new Cordelia(elm, o);
    }

    /**
     * Extracts attributes from the given HTML element
     *
     * @param {HTML Element} elm
     * @returns {Object}
     */
    function extractHtmlAttributes(elm) {
        var attrs = elm.attributes,
            o = {};

        for(var i=0; i<attrs.length; i++) {
            var attr = attrs[i];

            if(attr.name.indexOf('cordelia-') > -1) {
                var n = attr.name.replace('cordelia-','');
                while(n.indexOf('-') > -1) {
                    var index = n.indexOf('-');
                    if(n[index+1]) {
                        n = n.substring(0, index) + n[index+1].toUpperCase() + n.substring(index+2, n.length);
                    }
                }

                if(defaults[n] !== undefined) {
                    var value = attr.value;

                    if(value == 'true') {
                        value = true;
                    } else if(value == 'false') {
                        value = false;
                    }

                    if(n == 'paletteColors') {
                        value = value.split(',');
                    }

                    o[n] = value;
                }

                $(elm).removeAttr(attr.name);
                i -= 1;
            }
        }

        return o;
    }

    /**
     * Creates a new event and initalizes it.
     *
     * @param {String} name
     * @returns {Event}
     */
    function createEvent(name) {
        var event = document.createEvent('HTMLEvents') || document.createEvent('event');
        event.initEvent(name, false, true);
        return event;
    }

    /**
     * @param {HTML Element} elm
     * @param {Object} o
     * @constructor
     */
    function Cordelia(elm, o) {
        // Stores the HTML Elements.
        this.elm = {};

        this.elm.main = $(elm);

        this.extractAttributes(o);

        // size
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !this.embed) {
            this.size = 'small';
        } else if(this.size != 'small' && this.size != 'large') {
            this.size = 'medium';
        }

        // picker sizes
        this.majorPicker = {};
        this.minorPicker = {};
        this.opacityPicker = {};

        if(this.size == 'small') {
            this.majorPicker.width = 125;
            this.majorPicker.height = 125;
            this.minorPicker.width = 20;
            this.minorPicker.height = 125;
        } else if(this.size == 'medium') {
            this.majorPicker.width = 175;
            this.majorPicker.height = 175;
            this.minorPicker.width = 30;
            this.minorPicker.height = 175;
        } else {
            this.majorPicker.width = 250;
            this.majorPicker.height = 250;
            this.minorPicker.width = 30;
            this.minorPicker.height = 250;
        }
        this.majorPicker.subtractedValue = 9;
        this.minorPicker.subtractedValue = 7;

        if(this.allowOpacity) {
            this.opacityPicker.width = this.minorPicker.width;
            this.opacityPicker.height = this.minorPicker.height;
            this.opacityPicker.subtractedValue = this.minorPicker.subtractedValue;
        }

        if(this.pickerStyle != 0) { this.pickerStyle = 1; }
        if(this.colorFormat != 'rgb' && this.colorFormat != 'rgba' && this.colorFormat != 'hsl' && this.colorFormat != 'hsla') { this.colorFormat = 'hex'; }
        if(!this.color) {
            if(this.allowClearColor) {
                this.color = null;
            } else {
                if(this.colorFormat == 'hex') { this.color = '#FF000'; }
                else if(this.colorFormat == 'rgb') { this.color = 'rgb(255,0,0)'; }
                else if(this.colorFormat == 'rgba') { this.color = 'rgba(255,0,0,1)'; }
                else if(this.colorFormat == 'hsl') { this.color = 'hsl(0,100%,50%)'; }
                else if(this.colorFormat == 'hsla') { this.color = 'hsla(0,100%,50%,1)'; }
            }
        }

        this.init();

        pickers.push(this);
    }

    /**
     * Extracts and merges attributes.
     *
     * @param {Object} o
     */
    Cordelia.prototype.extractAttributes = function(o) {
        for(var i in defaults) {
            if(typeof o[i] !== 'undefined') {
                this[i] = o[i];
            } else {
                this[i] = defaults[i];
            }
        }
    }

    /**
     * Creates html and event listeners.
     */
    Cordelia.prototype.init = function() {
        // Stores the bound function to remove the event listener.
        this.pickerMovedBind = this.pickerMoved.bind(this);
        this.pickerReleasedBind = this.pickerReleased.bind(this);
        this.closePickerBind = this.closePicker.bind(this);
        this.setPositionBind = this.setPosition.bind(this);

        if(!this.embed) {
        	this.elm.main.addClass('cdp-wrapper');
			this.elm.main.addClass('cdp-background-type-opacity');
			this.elm.main.bind('click', this.openPicker.bind(this));

        	this.elm.overlay = $(document.createElement('div'));
            this.elm.overlay.addClass('cdp-wrapper-overlay');
            this.elm.main.append(this.elm.overlay);

            this.elm.picker = $(document.createElement('div'));
            this.elm.picker.css('display', 'none');
            this.elm.overlay.append(this.elm.picker);
        } else {
            this.elm.picker = this.elm.main;
        }
        this.elm.picker.addClass('cdp-container');
        this.elm.picker.attr('cdp-size', this.size);

        // Creates a DOM element to get the color as RGBA using the getRgbaColor function.
        this.elm.rgbaColor = $(document.createElement('div'));
        this.elm.rgbaColor.addClass('cdp-hidden');
        this.elm.picker.append(this.elm.rgbaColor);

        this.rgbaColor = {}; //Holds RGBA values of the current color
        this.rgbaColor.a = 1;
        this.rgbColor = {};  //Holds the latest RGB value to calculate the new value when the picker position is changed on the palette
        this.hslColor = {}; //Holds the latest HSL value to calculate the new value when the picker position is changed on the palette

        // Sets the current and initial colors according to the color type.
        if(this.color) {
            var rgba = this.getRgbaValue(this.color),
                currentColor = this.convertColor(rgba).value;

            this.color = currentColor;
            this.rgbaColor = rgba;
        }
        this.initialColor = currentColor;

        // picker container
        var pickerContainer = $(document.createElement('div'));
        pickerContainer.addClass('cdp-picker-container');
        this.elm.picker.append(pickerContainer);

        this.majorPicker.container = $(document.createElement('div'));
        this.majorPicker.container.addClass('cdp-major-picker');
        pickerContainer.append(this.majorPicker.container);

        this.minorPicker.container = $(document.createElement('div'));
        this.minorPicker.container.addClass('cdp-minor-picker');
        pickerContainer.append(this.minorPicker.container);

        if(this.pickerStyle == 0) {
            this.majorPicker.container.html('<div class="cdp-major-picker-gradient cdp-background-type-current-color"><div class="cdp-major-picker-gradient cdp-gradient-type-lr-white"><div class="cdp-major-picker-gradient cdp-gradient-type-bt-black cdp-last-gradient-child"></div></div></div>');
            this.elm.pickerCurrentColorBackground = this.majorPicker.container.find('.cdp-background-type-current-color');
            this.minorPicker.container.html('<div class="cdp-minor-picker-gradient cdp-gradient-type-tb-colorful cdp-last-gradient-child"></div>');
        } else if(this.pickerStyle == 1) {
            this.majorPicker.container.html('<div class="cdp-major-picker-gradient cdp-gradient-type-lr-colorful"><div class="cdp-major-picker-gradient cdp-gradient-type-bt-gray cdp-last-gradient-child"></div></div>');
            this.minorPicker.container.html('<div class="cdp-minor-picker-gradient cdp-gradient-type-bt-white-current-color-black cdp-last-gradient-child"></div>');
            this.elm.pickerCurrentColorBackground = this.minorPicker.container.find('.cdp-gradient-type-bt-white-current-color-black');
        }

        this.majorPicker.dragger = $(document.createElement('div'));
        this.majorPicker.dragger.addClass('cdp-major-dragger');
        this.majorPicker.container.find('.cdp-last-gradient-child').append(this.majorPicker.dragger);
        this.majorPicker.container.bind('mousedown', function(e) { this.pickerClicked(e, 'major'); }.bind(this));
        this.majorPicker.container.bind('touchstart', function(e) { this.pickerClicked(e, 'major'); }.bind(this));

        this.minorPicker.dragger = $(document.createElement('div'));
        this.minorPicker.dragger.addClass('cdp-minor-dragger');
        this.minorPicker.container.find('.cdp-last-gradient-child').append(this.minorPicker.dragger);
        this.minorPicker.container.bind('mousedown', function(e) { this.pickerClicked(e, 'minor'); }.bind(this));
        this.minorPicker.container.bind('touchstart', function(e) { this.pickerClicked(e, 'minor'); }.bind(this));

        // opacity picker
        if(this.allowOpacity) {
            this.opacityPicker.container = $(document.createElement('div'));
            this.opacityPicker.container.addClass('cdp-opacity-picker');
            this.opacityPicker.container.html('<div class="cdp-opacity-picker-gradient cdp-background-type-opacity"><div class="cdp-opacity-picker-gradient cdp-gradient-type-bt-current-color cdp-last-gradient-child"><div class="cdp-opacity-dragger"></div></div></div>');
            pickerContainer.append(this.opacityPicker.container);
            this.elm.pickerCurrentColorOpacityBackground = this.opacityPicker.container.find('.cdp-gradient-type-bt-current-color');
            this.opacityPicker.dragger = this.opacityPicker.container.find('.cdp-opacity-dragger');
            this.opacityPicker.container.bind('mousedown', function(e) { this.pickerClicked(e, 'opacity'); }.bind(this));
            this.opacityPicker.container.bind('touchstart', function(e) { this.pickerClicked(e, 'opacity'); }.bind(this));
        }

        // console
        if(this.allowClearColor || this.showColorValue || this.showButtons) {
            var consoleContainer = $(document.createElement('div'));
            consoleContainer.addClass('cdp-console-container');
            this.elm.picker.append(consoleContainer);

            // color console
            if(this.allowClearColor || this.showColorValue) {
                var colorConsoleContainer = $(document.createElement('div'));
                colorConsoleContainer.addClass('cdp-color-console-container');
                colorConsoleContainer.addClass('cdp-background-type-opacity');
                consoleContainer.append(colorConsoleContainer);

                this.elm.currentColorConsole = $(document.createElement('div'));
                this.elm.currentColorConsole.addClass('cdp-current-color-console');
                colorConsoleContainer.append(this.elm.currentColorConsole);

                if(this.showColorValue) {
                    this.elm.initialColor = $(document.createElement('div'));
                    this.elm.initialColor.addClass('cdp-initial-color');
                    this.elm.initialColor.html('<i class="cdp-icons"></i>');
                    this.elm.initialColor.bind('click', this.setColorWithInitialColor.bind(this));
                    this.elm.currentColorConsole.before(this.elm.initialColor);

                    this.elm.colorValueInput = $(document.createElement('input'));
                    this.elm.colorValueInput.addClass('cdp-current-color');
                    this.elm.colorValueInput.attr('type', 'text');
                    this.elm.colorValueInput.attr('spellcheck', false);
                    this.elm.colorValueInput.bind('change', function() { this.setColorWithValue(); }.bind(this));
                    this.elm.currentColorConsole.append(this.elm.colorValueInput);

                    this.elm.colorValueInput.value = this.color;
                    this.setInitialColorIcon();
                } else {
                    consoleContainer.addClass('cdp-current-color-non-showing');
                }

                if(this.allowClearColor) {
                    this.elm.clearColor = $(document.createElement('div'));
                    this.elm.clearColor.addClass('cdp-clear-color');
                    this.elm.clearColor.html('<i class="cdp-icons"></i>');

                    this.elm.clearColor.bind('click', function() { this.clearColor(); }.bind(this));
                    this.elm.currentColorConsole.append(this.elm.clearColor);
                } else {
                    consoleContainer.addClass('cdp-clear-color-non-showing');
                }
            } else {
                consoleContainer.addClass('cdp-color-console-non-showing');
            }

            // buttons
            if(this.showButtons) {
                var buttonContainer = $(document.createElement('div'));
                buttonContainer.addClass('cdp-button-container');
                buttonContainer.html('<div class="cdp-button" cdp-function="save"><i class="cdp-icons"></i>SAVE</div><div class="cdp-button" cdp-function="cancel"><i class="cdp-icons"></i>CANCEL</div>');
                consoleContainer.append(buttonContainer);

                var saveButton = buttonContainer.find('div[cdp-function="save"]');
                var cancelButton = buttonContainer.find('div[cdp-function="cancel"]');

                saveButton.bind('click', this.save.bind(this));
                cancelButton.bind('click', this.cancel.bind(this));
            }
        }

        // palette
        if(this.showPalette) {
            var arrowDiv = $(document.createElement('div'));
            arrowDiv.addClass('cdp-arrow-div');
            this.elm.picker.append(arrowDiv);

            var arrowIcon = $(document.createElement('i'));
            arrowIcon.addClass('cdp-icons');
            arrowIcon.bind('click', function() { this.elm.paletteContainer.fadeToggle(100); }.bind(this));
            arrowDiv.append(arrowIcon);

            this.elm.paletteContainer = $(document.createElement('div'));
            this.elm.paletteContainer.css('display', 'none');
            this.elm.paletteContainer.html('<hr class="cdp-palette-line" /><div class="cdp-palette"></div>');
            this.elm.picker.append(this.elm.paletteContainer);

            this.elm.palette = this.elm.picker.find('.cdp-palette');

            if(this.allowPaletteAddColor) {
                var addColor = $(document.createElement('div'));
                addColor.addClass('cdp-palette-add-element');
                addColor.html('<i class="cdp-icons"></i>');
                addColor.bind('click', this.addColorToPalette.bind(this));
                this.elm.palette.append(addColor);
            }

            for(var i=0; i<this.paletteColors.length; i++) {
                (function(i, _this) {
                    var rgba = _this.getRgbaValue(_this.paletteColors[i]);
                    _this.paletteColors[i] = 'rgba('+rgba.r+', '+rgba.g+', '+rgba.b+', '+rgba.a+')';
                    _this.addColorElementToPalette(rgba);
                }(i, this))
            }
        }

        if(this.color) {
            this.setColor(null, false, true, true);
        } else {
            this.clearColor(true);
        }
    }

    /**
     * Sets the color and the position of the picker on the palette and sets the input's value according to the new color.
     *
     * @param {Object} rgba
     * @param {Boolean} eventCall
     * @param {Boolean} input
     * @param {Boolean} picker
     */
    Cordelia.prototype.setColor = function(rgba, eventCall, input, picker) {
        var color,
            _isDark;

        if(rgba) {
            color = this.convertColor(rgba);
            this.rgbaColor = rgba;
        }

        if((color && color.value != this.color) || !rgba) {
            if(rgba) {
                this.color = color.value;
            } else {
                rgba = this.rgbaColor;
            }

            _isDark = isDark(rgba);

            if(!this.embed) {
                this.elm.overlay.css('background', this.color);
            }

            if(this.elm.currentColorConsole) {
                this.elm.currentColorConsole.css('background', this.color);
            }

            if(_isDark) {
                if(this.pickerStyle == 0) { this.majorPicker.dragger.addClass('cdp-dark'); }
                else if(this.pickerStyle == 1) { this.minorPicker.dragger.addClass('cdp-dark'); }
            } else {
                if(this.pickerStyle == 0) { this.majorPicker.dragger.removeClass('cdp-dark'); }
                else if(this.pickerStyle == 1) { this.minorPicker.dragger.removeClass('cdp-dark'); }
            }

            if(this.allowOpacity) {
                if(_isDark || rgba.a < 0.25) {
                    this.opacityPicker.dragger.addClass('cdp-dark');
                } else {
                    this.opacityPicker.dragger.removeClass('cdp-dark');
                }
            }

            if(this.showColorValue) {
                if(input) {
                    this.elm.colorValueInput.val(this.color);
                }

                if(_isDark || rgba.a < 0.4) {
                    this.elm.colorValueInput.addClass('cdp-dark');
                } else {
                    this.elm.colorValueInput.removeClass('cdp-dark');
                }
            }

            if(this.elm.clearColor) {
                if(_isDark || rgba.a < 0.4) {
                    this.elm.clearColor.addClass('cdp-dark');
                } else {
                    this.elm.clearColor.removeClass('cdp-dark');
                }
            }

            if(picker) {
                var hsl = colorConverter.rgbTohsl(rgba);

                if(this.pickerStyle == 0) {
                    this.elm.pickerCurrentColorBackground.css('background', 'hsl('+hsl.h+', 100%, 50%');

                    // major
                    var x = this.majorPicker.height,
                        maxColor = Math.max(rgba.r,rgba.g,rgba.b),
                        topCV = Math.abs(Math.round(((x/255) * maxColor) - x)),
                        minColor = Math.min(rgba.r,rgba.g,rgba.b),
                        leftV = Math.abs(Math.round(((x/255) * minColor) - x)),
                        leftCV = leftV - Math.abs(Math.round((topCV/maxColor) * minColor));
                    this.majorPicker.dragger.css('left', leftCV - this.majorPicker.subtractedValue + 'px');
                    this.majorPicker.dragger.css('top', topCV - this.majorPicker.subtractedValue + 'px');

                    // minor
                    this.minorPicker.dragger.css('left', 'calc(50% - '+this.minorPicker.subtractedValue+'px)');
                    this.minorPicker.dragger.css('top', (Math.round(((this.minorPicker.height) / 360) * hsl.h)) - this.minorPicker.subtractedValue + 'px');

                    var rgb = this.getRgbaValue('hsl('+hsl.h+', 100%, 50%)');
                    this.rgbColor = rgb;
                } else {
                    this.elm.pickerCurrentColorBackground.css('background', 'linear-gradient(to bottom, hsl(0, 100%, 100%), hsl('+hsl.h+', 100%, 50%), hsl(0,0%,0%))');

                    // major
                    var x = this.majorPicker.height,
                        leftCV = Math.round((x/360) * hsl.h),
                        topCV = Math.abs(Math.round(((x/100) * hsl.s) - x));
                    this.majorPicker.dragger.css('left', leftCV - this.majorPicker.subtractedValue + 'px');
                    this.majorPicker.dragger.css('top', topCV - this.majorPicker.subtractedValue + 'px');

                    // minor
                    this.minorPicker.dragger.css('left', 'calc(50% - '+this.minorPicker.subtractedValue+'px)');
                    var y = this.minorPicker.height;
                    this.minorPicker.dragger.css('top', (Math.abs(Math.round(((y/100) * hsl.l) - y))) - this.minorPicker.subtractedValue + 'px');

                    this.hslColor = hsl;
                }

                if(this.allowOpacity) {
                    this.elm.pickerCurrentColorOpacityBackground.css('background', 'linear-gradient(to top, rgba('+rgba.r+', '+rgba.g+', '+rgba.b+', 1), rgba('+rgba.r+', '+rgba.g+', '+rgba.b+', 0))');
                    this.opacityPicker.dragger.css('left', 'calc(50% - '+this.opacityPicker.subtractedValue+'px)');
                    this.opacityPicker.dragger.css('top', Math.round(((this.opacityPicker.height) / 100) * (rgba.a * 100)) - this.opacityPicker.subtractedValue + 'px');
                }
            }

            if(eventCall) {
                this.elm.main[0].dispatchEvent(events.changed);
            }
        }
    }

    /**
     * This function is called when a color is chosen using the picker.
     * Sets the color.
     *
     * @param {Object} event
     * @param {String} type
     */
    Cordelia.prototype.pickerClicked = function(event, type) {
        this.dragStatus = type;
        $('body').addClass('cdp-dragging-active');

        var position;
        if(type == 'major' && this.pickerStyle == 0 && !this.color) {
            position = this.minorPicker.dragger.position();
            this.setColorWithPosition({ x: (position.left + this.minorPicker.subtractedValue), y: (position.top + this.minorPicker.subtractedValue) }, 'minor');
        } else if(type == 'minor' && this.pickerStyle == 1 && !this.color) {
            position = this.majorPicker.dragger.position();
            this.setColorWithPosition({ x: (position.left + this.majorPicker.subtractedValue), y: (position.top + this.majorPicker.subtractedValue) }, 'major');
        } else if(type == 'opacity' && !this.color) {
            if(this.pickerStyle == 0) {
                position = this.minorPicker.dragger.position();
                this.setColorWithPosition({ x: (position.left + this.minorPicker.subtractedValue), y: (position.top + this.minorPicker.subtractedValue) }, 'minor');
            } else {
                position = this.majorPicker.dragger.position();
                this.setColorWithPosition({ x: (position.left + this.majorPicker.subtractedValue), y: (position.top + this.majorPicker.subtractedValue) }, 'major');
            }
        }

        this.pickerMoved(event);
        this.toggleDraggerListeners(true);
    }

    /**
     * This function is called when the picker is moved on the palette. Takes the event object as an argument. Calls the setColorWithPosition() to set the new color.
     *
     * @param {Object} event
     */
    Cordelia.prototype.pickerMoved = function(event) {
        var n;

        if(this.dragStatus == 'major') {
            n = newPosition(event, this.majorPicker);
        } else if(this.dragStatus == 'minor') {
            n = newPosition(event, this.minorPicker);
        } else {
            n = newPosition(event, this.opacityPicker);
        }
        this.setColorWithPosition(n, this.dragStatus, true);

        event.preventDefault();
    }

    /**
     * Sets and returns the new position.
     *
     * @param {Object} event
     * @param {Object} picker
     * @returns {x: Number, y: Number}
     */
    function newPosition(event, picker) {
        var offset = picker.container.offset(),
            eX = (event.clientX) ? event.clientX + window.pageXOffset : event.pageX,
            eY = (event.clientY) ? event.clientY + window.pageYOffset : event.pageY,
            x = eX - (offset.left + picker.subtractedValue),
            y = eY - (offset.top + picker.subtractedValue);

        if(x < -picker.subtractedValue) { x = -picker.subtractedValue; } else if(x > (picker.width - picker.subtractedValue)) { x = picker.width - picker.subtractedValue; }
        if(y < -picker.subtractedValue) { y = -picker.subtractedValue; } else if(y > (picker.height - picker.subtractedValue)) { y = picker.height - picker.subtractedValue; }

        picker.dragger.css('left', x + 'px');
        picker.dragger.css('top', y + 'px');
        return { x:(x + picker.subtractedValue), y:(y + picker.subtractedValue) };
    }

    /**
     * Sets the color according to the new position.
     *
     * @param {Object} n
     * @param {String} type
     * @param {Boolean} eventCall
     */
    Cordelia.prototype.setColorWithPosition = function(n, type, eventCall) {
        eventCall = eventCall || false;

        var newColor;

        if(type == 'major') {
            if(this.pickerStyle == 0) {
                var rgb = [this.rgbColor.r, this.rgbColor.g, this.rgbColor.b],
                    x = this.majorPicker.height,
                    topCV,
                    leftV,
                    leftCV,
                    netV;

                for(var i=0; i<rgb.length; i++) {
                    var v = rgb[i];
                    if(v == 255) {
                        netV = Math.abs(Math.round(((255/x) * n.y) - 255));
                    } else {
                        topCV = Math.round((x - n.y) * (v/x));
                        leftV = Math.round((x - n.x) * ((255-v)/x));
                        leftCV = Math.abs(Math.round((x - n.y) * (leftV/x)));
                        netV = topCV+leftCV;
                    }
                    rgb[i] = netV;
                }

                this.setColor({
                    r: rgb[0],
                    g: rgb[1],
                    b: rgb[2],
                    a: this.rgbaColor.a
                }, eventCall, true, false);

                if(this.allowOpacity) {
                    this.elm.pickerCurrentColorOpacityBackground.css('background', 'linear-gradient(to top, rgba('+rgb[0]+', '+rgb[1]+', '+rgb[2]+', 1), rgba('+rgb[0]+', '+rgb[1]+', '+rgb[2]+', 0))');
                }
            } else if(this.pickerStyle == 1) {
                var x = this.majorPicker.height,
                    h = Math.round(n.x * (360/x)),
                    s = Math.abs(Math.round(n.y * (100/x)) - 100);

                this.elm.pickerCurrentColorBackground.css('background', 'linear-gradient(to bottom, hsl(0, 100%, 100%), hsl('+h+', '+s+'%, 50%), hsl(0, 0%, 0%))');
                this.hslColor.h = h;
                this.hslColor.s = s;

                var position = this.minorPicker.dragger.position(),
                    minorX = position.left + this.minorPicker.subtractedValue,
                    minorY = position.top + this.minorPicker.subtractedValue;

                this.setColorWithPosition({ x:minorX, y:minorY }, 'minor', eventCall);
            }
        } else if(type == 'minor') {
            if(this.pickerStyle == 0) {
                var x = this.minorPicker.height,
                    h = Math.round(n.y * (360/x));

                this.elm.pickerCurrentColorBackground.css('background', 'hsl('+h+', 100%, 50%)');
                var rgb = this.getRgbaValue('hsl('+h+', 100%, 50%)');
                this.rgbColor = rgb;

                var position = this.majorPicker.dragger.position(),
                    majorX = position.left + this.majorPicker.subtractedValue,
                    majorY = position.top + this.majorPicker.subtractedValue;

                this.setColorWithPosition({ x:majorX, y:majorY }, 'major', eventCall);
            } else if(this.pickerStyle == 1) {
                var x = this.minorPicker.height,
                    l = Math.abs(Math.round(n.y * (100/x)) - 100);
                this.hslColor.l = l;

                var rgba = this.getRgbaValue('hsl('+this.hslColor.h+', '+this.hslColor.s+'%, '+this.hslColor.l+'%)');

                this.setColor({
                    r: rgba.r,
                    g: rgba.g,
                    b: rgba.b,
                    a: this.rgbaColor.a
                }, eventCall, true, false);

                if(this.allowOpacity) {
                    this.elm.pickerCurrentColorOpacityBackground.css('background', 'linear-gradient(to top, rgba('+rgba.r+', '+rgba.g+', '+rgba.b+', 1), rgba('+rgba.r+', '+rgba.g+', '+rgba.b+', 0))');
                }
            }
        } else if(type == 'opacity') {
            var x = this.opacityPicker.height,
                a = Math.round((100/x) * n.y) / 100;

            this.setColor({
                r: this.rgbaColor.r,
                g: this.rgbaColor.g,
                b: this.rgbaColor.b,
                a: a
            }, eventCall, true, false);
        }
    }

    /**
     * Ends the dragging.
     */
    Cordelia.prototype.pickerReleased = function() {
        $('body').removeClass('cdp-dragging-active');
        this.toggleDraggerListeners(false);
    }

    /**
     * Toggles dragger listeners according to status.
     *
     * @param {Boolean} status
     */
    Cordelia.prototype.toggleDraggerListeners = function(status) {
        if(status) {
			$(document).bind('mousemove', this.pickerMovedBind);
            $(document).bind('touchmove', this.pickerMovedBind);
            $(document).bind('mouseup', this.pickerReleasedBind);
            $(document).bind('touchend', this.pickerReleasedBind);
        } else {
            $(document).unbind('mousemove', this.pickerMovedBind);
            $(document).unbind('touchmove', this.pickerMovedBind);
            $(document).unbind('mouseup', this.pickerReleasedBind);
            $(document).unbind('touchend', this.pickerReleasedBind);
        }
    }

    /**
     * This function is called when the input's value is changed.
     * Sets the new color.
     *
     * @param  {null|String} value
     * @param  {Boolean} passed
     */
    Cordelia.prototype.setColorWithValue = function(value, passed) {
        var value = this.elm.colorValueInput.val();
        if(value.trim() && value != this.color) {
            var rgba = this.getRgbaValue(value);
            this.setColor(rgba, true, false, true);
        }
    }

    /**
     *  Sets the initial color as current color.
     */
    Cordelia.prototype.setColorWithInitialColor = function() {
        if(this.initialColor != this.color) {
            if(this.initialColor) {
                var rgba = this.getRgbaValue(this.initialColor);
                this.setColor(rgba, true, true, true);
            } else {
                this.clearColor();
            }
        }
    }

    /**
     * Clears the color.
     *
     * @param {Boolean} pass
     */
    Cordelia.prototype.clearColor = function(pass) {
        pass = pass || false;

        if(this.color || pass) {
            this.majorPicker.dragger.css('left', this.majorPicker.subtractedValue * -1 + 'px');
            this.majorPicker.dragger.css('top', this.majorPicker.subtractedValue * -1 + 'px');
            this.minorPicker.dragger.css('left', 'calc(50% - '+this.minorPicker.subtractedValue+'px)');
            this.minorPicker.dragger.css('top', this.minorPicker.subtractedValue * -1 + 'px');

            this.rgbaColor.a = 1;

            if(this.pickerStyle == 0) {
                this.elm.pickerCurrentColorBackground.css('background', 'hsl(0,100%,50%)');
                this.majorPicker.dragger.addClass('cdp-dark');
            } else if(this.pickerStyle == 1) {
                this.elm.pickerCurrentColorBackground.css('background', 'linear-gradient(to bottom, hsl(0,100%,100%), hsl(0,100%,50%), hsl(0,0%,0%))');
                this.minorPicker.dragger.addClass('cdp-dark');
            }

            if(this.allowOpacity) {
                this.elm.pickerCurrentColorOpacityBackground.css('background', 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))');
                this.opacityPicker.dragger.css('left', 'calc(50% - '+this.opacityPicker.subtractedValue+'px)');
                this.opacityPicker.dragger.css('top', this.opacityPicker.height - this.opacityPicker.subtractedValue + 'px');
                this.opacityPicker.dragger.addClass('cdp-dark');
            }

            if(this.showColorValue) {
                this.elm.colorValueInput.val('');
                this.elm.colorValueInput.addClass('cdp-dark');
            }
            this.elm.currentColorConsole.css('background', 'transparent');
            this.elm.clearColor.addClass('cdp-dark');

            if(!this.embed) {
                this.elm.overlay.css('background', 'transparent');
            }

            if(!pass) {
                this.color = null;
                this.elm.main[0].dispatchEvent(events.changed);
            }
        }
    }

    /**
     * Adds a color element to the palette.
     *
     * @param {Object} rgba
     */
    Cordelia.prototype.addColorElementToPalette = function(rgba) {
        var color = 'rgba('+rgba.r+', '+rgba.g+', '+rgba.b+', '+rgba.a+')',
            paletteElement = $(document.createElement('div'));
        paletteElement.addClass('cdp-palette-element');
        paletteElement.addClass('cdp-background-type-opacity');
        paletteElement.html('<div style="background:'+color+';"></div>');
        paletteElement.bind('click', function() { this.setColorFromPalette(rgba); }.bind(this));
        this.elm.palette.append(paletteElement);
    }

    /**
     * Adds a color to the palette.
     */
    Cordelia.prototype.addColorToPalette = function() {
        var color = 'rgba('+this.rgbaColor.r+', '+this.rgbaColor.g+', '+this.rgbaColor.b+', '+this.rgbaColor.a+')';

        if(this.color && this.paletteColors.indexOf(color) == -1) {
            this.paletteColors.push(color);
            this.addColorElementToPalette(this.rgbaColor);
        }
    }

    /**
     * Sets the selected color as current color.
     *
     * @param {Object} rgba
     */
    Cordelia.prototype.setColorFromPalette = function(rgba) {
        this.setColor(rgba, true, true, true);
    }

    /**
     *  Sets the color of the icon of initial color according to initial color.
     */
    Cordelia.prototype.setInitialColorIcon = function() {
        if(!this.initialColor) {
            this.elm.initialColor.css('background', 'transparent');
            this.elm.initialColor.addClass('cdp-dark');
        } else {
            this.elm.initialColor.css('background', this.initialColor);

            var rgba = this.getRgbaValue(this.initialColor),
                _isDark = isDark(rgba);

            if(_isDark || rgba.a < 0.4) {
                this.elm.initialColor.addClass('cdp-dark');
            } else {
                this.elm.initialColor.removeClass('cdp-dark');
            }
        }
    }

    /**
     * Checks if a color is dark or not.
     *
     * @param {Object} rgb
     * @returns {Boolean}
     */
    function isDark(rgb) {
        var dark = Math.round(((rgb.r * 299) +
            (rgb.g * 587) +
            (rgb.b * 114)) / 1000);

        return (dark > 125) ? true : false;
    }

    /**
     * Shows the color picker.
     */
    Cordelia.prototype.openPicker = function() {
    	var display = this.elm.picker.css('display');
        if(display == 'none' && !this.animationProcessing) {
            this.animationProcessing = true;

            if(!this.embed) {
                this.elm.picker.addClass('cdp-visibility-hidden');
                this.setPosition();
                this.elm.picker.removeClass('cdp-visibility-hidden');
            }

            $(this.elm.picker[0]).fadeIn(100, function() {
                this.animationProcessing = false;
            }.bind(this));

            if(this.embed == false) {
                $(window).bind('resize', this.setPositionBind);

                if(this.showButtons == false) {
                    $(document).bind('mousedown', this.closePickerBind);
                    $(document).bind('touchstart', this.closePickerBind);
                }
            }

            this.elm.main[0].dispatchEvent(events.open);
        }
    }

    /**
     * Closes picker if the click target is not the picker itself.
     *
     * @param {Object} event
     * @param {Boolean} pass
     */
    Cordelia.prototype.closePicker = function(event, pass) {
        if(((event && !this.elm.picker[0].contains(event.target)) || pass) && !this.animationProcessing) {
            this.animationProcessing = true;

            this.elm.picker.fadeOut(100, function() {
                this.animationProcessing = false;
            }.bind(this));

            if(this.embed == false) {
                $(window).unbind('resize', this.setPositionBind);

                if(this.showButtons == false) {
                    $(document).unbind('mousedown', this.closePickerBind);
                    $(document).unbind('touchstart', this.closePickerBind);
                }
            }

            this.elm.main[0].dispatchEvent(events.close);
        }
    }

    /**
     * Sets the picker's position.
     */
    Cordelia.prototype.setPosition = function() {
        var offset = this.elm.main.offset(),
            left = offset.left,
            top = offset.top,
            x = left + this.elm.picker.width() + 20,
            _x = left - this.elm.picker.width(),
            y = top + this.elm.picker.height() + 50,
            _y = top - (this.elm.picker.height() + 10),
            w = $(window).width() + window.pageXOffset,
            h = $(window).height() + window.pageYOffset;

        if (x >= w && _x > 0) {
            this.elm.picker.addClass('cdp-right');
        } else {
            this.elm.picker.removeClass('cdp-right');
        }

        if (y >= h && _y > 0) {
            this.elm.picker.addClass('cdp-bottom');
        } else {
            this.elm.picker.removeClass('cdp-bottom');
        }
    }

    /**
     * Returns the current color.
     *
     * @returns {Object}
     */
    Cordelia.prototype.get = function() {
        return (!this.color) ? {value:null} : this.convertColor(this.rgbaColor);
    }

    /**
     * Sets a new color.
     *
     * @param {String} newColor
     */
    Cordelia.prototype.set = function(newColor) {
        if(!newColor && this.allowClearColor) {
            this.clearColor();
        } else if(!newColor) {
            newColor = this.color;
        } else {
            var rgba = this.getRgbaValue(newColor);
            this.setColor(rgba, true, true, true);
        }
    }

    /**
     * Shows the picker.
     */
    Cordelia.prototype.show = function() {
        this.openPicker();
    }

    /**
     * Hides the picker.
     */
    Cordelia.prototype.hide = function() {
        var display = this.elm.picker.css('display');
        if(display != 'none') {
            this.closePicker(null, true);
        }
    }

    /**
     * Sets current color as initial color and fires the save callback.
     */
    Cordelia.prototype.save = function() {
        this.initialColor = this.color;

        if(this.showColorValue) {
            this.setInitialColorIcon();
        }

        if(!this.embed) {
            this.hide();
        }

        this.elm.main[0].dispatchEvent(events.save);
    }

    /**
     * Sets initial color as current color and fires the cancel callback.
     */
    Cordelia.prototype.cancel = function() {
        this.setColorWithInitialColor();

        if(!this.embed) {
            this.hide();
        }

        this.elm.main[0].dispatchEvent(events.cancel);
    }

    /**
     * Converts any color type to RGBA with getComputedStyle.
     *
     * @param {String} color
     * @retuns {Object}
     */
    Cordelia.prototype.getRgbaValue = function(color) {
        this.elm.rgbaColor.css('background', color);

        var backgroundValue = this.elm.rgbaColor.css('background-color'),
            rgba = backgroundValue.replace(/^(rgb|rgba)\(/,'').replace(/\)$/,'').replace(/\s/g,'').split(',');

        return {
            r: parseInt(rgba[0]),
            g: parseInt(rgba[1]),
            b: parseInt(rgba[2]),
            a: (rgba[3]) ? parseFloat(rgba[3]) : 1
        };
    }

    /**
     * Converts and returns the current color according to the selected format that user chose.
     *
     * @param {Object} rgba
     * @returns {Object}
     */
    Cordelia.prototype.convertColor = function(rgba) {
        var r = rgba.r,
            g = rgba.g,
            b = rgba.b,
            a = rgba.a;

        if(a == 1 || !this.allowOpacity) {
            if(this.colorFormat == 'hex') {
                return { value:colorConverter.rgbTohex({ r:r, g:g, b:b }) };
            } else if(this.colorFormat == 'rgb') {
                return { value:'rgb('+r+','+g+','+b+')', r:r, g:g, b:b };
            } else if(this.colorFormat == 'rgba') {
                return { value:'rgba('+r+','+g+','+b+',1)', r:r, g:g, b:b, a:1 };
            } else {
                var hsl = colorConverter.rgbTohsl({ r:r, g:g, b:b });
                if(this.colorFormat == 'hsl') {
                    return  { value:'hsl('+hsl.h+','+hsl.s+'%,'+hsl.l+'%)', h:hsl.h, s:hsl.s, l:hsl.l };
                } else {
                    return  { value:'hsla('+hsl.h+','+hsl.s+'%,'+hsl.l+'%,1)', h:hsl.h, s:hsl.s, l:hsl.l, a:1 };
                }
            }
        } else {
            if(this.colorFormat != 'hsl' && this.colorFormat != 'hsla') {
                return { value:'rgba('+r+','+g+','+b+','+a+')', r:r, g:g, b:b, a:a };
            } else {
                var hsl = colorConverter.rgbTohsl({ r:r, g:g, b:b });
                return  { value:'hsla('+hsl.h+','+hsl.s+'%,'+hsl.l+'%,'+a+')', h:hsl.h, s:hsl.s, l:hsl.l, a:a };
            }
        }
    }

    var colorConverter = {
        rgbTohex: function(rgb) {
            var hex = '#' +
                ('0' + parseInt(rgb.r,10).toString(16)).slice(-2) +
                ('0' + parseInt(rgb.g,10).toString(16)).slice(-2) +
                ('0' + parseInt(rgb.b,10).toString(16)).slice(-2);

            return hex.toUpperCase();
        },
        rgbTohsl: function(rgb) {
            var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
            var maxColor = Math.max(r,g,b);
            var minColor = Math.min(r,g,b);
            // calculate L:
            var l = (maxColor + minColor) / 2 ;
            var s = 0;
            var h = 0;
            if(maxColor != minColor){
                // calculate S:
                if(l < 0.5){
                    s = (maxColor - minColor) / (maxColor + minColor);
                }else{
                    s = (maxColor - minColor) / (2.0 - maxColor - minColor);
                }
                // calculate h:
                if(r == maxColor){
                    h = (g-b) / (maxColor - minColor);
                }else if(g == maxColor){
                    h = 2.0 + (b - r) / (maxColor - minColor);
                }else{
                    h = 4.0 + (r - g) / (maxColor - minColor);
                }
            }

            l = Math.round(l * 100);
            s = Math.round(s * 100);
            h = Math.round(h * 60);
            if(h<0){
                h += 360;
            }

            return {h:h, s:s, l:l};
        }
    };
}));