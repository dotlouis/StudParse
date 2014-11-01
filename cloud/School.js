Parse.Cloud.beforeSave("School", function(request, response) {

    Parse.Cloud.useMasterKey();
    var globalPattern = new RegExp("^[a-z]+\.[a-z]+@[a-z]*\.?france-bs\.com$");

    // Set emailPattern to France-bs regexp by default
    request.object.set('emailPattern', {global: globalPattern});

    try{
        response.success();
    } catch(error){response.error(error);}
});
