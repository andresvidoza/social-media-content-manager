// Social Media Content Manager - Main JavaScript File

class ContentManager {
    constructor() {
        this.currentView = 'grid';
        this.currentFilters = {
            platform: '',
            type: '',
            status: '',
            search: ''
        };
        this.currentSort = 'scheduled_date';
        this.isEditing = false;
        this.editingId = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadContent();
        this.updateStats();
    }

    bindEvents() {
        // Helper function to safely add event listeners
        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        // Modal events
        safeAddListener('addContentBtn', 'click', () => this.openModal());
        safeAddListener('emptyStateBtn', 'click', () => this.openModal());
        safeAddListener('closeModal', 'click', () => this.closeModal());
        safeAddListener('cancelBtn', 'click', () => this.closeModal());
        safeAddListener('contentForm', 'submit', (e) => this.saveContent(e));

        // View toggle events (optional - may not exist in Pinterest design)
        safeAddListener('gridViewBtn', 'click', () => this.switchView('grid'));
        safeAddListener('listViewBtn', 'click', () => this.switchView('list'));
        safeAddListener('calendarViewBtn', 'click', () => this.switchView('calendar'));
        safeAddListener('viewToggle', 'click', () => this.toggleView());

        // Sort functionality
        safeAddListener('sortBy', 'change', (e) => this.updateSort(e.target.value));

        // Pinterest-style filter pills
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', (e) => this.handleFilterPill(e.target));
        });

        // Main search functionality
        safeAddListener('mainSearchInput', 'input', (e) => this.updateFilter('search', e.target.value));

        // Platform radio buttons for modal
        document.querySelectorAll('input[name="platform_radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handlePlatformRadioChange(e.target.value));
        });

        // Twitter-specific events
        safeAddListener('platform', 'change', (e) => this.handlePlatformChange(e.target.value));
        safeAddListener('content_type', 'change', (e) => this.handleContentTypeChange(e.target.value));
        safeAddListener('caption', 'input', (e) => this.updateCharacterCount(e.target.value));

        // Close modal when clicking outside
        safeAddListener('contentModal', 'click', (e) => {
            if (e.target.id === 'contentModal') {
                this.closeModal();
            }
        });
    }

    // Modal Management
    openModal(contentId = null) {
        this.isEditing = !!contentId;
        this.editingId = contentId;
        
        document.getElementById('modalTitle').textContent = this.isEditing ? 'Edit your pin' : 'Create content pin';
        document.getElementById('contentModal').classList.remove('hidden');
        
        if (this.isEditing) {
            this.loadContentForEdit(contentId);
        } else {
            this.resetForm();
        }
    }

    closeModal() {
        document.getElementById('contentModal').classList.add('hidden');
        this.resetForm();
        this.isEditing = false;
        this.editingId = null;
    }

    resetForm() {
        document.getElementById('contentForm').reset();
        document.getElementById('contentId').value = '';
        
        // Reset platform radio buttons
        document.querySelectorAll('input[name="platform_radio"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Hide Twitter fields
        document.getElementById('twitterFields').classList.add('hidden');
        document.getElementById('characterCount').classList.add('hidden');
        document.getElementById('threadLengthField').classList.add('hidden');
    }

    // Content CRUD Operations
    async loadContentForEdit(contentId) {
        try {
            const response = await fetch(`tables/content/${contentId}`);
            if (response.ok) {
                const content = await response.json();
                this.populateForm(content);
            } else {
                this.showNotification('Error loading content for editing', 'error');
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showNotification('Error loading content for editing', 'error');
        }
    }

    populateForm(content) {
        document.getElementById('contentId').value = content.id;
        document.getElementById('title').value = content.title || '';
        document.getElementById('platform').value = content.platform || '';
        document.getElementById('content_type').value = content.content_type || '';
        document.getElementById('status').value = content.status || 'Draft';
        document.getElementById('caption').value = content.caption || '';
        document.getElementById('hashtags').value = content.hashtags || '';
        document.getElementById('priority').value = content.priority || 'Medium';
        document.getElementById('engagement_goal').value = content.engagement_goal || '';
        document.getElementById('notes').value = content.notes || '';
        
        if (content.scheduled_date) {
            const date = new Date(content.scheduled_date);
            document.getElementById('scheduled_date').value = date.toISOString().slice(0, 16);
        }

        // Twitter-specific fields
        if (content.character_count) {
            document.getElementById('character_count').value = content.character_count;
        }
        if (content.thread_length) {
            document.getElementById('thread_length').value = content.thread_length;
        }

        // Update platform radio buttons
        if (content.platform) {
            const radioButton = document.querySelector(`input[name="platform_radio"][value="${content.platform}"]`);
            if (radioButton) {
                radioButton.checked = true;
            }
        }

        // Trigger platform change to show/hide Twitter fields
        this.handlePlatformChange(content.platform || '');
        this.handleContentTypeChange(content.content_type || '');
    }

    async saveContent(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        
        try {
            let response;
            if (this.isEditing) {
                response = await fetch(`tables/content/${this.editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch('tables/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                this.showNotification(this.isEditing ? 'Content updated successfully!' : 'Content created successfully!', 'success');
                this.closeModal();
                this.loadContent();
                this.updateStats();
            } else {
                throw new Error('Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            this.showNotification('Error saving content. Please try again.', 'error');
        }
    }

    getFormData() {
        const formData = {
            title: document.getElementById('title').value,
            platform: document.getElementById('platform').value,
            content_type: document.getElementById('content_type').value,
            status: document.getElementById('status').value,
            caption: document.getElementById('caption').value,
            hashtags: document.getElementById('hashtags').value,
            priority: document.getElementById('priority').value,
            engagement_goal: document.getElementById('engagement_goal').value,
            notes: document.getElementById('notes').value
        };

        const scheduledDate = document.getElementById('scheduled_date').value;
        if (scheduledDate) {
            formData.scheduled_date = new Date(scheduledDate).getTime();
        }

        // Twitter-specific fields
        const platform = document.getElementById('platform').value;
        if (platform && (platform.includes('Twitter') || platform === 'All Platforms')) {
            const characterCount = document.getElementById('character_count').value;
            if (characterCount) {
                formData.character_count = parseInt(characterCount);
            }
            
            const threadLength = document.getElementById('thread_length').value;
            if (threadLength) {
                formData.thread_length = parseInt(threadLength);
            }
        }

        return formData;
    }

    // Pinterest-style functionality
    handleFilterPill(pill) {
        // Remove active class from all pills
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked pill
        pill.classList.add('active');
        
        // Apply filter
        const filterValue = pill.getAttribute('data-filter');
        this.applyPillFilter(filterValue);
    }

    applyPillFilter(filterValue) {
        // Reset all filters first
        this.currentFilters = {
            platform: '',
            type: '',
            status: '',
            search: this.currentFilters.search // Keep search
        };

        // Apply the specific filter
        if (filterValue) {
            // Check if it's a platform filter
            if (['TikTok', 'Instagram', 'Twitter'].includes(filterValue)) {
                this.currentFilters.platform = filterValue;
            }
            // Check if it's a status filter
            else if (['Draft', 'Scheduled', 'Posted', 'Archived'].includes(filterValue)) {
                this.currentFilters.status = filterValue;
            }
            // Check if it's a content type filter
            else if (['Post', 'Story', 'Reel', 'Tweet', 'Thread', 'Space'].includes(filterValue)) {
                this.currentFilters.type = filterValue;
            }
        }

        this.loadContent();
    }

    handlePlatformRadioChange(value) {
        // Update the hidden select element
        document.getElementById('platform').value = value;
        
        // Handle platform-specific changes
        this.handlePlatformChange(value);
    }

    // Twitter-specific functionality
    handlePlatformChange(platform) {
        const twitterFields = document.getElementById('twitterFields');
        const characterCount = document.getElementById('characterCount');
        
        if (platform && (platform.includes('Twitter') || platform === 'All Platforms')) {
            twitterFields.classList.remove('hidden');
            characterCount.classList.remove('hidden');
            this.updateCharacterCount(document.getElementById('caption').value);
        } else {
            twitterFields.classList.add('hidden');
            characterCount.classList.add('hidden');
        }
    }

    handleContentTypeChange(contentType) {
        const threadLengthField = document.getElementById('threadLengthField');
        
        if (contentType === 'Thread') {
            threadLengthField.classList.remove('hidden');
        } else {
            threadLengthField.classList.add('hidden');
        }
    }

    updateCharacterCount(text) {
        const platform = document.getElementById('platform').value;
        if (!platform || (!platform.includes('Twitter') && platform !== 'All Platforms')) {
            return;
        }

        const characterCount = text.length;
        const characterCountDisplay = document.getElementById('characterCount');
        const characterCountInput = document.getElementById('character_count');
        
        characterCountInput.value = characterCount;
        characterCountDisplay.textContent = `${characterCount} characters`;
        
        // Style based on Twitter character limits
        characterCountDisplay.className = 'character-counter mt-1';
        if (characterCount > 280) {
            characterCountDisplay.classList.add('error');
        } else if (characterCount > 240) {
            characterCountDisplay.classList.add('warning');
        }
    }

    async deleteContent(contentId) {
        if (confirm('Are you sure you want to delete this content?')) {
            try {
                const response = await fetch(`tables/content/${contentId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.showNotification('Content deleted successfully!', 'success');
                    this.loadContent();
                    this.updateStats();
                } else {
                    throw new Error('Failed to delete content');
                }
            } catch (error) {
                console.error('Error deleting content:', error);
                this.showNotification('Error deleting content. Please try again.', 'error');
            }
        }
    }

    async duplicateContent(contentId) {
        try {
            const response = await fetch(`tables/content/${contentId}`);
            if (response.ok) {
                const content = await response.json();
                
                // Remove system fields and modify title
                const newContent = {
                    title: `${content.title} (Copy)`,
                    platform: content.platform,
                    content_type: content.content_type,
                    status: 'Draft',
                    caption: content.caption,
                    hashtags: content.hashtags,
                    priority: content.priority,
                    engagement_goal: content.engagement_goal,
                    notes: content.notes
                };

                const createResponse = await fetch('tables/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newContent)
                });

                if (createResponse.ok) {
                    this.showNotification('Content duplicated successfully!', 'success');
                    this.loadContent();
                    this.updateStats();
                } else {
                    throw new Error('Failed to duplicate content');
                }
            }
        } catch (error) {
            console.error('Error duplicating content:', error);
            this.showNotification('Error duplicating content. Please try again.', 'error');
        }
    }

    // Content Loading and Display
    async loadContent() {
        try {
            let url = 'tables/content?limit=100';
            
            // Add sorting
            url += `&sort=${this.currentSort}`;
            
            const response = await fetch(url);
            console.log('Fetch response:', response);
            
            if (response.ok) {
                console.log('Response is ok, calling json()...');
                console.log('JSON function:', response.json);
                
                const data = await response.json();
                console.log('JSON result:', data);
                console.log('Loaded data:', data); // Debug log
                
                // Handle both direct array and wrapped response formats
                const contentArray = data.data || data || [];
                this.displayContent(contentArray);
            } else {
                console.error('Response not ok:', response);
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('Error loading content:', error);
            console.error('Error details:', error.message, error.stack);
            
            // Show empty state instead of error for better UX
            this.displayContent([]);
        }
    }

    displayContent(content) {
        const filteredContent = this.filterContent(content);
        
        if (filteredContent.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        switch (this.currentView) {
            case 'grid':
                this.displayGridView(filteredContent);
                break;
            case 'list':
                this.displayListView(filteredContent);
                break;
            case 'calendar':
                this.displayCalendarView(filteredContent);
                break;
        }
    }

    filterContent(content) {
        return content.filter(item => {
            // Platform filter
            if (this.currentFilters.platform && item.platform !== this.currentFilters.platform) {
                return false;
            }
            
            // Type filter
            if (this.currentFilters.type && item.content_type !== this.currentFilters.type) {
                return false;
            }
            
            // Status filter
            if (this.currentFilters.status && item.status !== this.currentFilters.status) {
                return false;
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const searchableText = `${item.title} ${item.caption} ${item.hashtags}`.toLowerCase();
                return searchableText.includes(search);
            }
            
            return true;
        });
    }

    displayGridView(content) {
        const container = document.getElementById('gridView');
        container.innerHTML = '';
        
        // Show loading state briefly
        this.showLoadingState();
        
        setTimeout(() => {
            content.forEach(item => {
                const pin = this.createContentCard(item);
                container.appendChild(pin);
            });
            
            this.hideLoadingState();
        }, 300);

        // Show grid view, hide others
        document.getElementById('gridView').classList.remove('hidden');
        document.getElementById('listView').classList.add('hidden');
        document.getElementById('calendarView').classList.add('hidden');
    }

    showLoadingState() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('gridView').classList.add('hidden');
    }

    hideLoadingState() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('gridView').classList.remove('hidden');
    }

    displayListView(content) {
        const container = document.getElementById('listView');
        container.innerHTML = '';
        
        // Create table structure
        const table = document.createElement('div');
        table.className = 'bg-white shadow overflow-hidden sm:rounded-md';
        
        const list = document.createElement('ul');
        list.className = 'divide-y divide-gray-200';
        
        content.forEach(item => {
            const listItem = this.createListItem(item);
            list.appendChild(listItem);
        });
        
        table.appendChild(list);
        container.appendChild(table);

        // Show list view, hide others
        document.getElementById('gridView').classList.add('hidden');
        document.getElementById('listView').classList.remove('hidden');
        document.getElementById('calendarView').classList.add('hidden');
    }

    displayCalendarView(content) {
        // For now, show a basic calendar structure - you can enhance this later
        const container = document.getElementById('calendarView');
        container.innerHTML = `
            <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">Calendar View</h3>
                <p class="text-gray-600">Calendar functionality will be implemented in the next version.</p>
                <div class="mt-4 grid grid-cols-7 gap-2 text-center">
                    <div class="font-semibold p-2">Sun</div>
                    <div class="font-semibold p-2">Mon</div>
                    <div class="font-semibold p-2">Tue</div>
                    <div class="font-semibold p-2">Wed</div>
                    <div class="font-semibold p-2">Thu</div>
                    <div class="font-semibold p-2">Fri</div>
                    <div class="font-semibold p-2">Sat</div>
                </div>
            </div>
        `;

        // Show calendar view, hide others
        document.getElementById('gridView').classList.add('hidden');
        document.getElementById('listView').classList.add('hidden');
        document.getElementById('calendarView').classList.remove('hidden');
    }

    createContentCard(item) {
        const pin = document.createElement('div');
        pin.className = 'pin-item';
        
        const scheduledDate = item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'Not scheduled';
        const platformClass = this.getPlatformClass(item.platform);
        const statusClass = this.getStatusClass(item.status);
        
        // Generate content type icon
        const contentTypeIcon = this.getContentTypeIcon(item.content_type);
        
        // Create pin header with platform/status styling
        const headerClass = item.status ? statusClass : platformClass;
        
        pin.innerHTML = `
            <div class="pin-header ${headerClass}">
                <div class="text-center">
                    <i class="${contentTypeIcon} text-3xl mb-2"></i>
                    <div class="font-semibold text-lg">${item.content_type || 'Content'}</div>
                    <div class="text-sm opacity-80">${item.platform || 'Unknown Platform'}</div>
                </div>
                
                <!-- Pinterest-style overlay on hover -->
                <div class="pin-overlay">
                    <div class="pin-actions">
                        <button onclick="contentManager.openModal('${item.id}')" class="pin-action-btn">
                            Edit
                        </button>
                        <button onclick="contentManager.duplicateContent('${item.id}')" class="pin-action-btn secondary">
                            Copy
                        </button>
                        <button onclick="contentManager.deleteContent('${item.id}')" class="pin-action-btn secondary">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="pin-content">
                <h3 class="pin-title">${item.title}</h3>
                
                ${item.caption ? `<p class="pin-description">${item.caption}</p>` : ''}
                
                ${item.hashtags ? `<div class="pin-tags">
                    ${item.hashtags.split(',').slice(0, 4).map(tag => 
                        `<span class="pin-tag">${tag.trim()}</span>`
                    ).join('')}
                </div>` : ''}
                
                <div class="pin-meta">
                    <div class="flex items-center space-x-4 text-xs">
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            ${scheduledDate}
                        </span>
                        ${item.priority ? `<span class="flex items-center">
                            <i class="fas fa-flag mr-1"></i>
                            ${item.priority}
                        </span>` : ''}
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        ${item.status ? `<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            ${item.status}
                        </span>` : ''}
                        ${item.character_count ? `<span class="text-xs text-gray-500">
                            ${item.character_count} chars
                        </span>` : ''}
                    </div>
                </div>
                
                ${item.engagement_goal ? `<div class="mt-3 p-2 bg-purple-50 rounded-lg">
                    <p class="text-xs text-purple-700">
                        <i class="fas fa-target mr-1"></i>
                        ${item.engagement_goal}
                    </p>
                </div>` : ''}
                
                ${item.notes ? `<div class="mt-3 p-2 bg-yellow-50 rounded-lg">
                    <p class="text-xs text-yellow-700">
                        <i class="fas fa-sticky-note mr-1"></i>
                        ${item.notes.substring(0, 60)}${item.notes.length > 60 ? '...' : ''}
                    </p>
                </div>` : ''}
            </div>
        `;
        
        return pin;
    }

    getContentTypeIcon(contentType) {
        const icons = {
            'Post': 'fas fa-image',
            'Story': 'fas fa-mobile-alt',
            'Reel': 'fas fa-video',
            'Tweet': 'fab fa-twitter',
            'Thread': 'fas fa-list',
            'Space': 'fas fa-microphone'
        };
        return icons[contentType] || 'fas fa-file-alt';
    }

    getStatusClass(status) {
        const statusClasses = {
            'Draft': 'status-draft',
            'Scheduled': 'status-scheduled',
            'Posted': 'status-posted',
            'Archived': 'status-archived'
        };
        return statusClasses[status] || 'status-draft';
    }

    createListItem(item) {
        const li = document.createElement('li');
        const scheduledDate = item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'Not scheduled';
        
        li.innerHTML = `
            <div class="px-4 py-4 flex items-center justify-between">
                <div class="flex items-center min-w-0 flex-1">
                    <div class="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                            <p class="text-sm font-medium text-purple-600 truncate">${item.title}</p>
                            <p class="mt-2 flex items-center text-sm text-gray-500">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getPlatformClass(item.platform)}">
                                    ${item.platform || 'No Platform'}
                                </span>
                                <span class="ml-2">${item.content_type}</span>
                            </p>
                        </div>
                        <div class="hidden md:block">
                            <div>
                                <p class="text-sm text-gray-900">${scheduledDate}</p>
                                <p class="mt-2 flex items-center text-sm text-gray-500">
                                    <span class="px-2 py-1 text-xs font-medium rounded-full status-${item.status?.toLowerCase() || 'draft'}">
                                        ${item.status || 'Draft'}
                                    </span>
                                    ${item.priority ? `<span class="ml-2 px-2 py-1 text-xs font-medium rounded ${this.getPriorityClass(item.priority)}">
                                        ${item.priority}
                                    </span>` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="contentManager.openModal('${item.id}')" class="text-gray-400 hover:text-blue-600">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="contentManager.duplicateContent('${item.id}')" class="text-gray-400 hover:text-green-600">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="contentManager.deleteContent('${item.id}')" class="text-gray-400 hover:text-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        return li;
    }

    getPriorityClass(priority) {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getPlatformClass(platform) {
        if (!platform) return 'bg-gray-100 text-gray-800';
        
        const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '');
        
        switch (normalizedPlatform) {
            case 'tiktok':
                return 'platform-tiktok';
            case 'instagram':
                return 'platform-instagram';
            case 'twitter':
                return 'platform-twitter';
            case 'tiktok+instagram':
                return 'platform-tiktok+instagram';
            case 'tiktok+twitter':
                return 'platform-tiktok+twitter';
            case 'instagram+twitter':
                return 'platform-instagram+twitter';
            case 'allplatforms':
                return 'platform-all';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    // View Management
    switchView(viewType) {
        this.currentView = viewType;
        
        // Update button states (if they exist)
        document.querySelectorAll('[id$="ViewBtn"]').forEach(btn => {
            btn.className = 'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100';
        });
        
        const viewBtn = document.getElementById(`${viewType}ViewBtn`);
        if (viewBtn) {
            viewBtn.className = 'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-purple-100 text-purple-700';
        }
        
        this.loadContent();
    }

    toggleView() {
        // Simple toggle between grid and list view for Pinterest-style interface
        const newView = this.currentView === 'grid' ? 'list' : 'grid';
        this.switchView(newView);
    }

    // Filter Management
    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.loadContent();
    }

    clearFilters() {
        this.currentFilters = {
            platform: '',
            type: '',
            status: '',
            search: ''
        };
        
        // Reset search inputs
        document.getElementById('mainSearchInput').value = '';
        
        // Reset filter pills - activate "All"
        document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
        document.getElementById('filterAll').classList.add('active');
        
        this.loadContent();
    }

    updateSort(sortBy) {
        this.currentSort = sortBy;
        this.loadContent();
    }

    // Stats and Analytics
    async updateStats() {
        try {
            const response = await fetch('tables/content?limit=1000');
            if (response.ok) {
                const data = await response.json();
                console.log('Stats data:', data); // Debug log
                
                // Handle both direct array and wrapped response formats
                const content = data.data || data || [];
                
                // Calculate stats
                const totalContent = content.length;
                const scheduledContent = content.filter(item => item.status === 'Scheduled').length;
                const postedContent = content.filter(item => item.status === 'Posted').length;
                
                // This week content (simplified - you can enhance this)
                const oneWeekFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);
                const thisWeekContent = content.filter(item => {
                    if (!item.scheduled_date) return false;
                    return item.scheduled_date <= oneWeekFromNow && item.scheduled_date >= Date.now();
                }).length;
                
                // Update DOM safely
                const updateElement = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                    } else {
                        console.warn(`Stats element '${id}' not found`);
                    }
                };
                
                updateElement('totalContent', totalContent);
                updateElement('scheduledContent', scheduledContent);
                updateElement('postedContent', postedContent);
                updateElement('thisWeekContent', thisWeekContent);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
            // Set default values if stats fail
            const elements = ['totalContent', 'scheduledContent', 'postedContent', 'thisWeekContent'];
            elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = '0';
            });
        }
    }

    // Utility Functions
    showEmptyState() {
        document.getElementById('emptyState').classList.remove('hidden');
        document.getElementById('contentContainer').classList.add('hidden');
    }

    hideEmptyState() {
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('contentContainer').classList.remove('hidden');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 translate-x-full`;
        
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 
                       type === 'error' ? 'bg-red-50 border-red-200' : 
                       'bg-blue-50 border-blue-200';
        
        const iconColor = type === 'success' ? 'text-green-400' : 
                         type === 'error' ? 'text-red-400' : 
                         'text-blue-400';
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle';
        
        notification.innerHTML = `
            <div class="p-4 ${bgColor} border rounded-lg">
                <div class="flex items-center">
                    <i class="fas ${icon} ${iconColor} mr-3"></i>
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the application
const contentManager = new ContentManager();

// Make contentManager globally available for inline event handlers
window.contentManager = contentManager;