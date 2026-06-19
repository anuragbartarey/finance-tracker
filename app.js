// ===== Theme Handling =====
const THEME_KEY = 'fintrack_theme';
const STYLE_KEY = 'fintrack_ui_style';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    if (newTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', newTheme);
    }

    localStorage.setItem(THEME_KEY, newTheme);
}

// ===== UI Style Handling =====
function initUIStyle() {
    const savedStyle = localStorage.getItem(STYLE_KEY) || 'terminal';
    setUIStyle(savedStyle);

    // Set the radio button
    const radio = document.querySelector(`input[name="uiStyle"][value="${savedStyle}"]`);
    if (radio) radio.checked = true;

    // Listen for style changes
    document.querySelectorAll('input[name="uiStyle"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            setUIStyle(e.target.value);
            localStorage.setItem(STYLE_KEY, e.target.value);
        });
    });

    // Settings modal handlers
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('settingsClose').addEventListener('click', closeSettingsModal);
    document.getElementById('settingsClose2').addEventListener('click', closeSettingsModal);
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettingsModal();
    });
}

function setUIStyle(style) {
    document.documentElement.setAttribute('data-ui-style', style);
}

function openSettingsModal() {
    document.getElementById('settingsOverlay').classList.add('active');
}

function closeSettingsModal() {
    document.getElementById('settingsOverlay').classList.remove('active');
}

// ===== Data Store =====
const STORAGE_KEY = 'fintrack_data';

const defaultData = {
    version: '1.0',
    currency: 'INR',
    current: {
        date: new Date().toISOString().split('T')[0],
        total_value: 0
    },
    previous: null,
    savings_accounts: [],
    fixed_deposits: [],
    ppf: null,
    equity: [],
    mutual_funds: [],
    gold_bonds: [],
    provident_fund: null,
    physical_assets: []
};

let appData = null;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initUIStyle();
    loadData();
    initTabs();
    initModals();
    initButtons();
    renderAll();
});

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            appData = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored data:', e);
            appData = { ...defaultData };
        }
    } else {
        appData = { ...defaultData };
    }
}

function saveData() {
    appData.current.date = new Date().toISOString().split('T')[0];
    appData.current.total_value = calculateTotalNetWorth();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// ===== Tab Navigation =====
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panelId = tab.dataset.tab + '-panel';
            document.getElementById(panelId).classList.add('active');
        });
    });
}

// ===== Modal Handling =====
let currentEditId = null;
let currentCategory = null;
let deleteCallback = null;

function initModals() {
    // Main modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', handleModalSave);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Confirm modal
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmDelete').addEventListener('click', handleConfirmDelete);
    document.getElementById('confirmOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeConfirmModal();
    });

    // Snapshot modal
    document.getElementById('snapshotClose').addEventListener('click', closeSnapshotModal);
    document.getElementById('snapshotCancel').addEventListener('click', closeSnapshotModal);
    document.getElementById('snapshotConfirm').addEventListener('click', handleSnapshotConfirm);
    document.getElementById('snapshotOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSnapshotModal();
    });

    // Add entry buttons
    document.querySelectorAll('.add-entry-btn').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.category));
    });
}

function openModal(category, editId = null) {
    currentCategory = category;
    currentEditId = editId;

    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    const isEdit = editId !== null;
    let data = null;

    if (isEdit) {
        data = getEntryById(category, editId);
    }

    title.textContent = isEdit ? `Edit ${getCategoryName(category)}` : `Add ${getCategoryName(category)}`;
    body.innerHTML = getFormHTML(category, data);

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    currentEditId = null;
    currentCategory = null;
}

function openConfirmModal(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    deleteCallback = callback;
    document.getElementById('confirmOverlay').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmOverlay').classList.remove('active');
    deleteCallback = null;
}

function handleConfirmDelete() {
    if (deleteCallback) {
        deleteCallback();
    }
    closeConfirmModal();
}

function openSnapshotModal() {
    const dateInput = document.getElementById('snapshotDate');
    dateInput.value = new Date().toISOString().split('T')[0];
    document.getElementById('snapshotOverlay').classList.add('active');
}

function closeSnapshotModal() {
    document.getElementById('snapshotOverlay').classList.remove('active');
}

function handleSnapshotConfirm() {
    const date = document.getElementById('snapshotDate').value;
    if (!date) return;

    // Move current to previous
    appData.previous = {
        date: appData.current.date,
        total_value: appData.current.total_value,
        savings_total: calculateCategoryTotal('savings'),
        fd_total: calculateCategoryTotal('fd'),
        ppf_total: calculateCategoryTotal('ppf'),
        equity_total: calculateCategoryTotal('equity'),
        mf_total: calculateCategoryTotal('mf'),
        gold_total: calculateCategoryTotal('gold'),
        pf_total: calculateCategoryTotal('pf'),
        assets_total: calculateCategoryTotal('assets')
    };

    // Update current date
    appData.current.date = date;

    saveData();
    renderAll();
    closeSnapshotModal();
}

// ===== Button Handlers =====
function initButtons() {
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('updateSnapshotBtn').addEventListener('click', openSnapshotModal);
}

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (imported.version) {
                appData = imported;
                saveData();
                renderAll();
                alert('Data imported successfully!');
            } else {
                alert('Invalid file format.');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===== Form Generation =====
function getCategoryName(category) {
    const names = {
        savings: 'Savings Account',
        fd: 'Fixed Deposit',
        ppf: 'PPF Account',
        equity: 'Equity Holding',
        mf: 'Mutual Fund',
        gold: 'Gold Bond',
        pf: 'Provident Fund',
        assets: 'Physical Asset'
    };
    return names[category] || category;
}

function getFormHTML(category, data) {
    switch (category) {
        case 'savings':
            return `
                <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" class="form-input" id="formBank" value="${data?.bank || ''}" placeholder="e.g., HDFC Bank">
                </div>
                <div class="form-group">
                    <label class="form-label">Account Name</label>
                    <input type="text" class="form-input" id="formAccountName" value="${data?.account_name || ''}" placeholder="e.g., Primary Savings">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Account Number (Last 4)</label>
                        <input type="text" class="form-input" id="formAccountNum" value="${data?.account_number_masked?.replace('xxxx', '') || ''}" placeholder="1234" maxlength="4">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Balance (₹)</label>
                        <input type="number" class="form-input" id="formBalance" value="${data?.balance || ''}" placeholder="150000">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">As Of Date</label>
                    <input type="date" class="form-input" id="formAsOfDate" value="${data?.as_of_date || new Date().toISOString().split('T')[0]}">
                </div>
            `;

        case 'fd':
            return `
                <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" class="form-input" id="formBank" value="${data?.bank || ''}" placeholder="e.g., SBI">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Principal (₹)</label>
                        <input type="number" class="form-input" id="formPrincipal" value="${data?.principal || ''}" placeholder="500000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Interest Rate (%)</label>
                        <input type="number" class="form-input" id="formRate" value="${data?.rate || ''}" placeholder="7.1" step="0.1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" class="form-input" id="formStartDate" value="${data?.start_date || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Maturity Date</label>
                        <input type="date" class="form-input" id="formMaturityDate" value="${data?.maturity_date || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Maturity Value (₹)</label>
                        <input type="number" class="form-input" id="formMaturityValue" value="${data?.maturity_value || ''}" placeholder="535500">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Current Value (₹)</label>
                        <input type="number" class="form-input" id="formCurrentValue" value="${data?.current_value || ''}" placeholder="520000">
                    </div>
                </div>
            `;

        case 'ppf':
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Account Holder</label>
                        <input type="text" class="form-input" id="formHolder" value="${data?.account_holder || ''}" placeholder="Self">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bank</label>
                        <input type="text" class="form-input" id="formBank" value="${data?.bank || ''}" placeholder="SBI">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Current Balance (₹)</label>
                        <input type="number" class="form-input" id="formBalance" value="${data?.balance || ''}" placeholder="850000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Year Contributions (₹)</label>
                        <input type="number" class="form-input" id="formContributions" value="${data?.year_contributions || ''}" placeholder="150000">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Interest Rate (%)</label>
                        <input type="number" class="form-input" id="formRate" value="${data?.interest_rate || ''}" placeholder="7.1" step="0.1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Maturity Year</label>
                        <input type="number" class="form-input" id="formMaturityYear" value="${data?.maturity_year || ''}" placeholder="2035">
                    </div>
                </div>
            `;

        case 'equity':
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Symbol</label>
                        <input type="text" class="form-input" id="formSymbol" value="${data?.symbol || ''}" placeholder="RELIANCE">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Company Name</label>
                        <input type="text" class="form-input" id="formName" value="${data?.name || ''}" placeholder="Reliance Industries">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-input" id="formQuantity" value="${data?.quantity || ''}" placeholder="10">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Average Price (₹)</label>
                        <input type="number" class="form-input" id="formAvgPrice" value="${data?.avg_price || ''}" placeholder="2450" step="0.01">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Current Price (₹)</label>
                        <input type="number" class="form-input" id="formCurrentPrice" value="${data?.current_price || ''}" placeholder="2890" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Broker</label>
                        <input type="text" class="form-input" id="formBroker" value="${data?.broker || ''}" placeholder="Zerodha">
                    </div>
                </div>
            `;

        case 'mf':
            return `
                <div class="form-group">
                    <label class="form-label">Fund Name</label>
                    <input type="text" class="form-input" id="formName" value="${data?.name || ''}" placeholder="Axis Bluechip Fund">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Folio Number</label>
                        <input type="text" class="form-input" id="formFolio" value="${data?.folio || ''}" placeholder="12345/67">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Units</label>
                        <input type="number" class="form-input" id="formUnits" value="${data?.units || ''}" placeholder="234.567" step="0.001">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">NAV (₹)</label>
                        <input type="number" class="form-input" id="formNav" value="${data?.nav || ''}" placeholder="48.50" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Invested Amount (₹)</label>
                        <input type="number" class="form-input" id="formInvested" value="${data?.invested_amount || ''}" placeholder="100000">
                    </div>
                </div>
            `;

        case 'gold':
            return `
                <div class="form-group">
                    <label class="form-label">Series</label>
                    <input type="text" class="form-input" id="formSeries" value="${data?.series || ''}" placeholder="SGB 2023-24 Series I">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Units (grams)</label>
                        <input type="number" class="form-input" id="formUnits" value="${data?.units || ''}" placeholder="2" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Issue Price (₹/gm)</label>
                        <input type="number" class="form-input" id="formIssuePrice" value="${data?.issue_price || ''}" placeholder="5926">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Current Gold Price (₹/gm)</label>
                        <input type="number" class="form-input" id="formCurrentGoldPrice" value="${data?.current_gold_price || ''}" placeholder="7200">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Interest Rate (%)</label>
                        <input type="number" class="form-input" id="formRate" value="${data?.interest_rate || ''}" placeholder="2.5" step="0.1">
                    </div>
                </div>
            `;

        case 'pf':
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <select class="form-select" id="formType">
                            <option value="EPF" ${data?.type === 'EPF' ? 'selected' : ''}>EPF</option>
                            <option value="VPF" ${data?.type === 'VPF' ? 'selected' : ''}>VPF</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">UAN (Last 4)</label>
                        <input type="text" class="form-input" id="formUan" value="${data?.uan?.replace(/x/g, '').replace(/-/g, '') || ''}" placeholder="1234" maxlength="4">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Employer</label>
                    <input type="text" class="form-input" id="formEmployer" value="${data?.employer || ''}" placeholder="Company Name">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Total Balance (₹)</label>
                        <input type="number" class="form-input" id="formBalance" value="${data?.balance || ''}" placeholder="450000">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Employee Share (₹)</label>
                        <input type="number" class="form-input" id="formEmployeeShare" value="${data?.employee_share || ''}" placeholder="220000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Employer Share (₹)</label>
                        <input type="number" class="form-input" id="formEmployerShare" value="${data?.employer_share || ''}" placeholder="230000">
                    </div>
                </div>
            `;

        case 'assets':
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <select class="form-select" id="formType">
                            <option value="property" ${data?.type === 'property' ? 'selected' : ''}>Property</option>
                            <option value="vehicle" ${data?.type === 'vehicle' ? 'selected' : ''}>Vehicle</option>
                            <option value="jewelry" ${data?.type === 'jewelry' ? 'selected' : ''}>Jewelry</option>
                            <option value="other" ${data?.type === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" id="formName" value="${data?.name || ''}" placeholder="2BHK Flat">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="formLocation" value="${data?.location || ''}" placeholder="Bangalore">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Purchase Date</label>
                        <input type="date" class="form-input" id="formPurchaseDate" value="${data?.purchase_date || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Purchase Value (₹)</label>
                        <input type="number" class="form-input" id="formPurchaseValue" value="${data?.purchase_value || ''}" placeholder="6500000">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Current Value (₹)</label>
                        <input type="number" class="form-input" id="formCurrentValue" value="${data?.current_value || ''}" placeholder="8500000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Loan Outstanding (₹)</label>
                        <input type="number" class="form-input" id="formLoan" value="${data?.loan_outstanding || ''}" placeholder="2500000">
                    </div>
                </div>
            `;

        default:
            return '<p>Form not available</p>';
    }
}

// ===== Form Saving =====
function handleModalSave() {
    const data = collectFormData(currentCategory);
    if (!data) return;

    if (currentEditId) {
        updateEntry(currentCategory, currentEditId, data);
    } else {
        addEntry(currentCategory, data);
    }

    saveData();
    renderAll();
    closeModal();
}

function collectFormData(category) {
    switch (category) {
        case 'savings':
            return {
                id: currentEditId || 'sav_' + Date.now(),
                bank: document.getElementById('formBank').value,
                account_name: document.getElementById('formAccountName').value,
                account_number_masked: 'xxxx' + document.getElementById('formAccountNum').value,
                balance: parseFloat(document.getElementById('formBalance').value) || 0,
                as_of_date: document.getElementById('formAsOfDate').value
            };

        case 'fd':
            return {
                id: currentEditId || 'fd_' + Date.now(),
                bank: document.getElementById('formBank').value,
                principal: parseFloat(document.getElementById('formPrincipal').value) || 0,
                rate: parseFloat(document.getElementById('formRate').value) || 0,
                start_date: document.getElementById('formStartDate').value,
                maturity_date: document.getElementById('formMaturityDate').value,
                maturity_value: parseFloat(document.getElementById('formMaturityValue').value) || 0,
                current_value: parseFloat(document.getElementById('formCurrentValue').value) || 0
            };

        case 'ppf':
            return {
                account_holder: document.getElementById('formHolder').value,
                bank: document.getElementById('formBank').value,
                balance: parseFloat(document.getElementById('formBalance').value) || 0,
                year_contributions: parseFloat(document.getElementById('formContributions').value) || 0,
                interest_rate: parseFloat(document.getElementById('formRate').value) || 0,
                maturity_year: parseInt(document.getElementById('formMaturityYear').value) || 0
            };

        case 'equity':
            return {
                id: currentEditId || 'eq_' + Date.now(),
                symbol: document.getElementById('formSymbol').value.toUpperCase(),
                name: document.getElementById('formName').value,
                quantity: parseInt(document.getElementById('formQuantity').value) || 0,
                avg_price: parseFloat(document.getElementById('formAvgPrice').value) || 0,
                current_price: parseFloat(document.getElementById('formCurrentPrice').value) || 0,
                broker: document.getElementById('formBroker').value
            };

        case 'mf':
            const units = parseFloat(document.getElementById('formUnits').value) || 0;
            const nav = parseFloat(document.getElementById('formNav').value) || 0;
            return {
                id: currentEditId || 'mf_' + Date.now(),
                name: document.getElementById('formName').value,
                folio: document.getElementById('formFolio').value,
                units: units,
                nav: nav,
                invested_amount: parseFloat(document.getElementById('formInvested').value) || 0,
                current_value: units * nav
            };

        case 'gold':
            return {
                id: currentEditId || 'gold_' + Date.now(),
                series: document.getElementById('formSeries').value,
                units: parseFloat(document.getElementById('formUnits').value) || 0,
                issue_price: parseFloat(document.getElementById('formIssuePrice').value) || 0,
                current_gold_price: parseFloat(document.getElementById('formCurrentGoldPrice').value) || 0,
                interest_rate: parseFloat(document.getElementById('formRate').value) || 0
            };

        case 'pf':
            return {
                type: document.getElementById('formType').value,
                uan: 'xxxx-xxxx-' + document.getElementById('formUan').value,
                employer: document.getElementById('formEmployer').value,
                balance: parseFloat(document.getElementById('formBalance').value) || 0,
                employee_share: parseFloat(document.getElementById('formEmployeeShare').value) || 0,
                employer_share: parseFloat(document.getElementById('formEmployerShare').value) || 0
            };

        case 'assets':
            return {
                id: currentEditId || 'asset_' + Date.now(),
                type: document.getElementById('formType').value,
                name: document.getElementById('formName').value,
                location: document.getElementById('formLocation').value,
                purchase_date: document.getElementById('formPurchaseDate').value,
                purchase_value: parseFloat(document.getElementById('formPurchaseValue').value) || 0,
                current_value: parseFloat(document.getElementById('formCurrentValue').value) || 0,
                loan_outstanding: parseFloat(document.getElementById('formLoan').value) || 0
            };

        default:
            return null;
    }
}

// ===== Data Operations =====
function getEntryById(category, id) {
    const mapping = {
        savings: 'savings_accounts',
        fd: 'fixed_deposits',
        equity: 'equity',
        mf: 'mutual_funds',
        gold: 'gold_bonds',
        assets: 'physical_assets'
    };

    if (category === 'ppf') return appData.ppf;
    if (category === 'pf') return appData.provident_fund;

    const key = mapping[category];
    if (key && appData[key]) {
        return appData[key].find(item => item.id === id);
    }
    return null;
}

function addEntry(category, data) {
    const mapping = {
        savings: 'savings_accounts',
        fd: 'fixed_deposits',
        equity: 'equity',
        mf: 'mutual_funds',
        gold: 'gold_bonds',
        assets: 'physical_assets'
    };

    if (category === 'ppf') {
        appData.ppf = data;
        return;
    }
    if (category === 'pf') {
        appData.provident_fund = data;
        return;
    }

    const key = mapping[category];
    if (key) {
        if (!appData[key]) appData[key] = [];
        appData[key].push(data);
    }
}

function updateEntry(category, id, data) {
    const mapping = {
        savings: 'savings_accounts',
        fd: 'fixed_deposits',
        equity: 'equity',
        mf: 'mutual_funds',
        gold: 'gold_bonds',
        assets: 'physical_assets'
    };

    if (category === 'ppf') {
        appData.ppf = data;
        return;
    }
    if (category === 'pf') {
        appData.provident_fund = data;
        return;
    }

    const key = mapping[category];
    if (key && appData[key]) {
        const index = appData[key].findIndex(item => item.id === id);
        if (index !== -1) {
            appData[key][index] = data;
        }
    }
}

function deleteEntry(category, id) {
    const mapping = {
        savings: 'savings_accounts',
        fd: 'fixed_deposits',
        equity: 'equity',
        mf: 'mutual_funds',
        gold: 'gold_bonds',
        assets: 'physical_assets'
    };

    if (category === 'ppf') {
        appData.ppf = null;
        return;
    }
    if (category === 'pf') {
        appData.provident_fund = null;
        return;
    }

    const key = mapping[category];
    if (key && appData[key]) {
        appData[key] = appData[key].filter(item => item.id !== id);
    }
}

// ===== Calculations =====
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹ 0';
    const abs = Math.abs(amount);
    let formatted;

    if (abs >= 10000000) {
        formatted = (amount / 10000000).toFixed(2) + ' Cr';
    } else if (abs >= 100000) {
        formatted = (amount / 100000).toFixed(2) + ' L';
    } else {
        formatted = amount.toLocaleString('en-IN');
    }

    return '₹ ' + formatted;
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-IN');
}

function calculateCategoryTotal(category) {
    switch (category) {
        case 'savings':
            return (appData.savings_accounts || []).reduce((sum, item) => sum + (item.balance || 0), 0);

        case 'fd':
            return (appData.fixed_deposits || []).reduce((sum, item) => sum + (item.current_value || 0), 0);

        case 'ppf':
            return appData.ppf?.balance || 0;

        case 'equity':
            return (appData.equity || []).reduce((sum, item) => sum + (item.quantity * item.current_price), 0);

        case 'mf':
            return (appData.mutual_funds || []).reduce((sum, item) => sum + (item.units * item.nav), 0);

        case 'gold':
            return (appData.gold_bonds || []).reduce((sum, item) => sum + (item.units * item.current_gold_price), 0);

        case 'pf':
            return appData.provident_fund?.balance || 0;

        case 'assets':
            return (appData.physical_assets || []).reduce((sum, item) =>
                sum + ((item.current_value || 0) - (item.loan_outstanding || 0)), 0);

        default:
            return 0;
    }
}

function calculateGroupTotal(group) {
    switch (group) {
        case 'liquid':
            return calculateCategoryTotal('savings');
        case 'fixed':
            return calculateCategoryTotal('fd') + calculateCategoryTotal('ppf') + calculateCategoryTotal('gold');
        case 'equity':
            return calculateCategoryTotal('equity') + calculateCategoryTotal('mf');
        case 'retirement':
            return calculateCategoryTotal('pf');
        case 'physical':
            return calculateCategoryTotal('assets');
        default:
            return 0;
    }
}

function calculatePreviousGroupTotal(group) {
    if (!appData.previous) return 0;

    switch (group) {
        case 'liquid':
            return appData.previous.savings_total || 0;
        case 'fixed':
            return (appData.previous.fd_total || 0) + (appData.previous.ppf_total || 0) + (appData.previous.gold_total || 0);
        case 'equity':
            return (appData.previous.equity_total || 0) + (appData.previous.mf_total || 0);
        case 'retirement':
            return appData.previous.pf_total || 0;
        case 'physical':
            return appData.previous.assets_total || 0;
        default:
            return 0;
    }
}

function calculateTotalNetWorth() {
    return calculateGroupTotal('liquid') +
           calculateGroupTotal('fixed') +
           calculateGroupTotal('equity') +
           calculateGroupTotal('retirement') +
           calculateGroupTotal('physical');
}

// ===== Rendering =====
function renderAll() {
    renderSummary();
    renderSavings();
    renderFD();
    renderPPF();
    renderEquity();
    renderMF();
    renderGold();
    renderPF();
    renderAssets();
}

function renderSummary() {
    const total = calculateTotalNetWorth();
    const prevTotal = appData.previous?.total_value || 0;
    const delta = total - prevTotal;
    const deltaPct = prevTotal > 0 ? (delta / prevTotal * 100) : 0;

    document.getElementById('totalNetWorth').textContent = formatCurrency(total);

    const deltaEl = document.getElementById('totalDelta');
    const sign = delta >= 0 ? '+' : '';
    deltaEl.textContent = `${sign}${formatCurrency(delta)} (${sign}${deltaPct.toFixed(1)}%)`;
    deltaEl.className = 'net-worth-delta' + (delta < 0 ? ' negative' : '');

    document.getElementById('previousDate').textContent = appData.previous?.date || '--';

    // Render group totals
    const groups = ['liquid', 'fixed', 'equity', 'retirement', 'physical'];
    groups.forEach(group => {
        const current = calculateGroupTotal(group);
        const previous = calculatePreviousGroupTotal(group);
        const change = current - previous;

        document.getElementById(`${group}Current`).textContent = formatCurrency(current);
        document.getElementById(`${group}Previous`).textContent = formatCurrency(previous);

        const changeEl = document.getElementById(`${group}Change`);
        const changeSign = change >= 0 ? '+' : '';
        changeEl.textContent = changeSign + formatCurrency(change);
        changeEl.className = 'col-change' + (change < 0 ? ' negative' : '');
    });
}

function renderSavings() {
    const tbody = document.getElementById('savingsTableBody');
    const accounts = appData.savings_accounts || [];
    const total = calculateCategoryTotal('savings');

    document.getElementById('savingsTotal').textContent = formatCurrency(total);

    if (accounts.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No savings accounts added</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(acc => `
        <tr>
            <td>${acc.bank}</td>
            <td>${acc.account_name}</td>
            <td class="text-muted">${acc.account_number_masked}</td>
            <td class="text-right">${formatCurrency(acc.balance)}</td>
            <td class="text-muted">${acc.as_of_date}</td>
            <td class="actions-col">
                <button class="action-btn" onclick="openModal('savings', '${acc.id}')">Edit</button>
                <button class="action-btn delete" onclick="confirmDelete('savings', '${acc.id}')">Del</button>
            </td>
        </tr>
    `).join('');
}

function renderFD() {
    const tbody = document.getElementById('fdTableBody');
    const fds = appData.fixed_deposits || [];
    const total = calculateCategoryTotal('fd');

    document.getElementById('fdTotal').textContent = formatCurrency(total);

    if (fds.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No fixed deposits added</td></tr>';
        return;
    }

    tbody.innerHTML = fds.map(fd => `
        <tr>
            <td>${fd.bank}</td>
            <td class="text-right">${formatCurrency(fd.principal)}</td>
            <td class="text-right">${fd.rate}%</td>
            <td class="text-muted">${fd.start_date}</td>
            <td class="text-muted">${fd.maturity_date}</td>
            <td class="text-right">${formatCurrency(fd.current_value)}</td>
            <td class="actions-col">
                <button class="action-btn" onclick="openModal('fd', '${fd.id}')">Edit</button>
                <button class="action-btn delete" onclick="confirmDelete('fd', '${fd.id}')">Del</button>
            </td>
        </tr>
    `).join('');
}

function renderPPF() {
    const container = document.getElementById('ppfDetails');
    const ppf = appData.ppf;
    const addBtn = document.getElementById('ppfAddBtn');

    if (!ppf) {
        container.innerHTML = '<div class="ppf-empty">No PPF account added</div>';
        addBtn.innerHTML = '<span class="prompt">&gt;</span> Add PPF account...';
        return;
    }

    addBtn.innerHTML = '<span class="prompt">&gt;</span> Edit PPF account...';

    container.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Balance</span>
                <span class="detail-value large">${formatCurrency(ppf.balance)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Account Holder</span>
                <span class="detail-value">${ppf.account_holder}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Bank</span>
                <span class="detail-value">${ppf.bank}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Year Contributions</span>
                <span class="detail-value">${formatCurrency(ppf.year_contributions)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Interest Rate</span>
                <span class="detail-value">${ppf.interest_rate}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Maturity Year</span>
                <span class="detail-value">${ppf.maturity_year}</span>
            </div>
        </div>
        <div style="margin-top: 16px; text-align: right;">
            <button class="action-btn delete" onclick="confirmDelete('ppf')">Delete PPF Account</button>
        </div>
    `;
}

function renderEquity() {
    const tbody = document.getElementById('equityTableBody');
    const tfoot = document.getElementById('equityTableFoot');
    const holdings = appData.equity || [];
    const total = calculateCategoryTotal('equity');

    document.getElementById('equityTotal').textContent = formatCurrency(total);

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No equity holdings added</td></tr>';
        tfoot.style.display = 'none';
        return;
    }

    let totalInvested = 0;
    let totalCurrent = 0;

    tbody.innerHTML = holdings.map(eq => {
        const invested = eq.quantity * eq.avg_price;
        const current = eq.quantity * eq.current_price;
        const pnl = current - invested;
        const pnlPct = invested > 0 ? (pnl / invested * 100) : 0;

        totalInvested += invested;
        totalCurrent += current;

        const pnlClass = pnl >= 0 ? 'positive' : 'negative';
        const sign = pnl >= 0 ? '+' : '';

        return `
            <tr>
                <td><strong>${eq.symbol}</strong></td>
                <td class="text-muted">${eq.name}</td>
                <td class="text-right">${eq.quantity}</td>
                <td class="text-right">${formatNumber(eq.avg_price)}</td>
                <td class="text-right">${formatNumber(eq.current_price)}</td>
                <td class="text-right ${pnlClass}">${sign}${formatNumber(Math.round(pnl))}</td>
                <td class="text-right ${pnlClass}">${sign}${pnlPct.toFixed(1)}%</td>
                <td class="actions-col">
                    <button class="action-btn" onclick="openModal('equity', '${eq.id}')">Edit</button>
                    <button class="action-btn delete" onclick="confirmDelete('equity', '${eq.id}')">Del</button>
                </td>
            </tr>
        `;
    }).join('');

    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested * 100) : 0;
    const totalPnlClass = totalPnl >= 0 ? 'positive' : 'negative';
    const totalSign = totalPnl >= 0 ? '+' : '';

    document.getElementById('equityInvested').textContent = formatNumber(Math.round(totalInvested));
    document.getElementById('equityCurrentVal').textContent = formatNumber(Math.round(totalCurrent));
    document.getElementById('equityPnL').textContent = totalSign + formatNumber(Math.round(totalPnl));
    document.getElementById('equityPnL').className = 'text-right ' + totalPnlClass;
    document.getElementById('equityPnLPct').textContent = totalSign + totalPnlPct.toFixed(1) + '%';
    document.getElementById('equityPnLPct').className = 'text-right ' + totalPnlClass;

    tfoot.style.display = 'table-footer-group';
}

function renderMF() {
    const tbody = document.getElementById('mfTableBody');
    const funds = appData.mutual_funds || [];
    const total = calculateCategoryTotal('mf');

    document.getElementById('mfTotal').textContent = formatCurrency(total);

    if (funds.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No mutual funds added</td></tr>';
        return;
    }

    tbody.innerHTML = funds.map(mf => {
        const currentValue = mf.units * mf.nav;
        const gain = currentValue - mf.invested_amount;
        const gainPct = mf.invested_amount > 0 ? (gain / mf.invested_amount * 100) : 0;
        const gainClass = gain >= 0 ? 'positive' : 'negative';
        const sign = gain >= 0 ? '+' : '';

        return `
            <tr>
                <td>${mf.name}</td>
                <td class="text-muted">${mf.folio}</td>
                <td class="text-right">${mf.units.toFixed(3)}</td>
                <td class="text-right">${mf.nav.toFixed(2)}</td>
                <td class="text-right">${formatCurrency(mf.invested_amount)}</td>
                <td class="text-right">${formatCurrency(currentValue)}</td>
                <td class="text-right ${gainClass}">${sign}${gainPct.toFixed(1)}%</td>
                <td class="actions-col">
                    <button class="action-btn" onclick="openModal('mf', '${mf.id}')">Edit</button>
                    <button class="action-btn delete" onclick="confirmDelete('mf', '${mf.id}')">Del</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderGold() {
    const tbody = document.getElementById('goldTableBody');
    const bonds = appData.gold_bonds || [];
    const total = calculateCategoryTotal('gold');

    document.getElementById('goldTotal').textContent = formatCurrency(total);

    if (bonds.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No gold bonds added</td></tr>';
        return;
    }

    tbody.innerHTML = bonds.map(bond => {
        const currentValue = bond.units * bond.current_gold_price;

        return `
            <tr>
                <td>${bond.series}</td>
                <td class="text-right">${bond.units}</td>
                <td class="text-right">${formatNumber(bond.issue_price)}</td>
                <td class="text-right">${formatNumber(bond.current_gold_price)}</td>
                <td class="text-right">${bond.interest_rate}%</td>
                <td class="text-right">${formatCurrency(currentValue)}</td>
                <td class="actions-col">
                    <button class="action-btn" onclick="openModal('gold', '${bond.id}')">Edit</button>
                    <button class="action-btn delete" onclick="confirmDelete('gold', '${bond.id}')">Del</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPF() {
    const container = document.getElementById('pfDetails');
    const pf = appData.provident_fund;
    const addBtn = document.getElementById('pfAddBtn');

    if (!pf) {
        container.innerHTML = '<div class="pf-empty">No PF account added</div>';
        addBtn.innerHTML = '<span class="prompt">&gt;</span> Add PF account...';
        return;
    }

    addBtn.innerHTML = '<span class="prompt">&gt;</span> Edit PF account...';

    container.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">Total Balance</span>
                <span class="detail-value large">${formatCurrency(pf.balance)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${pf.type}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">UAN</span>
                <span class="detail-value">${pf.uan}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Employer</span>
                <span class="detail-value">${pf.employer}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Employee Share</span>
                <span class="detail-value">${formatCurrency(pf.employee_share)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Employer Share</span>
                <span class="detail-value">${formatCurrency(pf.employer_share)}</span>
            </div>
        </div>
        <div style="margin-top: 16px; text-align: right;">
            <button class="action-btn delete" onclick="confirmDelete('pf')">Delete PF Account</button>
        </div>
    `;
}

function renderAssets() {
    const tbody = document.getElementById('assetsTableBody');
    const assets = appData.physical_assets || [];
    const total = calculateCategoryTotal('assets');

    document.getElementById('assetsTotal').textContent = formatCurrency(total);

    if (assets.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No physical assets added</td></tr>';
        return;
    }

    tbody.innerHTML = assets.map(asset => {
        const netValue = asset.current_value - (asset.loan_outstanding || 0);
        const typeLabels = {
            property: 'Property',
            vehicle: 'Vehicle',
            jewelry: 'Jewelry',
            other: 'Other'
        };

        return `
            <tr>
                <td>${typeLabels[asset.type] || asset.type}</td>
                <td>${asset.name}</td>
                <td class="text-muted">${asset.location || '-'}</td>
                <td class="text-right">${formatCurrency(asset.purchase_value)}</td>
                <td class="text-right">${formatCurrency(asset.current_value)}</td>
                <td class="text-right ${asset.loan_outstanding ? 'negative' : ''}">${asset.loan_outstanding ? formatCurrency(asset.loan_outstanding) : '-'}</td>
                <td class="text-right">${formatCurrency(netValue)}</td>
                <td class="actions-col">
                    <button class="action-btn" onclick="openModal('assets', '${asset.id}')">Edit</button>
                    <button class="action-btn delete" onclick="confirmDelete('assets', '${asset.id}')">Del</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== Delete Confirmation =====
function confirmDelete(category, id) {
    const name = getCategoryName(category);
    openConfirmModal(`Are you sure you want to delete this ${name.toLowerCase()}?`, () => {
        deleteEntry(category, id);
        saveData();
        renderAll();
    });
}

// Make functions globally available for onclick handlers
window.openModal = openModal;
window.confirmDelete = confirmDelete;
