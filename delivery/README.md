# A3 reference delivery

The three `usernameA3-*.zip` files use the requested username placeholder. Extract all three into the same empty parent folder. The folder names inside each archive must remain intact.

| Archive | Contents |
| --- | --- |
| `usernameA3-clientside.zip` | Visitor pages, AngularJS, shared styles and photographs |
| `usernameA3-adminside.zip` | Staff pages, controllers and styles |
| `usernameA3-api.zip` | Express application, SQL, migration, tests, tools, project documentation and verification evidence |

The admin pages load shared AngularJS and styles through the visitor site, so all three parts are needed. Configure the database and `api/.env`, run `npm ci` in `api`, then `npm start`. The root README has complete instructions.

`charityevents_db.sql` is the final schema/data export. `Peer Evaluation form.docx` is blank and unchanged; each student completes it personally. `manifest.json` records archive integrity and source hashes. Local credentials and database files are excluded.

These are reference artifacts produced with recorded AI assistance. The A3 brief restricts directly submitting generated code/text. The student still needs their own permitted work, explanation, cPanel deployment, team GitHub history, video and confidential peer evaluation.
