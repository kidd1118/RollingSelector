window.DTBoardReport = (function($) {
    $.ajaxSetup({
        timeout: 120 * 1000
    });

    /**
     * get parameter form url query parameter
     */
    var params = (function() {
        if (
            window.location.host
                .toString()
                .toLowerCase()
                .indexOf("localhost") >= 0 ||
            window.location
                .toString()
                .toLowerCase()
                .indexOf("172.16.49") >= 0
        ) {
            //local paramter for testing
            return {
                lang: getParameterByName("lang")
                    ? getParameterByName("lang")
                    : window.viewDataCollection
                    ? window.viewDataCollection.lang
                    : "en-US",
                gameToken:
                    getParameterByName("gameToken") || (window.slotContainer ? window.slotContainer.gameToken : ""),
                // IPD-1942
                commonapisite: window.commonapisite || getParameterByName("commonapi"),
                infoUrl: window.infoUrl ? window.infoUrl + "/" : "./",
                bucode: window.viewDataCollection ? window.viewDataCollection.bucode : getParameterByName("bucode"),
                currencyISOCode: window.lunchParams
                    ? window.lunchParams.currencyISOCode
                    : getParameterByName("currencyISOCode") ||
                      (window.slotContainer ? window.slotContainer.currencyISOCode : ""),
                load: {
                    page: window.lunchParams
                        ? window.lunchParams.page
                        : window.viewDataCollection
                        ? window.viewDataCollection.page
                        : Number(getParameterByName("page")),
                    filter: window.lunchParams
                        ? window.lunchParams.filter
                        : window.viewDataCollection
                        ? window.viewDataCollection.filter
                        : getParameterByName("filter") || "Dragon"
                },
                refresh: function() {
                    this.load = {
                        page: window.lunchParams
                            ? window.lunchParams.page
                            : window.viewDataCollection
                            ? window.viewDataCollection.page
                            : Number(getParameterByName("page")),
                        filter: window.lunchParams
                            ? window.lunchParams.filter
                            : window.viewDataCollection
                            ? window.viewDataCollection.filter
                            : getParameterByName("filter") || "Dragon"
                    };
                    currencyISOCode: window.lunchParams
                        ? window.lunchParams.currencyISOCode
                        : getParameterByName("currencyISOCode") ||
                          (window.slotContainer ? window.slotContainer.currencyISOCode : "");
                }
            };
        }
        return {
            lang: getParameterByName("lang")
                ? getParameterByName("lang")
                : window.viewDataCollection
                ? window.viewDataCollection.lang
                : "en-US",
            gameToken: getParameterByName("gameToken") || (window.slotContainer ? window.slotContainer.gameToken : ""),
            // IPD-1942
            commonapisite: window.commonapisite || getParameterByName("commonapi"),
            infoUrl: window.infoUrl ? window.infoUrl + "/" : "./",
            bucode: window.viewDataCollection ? window.viewDataCollection.bucode : getParameterByName("bucode"),
            currencyISOCode: window.lunchParams
                ? window.lunchParams.currencyISOCode
                : getParameterByName("currencyISOCode") ||
                  (window.slotContainer ? window.slotContainer.currencyISOCode : ""),
            load: {
                page: window.lunchParams
                    ? window.lunchParams.page
                    : window.viewDataCollection
                    ? window.viewDataCollection.page
                    : Number(getParameterByName("page")),
                filter: window.lunchParams
                    ? window.lunchParams.filter
                    : window.viewDataCollection
                    ? window.viewDataCollection.filter
                    : getParameterByName("filter") || "Dragon"
            },
            refresh: function() {
                this.load = {
                    page: window.lunchParams
                        ? window.lunchParams.page
                        : window.viewDataCollection
                        ? window.viewDataCollection.page
                        : Number(getParameterByName("page")),
                    filter: window.lunchParams
                        ? window.lunchParams.filter
                        : window.viewDataCollection
                        ? window.viewDataCollection.filter
                        : getParameterByName("filter") || "Dragon"
                };
                currencyISOCode: window.lunchParams
                    ? window.lunchParams.currencyISOCode
                    : getParameterByName("currencyISOCode") ||
                      (window.slotContainer ? window.slotContainer.currencyISOCode : "");
            }
        };

        function getParameterByName(name, url) {
            url = url || window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return "";
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
    })();

    /**
     * QAT-35523 如果client亂打language code, 打API也會用亂打的帶出去, 然後就壞了~
     * 所以用這個方法回傳一個安全的culture name給API溝通用, 預設是 en-us
     *
     * @returns {*}
     */
    var getSafeCultureName = function() {
        var availableLanguages = ["en-us", "zh-cn"];
        var l = params.lang;
        for (var i = 0; i < availableLanguages.length; i++) {
            if (l.toLowerCase() === availableLanguages[i]) {
                return l;
            }
        }
        return availableLanguages && availableLanguages.length > 0 ? availableLanguages[0] : "en-us";
    };

    /**
     * Grid for dataSet
     */
    var Grid = (function() {
        var instance = function(opt) {
            this._options = opt || {
                isRowClick: false,
                rowTitle: false,
                hasHeader: false
            };
            this._root = $("<div/>").addClass("grid");
            this._noDataRow;
            this._columns = [];
            this._rows = [];
            this._wrapIndex = 0;

            if (this._options.hasHeader) {
                this._header = $("<div/>")
                    .addClass("title row")
                    .appendTo(this._root);
            }
        };
        instance.prototype = {
            addColumn: function(col) {
                this._columns[col.name] = col;
                if (this._header) {
                    this._header.append(
                        $("<div/>")
                            .addClass("cell " + (col.class || ""))
                            .text(col.label)
                    );
                }
            },
            addColumns: function(cols) {
                for (var i in cols.cols) {
                    var col = cols.cols[i];
                    col.wrapIndex = this._wrapIndex;
                    this.addColumn(col);
                }
                this._wrapIndex++;
            },
            addRow: function(data, title, css) {
                this._noDataRow && this._noDataRow.remove();

                var _this = this,
                    wrapCells = [],
                    $text = null,
                    $cel = null,
                    $row = $("<div/>")
                        .addClass(this._rows.length % 2 === 0 ? "row even" : "row odd")
                        .css(css || {})
                        .appendTo(this._root);

                if (this._options.rowTitle && title) {
                    var rowTitle = $("<div/>")
                        .addClass("rowTitle")
                        .text(title)
                        .appendTo($row);
                }

                for (var i in this._columns) {
                    var _data = data ? (this._columns[i].format ? this._columns[i].format(data[i]) : data[i]) : "";
                    if (this._columns[i].hide || _data === null) {
                        continue;
                    }
                    $cel = $("<div/>").addClass("cell");

                    if (this._columns[i].class) $cel.addClass(this._columns[i].class);

                    if (typeof _data == "string" || typeof _data == "number") {
                        if (_data == undefined || _data == null) {
                            $cel.text("");
                        } else {
                            $text = $("<span/>")
                                .addClass("text")
                                .html(_data);
                            $cel.append($text);
                        }
                    } else if (_data instanceof $) {
                        $cel.append(_data.addClass("text"));
                    }

                    if (isNaN(this._columns[i].wrapIndex)) {
                        $cel.appendTo($row);
                    } else {
                        var $cellWrap = wrapCells[this._columns[i].wrapIndex];

                        if (!$cellWrap) {
                            $cellWrap = $("<div/>")
                                .addClass("cell-wrap cell")
                                .appendTo($row);
                            wrapCells.push($cellWrap);
                        }
                        $cel.appendTo($cellWrap);
                    }
                }
                Utility.autoTextFill($row);

                $row.data("data", data);
                if (this._options.isRowClick) {
                    $("<div/>")
                        .addClass("detail")
                        .addClass("icon-icon_next")
                        .appendTo($row);
                    $row.click(function() {
                        $(_this).trigger($.Event("clickRow", [$(this).data("data"), $(this)])); //custom event
                    });
                }
                this._rows.push($row);
            },
            render: function($parent) {
                $parent && $parent.append(this._root);
            },
            on: function(evt, func) {
                $(this).on(evt, func);
            },
            clear: function() {
                this._root.empty();

                this._noDataRow =
                    this._noDataRow ||
                    $("<div/>")
                        .addClass("row even")
                        .append(
                            $("<div/>")
                                .addClass("cell")
                                .text(lang("label.noData"))
                        );
                this._noDataRow.appendTo(this._root);
                for (var i in this._rows) this._rows[i].remove();
                this._rows.length = 0;
            },
            show: function() {
                this._root.show();
            },
            hide: function() {
                this._root.hide();
            },
            displayColumns: function(columnsName) {
                //column index 0 to N, type is array
                for (var i in this._columns) {
                    if (columnsName.indexOf(i) > -1) {
                        this._columns[i].hide = false;
                    } else {
                        this._columns[i].hide = true;
                    }
                }
            },
            resize: function() {
                for (var i in this._rows) {
                    Utility.autoTextFill(this._rows[i]);
                }
            }
        };
        return instance;
    })();

    var Utility = {
        formatQueryDate: function(date) {
            return (
                Utility.padLeft(date.getUTCFullYear(), 2) +
                "-" +
                Utility.padLeft(date.getUTCMonth() + 1, 2) +
                "-" +
                Utility.padLeft(date.getUTCDate(), 2)
            );
        },
        //QAT-32866 api來的時區不固定，不轉時區直接顯示
        formatDate: function(date, seperator) {
            var d = new Date(date);
            d.setTime(d.getTime() - 4 * 60 * 60 * 1000);
            return (
                Utility.padLeft(d.getUTCFullYear(), 2) +
                (seperator || "/") +
                Utility.padLeft(d.getUTCMonth() + 1, 2) +
                (seperator || "/") +
                Utility.padLeft(d.getUTCDate(), 2)
            );
        },
        //QAT-32866 api來的時區不固定，不轉時區直接顯示
        formatDateTime: function(date, seperator) {
            var d = new Date(date);
            d.setTime(d.getTime() - 4 * 60 * 60 * 1000);
            return (
                Utility.formatDate(date, seperator) +
                " " +
                Utility.padLeft(d.getUTCHours(), 2) +
                ":" +
                Utility.padLeft(d.getUTCMinutes(), 2) +
                ":" +
                Utility.padLeft(d.getUTCSeconds(), 2)
            );
        },
        //QAT-32866 api來的時區不固定，不轉時區直接顯示
        formatTime: function(date, seperator) {
            var d = new Date(date);
            d.setTime(d.getTime() - 4 * 60 * 60 * 1000);
            var h = d.getUTCHours(),
                apm = h < 12 ? "AM" : "PM";

            return (
                Utility.padLeft(h < 12 ? (h == 0 ? 12 : h) : 24 - h, 2) +
                (seperator || ":") +
                Utility.padLeft(d.getUTCMinutes(), 2) +
                " " +
                apm
            );
        },
        formatNumber: function(num, precision, separator) {
            var parts;
            if (!isNaN(parseFloat(num)) && isFinite(num)) {
                num = Number(num);
                num = (typeof precision !== "undefined" ? num.toFixed(precision) : num).toString();
                parts = num.split(".");
                parts[0] = parts[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1" + (separator || ","));

                return parts.join(".");
            }
            return num;
        },
        padLeft: function(str, max) {
            str = str.toString();
            return str.length < max ? Utility.padLeft("0" + str, max) : str;
        },
        autoTextFill: function($row) {
            var minFontSize = 6;
            var f = (function(r) {
                var row = r.css("font-size", "");
                return function() {
                    var fixedFontSize = parseInt(row.css("font-size"), 10);
                    row.find(".cell").each(function() {
                        var $cell = $(this),
                            cell_w = $cell.innerWidth(),
                            text_w = $cell.children(".text")[0] ? $cell.children(".text").outerWidth() : 0;
                        if (text_w > 0 && cell_w > 0 && text_w >= cell_w) {
                            fixedFontSize = Math.min((fixedFontSize * cell_w) / text_w - 1, fixedFontSize);
                        }
                    });
                    row.css("font-size", Math.max(fixedFontSize, minFontSize));
                };
            })($row);
            setTimeout(f, 0); //need to delay for correct width.
        }
    };

    /**
     * menu base
     */
    var MenuBase = (function() {
        var instance = function(opt) {
            this._options = $.extend(
                {
                    verticalPadding: 20,
                    horizionPadding: 20,
                    maxHeight: null,
                    maxWidth: null
                },
                opt || {}
            );

            this._root = $("<div/>").addClass("menu");
            this._content = $("<div/>")
                .css({
                    padding: this._options.verticalPadding + "px " + this._options.horizionPadding + "px",
                    maxHeight: this._options.maxHeight + "px",
                    maxWidth: this._options.maxWidth + "px"
                })
                .appendTo(this._root);

            this._list = {};
            this._value = null;

            this.hide();
            //this._root.get(0).addEventListener('touchmove', function () {
            //    event.cancelBubble = true;
            //    event.stopPropagation();
            //    return false;
            //});
        };
        instance.prototype = {
            render: function($parent) {
                $parent && $parent.append(this._root);
            },
            on: function(evt, func) {
                $(this).on(evt, func);
            },
            show: function() {
                this._root.show();
            },
            hide: function() {
                this._root.hide();
            },
            val: function(v) {
                if (v == undefined) return this._value;
                if (this.exist(v)) {
                    this._value = v;
                }
            },
            text: function() {
                return this._list && this._list[this._value] ? this._list[this._value].text() : this._value;
            },
            position: function(pos) {
                this._root.css({
                    top: Math.max(0, Math.min(window.innerHeight - this._root.outerHeight(), pos.top)),
                    left: Math.max(0, Math.min(window.innerWidth - this._root.outerWidth(), pos.left))
                });
            },
            height: function() {
                return this._height || this._root.height() /*+ this._options.verticalPadding * 2*/;
            },
            width: function() {
                return this._width || this._root.width() /*+ this._options.horizionPadding * 2*/;
            },
            visibility: function() {
                return this._root.is(":visible");
            },
            clear: function() {
                this._list = {};
                this._value = null;
                this._root.children().empty();
            },
            addOption: function(v, t) {
                this._list[v] = (function(me, value) {
                    return $("<div/>")
                        .addClass("cell")
                        .text(t)
                        .appendTo(me._content)
                        .on(
                            "click",
                            function() {
                                this.val(value);
                                $(this).trigger($.Event("change", [value]));
                            }.bind(me)
                        );
                })(this, v);
            },
            exist: function(v) {
                if (this._list[v]) {
                    return true;
                } else return false;
            },
            css: function css(c) {
                this._root.css(c);
            }
        };
        return instance;
    })();

    /**
     * date picker
     */
    var DatePicker = (function() {
        var instance = function(opt) {
            this._options = $.extend(
                {
                    cellHeight: 50,
                    cellWidth: 120,
                    verticalPadding: 10,
                    rowNum: 40, //上下各多少個
                    reelNum: 3
                },
                opt || {}
            );

            var visibleNum = 3,
                relativeLeft = 15,
                cHeight = this._options.cellHeight, //cell
                cWidth = this._options.cellWidth, //cell
                rHeight = cHeight * visibleNum, //reel
                vPadding = this._options.verticalPadding;

            (this._height = cHeight * visibleNum + vPadding * 2), (this._width = cWidth * this._options.reelNum);
            this._value = null;
            this._timeout = null;

            this._root = $("<div/>")
                .addClass("menu datePicker")
                .css({
                    padding: vPadding + "px 0",
                    "max-width": "100%"
                })
                .width(this._width + relativeLeft); //relativeLeft is mask

            this._date = $("<div/>")
                .css({ left: "2%" })
                .width("33%")
                .height(rHeight)
                .addClass("date")
                .appendTo(this._root)
                .on(
                    "scroll",
                    function() {
                        var index = Math.round(this._date.scrollTop() / cHeight);

                        this._timeout && clearTimeout(this._timeout);
                        this._timeout = setTimeout(
                            function() {
                                this._date.stop().animate(
                                    { scrollTop: index * cHeight },
                                    "fast",
                                    function() {
                                        var cell = this._date.children(":eq(" + (index + 1) + ")");
                                        var millis = Number(cell.attr("millis"));
                                        var d = new Date(millis);
                                        this.setDate(d);
                                    }.bind(this)
                                );
                            }.bind(this),
                            250
                        );
                    }.bind(this)
                );

            this._month = $("<div/>")
                .css({ left: "-5%" })
                .width("33%")
                .height(rHeight)
                .addClass("month")
                .appendTo(this._root)
                .on(
                    "scroll",
                    function() {
                        var index = Math.round(this._month.scrollTop() / cHeight);

                        this._timeout && clearTimeout(this._timeout);
                        this._timeout = setTimeout(
                            function() {
                                this._month.stop().animate(
                                    { scrollTop: index * cHeight },
                                    "fast",
                                    function() {
                                        var cell = this._month.children(":eq(" + (index + 1) + ")");
                                        var millis = Number(cell.attr("millis"));
                                        var d = new Date(millis);
                                        this.setDate(d);
                                    }.bind(this)
                                );
                            }.bind(this),
                            250
                        );
                    }.bind(this)
                );

            this._year = $("<div/>")
                .css({ left: "-7%" })
                .width("33%")
                .height(rHeight)
                .addClass("year")
                .appendTo(this._root)
                .on(
                    "scroll",
                    function() {
                        //clearTimeout($.data(this, "scrollCheck"));
                        //$.data(this, "scrollCheck", setTimeout(function () {
                        //    $output.html(stopped);
                        //}, 250));

                        var index = Math.round(this._year.scrollTop() / cHeight);

                        this._timeout && clearTimeout(this._timeout);
                        this._timeout = setTimeout(
                            function() {
                                this._year.stop().animate(
                                    { scrollTop: index * cHeight },
                                    "fast",
                                    function() {
                                        var cell = this._year.children(":eq(" + (index + 1) + ")");
                                        var millis = Number(cell.attr("millis"));
                                        var d = new Date(millis);
                                        this.setDate(d);
                                    }.bind(this)
                                );
                            }.bind(this),
                            250
                        );
                    }.bind(this)
                );

            //mask
            $("<div/>")
                .css({ left: relativeLeft * -2 + "px" })
                .width("1%")
                .height(rHeight)
                .appendTo(this._root);

            this.year;
            this.month;
            this.date;
            this.today();

            this._year.get(0).addEventListener("touchmove", function() {
                event.cancelBubble = true;
                event.stopPropagation();
                return false;
            });
            this._month.get(0).addEventListener("touchmove", function() {
                event.cancelBubble = true;
                event.stopPropagation();
                return false;
            });
            this._date.get(0).addEventListener("touchmove", function() {
                event.cancelBubble = true;
                event.stopPropagation();
                return false;
            });
        };
        $.extend(instance.prototype, MenuBase.prototype, {
            today: function() {
                var now = new Date();
                this.setDate(now);
            },
            build: function(date) {
                var _this = this,
                    h = this._options.cellHeight,
                    w = this._options.cellWidth,
                    now = new Date(),
                    month = date.getMonth();

                this._year.empty();
                this._month.empty();
                this._date.empty();

                for (var i = this.year - this._options.rowNum; i <= this.year + this._options.rowNum; i++) {
                    var d = new Date(date);
                    d.setFullYear(i);
                    var cell = $("<div/>")
                        .addClass("cell")
                        .css("line-height", h + "px")
                        .text(i)
                        .attr("millis", d.getTime())
                        .on("click", onClick);

                    if (d.getFullYear() == this.year) {
                        cell.addClass("focus");
                    }
                    this._year.append(cell);
                }

                for (var i = -this._options.rowNum; i <= this._options.rowNum; i++) {
                    var d = new Date(date);
                    var oDay = d.getDate();
                    d.setMonth(month + i);

                    if (d.getDate() != oDay) {
                        d.setMonth(d.getMonth() - 1);
                        d.setDate(28);
                    }

                    var cell = $("<div/>")
                        .addClass("cell")
                        .css("line-height", h + "px")
                        .text(d.getMonth() + 1)
                        .attr("millis", d.getTime())
                        .on("click", onClick);

                    if (d.getFullYear() == this.year && d.getMonth() == this.month) {
                        cell.addClass("focus");
                    }
                    this._month.append(cell);
                }

                for (var i = -this._options.rowNum; i <= this._options.rowNum; i++) {
                    var d = new Date(date);
                    d.setDate(this.date + i);

                    var cell = $("<div/>")
                        .addClass("cell")
                        .css("line-height", h + "px")
                        .text(d.getDate())
                        .attr("millis", d.getTime())
                        .on("click", onClick);

                    if (d.getFullYear() == this.year && d.getMonth() == this.month && d.getDate() == this.date) {
                        cell.addClass("focus");
                    }
                    this._date.append(cell);
                }

                function onClick() {
                    var millis = Number($(this).attr("millis"));
                    var d = new Date(millis);
                    _this.setDate(d);
                }
            },
            setDate: function(date) {
                this.year = date.getFullYear();
                this.month = date.getMonth();
                this.date = date.getDate();

                this.build(date);
                this.val(date);

                this._year.scrollTop(this._options.cellHeight * (this._options.rowNum - 1));
                this._month.scrollTop(this._options.cellHeight * (this._options.rowNum - 1));
                this._date.scrollTop(this._options.cellHeight * (this._options.rowNum - 1));

                $(this).trigger($.Event("change", [date]));
            },
            val: function(v) {
                if (v === undefined) return this._value;
                this._value = v;
            },
            text: function() {
                return (
                    Utility.padLeft(this._value.getDate(), 2) +
                    "/" +
                    Utility.padLeft(this._value.getMonth() + 1, 2) +
                    "/" +
                    Utility.padLeft(this._value.getFullYear(), 2)
                );
            },
            exist: function() {
                return true;
            },
            show: function() {
                this._root.show();
                this._year.scrollTop(this._options.cellHeight * (this._options.rowNum - 1));
                this._month.scrollTop(this._options.cellHeight * (this._options.rowNum - 1));
                this._date.scrollTop(this._options.cellHeight * (this._options.rowNum - 1));
            }
        });
        return instance;
    })();

    /**
     * combo menu
     */
    var ComboMenu = (function() {
        var instance = function(opt) {
            this._options = $.extend(
                {
                    cellHeight: 50,
                    cellWidth: 120,
                    verticalPadding: 0,
                    dataSetNum: 2, //上下各多少組資料
                    reelNum: 3
                },
                opt || {}
            );

            var visibleNum = 3,
                relativeLeft = 15,
                cHeight = this._options.cellHeight, //cell
                cWidth = this._options.cellWidth, //cell
                rHeight = cHeight * visibleNum, //reel
                vPadding = this._options.verticalPadding;

            (this._height = cHeight * visibleNum + vPadding * 2), (this._width = cWidth * this._options.reelNum);
            this._value = null;
            this._data = null;
            this._timeout = null;

            this._root = $("<div/>")
                .addClass("menu combo")
                .css({
                    padding: vPadding + "px 0",
                    "max-width": "100%"
                })
                .width(this._width + relativeLeft); //relativeLeft is mask

            this._mainMenu = $("<div/>")
                .css({ left: "0" })
                .width("33%")
                .height(rHeight)
                .addClass("mainMenu")
                .appendTo(this._root)
                .on("scroll", onScroll_mainMenu.bind(this));

            function onScroll_mainMenu() {
                var index = Math.round(this._mainMenu.scrollTop() / cHeight);

                this._timeout && clearTimeout(this._timeout);
                this._timeout = setTimeout(
                    function() {
                        this._mainMenu.stop().animate(
                            { scrollTop: index * cHeight },
                            "fast",
                            function() {
                                var cell = this._mainMenu.children(":eq(" + (index + 1) + ")");
                                var value = {};

                                for (var i in this._data[cell.attr("value")]) {
                                    value[cell.attr("value")] = i;
                                    break;
                                }
                                if (value[cell.attr("value")]) {
                                    this.val(value);
                                    this.build();
                                    $(this).trigger($.Event("change", [this._value]));
                                }
                            }.bind(this)
                        );
                    }.bind(this),
                    250
                );
            }

            this._subMenu = $("<div/>")
                .css({ left: relativeLeft * -1 + "px" })
                .width("66%")
                .height(rHeight)
                .addClass("subMenu")
                .appendTo(this._root)
                .on("scroll", onScroll_subMenu.bind(this));

            function onScroll_subMenu() {
                var index = Math.round(this._subMenu.scrollTop() / cHeight);

                this._timeout && clearTimeout(this._timeout);
                this._timeout = setTimeout(
                    function() {
                        this._subMenu.stop().animate(
                            { scrollTop: index * cHeight },
                            "fast",
                            function() {
                                var cell = this._subMenu.children(":eq(" + (index + 1) + ")");
                                var splitValue = cell.attr("value") ? cell.attr("value").split("!@#") : null;
                                if (splitValue && splitValue.length == 2) {
                                    var value = {};
                                    value[splitValue[0]] = splitValue[1];
                                    this.val(value);
                                    this.buildSubMenu(splitValue[0], this._data[splitValue[0]]);
                                    $(this).trigger($.Event("change", [this._value]));
                                }
                            }.bind(this)
                        );
                    }.bind(this),
                    250
                );
            }
            //mask
            $("<div/>")
                .css({ left: "0px" })
                .width("1%")
                .height(rHeight)
                .appendTo(this._root);

            this._mainMenu.get(0).addEventListener("touchmove", function() {
                event.cancelBubble = true;
                event.stopPropagation();
                return false;
            });
            this._subMenu.get(0).addEventListener("touchmove", function() {
                event.cancelBubble = true;
                event.stopPropagation();
                return false;
            });
        };
        $.extend(instance.prototype, MenuBase.prototype, {
            exist: function(v) {
                return true;
            },
            setData: function(data) {
                this._data = data;
                this.build();
                $(this).trigger($.Event("change", [this._value]));
            },
            val: function(v) {
                if (v == undefined) return this._value;
                this._value = v;
                //this.build();
            },
            show: function() {
                this._root.show();
            },
            text: function() {
                var _text = "";
                for (var i in this._value) {
                    _text = "<span>" + i + "</span>";
                    for (var j in this._data[i]) {
                        if (j == this._value[i]) {
                            _text += "<span>" + this._data[i][j] + "</span>";
                            break;
                        }
                    }
                }
                return _text;
            },
            build: function() {
                var _this = this,
                    h = this._options.cellHeight,
                    w = this._options.cellWidth;

                this._mainMenu.empty();
                this._subMenu.empty();

                var totalDataSetNum = this._options.dataSetNum * 2 + 1;

                for (var i = 0; i < totalDataSetNum; i++) {
                    for (var key in this._data) {
                        var mainCell = $("<div/>")
                            .addClass("cell")
                            .css("line-height", h + "px")
                            .text(key)
                            .attr("value", key)
                            .on("click", function() {
                                var value = {};
                                for (var v in _this._data[$(this).attr("value")]) {
                                    value[$(this).attr("value")] = v;
                                    break;
                                }

                                _this.val(value);
                                _this._mainMenu.children().removeClass("focus");
                                $(this).addClass("focus");
                                $(_this).trigger($.Event("change", [_this._value]));
                            });

                        if (this._value && this._value[key] && i == this._options.dataSetNum) {
                            mainCell.addClass("focus");
                            this.buildSubMenu(key, this._data[key]);
                        }
                        this._mainMenu.append(mainCell);
                    }
                }
                this.scrollToFocus(this._mainMenu);
            },
            buildSubMenu: function(parentData, data) {
                var _this = this,
                    h = this._options.cellHeight,
                    w = this._options.cellWidth;

                this._subMenu.empty();

                var totalDataSetNum = this._options.dataSetNum * 2 + 1;

                for (var i = 0; i < totalDataSetNum; i++) {
                    for (var key in data) {
                        var subCell = $("<div/>")
                            .addClass("cell")
                            .css("line-height", h + "px")
                            .text(data[key])
                            .attr("value", parentData + "!@#" + key)
                            .on("click", function() {
                                var splitValue = $(this)
                                    .attr("value")
                                    .split("!@#");
                                var value = {};
                                value[splitValue[0]] = splitValue[1];

                                _this.val(value);
                                _this._subMenu.children().removeClass("focus");
                                $(this).addClass("focus");
                                $(_this).trigger($.Event("change", [_this._value]));
                            });

                        if (this._value && this._value[parentData] == key && i == this._options.dataSetNum) {
                            subCell.addClass("focus");
                        }
                        this._subMenu.append(subCell);
                    }
                }
                this.scrollToFocus(this._subMenu);
            },
            show: function() {
                this._root.show();

                this.scrollToFocus(this._mainMenu);
                this.scrollToFocus(this._subMenu);
            },
            scrollToFocus: function(cells) {
                if (cells.children().length) {
                    var offsetHeight =
                            this.getChildrenOffsetTop(cells, ":eq(1)") - this.getChildrenOffsetTop(cells, ":eq(0)"),
                        index = Math.round(
                            (this.getChildrenOffsetTop(cells, ".focus") - this.getChildrenOffsetTop(cells, ":first")) /
                                offsetHeight
                        );
                    cells.scrollTop((index - 1) * this._options.cellHeight);
                }
            },
            getChildrenOffsetTop: function(element, selector) {
                var _element = element.children(selector);
                return _element.length && _element.offset() ? _element.offset().top : 0;
            }
        });
        return instance;
    })();

    /**
     * select
     */
    var Select = (function() {
        var instance = function(m, options) {
            this._root = $("<div/>")
                .addClass("select")
                .addClass(options ? options.className : "")
                .on(
                    "click",
                    function(e) {
                        this._root.addClass("focus");
                        //alert(this._root[0].offsetTop);
                        this._menu.position({
                            top: this._root[0].offsetTop - this._menu.height(), //this._root.offset().top is incorrect value in safari.
                            left: this._root.offset().left - this._menu.width() / 2 + this._root.width() / 2
                        });
                        this._menu.show();
                        e && e.stopPropagation();
                    }.bind(this)
                );
            this._text = $("<div/>")
                .addClass("text")
                .appendTo(this._root);
            this._icon = $("<div/>")
                .addClass("icon")
                .appendTo(this._root);

            this._value;
            this._menu = m || new MenuBase({ maxHeight: 200 });
            this._menu.on(
                "change",
                function(evt) {
                    var data = evt[0];
                    this.val(data);
                }.bind(this)
            );

            $("#DTBoardReport")
                .get(0)
                .addEventListener(
                    "click",
                    function() {
                        this._root.removeClass("focus");
                        this._menu.hide();
                    }.bind(this)
                );
        };
        instance.prototype = {
            addOption: function(value, text) {
                this._menu.addOption(value, text);
                if (!this._value) {
                    this.val(value);
                    this.text(text);
                }
            },
            render: function($parent) {
                $parent && $parent.append(this._root);
                $parent && this._menu.render($parent);
            },
            on: function(evt, func) {
                $(this).on(evt, func);
            },
            show: function() {
                this._root.show();
            },
            hide: function() {
                this._root.hide();
            },
            val: function(v) {
                if (v === undefined) return this._value;
                if (this._menu.exist(v)) {
                    this._value = v;
                    this._menu.val(v);
                    this.text(this._menu.text());
                    $(this).trigger($.Event("change", [v]));
                }
            },
            text: function(t) {
                if (t === undefined) return this._text.text();
                this._text.html(t);
            },
            clear: function() {
                this._menu.clear();
                this.text("");
                this._value = null;
            },
            refresh: function() {
                this._menu.hide();
                this._root.removeClass("focus");
            },
            visibility: function() {
                return this._root.is(":visible");
            }
        };
        return instance;
    })();

    /**
     * button
     */
    var Button = (function() {
        var instance = function(m) {
            this._root = $("<div/>")
                .addClass("button")
                .on(
                    "click",
                    function() {
                        $(this).trigger($.Event("click", [this._value]));
                    }.bind(this)
                );
            this._text = $("<div/>")
                .addClass("text")
                .appendTo(this._root);
            this._icon = $("<div/>")
                .addClass("icon")
                .appendTo(this._root);
        };
        instance.prototype = {
            render: function($parent) {
                $parent && $parent.append(this._root);
            },
            on: function(evt, func) {
                $(this).on(evt, func);
            },
            show: function() {
                this._root.show();
            },
            hide: function() {
                this._root.hide();
            },
            val: function(v) {
                if (v == undefined) return this._value;
                this._value = v;
            },
            text: function(t) {
                this._text.text(t);
            }
        };
        return instance;
    })();

    /**
     * Dialog
     */
    var WaitingDialog = (function() {
        var instance = function(opt) {
            this._root = $("<div/>").addClass("mask");
            this._dialog = $(
                '<div><div class="floatingBarsG">' +
                    '<div class="blockG rotateG_01"></div>' +
                    '<div class="blockG rotateG_02"></div>' +
                    '<div class="blockG rotateG_03"></div>' +
                    '<div class="blockG rotateG_04"></div>' +
                    '<div class="blockG rotateG_05"></div>' +
                    '<div class="blockG rotateG_06"></div>' +
                    '<div class="blockG rotateG_07"></div>' +
                    '<div class="blockG rotateG_08"></div>' +
                    "</div></div>"
            )
                .addClass("dialog waiting")
                .appendTo(this._root);
            this.hide();
        };
        instance.prototype = {
            show: function() {
                this._root.show();
            },
            hide: function() {
                this._root.hide();
            },
            render: function($parent) {
                $parent && $parent.append(this._root);
            }
        };
        return instance;
    })();

    /**
     * data manager
     * get and set DT board.
     */
    var dataManager = (function() {
        var apiUrl = "",
            boardType = {
                Dragon: 1,
                Tiger: 2,
                daily: "Daily",
                weekly: "Weekly",
                period: "Period"
            };

        var mgr = function(url) {
            apiUrl = url;
        };
        mgr.prototype = {
            getDailyReport: function(type, filter, callback) {
                var url = apiUrl + "/DailyDTBReport/0"; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        BUCode: params.bucode,
                        //GameToken: params.gameToken,
                        CurrencyISOCode: params.currencyISOCode,
                        CultureName: getSafeCultureName(),
                        Type: boardType[type],
                        Date: filter.date
                    }
                })
                    .done(function(data) {
                        var result;
                        if (data && data.Body && data.Status == "Success") {
                            result = data.Body;
                        }
                        callback && callback(result);
                    })
                    .fail(function() {
                        callback && callback(null);
                    });
            },
            getWeeklyReport: function(type, filter, callback) {
                var url = apiUrl + "/WeeklyDTBReport/0"; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        BUCode: params.bucode,
                        //GameToken: params.gameToken,
                        CurrencyISOCode: params.currencyISOCode,
                        CultureName: getSafeCultureName(),
                        Type: boardType[type],
                        Year: filter.year,
                        Period: filter.period,
                        Week: filter.week
                    }
                })
                    .done(function(data) {
                        var result;
                        if (data && data.Body && data.Status == "Success") {
                            result = data.Body;
                        }
                        callback && callback(result);
                    })
                    .fail(function() {
                        callback && callback(null);
                    });
            },
            getPeriodReport: function(type, filter, callback) {
                var url = apiUrl + "/PeriodDTBReport/0"; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        BUCode: params.bucode,
                        //GameToken: params.gameToken,
                        CurrencyISOCode: params.currencyISOCode,
                        CultureName: getSafeCultureName(),
                        Type: boardType[type],
                        Year: filter.year,
                        Period: filter.period
                    }
                })
                    .done(function(data) {
                        var result;
                        if (data && data.Body && data.Status == "Success") {
                            result = data.Body;
                        }
                        callback && callback(result);
                    })
                    .fail(function() {
                        callback && callback(null);
                    });
            },
            getPeriodInfo: function(callback) {
                var url = apiUrl + "/PeriodInfos/0"; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        BUCode: params.bucode
                        //GameToken: params.gameToken
                    }
                })
                    .done(function(data) {
                        var result;
                        if (data && data.Body && data.Status == "Success") {
                            result = data.Body;
                        }
                        callback && callback(result);
                    })
                    .fail(function() {
                        callback && callback(null);
                    });
            },
            getPeriodDetailReport: function(type, filter, callback) {
                var sample = [
                    {
                        GameSN: 6,
                        GameName: "極道貓",
                        Week: 1,
                        Day: 1,
                        Date: "2016-10-31T23:42:04",
                        Score: 121200,
                        RefWager: "Ei+vGVuYH0FKJhL1TwwFzA=="
                    },
                    {
                        GameSN: 6,
                        GameName: "極道貓",
                        Week: 1,
                        Day: 2,
                        Date: "2016-11-01T00:01:44",
                        Score: 8209980,
                        RefWager: "oqGj3AvutA0Qv+oklWZlhw=="
                    }
                ];

                var url = apiUrl + "/PeriodDetailDTBReport/" + filter.gameSn; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        BUCode: params.bucode,
                        //GameToken: params.gameToken,
                        CultureName: getSafeCultureName(),
                        Type: boardType[type],
                        Year: filter.year,
                        Period: filter.period,
                        RefAccount: filter.refAccount
                    }
                })
                    .done(function(data) {
                        var result;
                        if (data && data.Body && data.Status == "Success") {
                            result = data.Body;
                        }
                        callback && callback(result);
                    })
                    .fail(function() {
                        callback && callback(null);
                    });
            },
            getDTBoardSetting: function(callback) {
                var url = apiUrl + "/DTBSetting";

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        buCode: params.bucode,
                        currencyISOCode: params.currencyISOCode
                    }
                })
                    .done(function(data) {
                        var result;
                        if (data && data.Body && data.Status == "Success") {
                            result = data.Body;
                        }
                        callback && callback(result);
                    })
                    .fail(function() {
                        callback && callback(null);
                    });
            }
        };
        return mgr;
    })();

    /**
     * pan up mask
     */
    var PanMask = (function() {
        var instance = function(opt) {
            this._root = $("<div/>").addClass("mask");
            this._dialog = $("<div/>")
                .addClass("dialog panUp")
                .css("background-image", "url(" + params.infoUrl + "img/common/Hand2.gif)")
                .appendTo(this._root);

            function initSafariMask() {
                var isiPhone = /iPhone|iPad|iPod/i.test(navigator.platform);

                if (isiPhone && !window.viewDataCollection) {
                    // 在iphone6 plus，呼叫addressbar出現並不會resize並不會被觸發。因此使用Interval。
                    // 在touch過程中，停止onresize被觸發。
                    var intouch = false;
                    document.body.addEventListener("touchstart", function() {
                        intouch = true;
                    });
                    document.body.addEventListener("touchend", function() {
                        intouch = false;
                    });
                    setInterval(st.bind(this), 300);

                    this.show();
                    //QAT-28354
                    document.body.scrollTop = document.documentElement.scrollTop = 0;

                    function st() {
                        if (!intouch) {
                            this.resize();
                        }
                    }
                } else {
                    this.hide();
                }
            }
            initSafariMask.bind(this)();
        };
        instance.prototype = {
            _innerHeight: 0,
            resize: function() {
                // skip when innerHeight not change
                if (this._innerHeight == window.innerHeight) return;

                this._innerHeight = window.innerHeight;

                if (window.innerWidth > window.innerHeight && window.innerHeight < document.body.offsetHeight * 0.9) {
                    this.show();
                    //QAT-28354
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    $(".dataSet").css("-webkit-overflow-scrolling", "auto");
                } else {
                    this.hide();
                    $(".dataSet").css("-webkit-overflow-scrolling", "touch");
                }

                // reset scroll position for next swipe up
                if (!/CriOS/i.test(navigator.userAgent)) {
                    //QAT-26995: check chrome on iOS, not sure why to set scroll Top, so...
                    $(document).body.scrollTop = 80;
                }
            },
            show: function() {
                this._root.show();
                // QAT-30190
                this._root.trigger("panMaskShow");
            },
            hide: function() {
                this._root.hide();
            },
            render: function($parent) {
                $parent && $parent.append(this._root);
            }
        };
        return instance;
    })();

    /**
     * Application
     * account statement instance.
     */
    var Application = (function() {
        var id = "#DTBoardReport",
            boardType = {
                Dragon: 1,
                Tiger: 2,
                daily: "Daily",
                weekly: "Weekly",
                period: "Period"
            },
            weekData,
            periodData,
            currentFilter = "Dragon"; //Dragon or Tiger from params.load.filter

        var instance = function() {
            var _this = this;
            this._subGrids = [];

            this._Grid = new Grid({ isRowClick: true });
            this._Grid.addColumn({ name: "Rank", class: "helf" });
            this._Grid.addColumn({ name: "Date" });
            this._Grid.addColumn({ name: "GameName", class: "helf textLeft" });
            this._Grid.addColumns({
                //support multiple columns to wrap together
                cols: [
                    { name: "MemberCode", class: "helf textLeft" },
                    {
                        name: "Score",
                        class: "helf textRight",
                        format: function(data) {
                            return Utility.formatNumber(data, currentFilter.toLowerCase() == "dragon" ? 2 : 0);
                        }
                    },
                    { name: "Count" }
                ]
            });
            this._Grid.on(
                "clickRow",
                function(evt) {
                    var $current = $(id + " .tabSet > .tab.focus"),
                        key = $current.data("key"),
                        data = evt[0],
                        $target = $(evt[1]);

                    if ($target && key == boardType.period) {
                        if ($target.data("subDom") === undefined) {
                            if ($target.data("isLoading") == true) return;

                            var year, period;
                            for (var i in this._periodSelect.val()) {
                                year = i;
                                period = this._periodSelect.val()[i];
                            }
                            $target.data("isLoading", true);

                            this._manager.getPeriodDetailReport(
                                currentFilter,
                                {
                                    year: year,
                                    period: period,
                                    refAccount: data.RefAccount,
                                    gameSn: data.GameSN
                                },
                                function(detailData) {
                                    if (detailData) {
                                        var detail = new Application.memberDetail();
                                        detail.insertAfter($target);
                                        detail.load(data.BuCode, detailData);
                                        detail.slideToggle(0);
                                        $target.data("subDom", detail);
                                        $target.toggleClass("open");
                                        _this._subGrids.push(detail);
                                    }
                                    $target.data("isLoading", false);
                                }
                            );
                        } else {
                            $target.data("subDom").slideToggle(0);
                            $target.data("subDom").resize();
                            $target.toggleClass("open");
                        }
                    } else {
                        var url =
                            params.infoUrl +
                            "acctState.html?lang=" +
                            encodeURIComponent(params.lang) +
                            "&gameToken=" +
                            encodeURIComponent(params.gameToken) +
                            "&gamesn=" +
                            encodeURIComponent(data.GameSN) +
                            "&commonapi=" +
                            encodeURIComponent(params.commonapisite) +
                            "&bucode=" +
                            encodeURIComponent(data.BuCode) +
                            "&page=3&filter=" +
                            encodeURIComponent(data.RefWager);

                        if (window.viewDataCollection) {
                            window.lunchParams = {};
                            window.lunchParams.gamesn = data.GameSN;
                            window.lunchParams.filter = data.RefWager;
                            window.lunchParams.page = 3;

                            $("#acctStateView").css(
                                "z-index",
                                parseInt(
                                    $(app.id())
                                        .parent()
                                        .parent()
                                        .css("z-index"),
                                    10
                                ) + 1
                            );

                            window["hideCloseView"] = false;

                            if (window["AccountStatement"]) {
                                window["AccountStatement"].load(window.lunchParams);
                                $("#acctStateView").show();
                            } else {
                                $.get(url, null, function(data) {
                                    $("#acctStateView > #acctStateContent").html(data);
                                    $("#acctStateView").show();
                                });
                            }
                        } else {
                            window.open(url); //open wager detail
                        }
                    }
                }.bind(this)
            );
            this._Grid.render($(id + " .grid"));

            var filterSet = $("<div/>")
                .addClass("filters")
                .appendTo($(id + " .footer"));

            this._datePicker = new DatePicker();
            this._dateSelect = new Select(this._datePicker, { className: "flex2" });
            this._dateSelect.hide();
            this._dateSelect.render(filterSet);
            var date = new Date();
            date.setHours(date.getUTCHours() - 4);
            this._datePicker.setDate(date);
            this._datePicker.css({ top: screen.height, left: screen.width });

            this._weekMenu = new ComboMenu();
            this._weekSelect = new Select(this._weekMenu, { className: "flex2" });
            this._weekSelect.hide();
            this._weekSelect.render(filterSet);

            this._periodMenu = new ComboMenu();
            this._periodSelect = new Select(this._periodMenu, { className: "flex2" });
            this._periodSelect.hide();
            this._periodSelect.render(filterSet);

            this._searchBtn = new Button();
            this._searchBtn.hide();
            this._searchBtn.render($(id + " .footer"));
            this._searchBtn.on("click", function(evt) {
                var $current = $(id + " .tabSet > .tab.focus");
                $current && $current.trigger("click");
            });

            this._manager = new dataManager(params.commonapisite);

            this._waiting = new WaitingDialog();
            this._waiting.render($(id));

            this._mask = new PanMask();
            this._mask.render($(id));
        };
        instance.prototype = {
            init: function() {
                params.refresh();
                weekData = {};
                periodData = {};
                currentFilter = params.load.filter || currentFilter;
            },
            load: function(load) {
                this._waiting.show();

                this.init();

                this._searchBtn.show();

                this._manager.getPeriodInfo(
                    function(data) {
                        var now = new Date(),
                            yearOfweek = 0,
                            nYear, //now year
                            nPeriod, //now period
                            nWeek; //now week

                        for (var i in data) {
                            //period data set
                            periodData[data[i].Year] = periodData[data[i].Year] || {};
                            periodData[data[i].Year][data[i].Period] =
                                data[i].Period +
                                " - (" +
                                Utility.formatDate(data[i].From, "/") +
                                " - " +
                                Utility.formatDate(data[i].To, "/") +
                                ")";

                            if (now > new Date(data[i].From) && now < new Date(data[i].To)) {
                                nYear = data[i].Year;
                                nPeriod = data[i].Period;
                            }

                            //week data set
                            var period_start = data[i].From ? new Date(data[i].From) : "",
                                period_end = data[i].To ? new Date(data[i].To) : "";

                            if (period_start && period_end) {
                                if (!weekData[data[i].Year]) {
                                    weekData[data[i].Year] = {};
                                    yearOfweek = 0;
                                }

                                var date = period_start,
                                    week = 0;

                                while (date < period_end) {
                                    var to = new Date(date);
                                    to.setDate(to.getDate() + 6);
                                    week++;
                                    yearOfweek++;
                                    weekData[data[i].Year][data[i].Period + "-" + week] =
                                        weekData[data[i].Year][data[i].Period + "-" + week] || {};
                                    weekData[data[i].Year][data[i].Period + "-" + week] =
                                        yearOfweek +
                                        " - (" +
                                        Utility.formatDate(date.toLocaleDateString(), "/") +
                                        " - " +
                                        Utility.formatDate(to.toLocaleDateString(), "/") +
                                        ")";

                                    if (now > date && now < to) {
                                        nWeek = data[i].Period + "-" + week;
                                    }
                                    date = to;
                                    date.setDate(date.getDate() + 1);
                                }
                            }
                        }
                        var currentPeriod = {};
                        currentPeriod[nYear] = nPeriod;
                        this._periodMenu.val(currentPeriod);
                        this._periodMenu.setData(periodData);

                        var currentWeek = {};
                        currentWeek[nYear] = nWeek;
                        this._weekMenu.val(currentWeek);
                        this._weekMenu.setData(weekData);

                        this.setHeader(lang("label." + currentFilter.toLowerCase()));

                        // QAT-32987 bind DTB settings before init-tab
                        var self = this;
                        this._manager.getDTBoardSetting(function(dataSet) {
                            var boardType = currentFilter.toLowerCase();
                            if (boardType === "dragon") {
                                if (dataSet && dataSet.Dragon.Daily == 1) $(id + " .tabSet > .dailyBoard").show();
                                else $(id + " .tabSet > .dailyBoard").hide();
                                if (dataSet && dataSet.Dragon.Weekly == 1) $(id + " .tabSet > .weeklyBoard").show();
                                else $(id + " .tabSet > .weeklyBoard").hide();
                                if (dataSet && dataSet.Dragon.Period == 1) $(id + " .tabSet > .periodBoard").show();
                                else $(id + " .tabSet > .periodBoard").hide();
                            } else {
                                if (dataSet && dataSet.Tiger.Daily == 1) $(id + " .tabSet > .dailyBoard").show();
                                else $(id + " .tabSet > .dailyBoard").hide();
                                if (dataSet && dataSet.Tiger.Weekly == 1) $(id + " .tabSet > .weeklyBoard").show();
                                else $(id + " .tabSet > .weeklyBoard").hide();
                                if (dataSet && dataSet.Tiger.Period == 1) $(id + " .tabSet > .periodBoard").show();
                                else $(id + " .tabSet > .periodBoard").hide();
                            }

                            self.initTabs(load);
                            $(id + " .content").show();
                        });
                    }.bind(this)
                );

                if (window.hideCloseView) {
                    $(id + " #closeView").hide();
                } else {
                    $(id + " #closeView").show();
                }
            },
            setHeader: function(text) {
                $(id + " .header").text(text || "");
            },
            setFooter: function(data, classes) {
                var $footer = $(id + " .footer");
                $footer.children().remove();

                for (var i in data) {
                    var cell = $("<div/>")
                        .addClass("cell")
                        .text(data[i] || !isNaN(data[i]) ? data[i] : "")
                        .appendTo($footer);
                    if (classes && classes[i]) cell.addClass(classes[i]);
                }
            },
            initTabs: function(load) {
                $(id + " .tabSet > .tab.focus").removeClass("focus");

                var _this = this,
                    $current = $(id + " .tabSet > .tab:first").toggleClass("focus");

                $(id + " .tabSet").each(function() {
                    var tabKey = [boardType.daily, boardType.weekly, boardType.period];

                    $(this)
                        .children()
                        .off("click");
                    $(this)
                        .children(".tab")
                        .on("click", function() {
                            $current.toggleClass("focus");
                            $current = $(this);
                            $current.toggleClass("focus");
                            onclick.call(_this);
                        })
                        .each(setKey);

                    function setKey() {
                        var key = tabKey.shift();
                        $(this).data("key", key);

                        if (load && load.page == key) {
                            $current.toggleClass("focus");
                            $current = $(this);
                            $current.toggleClass("focus");
                        }
                    }
                });
                function onclick() {
                    this._waiting.show();
                    this._Grid.clear();
                    this._subGrids.length = 0;

                    var key = $current ? $current.data("key") : null,
                        filter = {};

                    switch (key) {
                        case boardType.daily:
                            var date = new Date(this._dateSelect.val());
                            filter.date =
                                Utility.padLeft(date.getFullYear(), 2) +
                                "-" +
                                Utility.padLeft(date.getMonth() + 1, 2) +
                                "-" +
                                Utility.padLeft(date.getDate(), 2);
                            this._dateSelect.show();
                            this._weekSelect.hide();
                            this._periodSelect.hide();
                            break;
                        case boardType.weekly:
                            for (var i in this._weekSelect.val()) {
                                filter.year = i;
                                if (this._weekSelect.val()[i]) {
                                    filter.period = this._weekSelect.val()[i].split("-")[0];
                                    filter.week = this._weekSelect.val()[i].split("-")[1];
                                }
                            }

                            this._dateSelect.hide();
                            this._weekSelect.show();
                            this._periodSelect.hide();
                            break;
                        case boardType.period:
                            for (var i in this._periodSelect.val()) {
                                filter.year = i;
                                filter.period = this._periodSelect.val()[i];
                            }
                            this._dateSelect.hide();
                            this._weekSelect.hide();
                            this._periodSelect.show();
                            break;
                        default:
                            this._waiting.hide();
                            return;
                    }

                    this._manager["get" + key + "Report"](
                        currentFilter,
                        filter,
                        function(data) {
                            var col = ["Rank", "Date", "GameName", "MemberCode", "Score", "Count"];

                            switch (key) {
                                case boardType.daily:
                                    col = ["Rank", "", "GameName", "MemberCode", "Score", ""];
                                    break;
                                case boardType.weekly:
                                    col = ["Rank", "Date", "GameName", "MemberCode", "Score", ""];
                                    break;
                                case boardType.period:
                                    col = ["Rank", "", "GameName", "MemberCode", "", "Count"];
                                    break;
                            }

                            $(id + " .content > .title.row")
                                .find("[data-col]")
                                .each(function(index, item) {
                                    $(item)[col[index] ? "show" : "hide"]();
                                });
                            this._Grid.displayColumns(col);
                            for (var i in data) {
                                switch (key) {
                                    case boardType.daily:
                                        data[i].Rank =
                                            "<div>" +
                                            data[i].Rank +
                                            "</div><div>" +
                                            Utility.formatTime(data[i].Date) +
                                            "</div>";
                                        break;
                                    case boardType.weekly:
                                        var date = new Date(Utility.formatDate(data[i].Date));
                                        data[i].Date =
                                            lang("label.week") +
                                            data[i].Week +
                                            " - " +
                                            lang("label.daily") +
                                            data[i].Day +
                                            " " +
                                            Utility.padLeft(date.getDate(), 2) +
                                            "/" +
                                            Utility.padLeft(date.getMonth() + 1, 2);
                                        break;
                                }
                                this._Grid.addRow(data[i]);
                            }

                            this._waiting.hide();
                        }.bind(this)
                    );
                }
                $current && $current.trigger("click");
            },
            resize: function() {
                this._datePicker.visibility() && this._dateSelect.refresh();
                this._weekSelect.refresh();
                this._periodSelect.refresh();
                this._Grid.resize();
                for (var i in this._subGrids) {
                    if (this._subGrids[i].visibility()) {
                        this._subGrids[i].resize();
                    }
                }
            },
            id: function() {
                return id;
            },
            render: function($parent) {
                $parent && $parent.append($(id));
            }
        };
        return instance;
    })();

    /**
     * member detail
     */
    Application.memberDetail = (function() {
        var currentFilter = "Dragon"; //Dragon or Tiger from params.load.filter

        var instance = function() {
            this._root = $("<div/>")
                .addClass("memberDetail")
                .hide();
            this._left = $("<div/>")
                .addClass("left")
                .appendTo(this._root);
            this._right = $("<div/>")
                .addClass("right")
                .appendTo(this._root)
                .on(
                    "click",
                    function() {
                        this.slideToggle(0);
                    }.bind(this)
                );

            this._Grid = new Grid({ hasHeader: true, isRowClick: true });
            this._Grid.addColumn({ name: "Date", label: lang("label.daily") });
            this._Grid.addColumn({
                name: "Score",
                class: "textRight",
                label: lang("label.score"),
                format: function(data) {
                    return Utility.formatNumber(data, currentFilter.toLowerCase() == "dragon" ? 2 : 0);
                }
            });
            this._Grid.render(this._left);
            this._Grid.on(
                "clickRow",
                function(evt) {
                    var data = evt[0];
                    var url =
                        params.infoUrl +
                        "acctState.html?lang=" +
                        encodeURIComponent(params.lang) +
                        "&gameToken=" +
                        encodeURIComponent(params.gameToken) +
                        "&gamesn=" +
                        encodeURIComponent(data.GameSN) +
                        "&commonapi=" +
                        encodeURIComponent(params.commonapisite) +
                        "&bucode=" +
                        encodeURIComponent(params.bucode) +
                        "&page=3&filter=" +
                        encodeURIComponent(data.RefWager);

                    if (window.viewDataCollection) {
                        window.lunchParams = {};
                        window.lunchParams.gamesn = data.GameSN;
                        window.lunchParams.filter = data.RefWager;
                        window.lunchParams.page = 3;

                        $("#acctStateView").css(
                            "z-index",
                            parseInt(
                                $(app.id())
                                    .parent()
                                    .parent()
                                    .css("z-index"),
                                10
                            ) + 1
                        );

                        window["hideCloseView"] = false;

                        if (window["AccountStatement"]) {
                            window["AccountStatement"].load(window.lunchParams);
                            $("#acctStateView").show();
                        } else {
                            $.get(url, null, function(data) {
                                $("#acctStateView > #acctStateContent").html(data);
                                $("#acctStateView").show();
                            });
                        }
                    } else {
                        window.open(url); //open wager detail
                    }
                }.bind(this)
            );

            this._rightTop = $("<div/>")
                .addClass("detail-collapse")
                .html('<div class="icon"/>')
                .appendTo(this._right);
            this._rightBottom = $("<div/>")
                .addClass("detail-text")
                .text(lang("label.detail"))
                .appendTo(this._right);
        };
        instance.prototype = {
            load: function(buCode, data) {
                currentFilter = params.load.filter || currentFilter;
                this._buCode = buCode;
                data.sort(this.itemSortFunction);
                for (var i in data) {
                    data[i].Date =
                        lang("label.week") +
                        data[i].Week +
                        " - " +
                        lang("label.daily") +
                        data[i].Day +
                        " " +
                        Utility.formatDate(data[i].Date, "/");
                    this._Grid.addRow(data[i]);
                }
            },
            itemSortFunction: function(a, b) {
                if (!a && b) return 1;
                if (a && !b) return -1;
                if (a && b) {
                    var diff = b.Score - a.Score;
                    if (diff !== 0) {
                        return diff;
                    } else {
                        // QAT-32758
                        return Date.parse(a.Date) - Date.parse(b.Date);
                    }
                }
            },
            render: function($parent) {
                $parent && $parent.append(this._root);
            },
            unrender: function() {
                this._root.remove();
            },
            insertAfter: function(dom) {
                this._root.insertAfter(dom);
            },
            slideToggle: function(duration) {
                this._root.slideToggle(duration);
            },
            resize: function() {
                this._Grid.resize();
            },
            visibility: function() {
                return this._root.is(":visible");
            }
        };
        return instance;
    })();

    //initail DOM for account statement
    var app = new Application();

    /**
     *
     * 啟動多語系功能
     *
     */
    var Localization = (function() {
        var instance = function(opt) {
            this._options = $.extend(
                {
                    fileName: "translation.json",
                    lang: "en-US",
                    defaultLang: "en-US",
                    url: "/{{lang}}/{{fileName}}",
                    crossDomain: true,
                    retry: 0, //times
                    interval: 5 //seconds
                },
                opt || {}
            );
        };

        instance.prototype = {
            _lang: null,
            load: function(callback) {
                var _this = this,
                    retry = this._options.retry,
                    interval = this._options.interval;

                function load() {
                    $.ajax({
                        dataType: "json",
                        url: _this._options.url
                            .replace("{{lang}}", _this._options.lang)
                            .replace("{{fileName}}", _this._options.fileName),
                        crossDomain: _this._options.crossDomain
                    })
                        .done(function(data) {
                            _this._lang = data;
                            callback && callback();
                        })
                        .fail(function() {
                            if (retry > 0) {
                                setTimeout(load, interval * 1000);
                                retry--;
                            } else {
                                $.ajax({
                                    dataType: "json",
                                    url: _this._options.url
                                        .replace("{{lang}}", _this._options.defaultLang)
                                        .replace("{{fileName}}", _this._options.fileName),
                                    crossDomain: _this._options.crossDomain
                                })
                                    .done(function(data) {
                                        _this._lang = data;
                                    })
                                    .always(function(data) {
                                        callback && callback();
                                    });
                            }
                        });
                }
                load();
            },
            localize: function(selector) {
                var _this = this,
                    doms = $(selector + " [lang]");

                doms.each(function() {
                    var $dom = $(this),
                        key = $dom.attr("lang");

                    if (key.indexOf("[html]") > -1) {
                        $dom.html(_this.lang(key.replace("[html]", "")));
                    } else {
                        $dom.text(_this.lang(key));
                    }
                    $dom.removeAttr("lang");
                });
            },
            lang: function(key, params) {
                var keyList = key.split("."),
                    text = this._lang;
                for (var i in keyList) {
                    text = text[keyList[i]];
                    if (text == undefined || text == null) return key;
                }
                for (var i in params) {
                    text = text.replace(new RegExp("\\{" + i + "\\}", "g"), params[i]);
                }
                return text;
            }
        };
        return instance;
    })();

    var lang;
    var locales = new Localization({
        lang: params.lang.replace(/-/, "_"),
        defaultLang: (window.viewDataCollection ? window.viewDataCollection.lang : "en-US").replace(/-/, "_"),
        url: params.infoUrl + "resources/common/locales/{{lang}}/{{fileName}}"
    });
    locales.load(function() {
        lang = locales.lang.bind(locales);
        locales.localize(app.id());
        app.load(params.load);
    });

    //$(window).off('orientationchange');
    //$(window).on('orientationchange', onResize);
    $(window).off("resize", onResize);
    $(window).on("resize", onResize);
    $(app.id() + " #closeView").on("click", function() {
        if (window.viewDataCollection) {
            $(app.id())
                .parent()
                .parent()
                .hide();
            $(app.id())
                .parent()
                .parent()
                .css("z-index", "");
            window.lunchParams = null;
        } else {
            window.close();
        }
    });

    function onResize() {
        setTimeout(function() {
            app.resize();
        }, 50);
    }

    function preventGesture() {
        //QAT-27628, QAT-27054 block touch gesture
        var touchEndTime;

        document.body.addEventListener("touchstart", function(e) {
            var event = e || window.event;
            if (event.touches && event.touches.length > 1) {
                //touch pointer counter
                event.preventDefault();
            }
        });
        document.body.addEventListener("touchmove", function(e) {
            var event = e || window.event;
            if (event.touches && event.touches.length > 1) {
                event.preventDefault();
            }
        });
        document.body.addEventListener("touchend", function(e) {
            var event = e || window.event;
            now = new Date().getTime();

            if (now - touchEndTime <= 300) {
                //prevent double touch to zoom in
                event.preventDefault();
            }
            touchEndTime = now;
        });
    }
    if (!window.viewDataCollection) {
        preventGesture();
    }
    //debugger;

    //for iOS:撐大可視範圍，避免預設顯示時出現title bar
    var isiPhone = /iPhone|iPad|iPod/i.test(navigator.platform),
        $p101 = $(app.id() + " .p101");
    if (isiPhone && !$p101.length) {
        $("<div/>")
            .addClass("p101")
            .appendTo($(app.id()));
    }

    function isIphone5() {
        function iOSVersion() {
            var agent = window.navigator.userAgent,
                start = agent.indexOf("OS ");
            if (agent.indexOf("iPhone") > -1 && start > -1)
                return window.Number(agent.substr(start + 3, 3).replace("_", "."));
            else return 0;
        }
        return isiPhone && iOSVersion() >= 6 && window.screen.height == 1136 / 2 ? true : false;
    }
    if (isIphone5()) {
        $(app.id() + " .footer").addClass("i5fixed");

        // QAT-30190 especially for iphone5 to hide any popup menu while pan-mask shows up.
        app._mask._root.on("panMaskShow", function() {
            app._dateSelect._menu.hide();
            app._weekSelect._menu.hide();
            app._periodSelect._menu.hide();
        });
    }

    return app;
})($);
