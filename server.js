// Import necessary modules
const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE SETUP ---
const dbPath = path.join(__dirname, 'database.json');

// Helper function to read the database
const readDB = () => {
    try {
        const dbData = fs.readFileSync(dbPath);
        return JSON.parse(dbData);
    } catch (error) {
        console.error("Error reading database:", error);
        // Return a default structure if the file doesn't exist or is empty
        return { users: [], lessons: [], riddles: [] };
    }
};

// Helper function to write to the database
const writeDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error("Error writing to database:", error);
    }
};

// --- MOCK DATA (Included for context, assuming this might be moved or dynamic later) ---
const learningPaths = {
    python: {
        title: "The Pythonic Temple",
        currentLesson: "The Alchemist's Variables",
        type: 'quiz',
        lessonId: 'python_variables',
        steps: [
            { name: "The Basics of Syntax", completed: true },
            { name: "The Alchemist's Variables", completed: false },
            { name: "The Trial of Conditionals", completed: false },
            { name: "The Loop Labyrinth", completed: false },
            { name: "The Riddle of Two Sums", completed: false },
            { name: "The Object-Oriented Oracle", completed: false }
        ],
        challenge: {
            title: "The Daily Divisibility",
            description: "Write a function to check if a number is divisible by both 3 and 5."
        }
    },
    javascript: {
        title: "The JavaScript Jungle",
        currentLesson: "The Mirrored Word",
        type: 'riddle',
        lessonId: 'js_palindrome',
        steps: [
            { name: "First Steps into the Wild", completed: true },
            { name: "Taming the Variables", completed: true },
            { name: "The Mirrored Word", completed: false },
            { name: "Mastering the DOM Tree", completed: false },
            { name: "The Asynchronous Abyss", completed: false },
            { name: "The Framework Frontier", completed: false }
        ],
        challenge: {
            title: "The Daily Anagram",
            description: "Write a function to check if two words are anagrams of each other."
        }
    },
    sql: {
        title: "The SQL Kingdom",
        currentLesson: "The Royal Scribe's Task",
        type: 'riddle',
        lessonId: 'sql_filter_users',
        steps: [
            { name: "The Royal Proclamation of SELECT", completed: true },
            { name: "The Royal Scribe's Task", completed: false },
            { name: "The JOINing of Tables", completed: false },
            { name: "The Aggregate Functions", completed: false },
            { name: "The Subquery Secrets", completed: false }
        ],
        challenge: {
            title: "The Daily Employee Count",
            description: "Write a query to count the number of employees in each department."
        }
    },
    datastructures: {
        title: "The Architect's Labyrinth",
        currentLesson: "The Array Blueprint",
        type: 'riddle',
        lessonId: 'ds_array_sum',
        steps: [
            { name: "The Array Blueprint", completed: false },
            { name: "The Linked List Chain", completed: false },
            { name: "The Stack of Plates", completed: false },
            { name: "The Queue for the Throne", completed: false },
            { name: "The Hash Table's Map", completed: false }
        ],
        challenge: {
            title: "The Daily Max Value",
            description: "Write a function to find the maximum value in an array."
        }
    }
};

const lessonData = {
    js_conditionals: {
        title: "Navigating with Conditionals",
        question: "Which operator is used for strict equality (checks both value and type)?",
        options: ["==", "=", "===", "!="],
        correctAnswer: 2
    },
    sql_select: {
        title: "The SELECT Statement",
        question: "Which SQL statement is used to extract data from a database?",
        options: ["GET", "SELECT", "OPEN", "EXTRACT"],
        correctAnswer: 1
    },
    python_variables: {
        title: "The Alchemist's Variables",
        question: "What is the correct way to assign the integer value 10 to a variable named 'gold' in Python?",
        options: ["gold = 10", "let gold = 10;", "const gold = 10;", "variable gold = 10;"],
        correctAnswer: 0
    }
};

const riddleData = {
    python_two_sum: {
        title: "The Riddle of Two Sums",
        riddle: "Given a list of numbers `[2, 7, 11, 15]` and a target of `9`, complete the function `solve()` to return the indices of the two numbers that add up to the target.\n\nThe correct answer is `[0, 1]`.",
        scaffold: "def solve():\n  nums = [2, 7, 11, 15]\n  target = 9\n  # Your code goes here\n  \n  \n  return [] # Return the indices",
        solution: "return [0, 1]",
        hint: "You can use a dictionary to store the numbers you've seen so far."
    },
    js_palindrome: {
        title: "The Mirrored Word",
        riddle: "A palindrome is a word that reads the same forwards and backwards. Complete the `isPalindrome` function to check if a given word is a palindrome. It should return `true` or `false`.\n\nExample: `isPalindrome('racecar')` should return `true`.",
        scaffold: "function isPalindrome(word) {\n  // Your code here\n\n\n  return word.split('').reverse().join('') === word;\n}",
        solution: "return word.split('').reverse().join('') === word;",
        hint: "You can reverse the string and compare it to the original."
    },
    sql_filter_users: {
        title: "The Royal Scribe's Task",
        riddle: "From the `Users` table, select all users who are older than 30. The table has columns `name` and `age`.\n\nComplete the query.",
        scaffold: "SELECT * FROM Users WHERE age > 30;",
        solution: "age > 30",
        hint: "Use the `WHERE` clause to filter the results."
    },
    ds_array_sum: {
        title: "The Array Blueprint",
        riddle: "Given an array of numbers, calculate the sum of all its elements.\n\nExample: `sum([1, 2, 3])` should return `6`.",
        scaffold: "function sum(arr) {\n  // Your code here\n\n\n  return 0;\n}",
        solution: "return arr.reduce((a, b) => a + b, 0)",
        hint: "You can use the `reduce` method to solve this problem."
    }
};

const leaderboardData = [
    { rank: 1, name: 'Alex Ryder', xp: 15240, avatar: 'A', rankColor: 'text-yellow-400', borderColor: 'border-yellow-400' },
    { rank: 2, name: 'Ben Carter', xp: 14880, avatar: 'B', rankColor: 'text-gray-300', borderColor: 'border-gray-400' },
    { rank: 3, name: 'Chloe Davis', xp: 14510, avatar: 'C', rankColor: 'text-orange-400', borderColor: 'border-orange-400' },
    { rank: 4, name: 'You', xp: 9120, avatar: 'Y', isCurrentUser: true }
];

const questData = [
    { id: 1, title: 'Daily Login', description: 'Log in for 3 consecutive days', progress: '2/3', completed: false },
    { id: 2, title: 'Python Novice', description: 'Complete 5 Python lessons', progress: '3/5', completed: false },
    { id: 3, title: 'Quiz Master', description: 'Answer 10 quiz questions correctly', progress: '8/10', completed: false }
];


// --- API ENDPOINTS ---

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const userExists = db.users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Username already exists." });
    }
    const newUser = {
        username,
        password, // Note: In a real app, you should hash passwords
        progress: { xp: 0, level: 1, xpToNextLevel: 500, badges: [], dailyStreak: 0, gems: 0 }
    };
    db.users.push(newUser);
    writeDB(db);
    res.json({ success: true, message: "Registration successful! Please login." });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, message: "Login successful!", userData: { username: user.username, progress: user.progress } });
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password." });
    }
});

app.get('/api/dashboard', (req, res) => {
    const { username, path } = req.query;
    if (!username) return res.status(400).json({ error: "Username is required." });
    const db = readDB();
    const user = db.users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: "User not found." });
    const selectedPath = learningPaths[path] || learningPaths.python;
    res.json({ userName: user.username, ...user.progress, learningPath: selectedPath });
});

app.get('/api/leaderboard', (req, res) => res.json(leaderboardData));

app.get('/api/quests', (req, res) => res.json(questData));


app.get('/api/lesson', (req, res) => {
    const lessonId = req.query.id;
    const selectedLesson = lessonData[lessonId];
    if (selectedLesson) res.json(selectedLesson);
    else res.status(404).json({ error: "Lesson not found" });
});

app.get('/api/riddle', (req, res) => {
    const riddleId = req.query.id;
    const selectedRiddle = riddleData[riddleId];
    if (selectedRiddle) res.json(selectedRiddle);
    else res.status(404).json({ error: "Riddle not found" });
});

app.post('/api/complete-lesson', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username is required." });
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.status(404).json({ success: false, message: "User not found." });
    const userProgress = db.users[userIndex].progress;
    userProgress.xp += 100;
    userProgress.gems += 10;
    userProgress.dailyStreak += 1;
    if (userProgress.xp >= userProgress.xpToNextLevel) {
        userProgress.level += 1;
        userProgress.xp -= userProgress.xpToNextLevel;
        userProgress.xpToNextLevel = Math.floor(userProgress.xpToNextLevel * 1.5);
    }
    writeDB(db);
    res.json({ success: true, message: "Progress saved!" });
});

// --- HTML PAGE SERVING ---

// Serve login page at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve other pages
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Add any other specific page routes here, for example:
// app.get('/dashboard', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
// });


// A catch-all for any other request. This can be a 404 or redirect to login.
// app.get('/^(?!\/api).*/', (req, res) => {
//     res.redirect('/');
// });


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
