const BASE_URL = 'http://127.0.0.1:8000/';
let currentUser = null;

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const mainContent = document.getElementById('mainContent');
const navButtons = document.querySelectorAll('nav button');

// Event Listeners
document.getElementById('homeBtn').addEventListener('click', loadHome);
document.getElementById('profileBtn').addEventListener('click', loadProfile);
document.getElementById('pointsBtn').addEventListener('click', loadPoints);
document.getElementById('tasksBtn').addEventListener('click', loadTasks);
document.getElementById('logoutBtn').addEventListener('click', logout);

document.addEventListener('DOMContentLoaded', checkAuth);

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
        currentUser = JSON.parse(storedUser);
        welcomeMessage.textContent = `Hello ${currentUser.username}`;
        updateNavigation();
        fetchUserProfile(); // Add this line
    } else {
        showLoginForm();
    }
}
// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await authenticatedFetch(`${BASE_URL}get_user_profile/`);
        if (response.ok) {
            const data = await response.json();
            currentUser = {
                ...currentUser,
                ...data.user,
                points_earned: data.points_earned,
                tasksCompleted: data.tasksCompleted
            };
            localStorage.setItem('user', JSON.stringify(currentUser));
            welcomeMessage.textContent = `Hello ${currentUser.username}`;
            return true;
        } else {
            showLoginForm();
            return false;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showLoginForm();
        return false;
    }
}

// Show login form
function showLoginForm() {
    currentUser = null; // Ensure currentUser is null
    updateNavigation(); // This will clear the navigation
    mainContent.innerHTML = `
        <form id="loginForm">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="#" id="showSignup">Sign up</a></p>
    `;
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showSignup').addEventListener('click', showSignupForm);
}

function showSignupForm() {
    currentUser = null; // Ensure currentUser is null
    updateNavigation(); // This will clear the navigation
    mainContent.innerHTML = `
        <form id="signupForm">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="#" id="showLogin">Login</a></p>
    `;
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(`${BASE_URL}login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            welcomeMessage.textContent = `Hello ${currentUser.username}`;
            updateNavigation();
            loadHome();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

function updateNavigation() {
    const nav = document.querySelector('nav');
    if (!currentUser) {
        nav.innerHTML = ''; // Clear navigation when no user is logged in
        return;
    }
    if (currentUser.is_staff) {
        nav.innerHTML = `
            <button id="homeBtn" class="active">Home</button>
            <button id="listAppsBtn">List Apps</button>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('homeBtn').addEventListener('click', loadAdminHome);
        document.getElementById('listAppsBtn').addEventListener('click', loadAppList);
    } else {
        nav.innerHTML = `
            <button id="homeBtn" class="active">Home</button>
            <button id="profileBtn">Profile</button>
            <button id="pointsBtn">Points</button>
            <button id="tasksBtn">Tasks</button>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('homeBtn').addEventListener('click', loadUserHome);
        document.getElementById('profileBtn').addEventListener('click', loadProfile);
        document.getElementById('pointsBtn').addEventListener('click', loadPoints);
        document.getElementById('tasksBtn').addEventListener('click', loadTasks);
    }
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(`${BASE_URL}signup/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, is_staff: false })
        });
        if (response.ok) {
            alert('Signup successful. Please login.');
            showLoginForm();
        } else {
            alert('Signup failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
    }
}

// Load home page
function loadHome() {
    setActiveNavButton('homeBtn');
    if (currentUser.is_staff) {
        loadAdminHome();
    } else {
        loadUserHome();
    }
}

// Load admin home
function loadAdminHome() {
    mainContent.innerHTML = `
        <h2>Add New App</h2>
        <form id="addAppForm">
            <input type="text" id="appName" placeholder="App Name" required>
            <input type="text" id="appUrl" placeholder="App URL" required>
            <select id="appCategory">
                <option value="">Select Category</option>
                <option value="Social Media">Social Media</option>
            <option value="Productivity">Productivity</option>
                <option value="Entertainment">Entertainment</option>
            </select>
            <select id="appSubCategory">
                <option value="">Select Sub-Category</option>
            </select>
            <input type="number" id="appPoints" placeholder="Points" required>
            <button type="submit">Add App</button>
        </form>
    `;
    document.getElementById('addAppForm').addEventListener('submit', handleAddApp);
    document.getElementById('appCategory').addEventListener('change', updateSubCategories);

}

async function loadAppList() {
    setActiveNavButton('listAppsBtn');
    try {
        const response = await authenticatedFetch(`${BASE_URL}get_android_apps/`);
        if (response.ok) {
            const apps = await response.json();
            mainContent.innerHTML = `
                <h2>App List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Sub-Category</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apps.map(app => `
                            <tr>
                                <td>${app.name}</td>
                                <td>${app.category}</td>
                                <td>${app.subCategory}</td>
                                <td>${app.points}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading app list:', error);
        mainContent.innerHTML = '<p>Error loading app list. Please try again later.</p>';
    }
}

// Update sub-categories based on selected category
function updateSubCategories() {
    const category = document.getElementById('appCategory').value;
    const subCategorySelect = document.getElementById('appSubCategory');
    subCategorySelect.innerHTML = '<option value="">Select Sub-Category</option>';
    
    const subCategories = {
        'Social Media': ['Messaging', 'Networking', 'Photo Sharing'],
        'Productivity': ['Time Management', 'Note Taking', 'Task Management'],
        'Entertainment': ['Games', 'Music', 'Video']
    };

    if (category in subCategories) {
        subCategories[category].forEach(subCat => {
            const option = document.createElement('option');
            option.value = subCat;
            option.textContent = subCat;
            subCategorySelect.appendChild(option);
        });
    }
}

// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        }
    };
    const mergedOptions = {...defaultOptions, ...options};
    mergedOptions.headers = {...defaultOptions.headers, ...options.headers};
    
    return fetch(url, mergedOptions);
}

// Handle adding a new app
async function handleAddApp(event) {
    event.preventDefault();
    const name = document.getElementById('appName').value;
    const url = document.getElementById('appUrl').value;
    const category = document.getElementById('appCategory').value;
    const subCategory = document.getElementById('appSubCategory').value;
    const points = document.getElementById('appPoints').value;

    try {
        const response = await authenticatedFetch(`${BASE_URL}add_android_app/`, {
            method: 'POST',
            body: JSON.stringify({ name, url, category, subCategory, points })
        });

        if (response.ok) {
            alert('App added successfully');
            loadAdminHome();
        } else {
            alert('Failed to add app');
        }
    } catch (error) {
        console.error('Error adding app:', error);
    }
}

// Load user home
async function loadUserHome() {
    try {
        // Fetch available apps
        const appsResponse = await authenticatedFetch(`${BASE_URL}get_android_apps/`);
        
        // Fetch user's tasks
        const tasksResponse = await authenticatedFetch(`${BASE_URL}get_user_tasks/`);
        
        if (appsResponse.ok && tasksResponse.ok) {
            const apps = await appsResponse.json();
            const tasksData = await tasksResponse.json();
            
            // Create a set of downloaded app IDs for quick lookup
            const downloadedAppIds = new Set(tasksData.tasks.map(task => task.app));

            mainContent.innerHTML = `
                <h2>Available Apps</h2>
                ${apps.map(app => `
                    <div class="app-card">
                        <div class="app-logo">${app.name[0]}</div>
                        <div class="app-info">
                            <h3>${app.name}</h3>
                            <p>${app.category} - ${app.subCategory}</p>
                        </div>
                        <div class="app-action">
                            ${downloadedAppIds.has(app.id) ?
                                `<button class="downloaded-button" disabled>Downloaded</button>` :
                                `<button class="download-button" onclick="downloadApp(${app.id})">Download</button>`
                            }
                            <span class="points-label">${app.points} POINTS</span>
                        </div>
                    </div>
                `).join('')}
            `;
        } else {
            throw new Error('Failed to fetch apps or tasks');
        }
    } catch (error) {
        console.error('Error loading home page:', error);
        mainContent.innerHTML = '<p>Error loading apps. Please try again later.</p>';
    }
}

// Download app
async function downloadApp(appId) {
    try {
        const response = await authenticatedFetch(`${BASE_URL}download_app/`, {
            method: 'POST',
            body: JSON.stringify({ app_id: appId })
        });
        if (response.ok) {
            const data = await response.json();
            alert(`App downloaded! You earned ${data.points_earned} points.`);
            loadTasks();
        } else {
            alert('You have already downloaded this app');
        }
    } catch (error) {
        console.error('Error downloading app:', error);
    }
}

// Load profile page
async function loadProfile() {
    setActiveNavButton('profileBtn');
    const profileUpdated = await fetchUserProfile();
    if (profileUpdated) {
        mainContent.innerHTML = `
            <h2>Profile</h2>
            <p>Username: ${currentUser.username}</p>
            <p>Email: ${currentUser.email || 'Not provided'}</p>
            <p>Total Points: ${currentUser.points_earned}</p>
            <p>Tasks Completed: ${currentUser.tasksCompleted}</p>
        `;
    } else {
        mainContent.innerHTML = '<p>Failed to load profile. Please try again later.</p>';
    }
}

// Load points page
async function loadPoints() {
    setActiveNavButton('pointsBtn');
    const profileUpdated = await fetchUserProfile();
    if (profileUpdated) {
        mainContent.innerHTML = `
            <h2>Points</h2>
            <p>Total Points: ${currentUser.points_earned}</p>
            <p>Tasks Completed: ${currentUser.tasksCompleted}</p>
        `;
    } else {
        mainContent.innerHTML = '<p>Failed to load points. Please try again later.</p>';
    }
}

// Load tasks page
async function loadTasks() {
    setActiveNavButton('tasksBtn');
    try {
        const tasksResponse = await authenticatedFetch(`${BASE_URL}get_user_tasks/`);
        if (tasksResponse.ok) {
            const data = await tasksResponse.json();
            
            // Update current user profile
            currentUser = {...currentUser, ...data.user_profile.user};
            currentUser.points_earned = data.user_profile.points_earned;
            currentUser.tasksCompleted = data.user_profile.tasksCompleted;

            // Fetch app details
            const appsResponse = await authenticatedFetch(`${BASE_URL}get_android_apps/`);
            let apps = {};
            if (appsResponse.ok) {
                const appsData = await appsResponse.json();
                apps = appsData.reduce((acc, app) => {
                    acc[app.id] = app;
                    return acc;
                }, {});
            }

            // Render tasks
            mainContent.innerHTML = `
                <h2>Tasks</h2>
                <p>Total Points: ${currentUser.points_earned}</p>
                <p>Tasks Completed: ${currentUser.tasksCompleted}</p>
                ${data.tasks.map(task => {
                    const app = apps[task.app] || { name: 'Unknown App', points: 0 };
                    const screenshotPath = task.screenshot ? 
                        `D:\\WORK ONLY\\Next lab final\\AppDownloaderProject\\${task.screenshot}` : 
                        null;
                    return `
                        <div class="app-card">
                            <div class="app-logo">${app.name ? app.name[0] : '?'}</div>
                            <div class="app-info">
                                <h3>${app.name}</h3>
                                <p>Points: ${app.points}</p>
                            </div>
                            ${task.completed ? 
                                (screenshotPath ? 
                                    `<img src="${screenshotPath}" alt="Screenshot" style="max-width: 100px; max-height: 100px;">` : 
                                    '<button disabled>Completed</button>'
                                ) : 
                                `<button onclick="uploadScreenshot(${task.id})">Upload Screenshot</button>`
                            }
                        </div>
                    `;
                }).join('')}
            `;
        } else {
            mainContent.innerHTML = '<p>Failed to load tasks. Please try again later.</p>';
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        mainContent.innerHTML = '<p>An error occurred while loading tasks. Please try again later.</p>';
    }
}

// Upload screenshot
function uploadScreenshot(taskId) {
    // Create a modal dialog for the upload
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const uploadArea = document.createElement('div');
    uploadArea.style.width = '300px';
    uploadArea.style.height = '200px';
    uploadArea.style.backgroundColor = 'white';
    uploadArea.style.border = '2px dashed #ccc';
    uploadArea.style.borderRadius = '10px';
    uploadArea.style.display = 'flex';
    uploadArea.style.flexDirection = 'column';
    uploadArea.style.alignItems = 'center';
    uploadArea.style.justifyContent = 'center';
    uploadArea.style.cursor = 'pointer';

    uploadArea.innerHTML = `
        <p>Drag and drop a screenshot here</p>
        <p>or</p>
        <button>Click to select a file</button>
    `;

    modal.appendChild(uploadArea);
    document.body.appendChild(modal);

    // File input for traditional file selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // Handle file selection
    function handleFileSelect(file) {
        if (file) {
            handleFile(file, taskId);
            document.body.removeChild(modal);
        }
    }

    // Click to select file
    uploadArea.querySelector('button').onclick = (e) => {
        e.stopPropagation();
        fileInput.click();
    };

    fileInput.onchange = (event) => {
        handleFileSelect(event.target.files[0]);
    };

    // Drag and drop functionality
    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
    };

    uploadArea.ondragleave = () => {
        uploadArea.style.backgroundColor = 'white';
    };

    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'white';
        handleFileSelect(e.dataTransfer.files[0]);
    };

    // Close modal when clicking outside the upload area
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Handle file upload
async function handleFile(file, taskId) {
    if (file) {
        const formData = new FormData();
        formData.append('screenshot', file);

        try {
            const response = await fetch(`${BASE_URL}upload_screenshot/${taskId}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${localStorage.getItem('token')}`
                    // Do not set 'Content-Type' header here. 
                    // The browser will set it automatically with the correct boundary for FormData
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                alert('Screenshot uploaded successfully!');
                loadTasks();
            } else {
                const errorData = await response.json();
                alert(`Failed to upload screenshot: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error uploading screenshot:', error);
            alert('An error occurred while uploading the screenshot');
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateNavigation(); // This will clear the navigation
    showLoginForm();
    welcomeMessage.textContent = 'Welcome';
}

// Set active navigation button
function setActiveNavButton(buttonId) {
    navButtons.forEach(button => button.classList.remove('active'));
    document.getElementById(buttonId).classList.add('active');
}

// Initialize the app
checkAuth();