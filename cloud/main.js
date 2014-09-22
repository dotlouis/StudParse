
var _ = require('underscore');

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

Parse.Cloud.beforeSave(Parse.User, function(request, response) {

	// A bit like sudo otherwise the query returns undefined (ACL)
	Parse.Cloud.useMasterKey();

	var username = request.object.get("username");
	var email = request.object.get("username");

	// Email address based on this format: firstname.lastname@[student.]school.com
	// Students: simon.wicart@student.france-bs.com
	// Not student: phillipe.caillot@france-bs.com
	
	var namepart = email.substring(0, email.indexOf('@'));
	var nickname = namepart.substring(0, email.indexOf('.')).capitalize();
	var fullname = nickname+" "+namepart.substring(email.indexOf('.')+1).capitalize();

	try{
		// Create the nickname attribute based on email address
		request.object.set("nickname", nickname);
		request.object.set("fullname", fullname);
		
		var schoolname;

		// if the email contains @france-bs, assign the student school
		if(email.substring(email.indexOf('@')).indexOf('france-bs') > -1)
			schoolname = 'FBS';
		else
			schoolname = 'FBS'; // default school


		var query = new Parse.Query("School");
		query.equalTo("nickname", schoolname);
		query.first ( {
			success: function(school) {
				if(!_.isUndefined(school)){
					request.object.set('school', school);
					response.success();
				}
				else
					response.error("No school matches this email adress "+email);
			},
			error: function(error) {
				throw "[ERROR] " + error.code + " : " + error.message;
			}
		});
			
	}
	catch(error){
		console.log(error);
		response.error(error);
	}
});

Parse.Cloud.afterSave(Parse.User, function(request){

	Parse.Cloud.useMasterKey();

	var user = request.object;

	var email = user.get('username');
	var rolename;

	// if the email contains @etu, assign the student role
	if(email.substring(email.indexOf('@')).indexOf('student') > -1)
		rolename = 'student';
	else if(email.substring(email.indexOf('@')).indexOf('admin') > -1)
		rolename = 'admin';
	else
		rolename = 'teacher'; //default role

	try{
		var query = new Parse.Query(Parse.Role);
		query.equalTo("name", rolename);
		query.first ( {
			success: function(role) {

				// if the role does not already exist create it
				if(!_.isUndefined(role)){
					role.getUsers().add(user);
					role.save();
				}
				else
					throw "Unknown role: "+rolename;
			},
			error: function(error) {
				throw "[ERROR] " + error.code + " : " + error.message;
			}
		});
	}
	catch(error){
		console.log(error);
	}
});

Parse.Cloud.beforeSave(Parse.Role, function(request, response) {

	Parse.Cloud.useMasterKey();

	var name = request.object.get("name");
	var permission = new Parse.ACL({});

	try{

		if(name=="admin")
			permission.setRoleReadAccess(request.object,true);

		request.object.setACL(permission);
		response.success();
	}
	catch(error){
		console.log(error);
		response.error(error);
	}
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
	}
	catch(error){
		console.log(error);
		response.error(error);
	}
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
	}
	catch(error){
		console.log(error);
		response.error(error);
	}
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
