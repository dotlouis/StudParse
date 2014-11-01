Parse.Cloud.beforeSave("Room", function(request, response) {

    Parse.Cloud.useMasterKey();
    var room = request.object;
    var school_relation = room.relation('school');

    try{
        // concat type and name for fullname
        room.set('fullname',room.get('type')+' '+room.get('name'));

        // Automatically add a relation to FBS
        new Parse.Query("School").equalTo('nickname','FBS').first().then(function(school){
            school_relation.add(school);
            response.success();
        },function(error){throw error;});
    } catch(error){response.error(error);}
});
