
var _ = require('underscore');


// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.beforeSave(Parse.User, function(request, response) {

	var username = request.object.get("username");
	var email = request.object.get("username");


	// Email address based on this format: firstname.lastname@[student.]school.com
	// Students: simon.wicart@student.france-bs.com
	// Not student: phillipe.caillot@france-bs.com

	try{
		// Create the nickname attribute based on email address
		request.object.set("nickname", email.substring(0, email.indexOf('@')).substring(0, email.indexOf('.')));

		// Assign school based on email address
		//request.object.set("school", Parse.User.assignSchool(email));
		
		// A bit like sudo otherwise the query returns undefined (ACL)
		Parse.Cloud.useMasterKey();

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
	// Assign roles based on email adress
	try{
		Parse.User.assignRole(request.object);
	}
	catch(error){
		console.log(error);
	}
});

Parse.User.makeNickname = function(email){
	// nickname is first name.
	return email.substring(0, email.indexOf('@')).substring(0, email.indexOf('.'));
}

Parse.User.assignSchool = function(user){

	// A bit like sudo otherwise the query returns undefined (ACL)
	Parse.Cloud.useMasterKey();

	var email = user.get('username');
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
			//throw "PLOT TWIST MUFFUGAS";
			console.log('COME ON !!!!!!');

			// if the school does not already exist throw error
			// if(_.isUndefined(school)){
			// 	throw "No school found matching this email address: "+ email;
			// 	console.log("No school found matching this email address ", email);
			// }
			// else{
				user.set('school', school.id);
				//user.save();
				//return school.id;
			// }
		},
		error: function(error) {
			console.log("SHIT man you piss me off really");
			throw "[ERROR] " + error.code + " : " + error.message;
		}
	});

}

Parse.User.assignRole = function(user){

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


	var query = new Parse.Query(Parse.Role);
	query.equalTo("name", rolename);
	query.first ( {
		success: function(role) {

			// if the role does not already exist create it
			// if(_.isUndefined(role)){
			// 	console.log("creating new role: ", rolename);
			// 	var newRole = new Parse.Role(rolename, new Parse.ACL());
			// 	newRole.getUsers().add(user);
			// 	newRole.save();
			// }
			// else{
				role.getUsers().add(user);
				role.save();
			// }
		},
		error: function(error) {
			throw "[ERROR] " + error.code + " : " + error.message;
		}
	});

}

