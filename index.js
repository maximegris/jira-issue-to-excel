const request = require('request-promise');
const argv = require('minimist')(process.argv.slice(2));
const utf8 = require('utf8');
const base64 = require('base-64');
const dateFormat = require('dateformat');
const json2xls = require('json2xls');
const fs = require('fs');

if (!argv.p || !argv.p || !argv.v) {
    console.error('Usage:' + __filename + '-u USERNAME:API_TOKEN -p MONPROJET -v VERSION1,VERSION2,VERSION3');
} else {

    var bytes = utf8.encode(argv.u);
    var auth = base64.encode(bytes);

    const options = {
        method: 'GET',
        uri: 'https://emotic.atlassian.net/rest/api/2/search?jql=project=' + argv.p + ' AND fixVersion IN (' + argv.v + ') ORDER BY fixVersion,status,type,priority&fields=summary,description,issuetype,fixVersions,created,priority,updated,status',
        json: true,
        headers: {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'application/json'
        }
    }

    request(options)
        .then(function (response) {
            
            const data = [];
            const issues = response.issues || [];
            for(let i = 0 ; i < issues.length ;  i++) {
                let issue = issues[i];
                data.push({
                    key: issue.key,
                    summary : issue.fields.summary,
                    description: issue.fields.description,
                    type : issue.fields.issuetype.name,
                    status : issue.fields.status.name,
                    created : issue.fields.created,
                    updated: issue.fields.updated,
                    priority: issue.fields.priority.name,
                    fixVersion: issue.fields.fixVersions && issue.fields.fixVersions.length > 0 ? issue.fields.fixVersions[0].name : ''
                });
            }

            if(data.length > 0) {
                const xls = json2xls(data);
    
                const now = Date();
                const fileName = dateFormat(now, 'yyyy_mm_dd-HH_MM_ss_') + argv.p + '.xlsx';
    
                fs.writeFileSync(fileName, xls, 'binary');
            }
            
        })
        .catch(function (err) {
            console.error(err);
        });
}
