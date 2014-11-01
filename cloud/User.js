Parse.Cloud.beforeSave(Parse.User, function(request, response) {

    // A bit like sudo otherwise the query returns undefined (ACL)
    Parse.Cloud.useMasterKey();

    var user = request.object;
    var email = user.getEmail();

    // the school is choosen via the client
    // var school = user.get('school');

    // placeholder to allow creation from the Parse Data Browser (since there is only one school)
    new Parse.Query('School').first().then(function(school){

        try{

            // Email should be provided from client even if Parse only make username property mandatory
            // Studapp client will by default provide email == username
            if(!email)
                throw "No valid email provided";

            if(!school)
                throw "No valid school provided";

            if(!email.match(school.get('emailPattern').global))
                throw "The email provided is not one of the "+school.get('name')+" school";

            // Email address based on this format: firstname.lastname@[student.]school.com
            // Students: simon.wicart@student.france-bs.com
            // Not student: phillipe.caillot@france-bs.com
            var namepart = email.substring(0, email.indexOf('@'));
            var nickname = namepart.substring(0, email.indexOf('.')).capitalize();
            var fullname = nickname+" "+namepart.substring(namepart.indexOf('.')+1).capitalize();
            // var schoolpart = email.substring(email.indexOf('@')+1, email.lastIndexOf('.'));
            // var schoolname = schoolpart.substring(schoolpart.indexOf('.')+1);

            // Set newly made attributes
            user.set("nickname", nickname);
            user.set("fullname", fullname);

            // return crafted User
            response.success();

        } catch(error){response.error(error);}
    });
});


// http://stackoverflow.com/questions/24180379/creating-relations-in-parse-com-with-multiple-classes-javascript-sdk
Parse.Cloud.afterSave(Parse.User, function(request){

    Parse.Cloud.useMasterKey();

    var user = request.object;
    var email = user.getEmail();
    var rolename = "student"; // default role
    var schoolpart = email.substring(email.indexOf('@')+1, email.lastIndexOf('.'));

    // if email does not contain "student" assign teacher role; else student role by default
    if(schoolpart.indexOf('student') == -1)
        if(schoolpart.indexOf('admin') == -1)
            rolename = 'teacher';
        else
            rolename = 'admin';

    try{
        // get the role based on rolename
        new Parse.Query(Parse.Role).equalTo('name',rolename).first().then(function(role){
            // if role does not exist, make it so
            if(!role)
                role = new Parse.Role(rolename, new Parse.ACL());
            // then add relation
            role.getUsers().add(user);
            role.save();
        },function(error){throw error;});

        // for now add to fbs by default
        new Parse.Query('School').equalTo('nickname',"FBS").first().then(function(school){
            // add relation
            school.relation('users').add(user);
            school.save();
        },function(error){throw error;});
    } catch(error){response.error(error);}
});
