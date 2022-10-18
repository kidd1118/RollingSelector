window.DTBoard = (function() {
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
                gameSn: window.viewDataCollection ? window.viewDataCollection.gamesn : getParameterByName("gamesn"),
                gameToken:
                    getParameterByName("gameToken") || (window.slotContainer ? window.slotContainer.gameToken : ""),
                // IPD-1942
                commonapisite: window.commonapisite || getParameterByName("commonapi"),
                infoUrl: window.infoUrl ? window.infoUrl + "/" : "./",
                bucode: window.viewDataCollection ? window.viewDataCollection.bucode : getParameterByName("bucode"),
                currencyISOCode:
                    getParameterByName("currencyISOCode") ||
                    (window.slotContainer ? window.slotContainer.currencyISOCode : ""),
                currencyCode:
                    getParameterByName("currencyCode") ||
                    (window.slotContainer ? window.slotContainer.currencyCode : ""),
                rootUrl: "http://gc-ag-dcas.xndev.net",
                cultureName: getParameterByName("lang")
                    ? getParameterByName("lang")
                    : window.viewDataCollection
                    ? window.viewDataCollection.lang
                    : "en-US"
            };
        }
        return {
            lang: getParameterByName("lang")
                ? getParameterByName("lang")
                : window.viewDataCollection
                ? window.viewDataCollection.lang
                : "en-US",
            gameSn: window.viewDataCollection ? window.viewDataCollection.gamesn : getParameterByName("gamesn"),
            gameToken: getParameterByName("gameToken") || (window.slotContainer ? window.slotContainer.gameToken : ""),
            // IPD-1942
            commonapisite: window.commonapisite || getParameterByName("commonapi"),
            infoUrl: window.infoUrl ? window.infoUrl + "/" : "./",
            bucode: window.viewDataCollection ? window.viewDataCollection.bucode : getParameterByName("bucode"),
            currencyISOCode:
                getParameterByName("currencyISOCode") ||
                (window.slotContainer ? window.slotContainer.currencyISOCode : ""),
            currencyCode:
                getParameterByName("currencyCode") || (window.slotContainer ? window.slotContainer.currencyCode : ""),
            rootUrl: window.location.origin,
            cultureName: getParameterByName("lang")
                ? getParameterByName("lang")
                : window.viewDataCollection
                ? window.viewDataCollection.lang
                : "en-US"
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
                rowTitle: false
            };
            this._root = $("<div/>").addClass("grid");
            this._columns = [];
            this._rows = [];
        };
        instance.prototype = {
            addColumn: function(col) {
                this._columns[col.name] = col;
            },
            addRow: function(data, title, css) {
                var _this = this,
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
                    if (this._columns[i].hide) continue;
                    var _data = data ? (this._columns[i].format ? this._columns[i].format(data[i]) : data[i]) : "";
                    $cel = $("<div/>")
                        .addClass("cell")
                        .appendTo($row);
                    if (this._columns[i].class) $cel.addClass(this._columns[i].class);

                    if (typeof _data == "string" || typeof _data == "number") {
                        if (_data == undefined || _data == null) {
                            $cel.text("");
                        } else {
                            $cel.text(_data);
                        }
                    } else if (_data instanceof $) {
                        $cel.append(_data);
                    }
                }
                $cel.data("data", data);
                if (this._options.isRowClick) {
                    $("<div/>")
                        .addClass("detail")
                        .addClass("icon-icon_next")
                        .appendTo($row);
                    $cel.click(function() {
                        $(_this).trigger($.Event("clickRow", [$(this).data("data")])); //custom event
                    });
                }
                this._rows.push($row);
            },
            addNullRow: function() {
                var _this = this,
                    $cel = null,
                    $row = $("<div/>")
                        .addClass(this._rows.length % 2 === 0 ? "row even" : "row odd")
                        .css({})
                        .appendTo(this._root);

                console.log(">>append null row");
                for (var i in this._columns) {
                    if (this._columns[i].hide) continue;
                    $cel = $("<div/>")
                        .addClass("cell")
                        .appendTo($row);
                    if (this._columns[i].class) $cel.addClass(this._columns[i].class);
                    $cel.text("-");
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
                Utility.padLeft(date.getUTCDate(), 2));
        },
        formatDate: function(date, seperator) {
            var d = new Date(date);
            d.setTime(d.getTime() - 4 * 60 * 60 * 1000);
            return (
                Utility.padLeft(d.getUTCDate(), 2) +
                (seperator || "/") +
                Utility.padLeft(d.getUTCMonth() + 1, 2) +
                (seperator || "/") +
                Utility.padLeft(d.getUTCFullYear(), 2));
        },
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
                Utility.padLeft(d.getUTCSeconds(), 2));
        },
        formatTime: function(date, seperator) {
            var d = new Date(date);
            d.setTime(d.getTime() - 4 * 60 * 60 * 1000);
            var h = d.getUTCHours(),
                apm = h < 12 ? "AM" : "PM";

            return (
                Utility.padLeft(h < 12 ? h : 24 - h, 2) +
                (seperator || ":") +
                Utility.padLeft(d.getUTCMinutes(), 2) +
                " " +
                apm);
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
        }
    };

    /**
     * Dialog
     */
    var WaitingDialog = (function() {
        var instance = function(opt) {
            this._root = $("<div/>").addClass("mask");
            this._dialog = $(
                '<div><div id="floatingBarsG">' +
                    '<div class="blockG" id="rotateG_01"></div>' +
                    '<div class="blockG" id="rotateG_02"></div>' +
                    '<div class="blockG" id="rotateG_03"></div>' +
                    '<div class="blockG" id="rotateG_04"></div>' +
                    '<div class="blockG" id="rotateG_05"></div>' +
                    '<div class="blockG" id="rotateG_06"></div>' +
                    '<div class="blockG" id="rotateG_07"></div>' +
                    '<div class="blockG" id="rotateG_08"></div>' +
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
                daily: "Daily",
                weekly: "Weekly",
                period: "Period"
            };

        var mgr = function(url) {
            apiUrl = url;
        };
        mgr.prototype = {
            getDTBoardSetting: function(callback) {
                var sample = {
                    Body: {
                        Dragon: {
                            Daily: 0,
                            Weekly: 0,
                            Period: 0
                        },
                        Tiger: {
                            Daily: 0,
                            Weekly: 0,
                            Period: 0
                        },
                        DragonMinScore: 0
                    },
                    Messages: [
                        {
                            Args: ["string"],
                            ID: "string",
                            Type: 0
                        }
                    ],
                    Status: "string"
                };

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
            },
            getDragonBoard: function(type /*boardType*/, callback) {
                var sample = {
                    Body: {
                        Info: {
                            PeriodName: "string",
                            Year: 0,
                            Period: 0,
                            Week: 0,
                            Day: 0,
                            RangeFrom: "2016-10-20T02:17:22.682Z",
                            RangeTo: "2016-10-20T02:17:22.682Z",
                            SettleDate: "2016-10-20T02:17:22.682Z"
                        },
                        Entities: [
                            {
                                BUCode: "string",
                                Count: 0,
                                GameSN: 0,
                                MemberCode: "string",
                                Rank: 0,
                                RefAccountSN: "string",
                                RefWager: "string",
                                Score: 0,
                                SettleTime: "2016-10-20T02:17:22.682Z"
                            }
                        ]
                    },
                    Messages: [
                        {
                            Args: ["string"],
                            ID: "string",
                            Type: 0
                        }
                    ],
                    Status: "string"
                };

                var url = apiUrl + "/" + type + "DragonBoard/0"; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        buCode: params.bucode,
                        cultureName: getSafeCultureName(),
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
            },
            getTigerBoard: function(type /*boardType*/, callback) {
                var url = apiUrl + "/" + type + "TigerBoard/0"; //game sn, 0 for all

                $.ajax({
                    dataType: "json",
                    url: url,
                    data: {
                        cultureName: getSafeCultureName(),
                        buCode: params.bucode
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
            // QAT-32758
            entitySortFunction: function(a, b) {
                if (a && b && a.Score && b.Score && a.Score === b.Score) {
                    return Date.parse(a.SettleTime || a.SettleDate) - Date.parse(b.SettleTime || b.SettleDate);
                }
                return b.Score - a.Score;
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
     * DT Board instance.
     */
    var Application = (function() {
        var id = "#DTBoard",
            boardType = {
                daily: "Daily",
                weekly: "Weekly",
                period: "Period"
            },
            settings,
            timer1,
            timer2;

        var instance = function() {
            var _this = this;

            this._Grid = new Grid({ isRowClick: true });
            this._Grid.addColumn({ name: "Rank", class: "helf" });
            this._Grid.addColumn({
                name: "SettleTime",
                class: "helf",
                format: function(data) {
                    var date = new Date(data);
                    return lang("label.week" + date.getUTCDay());
                }
            });
            this._Grid.addColumn({ name: "MemberCode" });
            this._Grid.addColumn({
                name: "Score",
                class: "textRight",
                format: function(data) {
                    var key = $(id + " .tabSet .tab1.focus").data("key");
                    return key == "Dragon" ? Utility.formatNumber(data, 2) : Utility.formatNumber(data);
                }
            });
            this._Grid.addColumn({ name: "Count" });
            this._Grid.on("clickRow", function(evt) {
                var key1 = $(id + " .tabSet .tab1.focus").data("key"),
                    key2 = $(id + " .tabSet .tab2.focus").data("key");

                if (key2 == boardType.period) {
                    var url =
                        params.infoUrl +
                        "DTBoardRpt.html?lang=" +
                        encodeURIComponent(params.lang) +
                        "&gameToken=" +
                        encodeURIComponent(params.gameToken) +
                        "&gamesn=" +
                        encodeURIComponent(evt[0].GameSN) +
                        "&commonapi=" +
                        encodeURIComponent(params.commonapisite) +
                        "&bucode=" +
                        encodeURIComponent(evt[0].BUCode) +
                        "&currencyISOCode=" +
                        encodeURIComponent(params.currencyISOCode) +
                        "&filter=" +
                        encodeURIComponent(key1) +
                        "&page=" +
                        encodeURIComponent(boardType.period);

                    if (window.viewDataCollection) {
                        window.lunchParams = {};
                        window.lunchParams.currencyISOCode = params.currencyISOCode;
                        window.lunchParams.gamesn = evt[0].GameSN;
                        window.lunchParams.filter = key1;
                        window.lunchParams.page = boardType.period;

                        $("#DTBoardRptView").css(
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

                        if (window["DTBoardReport"]) {
                            window["DTBoardReport"].load(window.lunchParams);
                            $("#DTBoardRptView").show();
                        } else {
                            $.get(url, null, function(data) {
                                $("#DTBoardRptView > #DTBoardRptContent").html(data);
                                $("#DTBoardRptView").show();
                            });
                        }
                    } else {
                        window.open(url); //open DT board report
                    }
                } else {
                    var url =
                        params.infoUrl +
                        "acctState.html?lang=" +
                        encodeURIComponent(params.lang) +
                        "&gameToken=" +
                        encodeURIComponent(params.gameToken) +
                        "&gamesn=" +
                        encodeURIComponent(evt[0].GameSN) +
                        "&commonapi=" +
                        encodeURIComponent(params.commonapisite) +
                        "&bucode=" +
                        encodeURIComponent(evt[0].BUCode) +
                        "&page=3&filter=" +
                        encodeURIComponent(evt[0].RefWager);

                    if (window.viewDataCollection) {
                        window.lunchParams = {};
                        window.lunchParams.gamesn = evt[0].GameSN;
                        window.lunchParams.filter = evt[0].RefWager;
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
            });
            this._Grid.render($(id + " .grid"));

            this._manager = new dataManager(params.commonapisite);

            this._waiting = new WaitingDialog();
            this._waiting.render($(id));

            this._mask = new PanMask();
            this._mask.render($(id));
        };
        instance.prototype = {
            load: function() {
                var _this = this;
                if (settings) {
                    _this.initTabs(false);
                    _this.initNote();
                } else {
                    this._waiting.show();
                    this._manager.getDTBoardSetting(function(data) {
                        settings = data;
                        _this.initTabs(true);
                        _this.initNote();
                    });
                }

                if (window.hideCloseView) {
                    $(id + " #closeView").hide();
                } else {
                    $(id + " #closeView").show();
                }
            },
            setSubHeader: function(text) {
                $(id + " .subHeader").text(text);
            },
            setSubNote: function(text) {
                $(id + " .subNote").text(text);
            },
            initNote: function() {
                var messages = [lang("label.DTBoardNote1"), lang("label.DTBoardNote2"), lang("label.DTBoardNote3")],
                    index = 0;

                function fadeInMsg() {
                    $(id + " .note")
                        .hide()
                        .text(messages[index])
                        .fadeIn(500, function() {
                            index == messages.length - 1 ? (index = 0) : index++;
                        });
                }
                fadeInMsg();
                timer2 = setInterval(fadeInMsg, 5000);
            },
            initTabs: function(isRender) {
                var _this = this,
                    $current1,
                    $current2,
                    tabSeq = {
                        Dragon: {
                            Daily: true,
                            Weekly: true,
                            Period: true
                        },
                        Tiger: {
                            Daily: false,
                            Weekly: false,
                            Period: false
                        }
                    };

                if (isRender) {
                    for (var i in tabSeq) {
                        var isShow = false;
                        var tab1 = $("<div/>")
                            .addClass("tab1")
                            .text(lang("label." + i.toLowerCase()))
                            .data("key", i)
                            .appendTo($(id + " .tabSet"));
                        for (var j in tabSeq[i]) {
                            if (tabSeq[i][j]) {
                                var tab2 = $("<div/>")
                                    .addClass("tab2")
                                    .text(lang("label." + j.toLowerCase()))
                                    .data("key", j)
                                    .appendTo($(id + " .tabSet"));
                                if (settings && settings[i] && settings[i][j] == "1") {
                                    tab2.show();
                                } else {
                                    tab2.hide();
                                }
                            }
                            if (settings && settings[i] && settings[i][j] == "1") {
                                isShow = true;
                            }
                        }
                        if (isShow) {
                            tab1.show();
                        } else {
                            tab1.hide();
                        }
                    }

                    $(id + " .tabSet").each(function() {
                        //var tabKey = ['Dragon', 'Tiger', boardType.daily, boardType.weekly, boardType.period];

                        $(this)
                            .children()
                            .off("click");
                        $(this)
                            .children(".tab1")
                            .on("click", function() {
                                $current1.toggleClass("focus");
                                $current1 = $(this);
                                $current1.toggleClass("focus");
                                $current2.toggleClass("focus");
                                $current2 = null;

                                var key = $current1.data("key");
                                if (settings && settings[key]) {
                                    $(id + " .tabSet .tab2")
                                        .each(function() {
                                            if (settings[key][$(this).data("key")] == "1") {
                                                $(this).show();
                                                $current2 = $current2 || $(this).addClass("focus");
                                            } else {
                                                $(this).hide();
                                            }
                                        })
                                        .insertAfter(this);
                                } else {
                                    $(id + " .tabSet .tab2").hide();
                                }

                                $(id + " .subNote").hide();
                                if (key == "Dragon") {
                                    if (settings.DragonMinScore > 0) {
                                        $(id + " .subNote").show();
                                        _this.setSubNote(
                                            lang("label.DragonBoardSubNote", [
                                                Utility.formatNumber(settings.DragonMinScore, 0),
                                                params.currencyCode
                                            ])
                                        );
                                    }
                                } else if (key == "Tiger") {
                                    $(id + " .subNote").show();
                                    _this.setSubNote(lang("label.TigerBoardSubNote"));
                                }

                                onclick();
                            })
                            .each(setKey);

                        $(this)
                            .children(".tab2")
                            .on("click", function() {
                                $current2.toggleClass("focus");
                                $current2 = $(this);
                                $current2.toggleClass("focus");
                                onclick();
                            })
                            .each(setKey);

                        function setKey() {
                            //var key = tabKey.shift();
                            //$(this).data('key', key);
                        }
                    });
                    function onclick() {
                        _this._waiting.show();
                        _this._Grid.clear();

                        var key1 = $current1 ? $current1.data("key") : null,
                            key2 = $current2 ? $current2.data("key") : null;

                        if (!settings || !settings[key1] || settings[key1][key2] != 1) {
                            _this._waiting.hide();
                            return;
                        }

                        _this._manager["get" + key1 + "Board"](key2, function(data) {
                            // QAT-32758
                            var entities =
                                    data && data.Entities
                                        ? data.Entities.sort(_this._manager.entitySortFunction)
                                        : null,
                                info = data ? data.Info : null,
                                text = "",
                                col = ["Rank", "SettleTime", "MemberCode", "Score", "Count"];

                            switch (key2) {
                                case boardType.daily:
                                    text = info
                                        ? lang("label.dayN", [info.Day]) +
                                          " (" +
                                          Utility.formatDate(new Date(info.SettleDate)) +
                                          ")"
                                        : "";
                                    col = ["Rank", "", "MemberCode", "Score", ""];
                                    break;
                                case boardType.weekly:
                                    var date = info ? new Date(info.SettleDate) : null,
                                        sDate = info ? new Date(info.SettleDate) : null;

                                    if (date) {
                                        date.setDate(date.getDate() + (1 - info.Day));
                                    }
                                    if (sDate) {
                                        sDate.setDate(sDate.getDate() + (7 - info.Day));
                                    }
                                    for (var i in entities) {
                                        entities[i].SettleTime = entities[i].SettleTime || entities[i].SettleDate;
                                    }
                                    text = info
                                        ? lang("label.weekN", [info.Week]) +
                                          " (" +
                                          Utility.formatDate(date) +
                                          " - " +
                                          Utility.formatDate(sDate) +
                                          ")"
                                        : "";
                                    col = ["Rank", "SettleTime", "MemberCode", "Score", ""];
                                    break;
                                case boardType.period:
                                    text = info
                                        ? info.PeriodName +
                                          " (" +
                                          Utility.formatDate(new Date(info.RangeFrom)) +
                                          " - " +
                                          Utility.formatDate(new Date(info.RangeTo)) +
                                          ")"
                                        : "";
                                    col = ["Rank", "", "MemberCode", "", "Count"];
                                    break;
                            }
                            $(id + " .content > .title.row")
                                .children()
                                .each(function(index, item) {
                                    $(item)[col[index] ? "show" : "hide"]();
                                });
                            _this._Grid.displayColumns(col);
                            for (var i in entities) {
                                entities[i].MemberCode = $("<p/>").html(
                                    '<p style="color: #3292FF;">' +
                                        (window["GameName"]
                                            ? window["GameName"]["GameSN_" + entities[i].GameSN]
                                            : entities[i].GameSN) +
                                        "</p>" +
                                        (entities[i].Rank == 1
                                            ? '<img src="' +
                                              params.infoUrl +
                                              '/img/common/Crown.png" style="width: 20px; height: 18px;">'
                                            : "") +
                                        entities[i].MemberCode
                                );

                                _this._Grid.addRow(entities[i], null, entities[i].Rank == 1 ? { color: "red" } : null);
                            }

                            /**
                             * QAT-31176 : 沒有資料的row要顯示 " - "
                             * 這個方法算出要額外加入幾個 Null Items
                             * @param boardTypeId 列舉值: boardType.daily ...
                             * @param dataSet 資料集合
                             * @returns {number} 應該要填上幾個 空資料列(null line item)
                             */
                            function countNullLineItems(boardTypeId, dataSet) {
                                var N = dataSet ? dataSet.length : 0;
                                switch (boardTypeId) {
                                    case boardType.daily:
                                        return 10 - N;
                                    case boardType.weekly:
                                        return 7 - N;
                                    case boardType.period:
                                        return 0;
                                }
                                return 0;
                            }
                            var numNullItems = countNullLineItems(key2, entities);
                            for (var j = 0; j < numNullItems; j++) {
                                _this._Grid.addNullRow();
                            }
                            _this.setSubHeader(text);

                            _this._waiting.hide();
                        });
                    }
                }

                $current1 = $(id + " .tabSet > .tab1:visible:first").addClass("focus");
                $current2 = $(id + " .tabSet > .tab2:first");
                $current1 && $current1.trigger("click");
                timer1 = setInterval(onclick, 120 * 1000);
            },
            resize: function() {},
            stopTimer: function() {
                timer1 && clearInterval(timer1);
                timer2 && clearInterval(timer2);
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

    //initail DOM
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
                            loadGameName(_this._options.lang);
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
                                        loadGameName(_this._options.lang);
                                    });
                            }
                        });
                }
                function loadGameName(lang) {
                    if (window["GameName"]) {
                        _this._lang.gameName = window["GameName"] ? window["GameName"]["GameSN_" + params.gameSn] : "";
                        callback && callback();
                    } else {
                        var fileName = "",
                            fixedLang = lang.toLowerCase().replace("_", "-");
                        switch (fixedLang) {
                            case "zh-tw":
                            case "zh-cn":
                                fileName = "GameName." + fixedLang + ".js";
                                break;
                            default:
                                fileName = "GameName.js";
                                break;
                        }
                        $.getScript(params.rootUrl + "/Scripts/" + fileName).always(function(data) {
                            _this._lang.gameName = window["GameName"]
                                ? window["GameName"]["GameSN_" + params.gameSn]
                                : "";
                            callback && callback();
                        });
                    }
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
        app.load();
    });

    //$(window).off('orientationchange');
    //$(window).on('orientationchange', onResize);
    $(window).off("resize");
    $(window).on("resize", onResize);
    $(app.id() + " #closeView").on("click", function() {
        if (window.viewDataCollection) {
            $(app.id())
                .parent()
                .parent()
                .hide();
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

    return app;
})();
