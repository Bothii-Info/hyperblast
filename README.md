# hyperblast
Web app for BBD's vacation work July 2025. Should be a lazer tag app using phones.

## Features

- Create and join private lobbies
- Player face scanning for improved player recognition
- Real-time WebSocket communication
- In-game person detection with segmentation masks
- Multiplayer gameplay with scoring system

## Running the app
The app uses a node backend for websockets. This is found in the backend folder. A react app is used for the frontened. Obviously, this is in the frontend folder.

First make sure that you have all the node packages installed. Do this by running 
```
npm install
```
in both the backend and frontend folders.

To get the app running start by enabling the backend server, by running 
```
npm start
```
in the backend folder. (This starts the server).

To run the frontend, run
```
npm run dev
```
in the frontend folder.

## VS Code Task

The easiest way to run the application is using the VS Code task:

1. Open the project in VS Code
2. Press `Ctrl+Shift+P` and select "Tasks: Run Task"
3. Select "Start HyperBlast Dev Servers"

## How to Play

1. Open the application in your browser
2. Create a new lobby or join an existing one using a lobby code
3. Scan your face for improved player recognition
4. Once all players are ready, the game will start
5. Aim and shoot at other players to score points
6. The player with the highest score at the end wins

## Technical Implementation

- Frontend: React.js, TensorFlow.js, MediaPipe
- Backend: Node.js, WebSocket
- Person detection: TensorFlow COCO-SSD model
- Segmentation: MediaPipe Selfie Segmentation
