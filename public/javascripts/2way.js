function DataBinderNo$(customEvent, viewModel) {
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
            pubSub.publish(customEvent, prop_name, target.value);
        }
    });

    //subscribing to custom event
    pubSub.subscribe(customEvent, function (event, propName, newValue) {
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
    var that = this;

    //creating unique event for every model creation
    that.customEvent = (Model.id++) + ":change";
    that.binder = new DataBinderNo$(that.customEvent, this.constructor.name);

    that.binder.subscribe(that.customEvent, function (event, property, newValue, caller) {
        //endless loop check
        if (caller !== that) {
            that[property] = newValue;
        }
    });

    //stack for computed values
    that.computedStack = [];

    //on every none computed value change we should loop through
    that.reCompute = function () {
        for (var i = 0; i < that.computedStack.length; i++) {
            var prop = that.computedStack[i][0],
                value = that.computedStack[i][1].call(this);

            that.binder.publish(that.customEvent, prop, value, that);
        }
    }

    that.createProp = function (property, value) {
        Object.defineProperty(that, property, {
            get: function () {
                return typeof value !== "function" ? that["_" + property] : value.call(this);
            },
            set: function (newValue) {
                if (typeof value !== "function") {
                    that["_" + property] = newValue;
                    //when setting
                    that.reCompute();
                }
                that.binder.publish(that.customEvent, property, newValue, that);

            },
            enumerable: true,
            configurable: true
        });

        //pushing computed to stack
        if (typeof value === "function") {
            that.computedStack.push([property, value])
        }

        //trigger set function with value
        that[property] = typeof value !== "function" ? value : value.call(this);
    }

    //computed values will use this func inside its func-body to receive properties they depend on
    that.get = function (property) {
        return that[property];
    }

    //looping over all defined props
    for (var prop in configuration.props) {
        if (configuration.props.hasOwnProperty(prop)) {
            that.createProp(prop, configuration.props[prop]);
        }
    }
}
Model.id = 0;

var model = new Model({
    props: {
        name: "Andrej",
        surname: "Miljus",
        wholeName: function () {
            return this.get("name") + this.get("surname");
        }
    }
});

//model.createProp("name", "Andrej");


function View() {
    this.andrej = "hehe";
}
function MyModel() {
    var customEvent = "my:change";
    var binder = new DataBinder(customEvent, this.constructor.name);

    var obj = {
        props: {},
        set: function (property, newValue) {
            this.props[property] = newValue;
            binder.trigger(customEvent, [property, newValue, this])
        },
        get: function (property) {
            return this.props[property];
        },
        init: function () {

        }
    };
    //subscribing to event
    binder.on(customEvent, function (event, property, newValue, caller) {
        //endless loop check
        if (caller !== obj) {
            obj.set(property, newValue)
        }
    });
    return obj;
}


//})(jQuery)