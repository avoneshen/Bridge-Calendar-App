# Bridge Lift Calendar

Travelling across Tower Bridge daily, and getting caught out by it's opening times more than I care to admit, I thought it would be cool to have a list of lifts on my calendar rather than having to cross reference meetings with the [official web page](http://www.towerbridge.org.uk/lift-times/). This is a little Node.js app for that, by synching a database of bridge opening times with Google Calendar. 

## Instructions for Calendar Users

This is an open source project, and you're welcome to use it for your own implementation. If you just want the calendar, you're welcome to subscribe to mine. 

Here’s the iCal link for that: 
```
https://calendar.google.com/calendar/ical/v7e1aukb21boup91kmiend0em4%40group.calendar.google.com/public/basic.ics
```

And if you need it, here's the calendar URL:
```
https://calendar.google.com/calendar/embed?src=v7e1aukb21boup91kmiend0em4%40group.calendar.google.com&ctz=Europe%2FLondon
```

### Outlook Install
To add to an Outlook Calendar, go into Outlooks Calendar / Home / Open calendar / From internet… - put the above link in there, and when prompted, say you’ll subscribe to it.

### Help / Issues

If you want to raise an issue, or request help, please do that [here](https://github.com/avoneshen/Bridge-Calendar-App/issues).

Please raise an issue here if you need any help integrating the iCal solution with other calendars or clients. I'll be happy to help you out.

## Getting Started

I host this on Heroku. See below for a sample installation.

I use MongoDB for the database, and you will also need to configure a service account for Google Calendar. [Node JS Quickstart](https://developers.google.com/calendar/quickstart/nodejs).

You should also ensure that you add your service account email to your calendar permissions.

### Installing

The module requires the [Tower Bridge Lifts CLI application](https://github.com/aaparmeggiani/tower-bridge-lifts) by aaparmeggiani. Run the following to install:

```
ruby -S gem install tower_bridge_lifts
```

If using jruby, you may also need to install [tzInfo](https://github.com/tzinfo/tzinfo/issues/37):

```
gem install tzinfo-data
```

Configuration details are managed using [Heroku config variables](https://devcenter.heroku.com/articles/config-vars).

Set these up as follows - check the format in app.js:

```
$heroku config:set BRIDGE_CALENDAR_ID=12345 CLIENT_EMAIL=67890 GC_PRIVATE_KEY=12345 MONGO_USER=joe: MONGO_PW=password123 MONGO_URL_SUFFIX=@blogs.mlab.com
```

If using Heroku you will require the Node.js and Ruby buildpacks.

I use the Heroku Scheduler to execute. Refer to executeApp.js for the process I schedule. If using Heroku, you can test with:

```
$ heroku run executeApp
```

## Testing

You can run my integration, unit and linting checks with:

```
npm test
```

Note that the integration tests will require you to have set up the credentials variables.

## Authors

* **Andrew Voneshen** - *Initial Work* - [Andrew Voneshen](https://github.com/avoneshen)

## License
This project is licensed under the MIT Licence - see the LICENCE file for details.

## Acknowledgements

* This would have been impossible without the awesome Tower Bridge Lifts repo by aaparmeggiani - check it out here: https://github.com/aaparmeggiani/tower-bridge-lifts
* This depends on Google Calendar, available via a modified version of the Google Node API - available here: https://github.com/google/google-api-nodejs-client/#google-apis-nodejs-client
* This readme was created from this sample: https://gist.github.com/PurpleBooth/109311bb0361f32d87a2
