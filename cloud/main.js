
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

		// Assign school based on email address
		//request.object.set("school", Parse.User.assignSchool(email));
		
		var schoolname;

		// if the email contains @france-bs, assign the student school
		if(email.substring(email.indexOf('@')).indexOf('france-bs') > -1)
			schoolname = 'FBS';
		else
			schoolname = 'FBS'; // default school


		var query = new Parse.Query("School");
		query.equalTo("shortname", schoolname);
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

	var user = request.object;
	// Assign roles based on email adress

	// A bit like sudo otherwise the query returns undefined (ACL)
	Parse.Cloud.useMasterKey();

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
				else{
					console.log("creating new role: ", rolename);
					var newRole = new Parse.Role(rolename, new Parse.ACL());
					newRole.getUsers().add(user);
					newRole.save();
				}
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
