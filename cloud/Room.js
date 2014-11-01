Parse.Cloud.beforeSave("Room", function(request, response) {

    Parse.Cloud.useMasterKey();
    var room = request.object;

    try{
        // concat type and name for fullname
        room.set('fullname',room.get('type')+' '+room.get('name'));

        // Automatically points to FBS
        new Parse.Query("School").equalTo('nickname','FBS').first().then(function(school){
            room.set('school', school);
            response.success();
        },function(error){throw error;});
    } catch(error){response.error(error);}
});
