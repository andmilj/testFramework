/**
 * Created by amiljus on 4.10.2014.
 */
(function(controllers){
    var homeController=require("./homeController");

    controllers.init=function(app){
        homeController.init(app);
    };

})(module.exports);