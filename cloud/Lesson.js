var ical = require('cloud/ical.js');


Parse.Cloud.define("parseCalendar", function(request, response) {
    Parse.Cloud.httpRequest({
        url: 'http://www.univ-orleans.fr/EDTWeb/export',
        params: {
            project: '2014-2015',
            resources: '56204',
            type: 'ical'
        },
        success: function(httpResponse) {
            var test = ical.parseICS(httpResponse.text);
            response.success(test);
        },
        error: function(httpResponse) {
            response.error('Request failed with response code ' + httpResponse.status);
        }
    });
});
