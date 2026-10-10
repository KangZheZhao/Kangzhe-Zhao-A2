'use strict';
// Passenger's default entry point; the application is shared with npm start.
require('./server').start().catch(async error => {
  console.error('Unable to start:', error.message);
  await require('./event_db').end();
  process.exitCode = 1;
});
