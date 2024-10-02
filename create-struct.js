const fs = require("fs");
const path = require("path");

const folders = [
    "src/api",
    "src/assets",
    "src/components/ChessBoard",
    "src/contexts",
    "src/hooks",
    "src/pages",
    "src/redux/slices",
    "src/services",
    "src/styles",
];

const files = [
    { path: "src/api/auth.ts", content: "" },
    { path: "src/api/game.ts", content: "" },
    { path: "src/components/Button.tsx", content: "" },
    { path: "src/components/Header.tsx", content: "" },
    { path: "src/components/Footer.tsx", content: "" },
    { path: "src/contexts/AuthContext.tsx", content: "" },
    { path: "src/contexts/GameContext.tsx", content: "" },
    { path: "src/hooks/useAuth.ts", content: "" },
    { path: "src/hooks/useWebSocket.ts", content: "" },
    { path: "src/pages/Home.tsx", content: "" },
    { path: "src/pages/Login.tsx", content: "" },
    { path: "src/pages/ChessGame.tsx", content: "" },
    { path: "src/pages/Profile.tsx", content: "" },
    { path: "src/redux/store.ts", content: "" },
    { path: "src/redux/slices/authSlice.ts", content: "" },
    { path: "src/redux/slices/gameSlice.ts", content: "" },
    { path: "src/services/WebSocketService.ts", content: "" },
    { path: "src/styles/variables.scss", content: "" },
    { path: "src/styles/ChessBoard.scss", content: "" },
    { path: "src/App.tsx", content: "" },
    { path: "src/routes.tsx", content: "" },
];

function createFolders() {
    folders.forEach((folder) => {
        const folderPath = path.join(__dirname, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Created folder: ${folder}`);
        }
    });
}

function createFiles() {
    files.forEach((file) => {
        const filePath = path.join(__dirname, file.path);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, file.content);
            console.log(`Created file: ${file.path}`);
        }
    });
}

function createStructure() {
    createFolders();
    createFiles();
    console.log("Project structure created successfully.");
}

createStructure();
