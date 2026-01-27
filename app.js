// ===== Marketing Dashboard Application =====
// Today Capital Group - Marketing Productivity Tool

class MarketingDashboard {
    constructor() {
        this.data = {
            campaigns: [],
            content: [],
            leads: [],
            expenses: [],
            tasks: [],
            budget: {
                total: 100000,
                categories: {
                    digital: 0,
                    content: 0,
                    events: 0,
                    tools: 0,
                    other: 0
                }
            }
        };

        this.currentMonth = new Date();
        this.currentFilter = 'all';

        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDate();
        this.renderCalendar();
        this.updateDashboard();
        this.renderCampaigns();
        this.renderLeads();
        this.renderExpenses();
        this.renderTasks();
    }

    // ===== Data Persistence =====
    loadData() {
        const saved = localStorage.getItem('tcg_marketing_data');
        if (saved) {
            this.data = JSON.parse(saved);
        }
    }

    saveData() {
        localStorage.setItem('tcg_marketing_data', JSON.stringify(this.data));
        this.updateDashboard();
    }

    // ===== Event Bindings =====
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.section);
            });
        });

        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.section);
            });
        });

        // Quick Add
        document.getElementById('quick-add-btn').addEventListener('click', () => {
            this.showQuickAddMenu();
        });

        // Campaign Actions
        document.getElementById('add-campaign-btn').addEventListener('click', () => {
            this.showModal('campaign');
        });

        // Content Calendar
        document.getElementById('add-content-btn').addEventListener('click', () => {
            this.showModal('content');
        });

        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.renderCalendar();
        });

        // Lead Pipeline
        document.getElementById('add-lead-btn').addEventListener('click', () => {
            this.showModal('lead');
        });

        // Budget
        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.showModal('expense');
        });

        document.getElementById('total-budget-input').addEventListener('change', (e) => {
            this.data.budget.total = parseFloat(e.target.value) || 0;
            this.saveData();
            this.updateBudgetDisplay();
        });

        // Tasks
        document.getElementById('add-task-btn').addEventListener('click', () => {
            this.showModal('task');
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.hideModal();
        });
        document.getElementById('modal-save').addEventListener('click', () => this.handleModalSave());
    }

    // ===== Navigation =====
    navigateTo(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });

        const titles = {
            dashboard: 'Dashboard',
            campaigns: 'Campaigns',
            calendar: 'Content Calendar',
            leads: 'Lead Pipeline',
            budget: 'Budget',
            tasks: 'Tasks'
        };
        document.getElementById('section-title').textContent = titles[section] || 'Dashboard';
    }

    // ===== Date Display =====
    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
    }

    // ===== Dashboard =====
    updateDashboard() {
        // Active Campaigns
        const activeCampaigns = this.data.campaigns.filter(c => c.status === 'active').length;
        document.getElementById('active-campaigns').textContent = activeCampaigns;

        // Total Leads
        document.getElementById('total-leads').textContent = this.data.leads.length;

        // Budget Spent
        const totalSpent = this.data.expenses.reduce((sum, e) => sum + e.amount, 0);
        document.getElementById('budget-spent').textContent = this.formatCurrency(totalSpent);

        // Average ROI
        const campaignsWithROI = this.data.campaigns.filter(c => c.spent > 0 && c.revenue > 0);
        let avgROI = 0;
        if (campaignsWithROI.length > 0) {
            avgROI = campaignsWithROI.reduce((sum, c) => sum + ((c.revenue - c.spent) / c.spent * 100), 0) / campaignsWithROI.length;
        }
        document.getElementById('avg-roi').textContent = avgROI.toFixed(1) + '%';

        // Update budget display
        this.updateBudgetDisplay();

        // Upcoming Content
        this.renderUpcomingContent();

        // Recent Leads
        this.renderRecentLeads();

        // Pending Tasks
        this.renderPendingTasks();
    }

    updateBudgetDisplay() {
        const total = this.data.budget.total;
        const spent = this.data.expenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = total - spent;
        const percentage = total > 0 ? (spent / total * 100) : 0;

        document.getElementById('total-budget-input').value = total;
        document.getElementById('total-budget-display').textContent = this.formatCurrency(total);
        document.getElementById('spent-display').textContent = this.formatCurrency(spent);
        document.getElementById('remaining-display').textContent = this.formatCurrency(remaining);
        document.getElementById('budget-progress').style.width = Math.min(percentage, 100) + '%';
        document.getElementById('budget-percentage').textContent = percentage.toFixed(1) + '%';

        // Update category bars
        const categoryTotals = { digital: 0, content: 0, events: 0, tools: 0, other: 0 };
        this.data.expenses.forEach(e => {
            if (categoryTotals.hasOwnProperty(e.category)) {
                categoryTotals[e.category] += e.amount;
            }
        });

        const maxCategory = Math.max(...Object.values(categoryTotals), 1);
        Object.keys(categoryTotals).forEach(cat => {
            const bar = document.querySelector(`.bar[data-category="${cat}"]`);
            const amount = document.querySelector(`.category-amount[data-category="${cat}"]`);
            if (bar) bar.style.width = (categoryTotals[cat] / maxCategory * 100) + '%';
            if (amount) amount.textContent = this.formatCurrency(categoryTotals[cat]);
        });
    }

    renderUpcomingContent() {
        const container = document.getElementById('upcoming-content-list');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = this.data.content
            .filter(c => new Date(c.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming content scheduled</p>';
            return;
        }

        container.innerHTML = upcoming.map(item => `
            <div class="content-item">
                <span class="content-dot ${item.type}"></span>
                <div class="content-info">
                    <span class="content-title">${this.escapeHtml(item.title)}</span>
                    <span class="content-date">${this.formatDate(item.date)}</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentLeads() {
        const container = document.getElementById('recent-leads-list');
        const recent = [...this.data.leads]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No leads yet</p>';
            return;
        }

        container.innerHTML = recent.map(lead => `
            <div class="lead-item-small">
                <div class="lead-info-small">
                    <span class="lead-name-small">${this.escapeHtml(lead.name)}</span>
                    <span class="lead-source-small">${this.escapeHtml(lead.source)}</span>
                </div>
            </div>
        `).join('');
    }

    renderPendingTasks() {
        const container = document.getElementById('pending-tasks-list');
        const pending = this.data.tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        if (pending.length === 0) {
            container.innerHTML = '<p class="empty-state">No pending tasks</p>';
            return;
        }

        container.innerHTML = pending.map(task => `
            <div class="task-item-small">
                <div class="task-info-small">
                    <span class="task-title-small">${this.escapeHtml(task.title)}</span>
                    <span class="task-due-small">${task.dueDate ? 'Due: ' + this.formatDate(task.dueDate) : 'No due date'}</span>
                </div>
            </div>
        `).join('');
    }

    // ===== Campaigns =====
    renderCampaigns() {
        const tbody = document.getElementById('campaigns-list');

        if (this.data.campaigns.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No campaigns yet. Click "New Campaign" to get started.</td></tr>';
            return;
        }

        tbody.innerHTML = this.data.campaigns.map((campaign, index) => {
            const roi = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td><strong>${this.escapeHtml(campaign.name)}</strong></td>
                    <td>${this.escapeHtml(campaign.channel)}</td>
                    <td><span class="status-badge ${campaign.status}">${campaign.status}</span></td>
                    <td>${this.formatCurrency(campaign.budget)}</td>
                    <td>${this.formatCurrency(campaign.spent)}</td>
                    <td>${campaign.leads}</td>
                    <td>${roi}%</td>
                    <td>
                        <button class="action-btn" onclick="dashboard.editCampaign(${index})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="dashboard.deleteCampaign(${index})" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editCampaign(index) {
        this.showModal('campaign', index);
    }

    deleteCampaign(index) {
        if (confirm('Are you sure you want to delete this campaign?')) {
            this.data.campaigns.splice(index, 1);
            this.saveData();
            this.renderCampaigns();
        }
    }

    // ===== Content Calendar =====
    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthLabel = document.getElementById('calendar-month');

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        monthLabel.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isOtherMonth = date.getMonth() !== month;
            const isToday = date.getTime() === today.getTime();
            const dateStr = date.toISOString().split('T')[0];

            const dayContent = this.data.content
                .filter(c => c.date === dateStr)
                .map(c => `<div class="day-event ${c.type}" onclick="event.stopPropagation(); dashboard.editContent('${c.id}')">${this.escapeHtml(c.title)}</div>`)
                .join('');

            html += `
                <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}"
                     data-date="${dateStr}"
                     onclick="dashboard.addContentForDate('${dateStr}')">
                    <span class="day-number">${date.getDate()}</span>
                    <div class="day-content">${dayContent}</div>
                </div>
            `;

            if (date >= lastDay && (i + 1) % 7 === 0) break;
        }

        grid.innerHTML = html;
    }

    addContentForDate(dateStr) {
        this.showModal('content', null, dateStr);
    }

    editContent(id) {
        const index = this.data.content.findIndex(c => c.id === id);
        if (index !== -1) {
            this.showModal('content', index);
        }
    }

    deleteContent(index) {
        if (confirm('Are you sure you want to delete this content?')) {
            this.data.content.splice(index, 1);
            this.saveData();
            this.renderCalendar();
        }
    }

    // ===== Lead Pipeline =====
    renderLeads() {
        const stages = ['new', 'contacted', 'qualified', 'proposal', 'converted'];

        stages.forEach(stage => {
            const container = document.getElementById(`leads-${stage}`);
            const countEl = document.getElementById(`leads-${stage}-count`);
            const stageLeads = this.data.leads.filter(l => l.stage === stage);

            countEl.textContent = stageLeads.length;

            if (stageLeads.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = stageLeads.map((lead, i) => {
                const index = this.data.leads.findIndex(l => l.id === lead.id);
                return `
                    <div class="lead-card" onclick="dashboard.editLead(${index})" draggable="true" data-lead-id="${lead.id}">
                        <div class="lead-name">${this.escapeHtml(lead.name)}</div>
                        <div class="lead-company">${this.escapeHtml(lead.company || 'N/A')}</div>
                        <div class="lead-meta">
                            <span class="lead-value">${lead.value ? this.formatCurrency(lead.value) : '-'}</span>
                            <span class="lead-source">${this.escapeHtml(lead.source)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        });

        this.initDragAndDrop();
    }

    initDragAndDrop() {
        document.querySelectorAll('.lead-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.leadId);
                card.style.opacity = '0.5';
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });
        });

        document.querySelectorAll('.pipeline-column').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.style.background = '#e0e7ff';
            });

            column.addEventListener('dragleave', () => {
                column.style.background = '';
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.style.background = '';
                const leadId = e.dataTransfer.getData('text/plain');
                const newStage = column.dataset.stage;

                const lead = this.data.leads.find(l => l.id === leadId);
                if (lead && lead.stage !== newStage) {
                    lead.stage = newStage;
                    this.saveData();
                    this.renderLeads();
                }
            });
        });
    }

    editLead(index) {
        this.showModal('lead', index);
    }

    deleteLead(index) {
        if (confirm('Are you sure you want to delete this lead?')) {
            this.data.leads.splice(index, 1);
            this.saveData();
            this.renderLeads();
        }
    }

    // ===== Expenses =====
    renderExpenses() {
        const tbody = document.getElementById('expenses-list');

        if (this.data.expenses.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No expenses recorded yet.</td></tr>';
            return;
        }

        const sorted = [...this.data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = sorted.map((expense, i) => {
            const index = this.data.expenses.findIndex(e => e.id === expense.id);
            const categoryLabels = {
                digital: 'Digital Advertising',
                content: 'Content Production',
                events: 'Events & Webinars',
                tools: 'Tools & Software',
                other: 'Other'
            };
            return `
                <tr>
                    <td>${this.formatDate(expense.date)}</td>
                    <td>${this.escapeHtml(expense.description)}</td>
                    <td>${categoryLabels[expense.category] || expense.category}</td>
                    <td><strong>${this.formatCurrency(expense.amount)}</strong></td>
                    <td>
                        <button class="action-btn" onclick="dashboard.editExpense(${index})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="dashboard.deleteExpense(${index})" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editExpense(index) {
        this.showModal('expense', index);
    }

    deleteExpense(index) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.data.expenses.splice(index, 1);
            this.saveData();
            this.renderExpenses();
        }
    }

    // ===== Tasks =====
    renderTasks() {
        const container = document.getElementById('tasks-list');
        let tasks = [...this.data.tasks];

        if (this.currentFilter !== 'all') {
            tasks = tasks.filter(t => t.status === this.currentFilter);
        }

        tasks.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999');
        });

        if (tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks match the current filter.</p>';
            return;
        }

        container.innerHTML = tasks.map((task, i) => {
            const index = this.data.tasks.findIndex(t => t.id === task.id);
            const isCompleted = task.status === 'completed';
            return `
                <div class="task-item ${isCompleted ? 'completed' : ''}">
                    <div class="task-checkbox ${isCompleted ? 'checked' : ''}"
                         onclick="dashboard.toggleTask(${index})"></div>
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            ${task.dueDate ? `<span>Due: ${this.formatDate(task.dueDate)}</span>` : ''}
                            <span class="task-priority ${task.priority}">${task.priority}</span>
                            <span class="task-status ${task.status}">${task.status.replace('-', ' ')}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn" onclick="dashboard.editTask(${index})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="dashboard.deleteTask(${index})" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleTask(index) {
        const task = this.data.tasks[index];
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        this.saveData();
        this.renderTasks();
    }

    editTask(index) {
        this.showModal('task', index);
    }

    deleteTask(index) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.data.tasks.splice(index, 1);
            this.saveData();
            this.renderTasks();
        }
    }

    // ===== Modal System =====
    showQuickAddMenu() {
        const options = [
            { type: 'campaign', label: 'New Campaign' },
            { type: 'content', label: 'Schedule Content' },
            { type: 'lead', label: 'Add Lead' },
            { type: 'expense', label: 'Add Expense' },
            { type: 'task', label: 'Add Task' }
        ];

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${options.map(opt => `
                    <button class="btn btn-secondary" onclick="dashboard.hideModal(); dashboard.showModal('${opt.type}')"
                            style="justify-content: flex-start; padding: 16px;">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
        `;

        document.getElementById('modal-title').textContent = 'Quick Add';
        document.getElementById('modal-save').style.display = 'none';
        document.getElementById('modal-overlay').classList.add('active');
    }

    showModal(type, editIndex = null, prefillDate = null) {
        this.currentModalType = type;
        this.currentEditIndex = editIndex;
        document.getElementById('modal-save').style.display = '';

        const titles = {
            campaign: editIndex !== null ? 'Edit Campaign' : 'New Campaign',
            content: editIndex !== null ? 'Edit Content' : 'Schedule Content',
            lead: editIndex !== null ? 'Edit Lead' : 'Add Lead',
            expense: editIndex !== null ? 'Edit Expense' : 'Add Expense',
            task: editIndex !== null ? 'Edit Task' : 'Add Task'
        };

        document.getElementById('modal-title').textContent = titles[type];

        const modalBody = document.getElementById('modal-body');
        const data = editIndex !== null ? this.data[type + 's']?.[editIndex] || this.data[type]?.[editIndex] : null;

        switch (type) {
            case 'campaign':
                modalBody.innerHTML = this.getCampaignForm(data);
                break;
            case 'content':
                modalBody.innerHTML = this.getContentForm(data, prefillDate);
                break;
            case 'lead':
                modalBody.innerHTML = this.getLeadForm(data);
                break;
            case 'expense':
                modalBody.innerHTML = this.getExpenseForm(data);
                break;
            case 'task':
                modalBody.innerHTML = this.getTaskForm(data);
                break;
        }

        document.getElementById('modal-overlay').classList.add('active');
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        this.currentModalType = null;
        this.currentEditIndex = null;
    }

    getCampaignForm(data) {
        return `
            <div class="form-group">
                <label>Campaign Name</label>
                <input type="text" id="form-name" value="${data?.name || ''}" placeholder="e.g., Q1 LinkedIn Ads">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Channel</label>
                    <select id="form-channel">
                        <option value="LinkedIn" ${data?.channel === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                        <option value="Google Ads" ${data?.channel === 'Google Ads' ? 'selected' : ''}>Google Ads</option>
                        <option value="Facebook" ${data?.channel === 'Facebook' ? 'selected' : ''}>Facebook</option>
                        <option value="Email" ${data?.channel === 'Email' ? 'selected' : ''}>Email</option>
                        <option value="Content" ${data?.channel === 'Content' ? 'selected' : ''}>Content</option>
                        <option value="Events" ${data?.channel === 'Events' ? 'selected' : ''}>Events</option>
                        <option value="Other" ${data?.channel === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="form-status">
                        <option value="draft" ${data?.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="active" ${data?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="paused" ${data?.status === 'paused' ? 'selected' : ''}>Paused</option>
                        <option value="completed" ${data?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Budget ($)</label>
                    <input type="number" id="form-budget" value="${data?.budget || ''}" placeholder="10000">
                </div>
                <div class="form-group">
                    <label>Spent ($)</label>
                    <input type="number" id="form-spent" value="${data?.spent || ''}" placeholder="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Leads Generated</label>
                    <input type="number" id="form-leads" value="${data?.leads || ''}" placeholder="0">
                </div>
                <div class="form-group">
                    <label>Revenue ($)</label>
                    <input type="number" id="form-revenue" value="${data?.revenue || ''}" placeholder="0">
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="form-notes" placeholder="Campaign notes...">${data?.notes || ''}</textarea>
            </div>
        `;
    }

    getContentForm(data, prefillDate) {
        const dateValue = data?.date || prefillDate || new Date().toISOString().split('T')[0];
        return `
            <div class="form-group">
                <label>Content Title</label>
                <input type="text" id="form-title" value="${data?.title || ''}" placeholder="e.g., Market Outlook Blog Post">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Content Type</label>
                    <select id="form-type">
                        <option value="blog" ${data?.type === 'blog' ? 'selected' : ''}>Blog Post</option>
                        <option value="social" ${data?.type === 'social' ? 'selected' : ''}>Social Media</option>
                        <option value="email" ${data?.type === 'email' ? 'selected' : ''}>Email</option>
                        <option value="webinar" ${data?.type === 'webinar' ? 'selected' : ''}>Webinar</option>
                        <option value="report" ${data?.type === 'report' ? 'selected' : ''}>Report/Whitepaper</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Scheduled Date</label>
                    <input type="date" id="form-date" value="${dateValue}">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="form-description" placeholder="Content description...">${data?.description || ''}</textarea>
            </div>
        `;
    }

    getLeadForm(data) {
        return `
            <div class="form-group">
                <label>Lead Name</label>
                <input type="text" id="form-name" value="${data?.name || ''}" placeholder="John Smith">
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" id="form-company" value="${data?.company || ''}" placeholder="Acme Corp">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="form-email" value="${data?.email || ''}" placeholder="john@example.com">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="form-phone" value="${data?.phone || ''}" placeholder="(555) 123-4567">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Source</label>
                    <select id="form-source">
                        <option value="Website" ${data?.source === 'Website' ? 'selected' : ''}>Website</option>
                        <option value="LinkedIn" ${data?.source === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                        <option value="Referral" ${data?.source === 'Referral' ? 'selected' : ''}>Referral</option>
                        <option value="Event" ${data?.source === 'Event' ? 'selected' : ''}>Event</option>
                        <option value="Content" ${data?.source === 'Content' ? 'selected' : ''}>Content Download</option>
                        <option value="Other" ${data?.source === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Stage</label>
                    <select id="form-stage">
                        <option value="new" ${data?.stage === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${data?.stage === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="qualified" ${data?.stage === 'qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="proposal" ${data?.stage === 'proposal' ? 'selected' : ''}>Proposal</option>
                        <option value="converted" ${data?.stage === 'converted' ? 'selected' : ''}>Converted</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Estimated Value ($)</label>
                <input type="number" id="form-value" value="${data?.value || ''}" placeholder="50000">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="form-notes" placeholder="Additional notes...">${data?.notes || ''}</textarea>
            </div>
        `;
    }

    getExpenseForm(data) {
        const dateValue = data?.date || new Date().toISOString().split('T')[0];
        return `
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="form-description" value="${data?.description || ''}" placeholder="e.g., LinkedIn Ad Spend - January">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Amount ($)</label>
                    <input type="number" id="form-amount" value="${data?.amount || ''}" placeholder="5000" step="0.01">
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="form-date" value="${dateValue}">
                </div>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="form-category">
                    <option value="digital" ${data?.category === 'digital' ? 'selected' : ''}>Digital Advertising</option>
                    <option value="content" ${data?.category === 'content' ? 'selected' : ''}>Content Production</option>
                    <option value="events" ${data?.category === 'events' ? 'selected' : ''}>Events & Webinars</option>
                    <option value="tools" ${data?.category === 'tools' ? 'selected' : ''}>Tools & Software</option>
                    <option value="other" ${data?.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="form-notes" placeholder="Additional notes...">${data?.notes || ''}</textarea>
            </div>
        `;
    }

    getTaskForm(data) {
        const dateValue = data?.dueDate || '';
        return `
            <div class="form-group">
                <label>Task Title</label>
                <input type="text" id="form-title" value="${data?.title || ''}" placeholder="e.g., Review Q1 campaign performance">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" id="form-dueDate" value="${dateValue}">
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select id="form-priority">
                        <option value="low" ${data?.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${data?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${data?.priority === 'high' ? 'selected' : ''}>High</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="form-status">
                    <option value="pending" ${data?.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in-progress" ${data?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${data?.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="form-description" placeholder="Task description...">${data?.description || ''}</textarea>
            </div>
        `;
    }

    handleModalSave() {
        switch (this.currentModalType) {
            case 'campaign':
                this.saveCampaign();
                break;
            case 'content':
                this.saveContent();
                break;
            case 'lead':
                this.saveLead();
                break;
            case 'expense':
                this.saveExpense();
                break;
            case 'task':
                this.saveTask();
                break;
        }
    }

    saveCampaign() {
        const campaign = {
            id: this.currentEditIndex !== null ? this.data.campaigns[this.currentEditIndex].id : this.generateId(),
            name: document.getElementById('form-name').value,
            channel: document.getElementById('form-channel').value,
            status: document.getElementById('form-status').value,
            budget: parseFloat(document.getElementById('form-budget').value) || 0,
            spent: parseFloat(document.getElementById('form-spent').value) || 0,
            leads: parseInt(document.getElementById('form-leads').value) || 0,
            revenue: parseFloat(document.getElementById('form-revenue').value) || 0,
            notes: document.getElementById('form-notes').value,
            createdAt: this.currentEditIndex !== null ? this.data.campaigns[this.currentEditIndex].createdAt : new Date().toISOString()
        };

        if (!campaign.name) {
            alert('Please enter a campaign name');
            return;
        }

        if (this.currentEditIndex !== null) {
            this.data.campaigns[this.currentEditIndex] = campaign;
        } else {
            this.data.campaigns.push(campaign);
        }

        this.saveData();
        this.renderCampaigns();
        this.hideModal();
    }

    saveContent() {
        const content = {
            id: this.currentEditIndex !== null ? this.data.content[this.currentEditIndex].id : this.generateId(),
            title: document.getElementById('form-title').value,
            type: document.getElementById('form-type').value,
            date: document.getElementById('form-date').value,
            description: document.getElementById('form-description').value,
            createdAt: this.currentEditIndex !== null ? this.data.content[this.currentEditIndex].createdAt : new Date().toISOString()
        };

        if (!content.title) {
            alert('Please enter a content title');
            return;
        }

        if (this.currentEditIndex !== null) {
            this.data.content[this.currentEditIndex] = content;
        } else {
            this.data.content.push(content);
        }

        this.saveData();
        this.renderCalendar();
        this.hideModal();
    }

    saveLead() {
        const lead = {
            id: this.currentEditIndex !== null ? this.data.leads[this.currentEditIndex].id : this.generateId(),
            name: document.getElementById('form-name').value,
            company: document.getElementById('form-company').value,
            email: document.getElementById('form-email').value,
            phone: document.getElementById('form-phone').value,
            source: document.getElementById('form-source').value,
            stage: document.getElementById('form-stage').value,
            value: parseFloat(document.getElementById('form-value').value) || 0,
            notes: document.getElementById('form-notes').value,
            createdAt: this.currentEditIndex !== null ? this.data.leads[this.currentEditIndex].createdAt : new Date().toISOString()
        };

        if (!lead.name) {
            alert('Please enter a lead name');
            return;
        }

        if (this.currentEditIndex !== null) {
            this.data.leads[this.currentEditIndex] = lead;
        } else {
            this.data.leads.push(lead);
        }

        this.saveData();
        this.renderLeads();
        this.hideModal();
    }

    saveExpense() {
        const expense = {
            id: this.currentEditIndex !== null ? this.data.expenses[this.currentEditIndex].id : this.generateId(),
            description: document.getElementById('form-description').value,
            amount: parseFloat(document.getElementById('form-amount').value) || 0,
            date: document.getElementById('form-date').value,
            category: document.getElementById('form-category').value,
            notes: document.getElementById('form-notes').value,
            createdAt: this.currentEditIndex !== null ? this.data.expenses[this.currentEditIndex].createdAt : new Date().toISOString()
        };

        if (!expense.description) {
            alert('Please enter a description');
            return;
        }

        if (this.currentEditIndex !== null) {
            this.data.expenses[this.currentEditIndex] = expense;
        } else {
            this.data.expenses.push(expense);
        }

        this.saveData();
        this.renderExpenses();
        this.hideModal();
    }

    saveTask() {
        const task = {
            id: this.currentEditIndex !== null ? this.data.tasks[this.currentEditIndex].id : this.generateId(),
            title: document.getElementById('form-title').value,
            dueDate: document.getElementById('form-dueDate').value,
            priority: document.getElementById('form-priority').value,
            status: document.getElementById('form-status').value,
            description: document.getElementById('form-description').value,
            createdAt: this.currentEditIndex !== null ? this.data.tasks[this.currentEditIndex].createdAt : new Date().toISOString()
        };

        if (!task.title) {
            alert('Please enter a task title');
            return;
        }

        if (this.currentEditIndex !== null) {
            this.data.tasks[this.currentEditIndex] = task;
        } else {
            this.data.tasks.push(task);
        }

        this.saveData();
        this.renderTasks();
        this.hideModal();
    }

    // ===== Utilities =====
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize the dashboard
const dashboard = new MarketingDashboard();
