var fs = require('fs');
var ejs = require('ejs');

// initialize Mandrill stuff
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('OMITTED');

// Authenticate via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'OMITTED',
  consumer_secret: 'OMITTED',
  token: 'OMITTED',
  token_secret: 'OMITTED'
});


var csvFile = fs.readFileSync("friend_list.csv","utf8");

// constructor function for our friends
var Friend = function(firstName, lastName, numMonthsSinceContact, emailAddress){
	this.firstName = firstName;
	this.lastName = lastName;
	this.numMonthsSinceContact = numMonthsSinceContact;
	this.emailAddress = emailAddress;
}

// parses lines of the CSV file into an Array of Objects
var csvParse = function(csv){
	var parsed = [];

	// split csv into array of lines
	var csv_lines = csv.split("\n");

	// loop though array of lines to create objects
	// start at line 1 (ignores header)
	for (var i = 1; i < csv_lines.length; i++){
		var friend_data = csv_lines[i].split(",");
		// console.log(friend_data);
		var buddy = new Friend(friend_data[0],friend_data[1],friend_data[2],friend_data[3]);
		parsed.push(buddy);

	}
	return parsed;
}

// console.log(csvParse(csvFile));
var parsedFriends = csvParse(csvFile);

// for sending emails
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }

// read in email template
// var email_template =  "<html>\n<head><meta charset='utf-8'></head>\n<body>\n<p>Hey <%= firstName %>,</p>\n<br>\n<p>\nHow are you? It's been too long (<%= numMonthsSinceContact %> months?) since we caught up.\nI'm learning to code full-time at Fullstack Academy and having a blast.\n</p>\n<p>\nI've actually been blogging about my experiences at Fullstack.\nYou can check it out <a href='http://LINK_TO_BLOG'>here</a>.\n</p>\n<p>\nTalk soon,<br>\nZack\n</p>\n</body>\n</html>"
var email_template = fs.readFileSync("email_template.ejs", "utf-8");

var email_customizer = function(parsedFile, template, posts) {
	// 	for each friend on the list
	for (var i = 0; i < parsedFile.length; i++){
		// generate their customized email using EJS
		var emailTemplate = ejs.render(template, {
			firstName: parsedFile[i].firstName,
			numMonthsSinceContact: parsedFile[i].numMonthsSinceContact,
			latestPosts: posts
		});
		// send them their email
		// console.log(emailTemplate);
		sendEmail(parsedFile[i].firstName + " " + parsedFile[i].lastName, parsedFile[i].emailAddress, "Zack Elias", "zelias500@gmail.com", "Saying hi", emailTemplate)
	}
}


// generates the email html complete with latest posts
var generateHTML = function (postArray){
	client.posts('zackelias2.tumblr.com', function(err, blog){
  	var the_date = new Date();
  	// number of milliseconds in a day * seven days
  	var cutoff = 86400000*7;
  	// var latest = []

  	for (var i = 0; i < blog['posts'].length; i++){
  		var d = new Date(blog['posts'][i].date);
  		if ((the_date-d) < cutoff) {
  			postArray.push(blog['posts'][i]);
  		}
  	}

  	email_customizer(parsedFriends, email_template, postArray);
  // arr = latest;
	// console.log(latest);
	});
}

// Need to pass an empty array into generateHTML,
// which fills the array with the latest posts.
// Then, the array (newly filled) is passed to email_customizer,
// which inserts the latest posts info into each customized email.
var latest = [];

generateHTML(latest);






