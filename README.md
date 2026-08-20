# Neighborhood Safety Tracker

Neighborhood Safety Tracker is a web application that allows users to search and monitor crime complaint data in New York City. The application uses official NYPD complaint data along with user generated reports.

Users can search complaints using different filters, save locations they want to monitor, view complaints within a 1 mile radius of a saved location, and create their own reports.

## Setup

1) Install all the dependencies

```bash
npm install
```

2) Create a .env file in the root directory of the project and add the following variable

```env
APP_TOKEN=your_app_token
```

The APP_TOKEN is used to query the NYC Data API for the official NYC complaints

## How to get an APP_TOKEN

1) Signup for an NYC Open Data account at https://data.cityofnewyork.us/signup and then login

2) Once logged in, click on your profile name in the top right and select "Developer Settings"

3) Under the section, "App Tokens" click on 'Create New App Token' and fill out the information

4) Note: 'Neighborhood Safety Tracker' and 'Neighboorhood-Safety-Tracker' are already taken, you can use some other abbreivation or word to describe the app like "NST" or "Neighboorhood-Safety-Tracker-1"

5) Input a generic description

6) Copy the generated app token

7) Paste the token to your '.env' file to replace 'your_app_token'

```env
APP_TOKEN=your_token_here
```

## Running the app

1) Seed the database

```bash
npm run seed
```
**Note:** The initial seed may take around 5 minutes to complete because the application pulls data from the Official NYC Open Dataset. Wait until "Database seeded successfully" message appears before moving to the next step.

2) Start the app

```bash
npm start
```
## Test Users 

The seed file creates some users for testing different features. All test users use the same password for ease of access. The password is "Password1!"

Username: kevin | Email : kevin@test.com

Username: alex22 | Email: alex22@test.com

Username: maria | Email: maria@test.com

Username: james | Email: james@test.com

Username: sarah | Email: sarah@test.com

Username: daniel | Email: daniel@test.com
