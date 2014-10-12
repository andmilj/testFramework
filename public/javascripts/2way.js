function DataBinderNo$(obj, viewModel) {
    var pubSub = {
        cash: {},
        subscribe: function (msg, callback) {
            this.cash[msg] = this.cash[msg] || [];
            this.cash[msg].push(callback);
        },
        publish: function (msg) {
            this.cash[msg] = this.cash[msg] || [];
            for (var i = 0; i < this.cash[msg].length; i++) {
                this.cash[msg][i].apply(this, arguments);
            }
        }
    };

    document.addEventListener("keyup", function (e) {
        var target = e.target,
            prop_name = target.getAttribute("data-bind");
        if (prop_name && prop_name !== "") {
            pubSub.publish(obj.customEvent, prop_name, target.value);
        }
    });

    //subscribing to custom event
    pubSub.subscribe(obj.customEvent, function (event, propName, newValue, caller) {
        var elements = document.querySelectorAll("[data-bind=" + propName + "]"),
            tag_name;

        for (var i = 0, len = elements.length; i < len; i++) {
            tag_name = elements[i].tagName.toLowerCase();
            if (tag_name === "input") {
                elements[i].value = newValue;
            } else {
                elements[i].innerHTML = newValue;
            }
        }

        //endless loop check
        if (caller !== obj) {
            obj[propName] = newValue;
        }
    });

    return pubSub;
}

function DataBinder(customEvent, viewModel) {
    var pubSub = $({});
    $("[data-bind-vm=" + viewModel + "]").on("keyup", "[data-bind]", function (e) {
        var $this = $(this);
        var property = $this.attr("data-bind");
        var value = $this.val();
        pubSub.trigger(customEvent, [property, value])
    });
    //subscribing to custom event
    pubSub.on(customEvent, function (event, property, newValue) {
        //getting all elements
        $("[data-bind=" + property + "]").each(function () {
            var $this = $(this);

            if ($this.is("input")) {
                $this.val(newValue);
            } else {
                $this.html(newValue);
            }
        });
    });

    return pubSub;
}

function Model(configuration) {
    var obj = {},
    //creating unique event for every model creation
        customEvent = (Model.id++) + ":change",
        binder = new DataBinderNo$(customEvent, this.constructor.name),
    //stack for computed values
        computedStack = [],
    //on every none computed value change we should loop through
        reCompute = function () {
            for (var i = 0; i < computedStack.length; i++) {
                var prop = computedStack[i][0],
                    value = computedStack[i][1].call(objGetter);

                binder.publish(customEvent, prop, value, obj);
            }
        },
        createProp = function (property, value) {
            Object.defineProperty(obj, property, {
                get: function () {
                    return typeof value !== "function" ? obj["_" + property] : value.call(objGetter);
                },
                set: function (newValue) {
                    if (typeof value !== "function") {
                        obj["_" + property] = newValue;
                        //when setting
                        reCompute();
                    }
                    binder.publish(customEvent, property, newValue, obj);

                },
                enumerable: true,
                configurable: true
            });

            //pushing computed to stack
            if (typeof value === "function") {
                computedStack.push([property, value])
            }

            //trigger set function with value
            obj[property] = typeof value !== "function" ? value : value.call(objGetter);
        },
    //computed values will use this func inside its func-body to receive properties they depend on
        objGetter = {
            get: function (property) {
                return obj[property];
            }
        };

    binder.subscribe(customEvent, function (event, property, newValue, caller) {
        //endless loop check
        if (caller !== obj) {
            obj[property] = newValue;
        }
    });

    //looping over all defined props
    for (var prop in configuration.props) {
        if (configuration.props.hasOwnProperty(prop)) {
            createProp(prop, configuration.props[prop]);
        }
    }

    return obj;
}
Model.id = 0;
function ModelWithThis(configuration) {
    //creating unique event for every model creation
    this.customEvent = (Model.id++) + ":change";
    this.binder = new DataBinderNo$(this, this.constructor.name);
    //stack for computed values
    this.computedStack = [];
    this.config = configuration;
    //initialize configuration
    this.init(this.config);

}
ModelWithThis.id = 0;
ModelWithThis.prototype = function () {
    var reCompute = function () {
            for (var i = 0; i < this.computedStack.length; i++) {
                var prop = this.computedStack[i][0],
                    value = this.computedStack[i][1].call(this);

                this.binder.publish(this.customEvent, prop, value, this);
            }
        },

        createProp = function (property, value) {
            Object.defineProperty(this, property, {
                get: function () {
                    return typeof value !== "function" ? this["_" + property] : value.call(this);
                },
                set: function (newValue) {
                    if (typeof value !== "function") {
                        this["_" + property] = newValue;
                        //when setting
                        reCompute.call(this);
                    }
                    this.binder.publish(this.customEvent, property, newValue, this);

                },
                enumerable: true,
                configurable: true
            });

            //pushing computed to stack
            if (typeof value === "function") {
                this.computedStack.push([property, value])
            }

            //trigger set function with value
            this[property] = typeof value !== "function" ? value : value.call(this);
        },

    //computed values will use this func inside its func-body to receive properties they depend on
        get = function (property) {
            return this[property];
        },
    //looping over all defined props
        init = function (config) {
            for (var prop in config.props) {
                if (config.props.hasOwnProperty(prop)) {
                    this.createProp(prop, config.props[prop]);
                }
            }
        };
    return{
        createProp: createProp,
        get: get,
        init: init
    };
}();

var model = new ModelWithThis({
    props: {
        name: "Andrej",
        surname: "Miljus",
        wholeName: function () {
            return this.get("name") + this.get("surname");
        }
    }
});


function Data() {
    this.cache = {
    };
    this.expando = "data" + (new Date).getTime();
}

Data.id = 1;
Data.prototype = {
    //getting DOM elements data,
    //containing handlers and event dispatcher and other stuff
    get: function (elem) {
        var guid = elem[this.expando];
        if (!guid) {
            guid = elem[this.expando] = Data.id++;
            this.cache[guid] = {
                handlers:{}
            };
        }
        return this.cache[guid];
    }
}


//jquery
var am = function (selector) {
    return new am.prototype.init(selector);
}
var init = am.prototype.init = function (selector) {
    this[0] = document.querySelector(selector);
    return this;
}
init.prototype = am.prototype;
var dataGetter = new Data();
am.prototype.event = {
    //connecting objects dispatcher to handle all events bound to DOMelem
    add: function (elem, eventName, handler) {
        var elemData = dataGetter.get(elem);
        if (!elemData.handlers[eventName])
            elemData.handlers[eventName] = [];
        elemData.handlers[eventName].push(handler);
        console.log(elemData.handlers[eventName]);
        if(!elemData.dispatcher){
            //binding dispatcher to DOM element
            elemData.dispatcher= function (event) {
                var handlers=elemData.handlers[event.type];
                if(handlers) {
                    for (var i = 0, len = handlers.length; i < len; i++) {
                        handlers[i].call(elem, event);
                    }
                }
            };
        }
        if(elemData.handlers[eventName].length===1){
            document.addEventListener(eventName, elemData.dispatcher);
        }
    }
}
am.prototype.on = function (event, selector, callback) {
    //not in eventlistener. dont need to search on every click for
    //elements
    var elementsToHit = this[0].querySelectorAll(selector);
//    this.event.add(this[0],event, function () {
//        console.log("getting in custom handler");
//    });

    this.event.add(this[0] ,event, function (e) {
        var thisElem = e.target;
        var hit = true;
        while (thisElem !== this && hit) {
            for (var i = 0 , len = elementsToHit.length; i < len; i++) {
                if (hit = elementsToHit[i] === thisElem) {
                    //callback with context of element that was hit
                    callback.apply(thisElem, arguments);
                    break;
                }
                ;
            }
            thisElem = thisElem.parentNode
        }
    });

//    this[0].addEventListener(event, function (e) {
//        var thisElem = e.target;
//        var hit = true;
//        while (thisElem !== this && hit) {
//            for (var i = 0 , len = elementsToHit.length; i < len; i++) {
//                if (hit = elementsToHit[i] === thisElem) {
//                    //callback with context of element that was hit
//                    callback.apply(thisElem, arguments);
//                    break;
//                }
//                ;
//            }
//            thisElem = thisElem.parentNode
//        }
//    });
};
am("#test").on("click", "span", function (e) {
    console.log(this);
});

