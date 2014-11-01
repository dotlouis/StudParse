Parse.Cloud.beforeSave("Course", function(request, response) {

    Parse.Cloud.useMasterKey();
    var course = request.object;

    try{
        // Automatically points to FBS
        new Parse.Query("School").equalTo('nickname','FBS').first().then(function(school){
            course.set('school', school);
            response.success();
        },function(error){throw error;});
    } catch(error){response.error(error);}
});
