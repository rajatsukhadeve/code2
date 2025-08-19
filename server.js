// Import necessary modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Add axios for API calls

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Worqhat API Configuration
const WORQHAT_API_URL = 'https://api.worqhat.com/flows/trigger/1923e305-a659-4a5d-ac7d-a1702094840f';
const WORQHAT_API_KEY = 'wh_mehdbcs4Y97ep40HOnJPW2YzcjsGhGHJUrdmatuCKt1';

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

// Helper function to call Worqhat API for code analysis
const analyzeCodeWithWorqhat = async (userCode, language = 'javascript') => {
    try {
        const payload = {
            code: userCode,
            language: language,
            context: "This code is submitted as part of a coding challenge. Please provide constructive feedback, suggestions for improvement, and identify any issues."
        };

        const response = await axios.post(WORQHAT_API_URL, payload, {
            headers: {
                'Authorization': 'Bearer ' + WORQHAT_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        return {
            success: true,
            analysis: response.data,
            feedback: response.data.feedback || response.data.message || 'Code analysis completed'
        };
    } catch (error) {
        console.error('Worqhat API Error:', error.response?.data || error.message);
        return {
            success: false,
            error: 'Failed to analyze code',
            feedback: 'Unable to get AI feedback at this time. Please try again later.'
        };
    }
};

// --- LEARNING PATHS DATA ---
const learningPaths = {
    python: {
        title: "The Pythonic Temple",
        currentLesson: "The Riddle of Two Sums",
        type: 'riddle',
        lessonId: 'python_two_sum',
        steps: [
            { name: "The Basics of Syntax", completed: true },
            { name: "The Alchemist's Variables", completed: true },
            { name: "The Trial of Conditionals", completed: true },
            { name: "The Loop Labyrinth", completed: true },
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

// --- LESSON DATA ---
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

// --- RIDDLE DATA (FIXED) ---
const riddleData = {
    python_two_sum: {
        title: "The Riddle of Two Sums",
        riddle: "Given a list of numbers `[2, 7, 11, 15]` and a target of `9`, complete the function `solve()` to return the indices of the two numbers that add up to the target.\n\nThe correct answer should be `[0, 1]` because nums[0] + nums[1] = 2 + 7 = 9.",
        scaffold: "def solve():\n    nums = [2, 7, 11, 15]\n    target = 9\n    # Your code goes here\n    # Hint: Use a dictionary to store numbers you've seen\n    \n    return []  # Return the indices",
        solution: "return [0, 1]",
        hint: "You can use a dictionary to store the numbers you've seen so far and their indices.",
        language: "python"
    },
    js_palindrome: {
        title: "The Mirrored Word",
        riddle: "A palindrome is a word that reads the same forwards and backwards. Complete the `isPalindrome` function to check if a given word is a palindrome. It should return `true` or `false`.\n\nExample: `isPalindrome('racecar')` should return `true`.\nExample: `isPalindrome('hello')` should return `false`.",
        scaffold: "function isPalindrome(word) {\n    // Your code here\n    // Hint: Compare the word with its reverse\n    \n    return false; // Replace this\n}",
        solution: "return word.split('').reverse().join('') === word;",
        hint: "You can reverse the string and compare it to the original using split, reverse, and join methods.",
        language: "javascript"
    },
    sql_filter_users: {
        title: "The Royal Scribe's Task",
        riddle: "From the `Users` table, select all users who are older than 30. The table has columns `name` and `age`.\n\nComplete the SQL query to filter the results correctly.",
        scaffold: "-- Complete this SQL query\nSELECT * FROM Users \nWHERE /* your condition here */;",
        solution: "age > 30",
        hint: "Use the WHERE clause with a comparison operator to filter by age.",
        language: "sql"
    },
    ds_array_sum: {
        title: "The Array Blueprint",
        riddle: "Given an array of numbers, calculate the sum of all its elements.\n\nExample: `sum([1, 2, 3])` should return `6`.\nExample: `sum([10, 5])` should return `15`.",
        scaffold: "function sum(arr) {\n    // Your code here\n    // Hint: You can use a loop or array methods\n    \n    return 0; // Replace this\n}",
        solution: "return arr.reduce((a, b) => a + b, 0)",
        hint: "You can use the reduce method or a simple for loop to solve this problem.",
        language: "javascript"
    },
    // Add some more riddles for testing
    js_reverse_string: {
        title: "The String Reverser",
        riddle: "Write a function that takes a string and returns it reversed.\n\nExample: `reverseString('hello')` should return `'olleh'`.",
        scaffold: "function reverseString(str) {\n    // Your code here\n    \n    return ''; // Replace this\n}",
        solution: "return str.split('').reverse().join('');",
        hint: "Use the split, reverse, and join methods in sequence.",
        language: "javascript"
    },
    python_fibonacci: {
        title: "The Fibonacci Sequence",
        riddle: "Write a function that returns the nth number in the Fibonacci sequence.\n\nExample: `fibonacci(5)` should return `5` (0, 1, 1, 2, 3, 5).",
        scaffold: "def fibonacci(n):\n    # Your code here\n    # The sequence starts: 0, 1, 1, 2, 3, 5, 8...\n    \n    return 0  # Replace this",
        solution: "if n <= 1: return n\na, b = 0, 1\nfor _ in range(2, n + 1):\n    a, b = b, a + b\nreturn b",
        hint: "You can use iteration with two variables to keep track of the previous two numbers.",
        language: "python"
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

// LESSON ENDPOINT
app.get('/api/lesson', (req, res) => {
    const lessonId = req.query.id;
    console.log('Lesson requested:', lessonId); // Debug log
    const selectedLesson = lessonData[lessonId];
    if (selectedLesson) {
        res.json(selectedLesson);
    } else {
        console.log('Available lessons:', Object.keys(lessonData)); // Debug log
        res.status(404).json({ error: "Lesson not found" });
    }
});

// RIDDLE ENDPOINT (FIXED)
app.get('/api/riddle', (req, res) => {
    const riddleId = req.query.id;
    console.log('Riddle requested:', riddleId); // Debug log
    console.log('Available riddles:', Object.keys(riddleData)); // Debug log
    
    const selectedRiddle = riddleData[riddleId];
    if (selectedRiddle) {
        console.log('Riddle found:', selectedRiddle.title); // Debug log
        res.json(selectedRiddle);
    } else {
        console.log('Riddle not found for ID:', riddleId); // Debug log
        res.status(404).json({ 
            error: "Riddle not found", 
            availableRiddles: Object.keys(riddleData),
            requestedId: riddleId 
        });
    }
});

// ANALYZE CODE ENDPOINT
app.post('/api/analyze-code', async (req, res) => {
    const { code, riddleId, username } = req.body;
    
    if (!code) {
        return res.status(400).json({ success: false, message: "Code is required" });
    }

    const riddle = riddleData[riddleId];
    const language = riddle?.language || 'javascript';

    try {
        // Get AI analysis from Worqhat
        const analysis = await analyzeCodeWithWorqhat(code, language);
        
        // Check if code is correct (existing logic)
        const cleanUserCode = code.replace(/\s+/g, ' ').trim().toLowerCase();
        const cleanSolution = riddle?.solution ? riddle.solution.replace(/\s+/g, ' ').trim().toLowerCase() : '';
        
        // More flexible solution checking
        const isCorrect = cleanUserCode.includes(cleanSolution) || 
                         code.toLowerCase().includes(riddle?.solution?.toLowerCase() || '') ||
                         checkSolutionLogic(code, riddle);
        
        // Save code submission to database (optional)
        if (username) {
            const db = readDB();
            const userIndex = db.users.findIndex(u => u.username === username);
            if (userIndex !== -1) {
                if (!db.users[userIndex].codeSubmissions) {
                    db.users[userIndex].codeSubmissions = [];
                }
                db.users[userIndex].codeSubmissions.push({
                    riddleId,
                    code,
                    isCorrect,
                    timestamp: new Date().toISOString(),
                    aiAnalysis: analysis.feedback
                });
                writeDB(db);
            }
        }

        res.json({
            success: true,
            isCorrect,
            analysis: analysis.feedback,
            aiPowered: analysis.success,
            hints: analysis.success ? null : riddle?.hint
        });

    } catch (error) {
        console.error('Code analysis error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to analyze code",
            error: error.message
        });
    }
});

// Helper function to check solution logic more intelligently
function checkSolutionLogic(code, riddle) {
    if (!riddle) return false;
    
    // Basic pattern matching for common solutions
    switch (riddle.language) {
        case 'javascript':
            if (riddle.title.includes('palindrome')) {
                return code.includes('reverse') && code.includes('split') && code.includes('join');
            }
            if (riddle.title.includes('sum')) {
                return code.includes('reduce') || (code.includes('for') && code.includes('+'));
            }
            break;
        case 'python':
            if (riddle.title.includes('Two Sums')) {
                return code.includes('[0, 1]') || code.includes('[0,1]');
            }
            break;
        case 'sql':
            if (riddle.title.includes('filter')) {
                return code.toLowerCase().includes('age > 30');
            }
            break;
    }
    
    return false;
}

app.post('/api/complete-lesson', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username is required." });
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.status(404).json({ success: false, message: "User not found." });
    const userProgress = db.users[userIndex].progress;
    userProgress.xp += 150; // More XP for riddles
    userProgress.gems += 15; // More gems for riddles
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

// DEBUG ENDPOINT - Remove in production
app.get('/debug/riddles', (req, res) => {
    res.json({
        availableRiddles: Object.keys(riddleData),
        riddleData: riddleData
    });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Worqhat AI integration enabled for code analysis`);
    console.log(`Available riddles: ${Object.keys(riddleData).join(', ')}`);
});