/**
 * Created by amiljus on 4.10.2014.
 */
(function (homeController) {


    homeController.init = function (app) {

        app.get("/", function (req, res) {

            res.render("index");

        });

    };
})(module.exports)