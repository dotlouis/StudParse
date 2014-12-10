var tools = require('cloud/tools.js');

Parse.Cloud.beforeSave(Parse.User, function(request, response) {

    // A bit like sudo otherwise the query returns undefined (ACL)
    Parse.Cloud.useMasterKey();

    var user = request.object;
    var id = user.getUsername();

    getUserResource(id).then(function(resourceNumber){
        if(resourceNumber == -1)
            response.error("Unable to find resource number in page");
        else{
            user.set('resource', parseInt(resourceNumber));
            getResourceName(resourceNumber).then(function(name){
                console.log(name.fullname);
                user.set('fullname', name.fullname);
                user.set('nickname', name.firstname);
                response.success();
            },function(error){response.error(error);});
        }
    }, function(error){response.error(error);});

});

function getResourceName(resourceId){
    // we request the info page
    return Parse.Cloud.httpRequest({
        url: 'https://aderead6.univ-orleans.fr/jsp/custom/modules/infos/members.jsp',
        params: 'login=etuWeb&password=&projectId=2&uniqueId='+(resourceId.toString())
    }).then(function(httpResponse){
        var dom = httpResponse.text;

        // we look for the name of the resource
        var startOfName = dom.indexOf('<span class="title">')+20;
        var endOfName = dom.indexOf('</span><br><br>');
        var extracted = dom.substring(startOfName, endOfName);
        var firstname = extracted.substring(0, extracted.indexOf(' ')).toString().capitalize();
        var lastname = extracted.substring(extracted.indexOf(' ')+1).toString().capitalize();
        var fullname = firstname+" "+lastname;

        return {fullname: fullname, firstname: firstname, lastname:lastname};

    },function(error){return error;});
};

function getUserResource(userId){
    // we request the ENT page
    return Parse.Cloud.httpRequest({
            url: 'http://www.univ-orleans.fr/EDTWeb/edt',
            params: {
                project: '2014-2015',
                action: 'displayWeeksPeople',
                person: userId
            }
        }).then(function(httpResponse){
            var dom = httpResponse.text;

            // we look for the export url to get the resources and project number
            var startOfUrl = dom.indexOf('href=\"http://www.univ-orleans.fr/EDTWeb/export?');
            var endOfUrl = dom.indexOf('\u0026amp;type=ical\" target=\"Export\"');
            if(startOfUrl == -1 || endOfUrl == -1)
                return -1;
            else{
                var exportUrl = dom.substring(startOfUrl,endOfUrl);
                var project = exportUrl.substring(exportUrl.indexOf('project=')+8, exportUrl.indexOf('\u0026amp;resources='));
                var resource = exportUrl.substring(exportUrl.indexOf('resources=')+10);
                if(resource == "")
                    return -1;
                else
                    return resource;
            }
        },function(error){return error;});
};


// http://stackoverflow.com/questions/24180379/creating-relations-in-parse-com-with-multiple-classes-javascript-sdk
Parse.Cloud.afterSave(Parse.User, function(request){

    Parse.Cloud.useMasterKey();

    var user = request.object;
    // var email = user.getEmail();
    var rolename = "student"; // default role
    // var schoolpart = email.substring(email.indexOf('@')+1, email.lastIndexOf('.'));

    // if email does not contain "student" assign teacher role; else student role by default
    // if(schoolpart.indexOf('student') == -1)
    //     if(schoolpart.indexOf('admin') == -1)
    //         rolename = 'teacher';
    //     else
    //         rolename = 'admin';

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

        // for now add to the default school
        new Parse.Query('School').first().then(function(school){
            // add relation
            school.relation('users').add(user);
            school.save();
        },function(error){throw error;});
    } catch(error){response.error(error);}
});
