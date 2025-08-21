// Local Storage Manager for GitHub Pages Deployment
// This replaces the RESTful API calls with localStorage for client-side persistence

class LocalStorageManager {
    constructor() {
        this.storageKey = 'social_media_content';
        this.initializeStorage();
    }

    initializeStorage() {
        console.log('Initializing localStorage...');
        
        // Initialize with sample data if storage is empty
        if (!localStorage.getItem(this.storageKey)) {
            console.log('No existing data, creating sample data...');
            const sampleData = [
                {
                    id: this.generateId(),
                    title: "Summer Vibes Dance Challenge",
                    platform: "TikTok",
                    content_type: "Reel",
                    status: "Scheduled",
                    caption: "Join the summer vibes challenge! 🌞 Show me your best dance moves to this trending sound. Don't forget to tag your friends! Who's ready to bring the heat this summer? ✨",
                    hashtags: "#summervibes, #dancechallenge, #trending, #viral, #fyp, #summer2024",
                    scheduled_date: "2024-08-22T19:00:00",
                    priority: "High",
                    engagement_goal: "50k views, high engagement rate",
                    notes: "Post during peak hours (7-9 PM). Make sure to engage with comments quickly.",
                    created_at: Date.now(),
                    updated_at: Date.now()
                },
                {
                    id: this.generateId(),
                    title: "Behind the Scenes - Photoshoot",
                    platform: "Instagram",
                    content_type: "Story",
                    status: "Posted",
                    caption: "Taking you behind the scenes of today's photoshoot! 📸 The magic happens when you think the camera isn't rolling. What's your favorite BTS moment?",
                    hashtags: "#behindthescenes, #photoshoot, #content, #creator, #bts, #photography",
                    scheduled_date: "2024-08-21T15:00:00",
                    posted_date: "2024-08-21T15:00:00",
                    priority: "Medium",
                    engagement_goal: "High story views, save for highlights",
                    notes: "Great engagement on this type of content",
                    created_at: Date.now() - 86400000,
                    updated_at: Date.now() - 86400000
                },
                {
                    id: this.generateId(),
                    title: "Monday Motivation Tweet",
                    platform: "Twitter",
                    content_type: "Tweet",
                    status: "Scheduled",
                    caption: "🌟 Monday Motivation: The secret to getting ahead is getting started. What's one thing you're going to tackle this week that you've been putting off? Drop it in the comments and let's hold each other accountable! 💪",
                    hashtags: "#MondayMotivation, #Productivity, #Success, #Goals",
                    scheduled_date: "2024-08-26T07:00:00",
                    priority: "High",
                    engagement_goal: "High engagement, 500+ likes",
                    character_count: 239,
                    notes: "Perfect timing for morning engagement - post at 7 AM EST",
                    created_at: Date.now() - 43200000,
                    updated_at: Date.now() - 43200000
                },
                {
                    id: this.generateId(),
                    title: "Makeup Transformation Tuesday",
                    platform: "All Platforms",
                    content_type: "Reel",
                    status: "Draft",
                    caption: "Transformation Tuesday is here! ✨ From natural to glam in 60 seconds. Which look do you prefer? Drop your thoughts below! 💄",
                    hashtags: "#makeuptransformation, #transformation, #makeup, #beauty, #glam, #tutorial",
                    priority: "High",
                    engagement_goal: "Viral potential, 100k+ views",
                    notes: "Need to film this - have all makeup products ready",
                    created_at: Date.now() - 7200000,
                    updated_at: Date.now() - 7200000
                },
                {
                    id: this.generateId(),
                    title: "Content Creation Tips Thread",
                    platform: "Twitter",
                    content_type: "Thread",
                    status: "Draft",
                    caption: "🧵 THREAD: 5 content creation secrets I wish I knew when I started (save this for later!) \n\n1/ Content batching is a game-changer 🔄\nInstead of creating content daily, dedicate 1-2 days per week to create multiple pieces. Your future self will thank you!",
                    hashtags: "#ContentCreator, #SocialMediaTips, #CreatorEconomy, #Marketing",
                    priority: "High",
                    engagement_goal: "Viral thread, 1000+ retweets",
                    thread_length: 6,
                    character_count: 278,
                    notes: "Thread about content creation tips - very popular topic",
                    created_at: Date.now() - 3600000,
                    updated_at: Date.now() - 3600000
                }
            ];
            
            localStorage.setItem(this.storageKey, JSON.stringify(sampleData));
            console.log('Sample data created:', sampleData.length, 'items');
        } else {
            const existingData = JSON.parse(localStorage.getItem(this.storageKey));
            console.log('Existing data found:', existingData.length, 'items');
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Simulate API endpoints
    async get(endpoint, params = {}) {
        console.log('Storage GET request:', endpoint, params);
        const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        console.log('Retrieved data from storage:', data.length, 'items');
        
        // Check if this is a single item request (has ID after tables/content/)
        const parts = endpoint.split('/');
        if (parts.length > 2 && parts[2]) {
            // Get single item by ID
            const id = parts[2];
            const item = data.find(item => item.id === id);
            console.log('Single item request for ID:', id, 'Found:', !!item);
            return { ok: true, json: () => Promise.resolve(item) };
        } else {
            // Get all items with filtering and sorting
            let filteredData = [...data];
            
            // Apply search filter
            if (params.search) {
                const search = params.search.toLowerCase();
                filteredData = filteredData.filter(item => 
                    (item.title || '').toLowerCase().includes(search) ||
                    (item.caption || '').toLowerCase().includes(search) ||
                    (item.hashtags || '').toLowerCase().includes(search)
                );
            }
            
            // Apply sorting
            if (params.sort) {
                filteredData.sort((a, b) => {
                    const aVal = a[params.sort] || 0;
                    const bVal = b[params.sort] || 0;
                    
                    if (params.sort === 'scheduled_date' || params.sort === 'created_at') {
                        return new Date(bVal) - new Date(aVal); // Newest first
                    }
                    
                    return aVal.toString().localeCompare(bVal.toString());
                });
            }
            
            // Apply pagination
            const page = parseInt(params.page) || 1;
            const limit = parseInt(params.limit) || 100;
            const startIndex = (page - 1) * limit;
            const paginatedData = filteredData.slice(startIndex, startIndex + limit);
            
            const result = {
                data: paginatedData,
                total: filteredData.length,
                page,
                limit
            };
            
            console.log('Returning data:', result);
            
            return {
                ok: true,
                json: () => Promise.resolve(result)
            };
        }
    }

    async post(endpoint, body) {
        const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        const newItem = {
            ...body,
            id: this.generateId(),
            created_at: Date.now(),
            updated_at: Date.now()
        };
        
        data.push(newItem);
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        
        return { ok: true, json: () => Promise.resolve(newItem) };
    }

    async put(endpoint, body) {
        const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        const id = endpoint.split('/').pop();
        const index = data.findIndex(item => item.id === id);
        
        if (index !== -1) {
            data[index] = {
                ...data[index],
                ...body,
                updated_at: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return { ok: true, json: () => Promise.resolve(data[index]) };
        }
        
        return { ok: false };
    }

    async delete(endpoint) {
        const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        const id = endpoint.split('/').pop();
        const filteredData = data.filter(item => item.id !== id);
        
        localStorage.setItem(this.storageKey, JSON.stringify(filteredData));
        return { ok: true };
    }

    // Export data for backup
    exportData() {
        const data = localStorage.getItem(this.storageKey);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'social-media-content-backup.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Import data from backup
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
}

// Override global fetch for localStorage simulation
const storageManager = new LocalStorageManager();

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to use localStorage for tables/* endpoints
window.fetch = function(url, options = {}) {
    console.log('Fetch called with:', url, options);
    
    if (url.startsWith('tables/content')) {
        console.log('Using localStorage for:', url);
        
        const method = options.method || 'GET';
        const body = options.body ? JSON.parse(options.body) : null;
        
        // Parse URL for query parameters
        const [endpoint, queryString] = url.split('?');
        const params = {};
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            });
        }
        
        // Return a Promise that resolves to the storage result
        return new Promise(async (resolve) => {
            try {
                let result;
                switch (method) {
                    case 'GET':
                        result = await storageManager.get(endpoint, params);
                        break;
                    case 'POST':
                        result = await storageManager.post(endpoint, body);
                        break;
                    case 'PUT':
                        result = await storageManager.put(endpoint, body);
                        break;
                    case 'DELETE':
                        result = await storageManager.delete(endpoint);
                        break;
                    default:
                        result = await originalFetch(url, options);
                }
                
                console.log('Storage result:', result);
                resolve(result);
            } catch (error) {
                console.error('Storage error:', error);
                resolve({ ok: false, error });
            }
        });
    }
    
    // Use original fetch for other requests
    return originalFetch(url, options);
};

// Make storage manager available globally
window.storageManager = storageManager;