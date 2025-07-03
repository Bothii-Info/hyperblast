# hyperblast
Web app for BBD's vacation work July 2025. A lazer tag app using phones.

## Running the app
The app uses a node backend for websockets. This is found in the backend folder. A react app is used for the frontend. Obviously, this is in the frontend folder.
First make sure that you have all the node packages installed. Do this by running 
```
npm install
```
in both the frontend and backend folders.
Next, run the same command in the root folder. This installs a package that allows you to run the frontend and the backend concurrently by running
```
npm start
```
in the root folder.

Alternatively, the app is currently deployed on https://hyperblast-sooty.vercel.app/.