# GatorPath 🐊

GatorPath is a web application that visualizes and compares the performance of Dijkstra's algorithm and A\* search for finding the shortest path on the University of Florida campus.

This interface allows you to enter a start and end location, and it will run both algorithms simultaneously, showing you the nodes each algorithm visits in real-time.

## Project Structure

The project is organized into two main folders:

```
GatorPath/
├── backend/     # Node.js/Express server for pathfinding logic
└── frontend/    # React (Vite) client for the map interface
```

-----

## 🚀 Running Locally

To run this application, you will need **two separate terminal windows** open: one for the backend server and one for the frontend client.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your machine.

-----

### 1\. Run the Backend Server

The backend is responsible for loading the graph data (`nodes.csv`, `edges.csv`) and running the pathfinding algorithms when the frontend requests a route.

```bash
# 1. Navigate to the backend directory
cd GatorPath/backend

# 2. Install the necessary dependencies
npm install

# 3. Start the server
npm start
```

The terminal should show that the server is loading the nodes and edges and then listening on `http://localhost:3001`.

-----

### 2\. Run the Frontend Client

The frontend provides the map interface and user controls.

```bash
# 1. In a new terminal, navigate to the frontend directory
cd GatorPath/frontend

# 2. Install the necessary dependencies
npm install

# 3. Start the development server
npm run dev
```

This command will typically open the application automatically in your default browser (usually at `http://localhost:5173`).

-----

## 🖥️ Usage

Once both the backend and frontend are running:

1.  Open the application in your browser (e.g., `http://localhost:5173`).
2.  Type a starting location (e.g., "Beaty Towers") into the **Start** box.
3.  Type a destination (e.g., "Ben Hill Griffin Stadium") into the **End** box.
4.  Click the **Find Route** button.
6.  Watch the real-time visualization as both algorithms search for the path and see the final results appear in the sidebar.
   
Proposal link: https://docs.google.com/document/d/1XuAlLr0ptzoVryks59LQD--iJduZOdpCZy5cobvfzic/edit?usp=sharing
