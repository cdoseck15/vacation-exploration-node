<h1><a href="https://main.d1onofnofz7ttl.amplifyapp.com">Vacation Exploration</a></h1>
<p>
  Vacation Exploration is a website that helps people find the vacation that they would like to go on.
</p>
<p>
  Anyone that visits the website is able to view the about information and view any public vacations. A user can login and create an account that allows them to add friends and create and rate vacations that they have been on.
</p>
<h2>Technical Information</h2>
<p>
  This project uses node.js and express.js as the basis for the backend. Other packages and technologies used are:
  <ul>
    AWS Lambda
    MySQL
    JSON Web Tokens
    Google Places APIs
    Passport.js to authenticate with:
    <ul>
      Google OAuth 2.0
    </ul>
    Axios
  </ul>
<h2>How to use this code</h2>
<p>
  This project is run concurrently with a react.js frontend that is in
  <a href="https://github.com/cdoseck15/vacation-exploration-react">another repository</a> 
  on my account.
</p>
<p>
  You will have to have an account with Google setup to allow you to use Google Places and and OAuth Client ID that allows users to sign in using google.
</p>
<p>
  You will need a database that is setup with the structure that is in the sql_structure.sql file.
</p>
<p>
  In addition to that you will require an AWS account if you wish to push this to AWS.
</p>
<p>
  In order to use this code you will need to create a private-constants.js file that contains the constants needed for the program to run. In the future this will be set to use environment variables and this file will no longer be used. The constants are as follows:
  <ul>
    <li>GOOGLE_API_KEY</li>
    <li>FRONT_END which is the url of the react app.</li>
    <li>ACCESS_LIFE and REFRESH_LIFE which are constants for how long the JSON Web Tokens are valid for.</li>
    <li>ACCESS_KEY and REFRESH_KEY which are a key generated to encode the JSON Web Tokens.</li>
    <li>mysql which is the connection information for connecting to the database.</li>
    <li>google_auth which is the information for the Google OAuth that allows logging in with google.</li>
  </ul>
</p>
<p>
