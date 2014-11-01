Parse.Cloud.beforeSave("Course", function(request, response) {

    Parse.Cloud.useMasterKey();
    var course = request.object;
    var school_relation = course.relation('school');

    try{
        // Automatically add a relation to FBS
        new Parse.Query("School").equalTo('nickname','FBS').first().then(function(school){
            school_relation.add(school);
            response.success();
        },function(error){throw error;});
    } catch(error){response.error(error);}
});
