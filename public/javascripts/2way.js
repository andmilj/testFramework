/**
 * Created by amiljus on 5.10.2014.
 */
//(function ($, undefined) {
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

    that.customEvent = (Model.id++) + ":change";
    that.binder = new DataBinder(that.customEvent, this.constructor.name);

    that.binder.on(that.customEvent, function (event, property, newValue, caller) {
        //endless loop check
        if (caller !== that) {
            that[property] = newValue;
        }
    });
    that.computedStack=[];

    that.reCompute= function () {
        for(var i=0; i<that.computedStack.length; i++){
            var prop=that.computedStack[i][0],
                value=that.computedStack[i][1].call(this);

            that.binder.trigger(that.customEvent, [prop, value, that])
        }
    }

    that.createProp = function (property, value) {
        Object.defineProperty(that, property, {
            get: function () {
                return typeof value !== "function"? that["_" + property]: value.call(this);
            },
            set: function (newValue) {
                if(typeof value !=="function"){
                    that["_" + property] = newValue;
                    //when setting
                    that.reCompute();
                }
                that.binder.trigger(that.customEvent, [property, newValue, that]);

            },
            enumerable: true,
            configurable: true
        });

        //pushing computed to stack
        if(typeof value === "function"){
            that.computedStack.push([property,value])
        }
        //set internal property
        //that["_" + property] =  typeof value !== "function"? value : value.call(this);
        //trigger set function with value
        that[property] = typeof value !== "function"? value : value.call(this);
    }

    that.get= function (property) {
        return that[property];
    }


    for(var prop in configuration.props){
        if(configuration.props.hasOwnProperty(prop)){
            that.createProp(prop,configuration.props[prop]);
        }
    }
}
Model.id = 0;

var model = new Model({
    props: {
        name: "Andrej",
        surname: "Miljus",
        wholeName:function(){
            return this.get("name")+this.get("surname");
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