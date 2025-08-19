// Import necessary modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Add axios for API calls

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Worqhat API Configuration for Chatbot
const WORQHAT_CHAT_API_URL = 'https://api.worqhat.com/flows/trigger/1923e305-a659-4a5d-ac7d-a1702094840f';
const WORQHAT_API_KEY = 'wh_mehdbcs4Y97ep40HOnJPW2YzcjsGhGHJUrdmatuCKt1';

// Middleware to parse JSON bodies and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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
        return { users: [], lessons: [], riddles: [], chatHistory: [] };
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

// --- CHATBOT API FUNCTION ---
const getChatbotResponse = async (message, conversationHistory = []) => {
    try {
        console.log('🤖 Sending message to Worqhat API:', message.substring(0, 100) + '...');
        
        // Prepare the context from conversation history
        let context = '';
        if (conversationHistory.length > 0) {
            context = conversationHistory.slice(-5).map(msg => 
                `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');
        }

        // Create the payload for Worqhat API
        const payload = {
            message: message,
            context: context,
            type: "coding_assistant",
            instructions: `You are "Ask Doubt", a friendly AI coding assistant for CodeQuest platform. 
            Help users with:
            - Coding questions and debugging
            - Programming concepts explanation
            - Code review and optimization
            - Learning guidance
            
            Keep responses helpful, encouraging, and focused on coding/programming topics.
            Use emojis occasionally to make responses friendly.
            If asked about non-coding topics, gently redirect to programming help.`
        };

        console.log('📤 Payload prepared for Worqhat API');

        const response = await axios.post(WORQHAT_CHAT_API_URL, payload, {
            headers: {
                'Authorization': 'Bearer ' + WORQHAT_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 second timeout
        });

        console.log('✅ Received response from Worqhat API');
        
        // Extract the response from Worqhat API
        let aiResponse = '';
        if (response.data && response.data.response) {
            aiResponse = response.data.response;
        } else if (response.data && response.data.message) {
            aiResponse = response.data.message;
        } else if (response.data && typeof response.data === 'string') {
            aiResponse = response.data;
        } else {
            aiResponse = "I understand you're looking for help with coding! Could you please be more specific about what you'd like assistance with? 🤔";
        }

        return {
            success: true,
            response: aiResponse,
            source: 'worqhat_api'
        };

    } catch (error) {
        console.error('❌ Worqhat API Error:', error.response?.data || error.message);
        
        // Fallback response based on error type
        let fallbackResponse = '';
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            fallbackResponse = "I'm taking a bit longer to process your request. Let me give you a quick response: Could you please rephrase your question? I'm here to help with coding problems! 💻";
        } else if (error.response?.status === 401) {
            fallbackResponse = "I'm experiencing some authentication issues right now. But I'm still here to help! Could you tell me what specific coding topic you'd like assistance with? 🔧";
        } else if (error.response?.status >= 500) {
            fallbackResponse = "My AI brain is having a brief moment! 🤖 While I recover, could you tell me what programming language or concept you're working with?";
        } else {
            // Try to provide a helpful response based on the message content
            fallbackResponse = generateFallbackResponse(message);
        }

        return {
            success: false,
            response: fallbackResponse,
            source: 'fallback',
            error: error.message
        };
    }
};

// Fallback response generator for common coding questions
const generateFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('python')) {
        return "Python is a fantastic language to learn! 🐍 What specific Python concept would you like help with? Variables, functions, loops, or something else?";
    }
    
    if (lowerMessage.includes('javascript')) {
        return "JavaScript powers the web! 🌐 Are you working on DOM manipulation, promises, functions, or something else?";
    }
    
    if (lowerMessage.includes('sql')) {
        return "SQL helps you manage databases! 🗄️ Are you looking for help with SELECT statements, JOINs, or database design?";
    }
    
    if (lowerMessage.includes('debug') || lowerMessage.includes('error')) {
        return "Debugging can be tricky! 🔍 Could you share your code snippet and describe what error you're seeing? I'll help you track down the issue!";
    }
    
    if (lowerMessage.includes('function')) {
        return "Functions are the building blocks of programming! ⚡ What programming language are you working with, and what kind of function are you trying to create?";
    }
    
    if (lowerMessage.includes('loop')) {
        return "Loops help you repeat tasks efficiently! 🔄 Are you working with for loops, while loops, or having trouble with loop logic?";
    }
    
    if (lowerMessage.includes('array') || lowerMessage.includes('list')) {
        return "Arrays and lists are super useful for storing data! 📊 What would you like to do with your array? Sort, filter, or manipulate the data somehow?";
    }
    
    return "I'm here to help with all your coding questions! 💡 Could you tell me more about what programming concept or problem you're working on? The more specific you can be, the better I can assist you!";
};

// --- CHATBOT ENDPOINT ---
app.post('/api/chat', async (req, res) => {
    console.log('=== CHAT REQUEST ===');
    const { message, conversationHistory } = req.body;
    
    console.log('Message received:', message?.substring(0, 100) + '...');
    console.log('Conversation history length:', conversationHistory?.length || 0);
    
    if (!message || message.trim().length === 0) {
        console.log('❌ Empty message received');
        return res.status(400).json({
            success: false,
            response: "Please enter a message! I'm here to help with your coding questions. 😊"
        });
    }

    if (message.length > 2000) {
        console.log('❌ Message too long');
        return res.status(400).json({
            success: false,
            response: "Your message is a bit too long! Please try to keep it under 2000 characters. 📝"
        });
    }

    try {
        // Get response from Worqhat API
        const aiResult = await getChatbotResponse(message, conversationHistory);
        
        // Save chat interaction to database (optional)
        const db = readDB();
        if (!db.chatHistory) {
            db.chatHistory = [];
        }
        
        db.chatHistory.push({
            timestamp: new Date().toISOString(),
            userMessage: message,
            aiResponse: aiResult.response,
            source: aiResult.source,
            success: aiResult.success
        });
        
        // Keep only last 100 chat interactions to prevent database bloat
        if (db.chatHistory.length > 100) {
            db.chatHistory = db.chatHistory.slice(-100);
        }
        
        writeDB(db);
        console.log('💾 Chat interaction saved to database');
        
        console.log('✅ Chat response sent successfully');
        console.log('=== END CHAT REQUEST ===');
        
        res.json({
            success: true,
            response: aiResult.response,
            source: aiResult.source
        });

    } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        console.log('=== END CHAT REQUEST (ERROR) ===');
        
        res.status(500).json({
            success: false,
            response: "I'm having some technical difficulties right now! 😅 But don't worry - I'm still here to help! Could you try asking your coding question again?",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// --- EXISTING CODE CONTINUES (LEARNING PATHS, LESSONS, ETC.) ---

// Helper function to call Worqhat API for code analysis
const analyzeCodeWithWorqhat = async (userCode, language = 'javascript') => {
    try {
        const payload = {
            code: userCode,
            language: language,
            context: "This code is submitted as part of a coding challenge. Please provide constructive feedback, suggestions for improvement, and identify any issues."
        };

        const response = await axios.post(WORQHAT_CHAT_API_URL, payload, {
            headers: {
                'Authorization': 'Bearer ' + WORQHAT_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        return {
            success: true,
            analysis: response.data,
            feedback: response.data.feedback || response.data.response || response.data.message || 'Code analysis completed'
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

// --- RIDDLE DATA (FIXED AND EXPANDED) ---
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
    console.log('Lesson requested:', lessonId);
    const selectedLesson = lessonData[lessonId];
    if (selectedLesson) {
        res.json(selectedLesson);
    } else {
        console.log('Available lessons:', Object.keys(lessonData));
        res.status(404).json({ error: "Lesson not found" });
    }
});

// RIDDLE ENDPOINT (FIXED WITH BETTER LOGGING)
app.get('/api/riddle', (req, res) => {
    const riddleId = req.query.id;
    console.log('=== RIDDLE REQUEST ===');
    console.log('Riddle requested:', riddleId);
    console.log('Available riddles:', Object.keys(riddleData));
    console.log('Request query:', req.query);
    
    const selectedRiddle = riddleData[riddleId];
    if (selectedRiddle) {
        console.log('✅ Riddle found:', selectedRiddle.title);
        console.log('Riddle language:', selectedRiddle.language);
        res.json(selectedRiddle);
    } else {
        console.log('❌ Riddle not found for ID:', riddleId);
        res.status(404).json({ 
            error: "Riddle not found", 
            availableRiddles: Object.keys(riddleData),
            requestedId: riddleId 
        });
    }
    console.log('=== END RIDDLE REQUEST ===');
});

// ANALYZE CODE ENDPOINT (IMPROVED)
app.post('/api/analyze-code', async (req, res) => {
    console.log('=== CODE ANALYSIS REQUEST ===');
    const { code, riddleId, username } = req.body;
    console.log('Code to analyze:', code?.substring(0, 100) + '...');
    console.log('Riddle ID:', riddleId);
    console.log('Username:', username);
    
    if (!code) {
        console.log('❌ No code provided');
        return res.status(400).json({ success: false, message: "Code is required" });
    }

    const riddle = riddleData[riddleId];
    if (!riddle) {
        console.log('❌ Riddle not found for analysis:', riddleId);
        return res.status(404).json({ success: false, message: "Riddle not found" });
    }
    
    const language = riddle.language || 'javascript';
    console.log('Using language:', language);

    try {
        // Get AI analysis from Worqhat
        console.log('🤖 Calling Worqhat API...');
        const analysis = await analyzeCodeWithWorqhat(code, language);
        console.log('AI Analysis result:', analysis.success ? 'Success' : 'Failed');
        
        // Check if code is correct (enhanced logic)
        const isCorrect = checkSolutionLogic(code, riddle);
        console.log('Solution check result:', isCorrect);
        
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
                console.log('💾 Code submission saved to database');
            }
        }

        const result = {
            success: true,
            isCorrect,
            analysis: analysis.feedback,
            aiPowered: analysis.success,
            hints: analysis.success ? null : riddle.hint
        };
        
        console.log('✅ Analysis complete, sending response');
        console.log('=== END CODE ANALYSIS REQUEST ===');
        res.json(result);

    } catch (error) {
        console.error('❌ Code analysis error:', error);
        console.log('=== END CODE ANALYSIS REQUEST (ERROR) ===');
        res.status(500).json({
            success: false,
            message: "Failed to analyze code",
            error: error.message
        });
    }
});

// IMPROVED Helper function to check solution logic
function checkSolutionLogic(code, riddle) {
    if (!riddle) return false;
    
    console.log('Checking solution logic for:', riddle.title);
    const cleanUserCode = code.replace(/\s+/g, ' ').trim().toLowerCase();
    const cleanSolution = riddle.solution ? riddle.solution.replace(/\s+/g, ' ').trim().toLowerCase() : '';
    
    // First check: exact solution match
    if (cleanUserCode.includes(cleanSolution)) {
        console.log('✅ Exact solution match found');
        return true;
    }
    
    // Enhanced pattern matching for common solutions
    switch (riddle.language) {
        case 'javascript':
            if (riddle.title.includes('palindrome') || riddle.title.includes('Mirrored Word')) {
                const hasPalindromeLogic = code.includes('reverse') && code.includes('split') && code.includes('join');
                console.log('Palindrome logic check:', hasPalindromeLogic);
                return hasPalindromeLogic;
            }
            if (riddle.title.includes('sum') || riddle.title.includes('Array Blueprint')) {
                const hasSumLogic = code.includes('reduce') || (code.includes('for') && code.includes('+')) || code.includes('forEach');
                console.log('Sum logic check:', hasSumLogic);
                return hasSumLogic;
            }
            if (riddle.title.includes('reverse') || riddle.title.includes('String Reverser')) {
                const hasReverseLogic = code.includes('reverse') && code.includes('split') && code.includes('join');
                console.log('Reverse string logic check:', hasReverseLogic);
                return hasReverseLogic;
            }
            break;
            
        case 'python':
            if (riddle.title.includes('Two Sums')) {
                const hasTwoSumLogic = code.includes('[0, 1]') || code.includes('[0,1]');
                console.log('Two sums logic check:', hasTwoSumLogic);
                return hasTwoSumLogic;
            }
            if (riddle.title.includes('fibonacci') || riddle.title.includes('Fibonacci')) {
                const hasFibLogic = code.includes('for') && (code.includes('a, b =') || code.includes('a,b ='));
                console.log('Fibonacci logic check:', hasFibLogic);
                return hasFibLogic;
            }
            break;
            
        case 'sql':
            if (riddle.title.includes('filter') || riddle.title.includes("Scribe's Task")) {
                const hasFilterLogic = code.toLowerCase().includes('age > 30');
                console.log('SQL filter logic check:', hasFilterLogic);
                return hasFilterLogic;
            }
            break;
    }
    
    console.log('❌ No matching solution pattern found');
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

// Serve chatbot.html
app.get('/chatbot.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// DEBUG ENDPOINT - Remove in production
app.get('/debug/riddles', (req, res) => {
    res.json({
        availableRiddles: Object.keys(riddleData),
        riddleData: riddleData,
        riddleCount: Object.keys(riddleData).length
    });
});

// Chat history endpoint for debugging
app.get('/debug/chat-history', (req, res) => {
    const db = readDB();
    res.json({
        chatHistory: db.chatHistory || [],
        totalChats: (db.chatHistory || []).length
    });
});

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 HANDLER
app.use((req, res) => {
    console.log('404 - Route not found:', req.url);
    res.status(404).json({ error: 'Route not found', url: req.url });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🤖 Worqhat AI integration enabled for chatbot and code analysis`);
    console.log(`💬 Chatbot endpoint: /api/chat`);
    console.log(`📚 Available riddles: ${Object.keys(riddleData).join(', ')}`);
    console.log(`📊 Total riddles loaded: ${Object.keys(riddleData).length}`);
    console.log(`📝 Available lessons: ${Object.keys(lessonData).join(', ')}`);
    console.log(`=== Server Ready ===`);
});