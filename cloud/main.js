
var _ = require('underscore');

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

Parse.Cloud.beforeSave(Parse.User, function(request, response) {

	// A bit like sudo otherwise the query returns undefined (ACL)
	Parse.Cloud.useMasterKey();

	var user = request.object;
	var email = user.getEmail();
	var school_relation = user.relation('school');

	// the school is choosen via the client
	// var school = user.get('school');

	// placeholder to allow creation from the Parse Data Browser (since there is only one school)
	new Parse.Query("School").first().then(function(school){

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

			// Add a relation to selected school
			school_relation.add(school);

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
	} catch(error){response.error(error);}
});



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



Parse.Cloud.beforeSave("Room", function(request, response) {

	Parse.Cloud.useMasterKey();
	var room = request.object;
	var school_relation = room.relation('school');

	try{
		// Automatically add a relation to FBS
		new Parse.Query("School").equalTo('nickname','FBS').first().then(function(school){
			school_relation.add(school);
			response.success();
		},function(error){throw error;});
	} catch(error){response.error(error);}
});


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


Parse.Cloud.beforeSave("School", function(request, response) {

	Parse.Cloud.useMasterKey();
	var globalPattern = new RegExp("^[a-z]+\.[a-z]+@[a-z]*\.?france-bs\.com$");

	// Set emailPattern to France-bs regexp by default
	request.object.set('emailPattern', {global: globalPattern});

	try{
		response.success();
	} catch(error){response.error(error);}
});

Parse.Cloud.define("addUserToAdminRole", function(request, response){
	Parse.Cloud.useMasterKey();
	new Parse.Query(Parse.Role).equalTo('name','admin').first().then(function(result){
		result.getUsers().add(request.user);
		result.save();
		response.success(result);
	},
	function(error){
		response.error(error);
	})
});
