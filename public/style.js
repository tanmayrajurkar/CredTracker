// Remove duplicate Supabase initialization
let categories = []
let baskets = []
let changes = { categories: {}, baskets: {}, newCategories: [], newBaskets: [], deletedCategories: [], deletedBaskets: [] }
let userProfile = null;
let openDetailRows = new Set(); // Store IDs of categories with open detail rows

// Landing UI elements
const landingContainer = document.getElementById('landing-container');

// Function to save current input values within a given scope
function saveInputStates(scope = document) {
  const inputStates = new Map(); // Using a Map for compound keys
  scope.querySelectorAll('.editable-input').forEach(input => {
    // Create a unique key for each input based on its data attributes
    const key = `${input.dataset.type}-${input.dataset.id}-${input.dataset.field}`;
    inputStates.set(key, input.value);
  });
  return inputStates;
}

// Function to restore input values within a given scope
function restoreInputStates(inputStates, scope = document) {
  scope.querySelectorAll('.editable-input').forEach(input => {
    const key = `${input.dataset.type}-${input.dataset.id}-${input.dataset.field}`;
    if (inputStates.has(key)) {
      input.value = inputStates.get(key);
    }
  });
}

// Listen for auth state changes
window.addEventListener('authStateChanged', async (event) => {
    const { event: authEvent, session } = event.detail;
    
    if (authEvent === 'SIGNED_IN' || authEvent === 'TOKEN_REFRESHED') {
        // Load user profile first
        await loadUserProfile();
        
        // Then check onboarding status
        if (userProfile && userProfile.onboarding_complete) {
            showAppView();
        } else {
            showOnboardingView();
        }
    } else if (authEvent === 'SIGNED_OUT') {
        userProfile = null;
        showLandingView(); // Show landing page instead of auth view
    }
});

const mainTableContainer = document.getElementById('main-table-container')
const saveBtn = document.getElementById('save-btn')

// Auth UI elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const resetForm = document.getElementById('reset-form');
const authForm = document.getElementById('auth-form');
const resetBtn = document.getElementById('reset-btn');
const backToLoginBtn = document.getElementById('back-to-login-btn');
const resetEmail = document.getElementById('reset-email');
const resetMessage = document.getElementById('reset-message');

// Onboarding UI elements
const onboardingContainer = document.getElementById('onboarding-container');
const onboardingStep1 = document.getElementById('onboarding-step-1');
const onboardingStep2 = document.getElementById('onboarding-step-2');
const onboardingStep3 = document.getElementById('onboarding-step-3');
const onboardingNameInput = document.getElementById('onboarding-name');
const onboardingCreditsInput = document.getElementById('onboarding-credits');
const onboardingNext1Btn = document.getElementById('onboarding-next-1');
const onboardingNext2Btn = document.getElementById('onboarding-next-2');
const onboardingConfirmBtn = document.getElementById('onboarding-confirm-btn');
const confirmNameSpan = document.getElementById('confirm-name');
const confirmCreditsSpan = document.getElementById('confirm-credits');

// Profile & Navigation UI elements
const profileIconBtn = document.getElementById('profile-icon-btn');
const profilePopover = document.getElementById('profile-popover');
const profileNameDisplay = document.getElementById('profile-name');
const profileEmailDisplay = document.getElementById('profile-email');
const profileCreditsDisplay = document.getElementById('profile-display-credits');
const editProfilePageBtn = document.getElementById('edit-profile-page-btn');
const mainContentView = document.getElementById('main-content-view');
const editProfileView = document.getElementById('edit-profile-view');
const editProfileNameInput = document.getElementById('edit-profile-name');
const editProfileTotalCreditsInput = document.getElementById('edit-profile-total-credits');
const saveEditedProfileBtn = document.getElementById('save-edited-profile-btn');
const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
const editProfileMessage = document.getElementById('edit-profile-message');
const newPasswordInput = document.getElementById('new-password');
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordMessage = document.getElementById('change-password-message');

const homeBtn = document.getElementById('home-btn');

function showTooltip(infoIconElement, floatingTooltipElement) {
  const totalCreditsSum = categories.reduce((sum, cat) => sum + (parseFloat(cat.total_credits) || 0), 0);
  const userTotalCreditsToComplete = userProfile ? (userProfile.total_credits_to_complete || 0) : 0;

  let dynamicTooltipMessage = "Complete the table as all credits are not listed - total doesn't match"; // Default message
  if (totalCreditsSum > userTotalCreditsToComplete) {
    dynamicTooltipMessage = `Your total credits (${totalCreditsSum}) are more than the required credits to complete (${userTotalCreditsToComplete}).`;
  } else if (totalCreditsSum < userTotalCreditsToComplete) {
    dynamicTooltipMessage = `Your total credits (${totalCreditsSum}) are less than the required credits to complete (${userTotalCreditsToComplete}).`;
  } else {
    dynamicTooltipMessage = `Your total credits (${totalCreditsSum}) match the required credits to complete (${userTotalCreditsToComplete}).`;
  }

  console.log('showTooltip: Dynamic Tooltip Message:', dynamicTooltipMessage);
  floatingTooltipElement.textContent = dynamicTooltipMessage;
  console.log('showTooltip: Floating Tooltip Text Content after assignment:', floatingTooltipElement.textContent);
  console.log('showTooltip: Adding visible class to tooltip.');

  // Get dimensions and position it
  const rect = infoIconElement.getBoundingClientRect();

  // Ensure it's displayed as block for offsetWidth/offsetHeight to work
  floatingTooltipElement.style.display = 'block'; 
  floatingTooltipElement.style.visibility = 'hidden'; // Hide temporarily for measurement

  // Wait for a frame to ensure reflow after display block
  requestAnimationFrame(() => {
    const tooltipWidth = floatingTooltipElement.offsetWidth;
    const tooltipHeight = floatingTooltipElement.offsetHeight;

    floatingTooltipElement.style.left = (rect.left + rect.width / 2 - tooltipWidth / 2) + 'px';
    floatingTooltipElement.style.top = (rect.top - tooltipHeight - 12) + 'px'; // 12px margin
    floatingTooltipElement.classList.add('visible');
    floatingTooltipElement.style.visibility = 'visible'; // Finally make visible
  });
}

function hideTooltip(floatingTooltipElement) {
  console.log('hideTooltip: Removing visible class from tooltip.');
  floatingTooltipElement.classList.remove('visible');
}

// Renamed this function to be more explicit about its purpose
function setupGlobalTooltipListeners() {
  // Query elements inside this function to ensure they are current after DOM updates
  const infoIcon = document.getElementById('total-tooltip-trigger');
  const floatingTooltip = document.getElementById('floating-tooltip');

  if (infoIcon && floatingTooltip) {
    // Use arrow functions to correctly capture `infoIcon` and `floatingTooltip`
    infoIcon.addEventListener('mouseenter', () => showTooltip(infoIcon, floatingTooltip));
    infoIcon.addEventListener('focus', () => showTooltip(infoIcon, floatingTooltip));
    infoIcon.addEventListener('mouseleave', () => hideTooltip(floatingTooltip));
    infoIcon.addEventListener('blur', () => hideTooltip(floatingTooltip));
    infoIcon.addEventListener('click', function(e) {
      if (floatingTooltip.classList.contains('visible')) {
        hideTooltip(floatingTooltip);
      } else {
        showTooltip(infoIcon, floatingTooltip);
      }
      e.stopPropagation();
    });
    document.addEventListener('click', function(e) {
      if (!infoIcon.contains(e.target) && !floatingTooltip.contains(e.target)) {
        hideTooltip(floatingTooltip);
      }
    });
  } else {
    console.warn("Info icon or floating tooltip not found for event listeners setup.");
  }
}

loginBtn.onclick = async () => {
    loginBtn.disabled = signupBtn.disabled = true;
    authMessage.textContent = '';
    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value
        });
        if (error) {
            if (error.message.includes('CORS')) {
                authMessage.textContent = 'Connection error: Please ensure you are accessing the site from the correct domain (credtracker.netlify.app) and try again. If the problem persists, please contact support.';
                console.error('CORS error during login:', error);
            } else {
                authMessage.textContent = error.message;
            }
        } else {
            await checkSession();
        }
    } catch (err) {
        console.error('Login error:', err);
        if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
            authMessage.textContent = 'Unable to connect to the server. Please ensure you are accessing the site from the correct domain (credtracker.netlify.app) and try again. If the problem persists, please contact support.';
        } else {
            authMessage.textContent = 'An error occurred during login. Please try again.';
        }
    } finally {
        loginBtn.disabled = signupBtn.disabled = false;
    }
};

signupBtn.onclick = async () => {
    loginBtn.disabled = signupBtn.disabled = true;
    authMessage.textContent = '';
    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: emailInput.value,
            password: passwordInput.value
        });
        if (error) {
            authMessage.textContent = error.message;
        } else {
            authMessage.textContent = 'Check your email for a confirmation link!';
            if (data && data.user) {
                await createOrUpdateUserProfile(data.user.id, { onboarding_complete: false, name: '' });
            }
        }
    } catch (err) {
        authMessage.textContent = 'An error occurred during signup. Please try again.';
        console.error('Signup error:', err);
    } finally {
        loginBtn.disabled = signupBtn.disabled = false;
    }
};

// View Management Functions
function showAuthView() {
  landingContainer.style.display = 'none';
  authContainer.style.display = 'flex';
  onboardingContainer.style.display = 'none';
  appContainer.style.display = 'none';
  profilePopover.style.display = 'none';
  editProfileView.style.display = 'none';
}

function showOnboardingView() {
  landingContainer.style.display = 'none';
  authContainer.style.display = 'none';
  onboardingContainer.style.display = 'flex';
  appContainer.style.display = 'none';
  profilePopover.style.display = 'none';
  editProfileView.style.display = 'none';
  showOnboardingStep(1);
}

function showAppView() {
  landingContainer.style.display = 'none';
  authContainer.style.display = 'none';
  onboardingContainer.style.display = 'none';
  appContainer.style.display = 'block';
  mainContentView.style.display = 'block';
  editProfileView.style.display = 'none';
  profilePopover.style.display = 'none';
  
  // Re-enable profile icon in main view
  if (profileIconBtn) {
    profileIconBtn.style.opacity = '1';
    profileIconBtn.style.pointerEvents = 'auto';
  }
  
  fetchData();
  updateProfileUI();
}

function showEditProfileView() {
  mainContentView.style.display = 'none';
  profilePopover.style.display = 'none';
  editProfileView.style.display = 'block';
  
  // Disable profile icon in edit view
  if (profileIconBtn) {
    profileIconBtn.style.opacity = '0.5';
    profileIconBtn.style.pointerEvents = 'none';
  }
  
  // Populate edit form fields
  editProfileNameInput.value = userProfile.name || '';
  editProfileTotalCreditsInput.value = userProfile.total_credits_to_complete || '';
  changePasswordMessage.textContent = '';
  newPasswordInput.value = '';
  editProfileMessage.textContent = '';
}

// Profile & User Data Management
function updateProfileUI() {
  if (window.currentUser) {
    profileEmailDisplay.textContent = window.currentUser.email;
    profileNameDisplay.textContent = userProfile ? userProfile.name : '';
    profileCreditsDisplay.textContent = userProfile ? (userProfile.total_credits_to_complete || '0') : '0';
  } else {
    profileEmailDisplay.textContent = '';
    profileNameDisplay.textContent = '';
    profileCreditsDisplay.textContent = '';
  }
}

async function loadUserProfile() {
  if (!window.currentUser) return;
  const { data, error } = await window.supabaseClient
    .from('user_profiles')
    .select('name, total_credits_to_complete, onboarding_complete')
    .eq('id', window.currentUser.id)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error("Error loading user profile:", error);
    userProfile = null;
  } else {
    userProfile = data || { name: '', total_credits_to_complete: 0, onboarding_complete: false };
  }
}

async function createOrUpdateUserProfile(userId, data) {
  const { error } = await window.supabaseClient
    .from('user_profiles')
    .upsert({ id: userId, ...data });
  if (error) {
    console.error("Error upserting user profile:", error);
    return false;
  }
  await loadUserProfile();
  return true;
}

// Event Listeners
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    try {
      // Clear local state first
      window.currentUser = null;
      userProfile = null;
      
      // Clear all auth-related data from localStorage
      const supabaseUrl = window.config.SUPABASE_URL;
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
      
      // Sign out from Supabase
      await window.supabaseClient.auth.signOut();
      
      // Force show landing view immediately
      showLandingView();
      
      // Force reload the page to clear any remaining state
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
}

if (forgotPasswordLink) {
  forgotPasswordLink.onclick = () => {
    authForm.style.display = 'none';
    resetForm.style.display = 'block';
    resetMessage.textContent = '';
    resetEmail.value = '';
  };
}
if (backToLoginBtn) {
  backToLoginBtn.onclick = () => {
    authForm.style.display = 'block';
    resetForm.style.display = 'none';
    authMessage.textContent = '';
  };
}
if (resetBtn) {
  resetBtn.onclick = async () => {
    resetBtn.disabled = true;
    resetMessage.textContent = '';
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(resetEmail.value);
    if (error) {
      resetMessage.textContent = error.message;
    } else {
      resetMessage.textContent = 'Password reset email sent! Check your inbox.';
    }
    resetBtn.disabled = false;
  };
}

// Home Button Logic
if (homeBtn) {
  homeBtn.onclick = () => {
    showAppView();
  };
}

// Profile Icon (toggle popover) - Modified to check if we're in edit view
if (profileIconBtn) {
  profileIconBtn.onclick = (e) => {
    // Only toggle if we're not in edit view
    if (editProfileView.style.display !== 'block') {
      profilePopover.style.display = profilePopover.style.display === 'none' ? 'flex' : 'none';
      e.stopPropagation();
    }
  };
}

document.addEventListener('click', (e) => {
  if (profilePopover && profilePopover.style.display !== 'none' && !profilePopover.contains(e.target) && !profileIconBtn.contains(e.target)) {
    profilePopover.style.display = 'none';
  }
});

// Edit Profile Page Logic
if (editProfilePageBtn) {
  editProfilePageBtn.onclick = () => {
    showEditProfileView();
  };
}

if (cancelEditProfileBtn) {
  cancelEditProfileBtn.onclick = () => {
    showAppView();
  };
}

if (saveEditedProfileBtn) {
  saveEditedProfileBtn.onclick = async () => {
    saveEditedProfileBtn.disabled = true;
    editProfileMessage.textContent = '';
    const name = editProfileNameInput.value.trim();
    const totalCredits = parseInt(editProfileTotalCreditsInput.value) || 0;

    const updatedData = {
      name: name,
      total_credits_to_complete: totalCredits,
    };

    const success = await createOrUpdateUserProfile(window.currentUser.id, updatedData);
    if (success) {
      editProfileMessage.textContent = 'Profile updated successfully!';
      setTimeout(() => {
        showAppView();
      }, 1000);
    } else {
      editProfileMessage.textContent = 'Failed to update profile.';
    }
    saveEditedProfileBtn.disabled = false;
  };
}

// Change Password Logic (now within Edit Profile View)
if (changePasswordBtn) {
  changePasswordBtn.onclick = async () => {
    changePasswordBtn.disabled = true;
    changePasswordMessage.textContent = '';
    const newPassword = newPasswordInput.value;
    if (newPassword.length < 6) {
        changePasswordMessage.textContent = 'Password must be at least 6 characters.';
        changePasswordBtn.disabled = false;
        return;
    }
    const { error: passwordError } = await window.supabaseClient.auth.updateUser({ password: newPassword });
    if (passwordError) {
      changePasswordMessage.textContent = `Error updating password: ${passwordError.message}`;
      return;
    }
    changePasswordMessage.textContent = 'Password updated successfully!';
    newPasswordInput.value = '';
    changePasswordBtn.disabled = false;
  };
}

// Onboarding Logic
function showOnboardingStep(step) {
  onboardingStep1.style.display = 'none';
  onboardingStep2.style.display = 'none';
  onboardingStep3.style.display = 'none';
  if (step === 1) {
    onboardingStep1.style.display = 'flex';
    onboardingNameInput.focus();
  } else if (step === 2) {
    onboardingStep2.style.display = 'flex';
    onboardingCreditsInput.focus();
  } else if (step === 3) {
    onboardingStep3.style.display = 'flex';
    confirmNameSpan.textContent = onboardingNameInput.value;
    confirmCreditsSpan.textContent = onboardingCreditsInput.value;
  }
}

onboardingNext1Btn.onclick = () => {
  if (onboardingNameInput.value.trim() === '') {
    alert('Please enter your name.');
    return;
  }
  showOnboardingStep(2);
};

onboardingNext2Btn.onclick = () => {
  const credits = parseInt(onboardingCreditsInput.value);
  if (isNaN(credits) || credits < 0) {
    alert('Please enter a valid number for credits.');
    return;
  }
  showOnboardingStep(3);
};

onboardingConfirmBtn.onclick = async () => {
  onboardingConfirmBtn.disabled = true;
  const name = onboardingNameInput.value.trim();
  const totalCredits = parseInt(onboardingCreditsInput.value) || 0;

  const updatedData = {
    name: name,
    total_credits_to_complete: totalCredits,
    onboarding_complete: true,
  };
  const success = await createOrUpdateUserProfile(window.currentUser.id, updatedData);

  if (success) {
    // Create default categories for the new user
    const categoriesCreated = await createDefaultCategories(window.currentUser.id);
    if (categoriesCreated) {
      await checkSession();
    } else {
      alert("Failed to create default categories. Please try again.");
    }
  } else {
    alert("Failed to complete onboarding. Please try again.");
  }
  onboardingConfirmBtn.disabled = false;
};

// Add a helper to ensure all IDs are strings
function ensureStringIds(arr) {
  return arr.map(item => {
    const newItem = { ...item };
    if (newItem.id !== undefined) newItem.id = String(newItem.id);
    if (newItem.category_id !== undefined) newItem.category_id = String(newItem.category_id);
    return newItem;
  });
}

async function fetchData() {
  console.log("Fetching categories...");
  // Fetch categories for the current user
  const { data: catData, error: catError } = await window.supabaseClient
    .from('credit_categories')
    .select('*')
    .eq('user_id', window.currentUser.id)
    .order('sl_no');
  
  if (catError) {
    console.error("Error fetching categories:", catError);
    throw new Error(`Failed to fetch categories: ${catError.message}`);
  }
  
  categories = ensureStringIds(catData || []);
  console.log("Fetched categories:", categories);

  // Fetch baskets for the current user
  let baskData = [];
  if (window.currentUser) {
    console.log("Fetching user-specific baskets for user:", window.currentUser.id);
    const { data: userBaskData, error: baskError } = await window.supabaseClient
      .from('credit_baskets')
      .select('*')
      .eq('user_id', window.currentUser.id);
    
    if (baskError) {
      console.error("Error fetching baskets:", baskError);
      throw new Error(`Failed to fetch baskets: ${baskError.message}`);
    }
    
    baskData = ensureStringIds(userBaskData || []);
  }
  baskets = baskData;
  console.log("Fetched baskets:", baskets);

  // Clear any existing changes
  changes = { categories: {}, baskets: {}, newCategories: [], newBaskets: [], deletedCategories: [], deletedBaskets: [] };
  
  renderMainTable();
}

// Render Main Table Function (existing, ensure it creates the elements dynamically)
function renderMainTable(initialOpenStates = null) {
  const currentInputStates = saveInputStates(); // Save input states before clearing
  const statesToUseForRendering = initialOpenStates ? initialOpenStates : new Set(openDetailRows); // Use passed states or global snapshot
  console.log('Inside renderMainTable, statesToUseForRendering:', Array.from(statesToUseForRendering));

  mainTableContainer.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'credits-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Sl.No.</th>
        <th>Category</th>
        <th>Total Credits</th>
        <th>Earned Credits</th>
        <th>Remaining Credits</th>
        <th>View</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  // Render category rows
  categories.forEach((cat) => {
    // Calculate earned credits for this category
    const categoryEarnedCredits = baskets
      .filter(b => b.category_id === cat.id)
      .reduce((sum, basket) => sum + (parseFloat(basket.earned_credits) || 0), 0);

    // Calculate remaining credits for this category
    const remainingCredits = (parseFloat(cat.total_credits) || 0) - categoryEarnedCredits;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="editable-input" type="number" value="${cat.sl_no ?? ''}" data-type="category" data-id="${cat.id}" data-field="sl_no"></td>
      <td><input class="editable-input" type="text" value="${cat.category ?? ''}" data-type="category" data-id="${cat.id}" data-field="category"></td>
      <td><input class="editable-input" type="number" value="${cat.total_credits ?? ''}" data-type="category" data-id="${cat.id}" data-field="total_credits"></td>
      <td style="font-weight:600;">${categoryEarnedCredits}</td>
      <td style="font-weight:600;">${remainingCredits}</td>
      <td><button class="view-btn" data-toggle="${cat.id}">${statesToUseForRendering.has(String(cat.id)) ? '-' : '+'}</button></td>
      <td><button class="delete-row-btn" data-delete="category" data-id="${cat.id}">Delete</button></td>
    `;
    tbody.appendChild(tr);

    // Details row
    const detailsTr = document.createElement('tr');
    detailsTr.id = `details-row-${cat.id}`;
    const shouldBeOpen = statesToUseForRendering.has(String(cat.id));
    console.log(`Category ID: ${cat.id}, Should be open: ${shouldBeOpen}`);
    detailsTr.style.display = shouldBeOpen ? '' : 'none';
    const detailsTd = document.createElement('td');
    detailsTd.colSpan = 7;
    detailsTd.innerHTML = renderDetailsTable(cat.id);
    detailsTr.appendChild(detailsTd);
    tbody.appendChild(detailsTr);
  });

  // Calculate and add total row
  const totalCreditsSum = categories.reduce((sum, cat) => sum + (parseFloat(cat.total_credits) || 0), 0);
  const totalEarnedSum = baskets.reduce((sum, basket) => sum + (parseFloat(basket.earned_credits) || 0), 0);

  const userTotalCreditsToComplete = userProfile ? (userProfile.total_credits_to_complete || 0) : 0;
  const isMismatch = totalCreditsSum !== Number(userTotalCreditsToComplete);

  const totalTr = document.createElement('tr');
  totalTr.innerHTML = `
    <td colspan="2" style="font-weight:600;">Total Credits</td>
    <td class="total-credits-cell${isMismatch ? ' mismatch' : ''}">
      ${totalCreditsSum} ${isMismatch ? `<div class="info-icon" tabindex="0" id="total-tooltip-trigger">i</div>` : ''}
    </td>
    <td colspan="5" style="font-weight:600;">To Complete: ${userTotalCreditsToComplete}</td>
  `;

  // Add earned credits row
  const earnedTr = document.createElement('tr');
  earnedTr.innerHTML = `
    <td colspan="2" style="font-weight:600;">Total Earned Credits</td>
    <td style="font-weight:600;">${totalEarnedSum}</td>
    <td colspan="5" style="font-weight:600;">Remaining: ${userTotalCreditsToComplete - totalEarnedSum}</td>
  `;

  tbody.appendChild(totalTr);
  tbody.appendChild(earnedTr);

  // Add category button row
  const addCatTr = document.createElement('tr');
  addCatTr.innerHTML = `<td colspan="7"><button class="add-row-btn" id="add-category-btn">+ Add Category</button></td>`;
  tbody.appendChild(addCatTr);

  mainTableContainer.appendChild(table);

  // Defer restoring states and attaching listeners
  requestAnimationFrame(() => {
    restoreInputStates(currentInputStates);
    addMainTableListeners();
    setupGlobalTooltipListeners();
  });
}

// Render Details Table Function (existing)
function renderDetailsTable(categoryId) {
  // categoryId passed here can be a number or string depending on source
  const catIdString = String(categoryId);
  const cat = categories.find(c => c.id === catIdString); // c.id is now guaranteed string
  let heading = cat ? `${cat.category} Credits Distribution` : 'Credits Distribution';
  const catBaskets = baskets.filter(b => b.category_id === catIdString); // b.category_id is now guaranteed string
  let html = `<div class="details-container">
    <h2 class="details-heading">${heading}</h2>
    <table class="details-table">
      <thead>
        <tr>
          <th>Basket Name</th>
          <th>Minimum Credits</th>
          <th>Earned Credits</th>
          <th>Remaining Credits</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
  `;
  catBaskets.forEach(basket => {
    // Calculate remaining credits directly
    const calculatedRemaining = (parseFloat(basket.min_credits) || 0) - (parseFloat(basket.earned_credits) || 0);
    html += `<tr>
      <td><input class="editable-input" type="text" value="${basket.basket_name ?? ''}" data-type="basket" data-id="${basket.id}" data-field="basket_name"></td>
      <td><input class="editable-input" type="number" value="${basket.min_credits ?? ''}" data-type="basket" data-id="${basket.id}" data-field="min_credits"></td>
      <td><input class="editable-input" type="number" autocomplete="one-time-code" inputmode="numeric" value="${basket.earned_credits ?? ''}" data-type="basket" data-id="${basket.id}" data-field="earned_credits"></td>
      <td><span style="font-weight: bold;">${calculatedRemaining}</span></td>
      <td><button class="delete-row-btn" data-delete="basket" data-id="${basket.id}">Delete</button></td>
    </tr>`;
  });
  html += `<tr><td colspan="5"><button class="add-row-btn" data-add-basket="${catIdString}">+ Add Basket</button></td></tr>`; // Pass string ID
  html += '</tbody></table></div>';
  return html;
}

function addMainTableListeners(scope = document) {
  // Toggle details
  scope.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = function() {
      const catId = String(btn.getAttribute('data-toggle')); // Ensure string ID
      const detailsRow = document.getElementById(`details-row-${catId}`);
      if (detailsRow.style.display === 'none') {
        detailsRow.style.display = '';
        btn.textContent = '-';
        openDetailRows.add(catId);
      } else {
        detailsRow.style.display = 'none';
        btn.textContent = '+';
        openDetailRows.delete(catId);
      }
    };
  });

  // Editable inputs
  scope.querySelectorAll('.editable-input').forEach(input => {
    input.onchange = function() {
      const type = input.dataset.type;
      const id = String(input.dataset.id); // Ensure ID from dataset is string
      const field = input.dataset.field;
      let value = input.value;
      
      if (input.type === 'number') {
          value = parseFloat(value) || 0;
      }

      if (type === 'category') {
        const categoryToUpdate = categories.find(c => c.id === id);
        if (categoryToUpdate) {
            categoryToUpdate[field] = value;
        }
        if (!changes.categories[id]) changes.categories[id] = {};
        changes.categories[id][field] = value;
      } else if (type === 'basket') {
        const basketToUpdate = baskets.find(b => b.id === id);
        if (basketToUpdate) {
            basketToUpdate[field] = value;
            // Always update remaining_credits when min_credits or earned_credits changes
            if (field === 'min_credits' || field === 'earned_credits') {
                const minCredits = parseFloat(basketToUpdate.min_credits) || 0;
                const earnedCredits = parseFloat(basketToUpdate.earned_credits) || 0;
                basketToUpdate.remaining_credits = minCredits - earnedCredits;
                if (!changes.baskets[id]) changes.baskets[id] = {};
                changes.baskets[id].remaining_credits = basketToUpdate.remaining_credits;
            }
        }
        if (!changes.baskets[id]) changes.baskets[id] = {};
        changes.baskets[id][field] = value;
      }
      
      logChanges();
      
      // Save current open states before any re-render
      const currentOpenStatesSnapshot = new Set(openDetailRows);
      console.log('Before renderMainTable, currentOpenStatesSnapshot:', Array.from(currentOpenStatesSnapshot));
      
      if (type === 'category' || (type === 'basket' && field === 'earned_credits')) {
        const activeElement = document.activeElement;
        let focusedInputInfo = null;
        if (activeElement && activeElement.matches('.editable-input')) {
          focusedInputInfo = {
            id: String(activeElement.dataset.id), // Ensure ID is string here too
            type: activeElement.dataset.type,
            field: activeElement.dataset.field,
            selectionStart: activeElement.selectionStart,
            selectionEnd: activeElement.selectionEnd
          };
        }

        renderMainTable(currentOpenStatesSnapshot); // Pass the snapshot to renderMainTable
        
        // Explicitly restore open states after re-render to ensure persistence
        openDetailRows.clear(); // Clear the set
        currentOpenStatesSnapshot.forEach(id => openDetailRows.add(id)); // Add back previous states
        
        if (focusedInputInfo) {
          // Query selector needs string IDs
          const newActiveInput = document.querySelector(`[data-id="${focusedInputInfo.id}"][data-type="${focusedInputInfo.type}"][data-field="${focusedInputInfo.field}"]`);
          if (newActiveInput) {
            newActiveInput.focus();
            if (newActiveInput.type === 'text' || newActiveInput.type === 'number') {
              newActiveInput.setSelectionRange(focusedInputInfo.selectionStart, focusedInputInfo.selectionEnd);
            }
          }
        }
      } else if (type === 'basket') {
        const basket = baskets.find(b => b.id === id); // b.id is now string, id is string
        if (basket) {
          const categoryId = basket.category_id; // category_id is now guaranteed string
          const detailsRow = document.getElementById(`details-row-${categoryId}`);
          if (detailsRow) {
            const detailsTd = detailsRow.querySelector('td');
            if (detailsTd) {
              const currentDetailInputStates = saveInputStates(detailsTd);
              detailsTd.innerHTML = renderDetailsTable(categoryId); // categoryId passed is string
              requestAnimationFrame(() => {
                restoreInputStates(currentDetailInputStates, detailsTd);
                addMainTableListeners(detailsTd);
              });
            }
          }
        }
      }
    };

    input.onblur = function() {
      const currentValue = this.value;
      const originalValue = this.getAttribute('data-original-value');
      if (currentValue !== originalValue) {
        this.onchange();
      }
    };

    input.onfocus = function() {
      this.setAttribute('data-original-value', this.value);
    };

    input.onkeypress = function(e) {
      if (e.key === 'Enter') {
        this.onchange();
        this.blur();
      }
    };
  });

  // Add basket button click listener
  scope.querySelectorAll('[data-add-basket]').forEach(btn => {
    btn.onclick = function() {
      const catId = String(btn.getAttribute('data-add-basket')); // catId is already string from data-attribute
      const newBasket = {
        id: 'new-' + Date.now(), // String ID
        category_id: catId, // Directly assign as string
        basket_name: '',
        min_credits: '',
        earned_credits: '',
        remaining_credits: ''
      };
      baskets.push(newBasket);
      changes.newBaskets.push(newBasket);
      
      openDetailRows.add(catId);
      
      renderMainTable();
    };
  });

  // Delete row button click listener (can be scoped)
  scope.querySelectorAll('.delete-row-btn').forEach(btn => {
    btn.onclick = async function() { // Made function async
      const type = btn.getAttribute('data-delete');
      const id = String(btn.getAttribute('data-id')); // Ensure ID is string

      if (confirm(`Are you sure you want to delete this ${type}?`)) {
        try {
          if (type === 'category') {
            // First delete all baskets associated with this category
            const { error: basketError } = await window.supabaseClient
              .from('credit_baskets')
              .delete()
              .eq('category_id', id)
              .eq('user_id', window.currentUser.id);
            
            if (basketError) {
              throw new Error(`Failed to delete baskets for category ${id}: ${basketError.message}`);
            }

            // Then delete the category
            const { error: categoryError } = await window.supabaseClient
              .from('credit_categories')
              .delete()
              .eq('id', id)
              .eq('user_id', window.currentUser.id);

            if (categoryError) {
              throw new Error(`Failed to delete category ${id}: ${categoryError.message}`);
            }

            // Update frontend state
            categories = categories.filter(cat => cat.id !== id);
            baskets = baskets.filter(basket => basket.category_id !== id);
          } else if (type === 'basket') {
            const { error } = await window.supabaseClient
              .from('credit_baskets')
              .delete()
              .eq('id', id)
              .eq('user_id', window.currentUser.id);

            if (error) {
              throw new Error(`Failed to delete basket ${id}: ${error.message}`);
            }

            // Update frontend state
            baskets = baskets.filter(basket => basket.id !== id);
          }

          // Re-render the table
          renderMainTable();
          showToast(`Selected ${type} deleted successfully!`, 'success');
        } catch (error) {
          console.error('Error deleting:', error);
          showToast(`Failed to delete ${type}: ${error.message}`, 'error');
        }
      }
    };
  });

  // Add category button click listener
  const addCategoryBtn = scope.querySelector('#add-category-btn');
  if (addCategoryBtn) {
    addCategoryBtn.onclick = function() {
      const newCat = {
        id: 'new-' + Date.now(),
        sl_no: categories.length + 1,
        category: '',
        total_credits: '',
        earned_credits: ''
      };
      categories.push(newCat);
      changes.newCategories.push(newCat);
      renderMainTable();
    };
  }
}

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.classList.add('toast', type);
  toast.textContent = message;
  document.body.appendChild(toast);

  // Force reflow to trigger CSS transition
  toast.offsetHeight;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  }, 3000);
}

saveBtn.onclick = async function() {
  console.log("Save button clicked.");
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    // Filter out any newly added items that have also been marked for deletion
    changes.newCategories = changes.newCategories.filter(nc => !changes.deletedCategories.includes(nc.id));
    changes.newBaskets = changes.newBaskets.filter(nb => !changes.deletedBaskets.includes(nb.id));

    // Update categories
    for (const id in changes.categories) {
      if (!id.toString().startsWith('new-') && !changes.deletedCategories.includes(id)) {
        const updateData = { ...changes.categories[id] };
        // Only include fields that exist in the table
        const validFields = ['sl_no', 'category', 'total_credits', 'user_id'];
        Object.keys(updateData).forEach(key => {
          if (!validFields.includes(key)) {
            delete updateData[key];
          }
        });
        // Ensure user_id is set
        updateData.user_id = window.currentUser ? window.currentUser.id : null;
        const { error } = await window.supabaseClient.from('credit_categories').update(updateData).eq('id', id);
        if (error) throw new Error(`Failed to update category ${id}: ${error.message}`);
      }
    }

    // Update baskets
    for (const id in changes.baskets) {
      if (!id.toString().startsWith('new-') && !changes.deletedBaskets.includes(id)) {
        const updateData = { ...changes.baskets[id] };
        // Only include fields that exist in the table
        const validFields = ['basket_name', 'min_credits', 'earned_credits', 'remaining_credits', 'category_id', 'user_id'];
        Object.keys(updateData).forEach(key => {
          if (!validFields.includes(key)) {
            delete updateData[key];
          }
        });
        // Ensure user_id is set
        updateData.user_id = window.currentUser ? window.currentUser.id : null;
        const { error } = await window.supabaseClient.from('credit_baskets').update(updateData).eq('id', id);
        if (error) throw new Error(`Failed to update basket ${id}: ${error.message}`);
      }
    }

    // Insert new categories
    for (const cat of changes.newCategories) {
      const insertData = { ...cat };
      delete insertData.id; // Remove temporary client-side ID
      // Only include fields that exist in the table
      const validFields = ['sl_no', 'category', 'total_credits', 'user_id'];
      Object.keys(insertData).forEach(key => {
        if (!validFields.includes(key)) {
          delete insertData[key];
        }
      });
      // Ensure user_id is set
      insertData.user_id = window.currentUser ? window.currentUser.id : null;
      const { data, error } = await window.supabaseClient.from('credit_categories').insert([insertData]).select();
      if (error) throw new Error(`Failed to insert new category: ${error.message}`);
      
      if (data && data[0]) {
        // Update local baskets' category_id if they were linked to the temp ID
        baskets.forEach(b => {
          if (b.category_id === cat.id) b.category_id = data[0].id;
        });
      }
    }

    // Insert new baskets
    for (const bask of changes.newBaskets) {
      const insertData = { 
        ...bask, 
        user_id: window.currentUser ? window.currentUser.id : null,
        category_id: bask.category_id // Ensure category_id is included
      };
      delete insertData.id; // Remove temporary client-side ID
      // Only include fields that exist in the table
      const validFields = ['basket_name', 'min_credits', 'earned_credits', 'remaining_credits', 'category_id', 'user_id'];
      Object.keys(insertData).forEach(key => {
        if (!validFields.includes(key)) {
          delete insertData[key];
        }
      });
      const { error } = await window.supabaseClient.from('credit_baskets').insert([insertData]);
      if (error) throw new Error(`Failed to insert new basket: ${error.message}`);
    }

    // Delete categories
    for (const id of changes.deletedCategories) {
      if (!id.toString().startsWith('new-')) {
        try {
          // First delete all baskets associated with this category
          const { error: basketError } = await window.supabaseClient
            .from('credit_baskets')
            .delete()
            .eq('category_id', id)
            .eq('user_id', window.currentUser.id);
          
          if (basketError) {
            throw new Error(`Failed to delete baskets for category ${id}: ${basketError.message}`);
          }

          // Then delete the category
          const { error: categoryError } = await window.supabaseClient
            .from('credit_categories')
            .delete()
            .eq('id', id)
            .eq('user_id', window.currentUser.id);
          
          if (categoryError) {
            throw new Error(`Failed to delete category ${id}: ${categoryError.message}`);
          }
        } catch (error) {
          console.error('Error during deletion:', error);
          throw error;
        }
      }
    }

    // Delete baskets
    for (const id of changes.deletedBaskets) {
      if (!id.toString().startsWith('new-')) {
        const { error } = await window.supabaseClient
          .from('credit_baskets')
          .delete()
          .eq('id', id)
          .eq('user_id', window.currentUser.id);
        
        if (error) {
          throw new Error(`Failed to delete basket ${id}: ${error.message}`);
        }
      }
    }

    // Reset changes and reload
    changes = { categories: {}, baskets: {}, newCategories: [], newBaskets: [], deletedCategories: [], deletedBaskets: [] };
    
    // Fetch fresh data from the database
    await fetchData();
    
    saveBtn.textContent = 'Save';
    showToast('Changes saved successfully!', 'success');
  } catch (error) {
    console.error('Save error:', error);
    showToast(`Failed to save changes: ${error.message}`, 'error');
    saveBtn.textContent = 'Save Failed - Try Again';
  } finally {
    saveBtn.disabled = false;
  }
}

// Add debug logging for changes
function logChanges() {
  console.log('Current changes:', {
    categories: changes.categories,
    baskets: changes.baskets,
    newCategories: changes.newCategories,
    newBaskets: changes.newBaskets,
    deletedCategories: changes.deletedCategories,
    deletedBaskets: changes.deletedBaskets
  });
}

// Add a function to create default categories for new users
async function createDefaultCategories(userId) {
  const defaultCategories = [
    { sl_no: 1, category: 'University Core', total_credits: 0, user_id: userId },
    { sl_no: 2, category: 'Program Elective', total_credits: 0, user_id: userId },
    { sl_no: 3, category: 'University Elective', total_credits: 0, user_id: userId }
  ];

  const { error } = await window.supabaseClient
    .from('credit_categories')
    .insert(defaultCategories);

  if (error) {
    console.error('Error creating default categories:', error);
    return false;
  }
  return true;
}

// Add info sidebar button and container to the header
document.querySelector('.header-actions').insertAdjacentHTML('beforeend', `
  <button id="info-btn" class="header-icon-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-help-circle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></button>
`);

document.querySelector('#main-content-view').insertAdjacentHTML('beforeend', `
  <div id="info-sidebar" class="info-sidebar" style="display: none;">
    <div class="info-sidebar-content">
      <button id="close-info-btn" class="close-info-btn">&times;</button>
      <h2>How to Use CredTracker</h2>
      
      <section>
        <h3>Getting Started</h3>
        <p>Welcome to CredTracker! This tool helps you track your academic credits and progress.</p>
        <ul>
          <li>Each category represents a type of credit requirement (e.g., University Core, Program Elective)</li>
          <li>Baskets within each category help you break down specific requirements</li>
          <li>Track your earned credits and see your progress towards completion</li>
          <li>To find your credit distribution, visit vtop and navigate as follows: vtop -> academics -> my credit distribution</li>
        </ul>
      </section>

      <section>
        <h3>Managing Categories</h3>
        <ul>
          <li>Click "+ Add Category" to create a new credit category</li>
          <li>Enter the total credits required for each category</li>
          <li>Use the "View" button to see and manage baskets within a category</li>
          <li>Click "Delete" to remove a category (this will also delete all its baskets)</li>
        </ul>
      </section>

      <section>
        <h3>Managing Baskets</h3>
        <ul>
          <li>Click "+ Add Basket" within a category to create a new basket</li>
          <li>Enter the minimum credits required for each basket</li>
          <li>Update earned credits as you complete requirements</li>
          <li>Remaining credits are automatically calculated</li>
          <li>Click "Delete" to remove a basket</li>
        </ul>
      </section>

      <section>
        <h3>Tracking Progress</h3>
        <ul>
          <li>Total credits show the sum of all category requirements</li>
          <li>Earned credits show your progress across all baskets</li>
          <li>The "i" icon indicates if your total credits match your program requirements</li>
          <li>Remember to click "Save" after making changes</li>
        </ul>
      </section>

      <section>
        <h3>Tips</h3>
        <ul>
          <li>Keep your earned credits up to date for accurate progress tracking</li>
          <li>Use baskets to break down complex requirements into manageable parts</li>
          <li>Check the remaining credits to know what's left to complete</li>
          <li>You can edit any field by clicking on it</li>
        </ul>
      </section>

      <section>
        <h3>Example Credit Distribution</h3>
        <div class="example-images">
          <img src="imgs/Screenshot 2025-06-13 at 21.03.23.png" alt="Credit Distribution Example 1" class="zoomable-image" style="width: 100%; margin-bottom: 10px;">
          <img src="imgs/Screenshot 2025-06-13 at 21.03.39.png" alt="Credit Distribution Example 2" class="zoomable-image" style="width: 100%;">
        </div>
      </section>
    </div>
  </div>

  <div id="image-modal" class="image-modal">
    <span class="close-modal">&times;</span>
    <img class="modal-content" id="modal-image">
  </div>
`);

// Add floating tooltip container to the body
document.body.insertAdjacentHTML('beforeend', `
  <div id="floating-tooltip" class="floating-tooltip"></div>
`);

// Add info sidebar functionality
document.getElementById('info-btn').onclick = function() {
  document.getElementById('info-sidebar').classList.add('visible');
};

document.getElementById('close-info-btn').onclick = function() {
  document.getElementById('info-sidebar').classList.remove('visible');
};

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('info-sidebar');
  const infoBtn = document.getElementById('info-btn');
  if (!sidebar.contains(event.target) && !infoBtn.contains(event.target) && sidebar.classList.contains('visible')) {
    sidebar.classList.remove('visible');
  }
});

// Add image modal functionality
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const closeModal = document.querySelector('.close-modal');
  
  // Add click handlers to all zoomable images
  document.querySelectorAll('.zoomable-image').forEach(img => {
    img.onclick = function() {
      modal.style.display = "flex";
      modalImg.src = this.src;
    }
  });

  // Close modal when clicking the close button
  closeModal.onclick = function() {
    modal.style.display = "none";
  }

  // Close modal when clicking outside the image
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
    }
  });
});

// Auth tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Update button text and behavior based on active tab
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (tab.dataset.tab === 'login') {
      loginBtn.textContent = 'Login';
      signupBtn.textContent = 'Sign Up';
      loginBtn.type = 'submit';
      signupBtn.type = 'button';
    } else {
      loginBtn.textContent = 'Sign Up';
      signupBtn.textContent = 'Login';
      loginBtn.type = 'button';
      signupBtn.type = 'submit';
    }
  });
});

// Function to show auth page and hide landing page
function showAuth() {
    window.history.pushState({ page: 'auth' }, '', '#auth');
    showAuthView();
}

// Function to show landing page and hide auth page
function showLanding() {
    window.history.pushState({ page: 'landing' }, '', '#');
    showLandingView();
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Set current year in footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// 3D Model Animation
let scene, camera, renderer, controls;
let particles, particleSystem;
let isAnimating = true;

function init3DModel() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fa);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Create renderer
    const canvas = document.getElementById('hero-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;

    // Create particle system
    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 30;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 30;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 30;
        particleSizes[i] = Math.random() * 2;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0x2176bd,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Create main geometry
    const geometry = new THREE.TorusKnotGeometry(3, 1, 100, 16);
    const material = new THREE.MeshPhongMaterial({
        color: 0x2176bd,
        shininess: 100,
        specular: 0x155a8a,
        transparent: true,
        opacity: 0.9
    });

    const mainMesh = new THREE.Mesh(geometry, material);
    scene.add(mainMesh);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x2176bd, 1);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Add mouse interaction
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseout', onMouseOut);

    // Start animation
    animate();
}

function onWindowResize() {
    const canvas = document.getElementById('hero-canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function onMouseMove(event) {
    const canvas = document.getElementById('hero-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    // Update particle system based on mouse position
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const distance = Math.sqrt(
            Math.pow(positions[i] - x * 15, 2) +
            Math.pow(positions[i + 1] - y * 15, 2)
        );
        if (distance < 5) {
            positions[i + 2] += 0.1;
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
}

function onMouseOut() {
    // Reset particle positions
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = (Math.random() - 0.5) * 30;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
}

function animate() {
    if (!isAnimating) return;

    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Rotate main mesh
    const mainMesh = scene.children.find(child => child instanceof THREE.Mesh);
    if (mainMesh) {
        mainMesh.rotation.x += 0.005;
        mainMesh.rotation.y += 0.005;
    }

    // Animate particles
    const positions = particleSystem.geometry.attributes.position.array;
    const time = Date.now() * 0.001;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + positions[i]) * 0.01;
        positions[i + 1] += Math.cos(time + positions[i + 1]) * 0.01;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

// Pause animation when tab is not visible
document.addEventListener('visibilitychange', () => {
    isAnimating = !document.hidden;
    if (isAnimating) animate();
});

// Handle browser back button
window.addEventListener('popstate', function(event) {
    if (authContainer.style.display === 'flex') {
        showLandingView();
    }
});

// Initial check on page load
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) {
    window.currentUser = session.user;
    await loadUserProfile();
    if (userProfile && userProfile.onboarding_complete) {
      showAppView();
    } else {
      showOnboardingView();
    }
  } else {
    window.currentUser = null;
    userProfile = null;
    showLandingView();
  }
});

// New function to show the landing view
function showLandingView() {
  landingContainer.style.display = 'block'; // Or 'flex' or appropriate for landing
  authContainer.style.display = 'none';
  onboardingContainer.style.display = 'none';
  appContainer.style.display = 'none';
  profilePopover.style.display = 'none';
  editProfileView.style.display = 'none';
  
  // Initialize 3D model after the landing container is shown
  requestAnimationFrame(() => {
    init3DModel();
  });
}

async function checkSession() {
  console.log("checkSession called.");
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    // If no session, ensure we're in landing view
    if (!session) {
      window.currentUser = null;
      userProfile = null;
      showLandingView();
      return;
    }
    
    // If we have a session, update user and check profile
    window.currentUser = session.user;
    await loadUserProfile();

    if (userProfile && userProfile.onboarding_complete) {
      showAppView();
    } else {
      showOnboardingView();
    }
  } catch (error) {
    console.error('Error checking session:', error);
    // On error, default to landing view
    window.currentUser = null;
    userProfile = null;
    showLandingView();
  }
}