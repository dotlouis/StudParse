Parse.Cloud.beforeSave("School", function(request, response) {

    Parse.Cloud.useMasterKey();
    var globalPattern = new RegExp("^[a-z]+\.[a-z]+@[a-z]*\.?univ-orleans\.fr$");

    // Set emailPattern to Orleans Univ regexp by default
    request.object.set('emailPattern', {global: globalPattern});

    try{
        response.success();
    } catch(error){response.error(error);}
});
