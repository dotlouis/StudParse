Parse.Cloud.beforeSave(Parse.Role, function(request, response) {

    Parse.Cloud.useMasterKey();

    var role = request.object;
    var permission = new Parse.ACL();

    try{
        // admin have all rights
        permission.setRoleReadAccess('admin', true);
        permission.setRoleWriteAccess('admin', true);

        // by default the student have read access
        permission.setRoleReadAccess('student',true);
        // we set permission to read access "student" role
        // which allows same access for his child roles
        role.setACL(permission);
        response.success();
    } catch(error){response.error(error);}
});

Parse.Cloud.afterSave(Parse.Role, function(request){

    Parse.Cloud.useMasterKey();

    var role = request.object;

    try{
        if (role.getName() == 'admin'){
            // do nothing, admins have rights for eveything based on
            // security configured in the data browser
        }
        // if role is other than student (teacher or groups),
        // we make it child of student role for it to herit the same access
        else if (role.getName() != 'student'){
            new Parse.Query(Parse.Role).equalTo('name','student').first().then(function(studentRole){
                // However if student role does not exists, create it
                if(!studentRole)
                    studentRole = new Parse.Role("student", new Parse.ACL());

                // Then add the afterSaved role to studentRole
                studentRole.getRoles().add(role);
                studentRole.save();
            }, function(error){throw error;});
        }
    } catch(error){response.error(error);}

});
