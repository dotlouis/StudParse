var ical = require('cloud/ical.js');


Parse.Cloud.define("parseCalendar", function(request, response) {
    console.log(request.user.getUsername());
    // We scrap the ENT url using the unique userID of the university (username)
    Parse.Cloud.httpRequest({
        url: 'http://www.univ-orleans.fr/EDTWeb/edt',
        params: {
            project: '2014-2015',
            action: 'displayWeeksPeople',
            person: request.user.getUsername()
        },
        success: function(httpResponse) {
            var dom = httpResponse.text;

            // we look for the export url to get the resources and project number
            var startOfUrl = dom.indexOf('href=\"http://www.univ-orleans.fr/EDTWeb/export?');
            var endOfUrl = dom.indexOf('\u0026amp;type=ical\" target=\"Export\"');
            if(startOfUrl == -1 || endOfUrl == -1)
                response.error("resource number not found");
            else{
                var exportUrl = dom.substring(startOfUrl,endOfUrl);
                var project = exportUrl.substring(exportUrl.indexOf('project=')+8, exportUrl.indexOf('\u0026amp;resources='));
                var resource = exportUrl.substring(exportUrl.indexOf('resources=')+10);

                // We get the ical Data from export url
                Parse.Cloud.httpRequest({
                    url: "http://www.univ-orleans.fr/EDTWeb/export",
                    params: {
                        type: 'ical',
                        project: project,
                        resources: resource
                    },
                    success: function(httpResponse){
                        // we transform the ical data into useable json object
                        var schedule = ical.parseICS(httpResponse.text);
                        response.success(schedule);
                    },
                    error: function(httpResponse){
                        response.error("Unable to extract the ical data");
                    }
                })
            }
        },
        error: function(httpResponse) {
            response.error('Request failed with response code ' + httpResponse.status);
        }
    });
});
