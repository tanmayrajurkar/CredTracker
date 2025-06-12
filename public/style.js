// Remove duplicate Supabase initialization
let categories = []
let baskets = []
let changes = { categories: {}, baskets: {}, newCategories: [], newBaskets: [], deletedCategories: [], deletedBaskets: [] }
let userProfile = null;

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
        showAuthView();
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
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  const tooltipWidth = floatingTooltipElement.offsetWidth;
  const tooltipHeight = floatingTooltipElement.offsetHeight;

  floatingTooltipElement.style.left = (rect.left + rect.width / 2 + scrollX - tooltipWidth / 2) + 'px';
  floatingTooltipElement.style.top = (rect.top + scrollY - tooltipHeight - 12) + 'px';

  // Make it visible with the transition
  floatingTooltipElement.classList.add('visible');
}

function hideTooltip(floatingTooltipElement) {
  console.log('hideTooltip: Removing visible class from tooltip.');
  floatingTooltipElement.classList.remove('visible');
}

// Renamed this function to be more explicit about its purpose
function setupGlobalTooltipListeners() {
  // Query elements inside this function to ensure they are current after DOM updates
  const infoIcon = document.getElementById('test-tooltip-trigger');
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
            authMessage.textContent = error.message;
        }
    } catch (err) {
        authMessage.textContent = 'An error occurred during login. Please try again.';
        console.error('Login error:', err);
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
  authContainer.style.display = 'flex';
  onboardingContainer.style.display = 'none';
  appContainer.style.display = 'none';
  profilePopover.style.display = 'none';
  editProfileView.style.display = 'none';
}

function showOnboardingView() {
  authContainer.style.display = 'none';
  onboardingContainer.style.display = 'flex';
  appContainer.style.display = 'none';
  profilePopover.style.display = 'none';
  editProfileView.style.display = 'none';
  showOnboardingStep(1);
}

function showAppView() {
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
    await window.supabaseClient.auth.signOut();
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

  onboardingConfirmBtn.disabled = false;
  if (success) {
    await checkSession();
  } else {
    alert("Failed to complete onboarding. Please try again.");
  }
};

// Initial setup and data fetching
// This will be called after checkSession determines the view
async function fetchData() {
  console.log("Fetching categories...");
  const { data: catData, error: catError } = await window.supabaseClient.from('credit_categories').select('*').order('sl_no');
  if (catError) console.error("Error fetching categories:", catError);
  categories = catData || [];
  console.log("Fetched categories:", categories);

  let baskData = [];
  if (window.currentUser) {
    console.log("Fetching user-specific baskets for user:", window.currentUser.id);
    const { data: userBaskData, error: baskError } = await window.supabaseClient.from('credit_baskets').select('*').eq('user_id', window.currentUser.id);
    if (baskError) console.error("Error fetching baskets:", baskError);
    baskData = userBaskData || [];
  }
  baskets = baskData;
  console.log("Fetched baskets:", baskets);

  renderMainTable();
}

// Render Main Table Function (existing, ensure it creates the elements dynamically)
function renderMainTable() {
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
        <th>View</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  // Render category rows
  categories.forEach((cat) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="editable-input" type="number" value="${cat.sl_no ?? ''}" data-type="category" data-id="${cat.id}" data-field="sl_no"></td>
      <td><input class="editable-input" type="text" value="${cat.category ?? ''}" data-type="category" data-id="${cat.id}" data-field="category"></td>
      <td><input class="editable-input" type="number" value="${cat.total_credits ?? ''}" data-type="category" data-id="${cat.id}" data-field="total_credits"></td>
      <td><input class="editable-input" type="number" autocomplete="off" value="${cat.earned_credits ?? ''}" data-type="category" data-id="${cat.id}" data-field="earned_credits"></td>
      <td><button class="view-btn" data-toggle="${cat.id}">+</button></td>
      <td><button class="delete-row-btn" data-delete="category" data-id="${cat.id}">Delete</button></td>
    `;
    tbody.appendChild(tr);

    // Details row
    const detailsTr = document.createElement('tr');
    detailsTr.style.display = 'none';
    detailsTr.id = `details-row-${cat.id}`;
    const detailsTd = document.createElement('td');
    detailsTd.colSpan = 6;
    detailsTd.innerHTML = renderDetailsTable(cat.id);
    detailsTr.appendChild(detailsTd);
    tbody.appendChild(detailsTr);
  });

  // Calculate and add total row
  const totalCreditsSum = categories.reduce((sum, cat) => sum + (parseFloat(cat.total_credits) || 0), 0);
  const totalEarnedSum = categories.reduce((sum, cat) => sum + (parseFloat(cat.earned_credits) || 0), 0);

  const userTotalCreditsToComplete = userProfile ? (userProfile.total_credits_to_complete || 0) : 0;
  const isMismatch = totalCreditsSum !== Number(userTotalCreditsToComplete);

  const totalTr = document.createElement('tr');
  totalTr.innerHTML = `
    <td colspan="2" style="font-weight:600;">Total Credits</td>
    <td class="total-credits-cell${isMismatch ? ' mismatch' : ''}">
      ${totalCreditsSum}
      ${isMismatch ? `<span class="info-icon" tabindex="0" id="test-tooltip-trigger">i</span>` : ''}
    </td>
    <td style="font-weight:600;">${totalEarnedSum}</td>
    <td colspan="2" style="font-weight:600;">To Complete: ${userTotalCreditsToComplete}</td>
  `;
  tbody.appendChild(totalTr);

  // Add category button row
  const addCatTr = document.createElement('tr');
  addCatTr.innerHTML = `<td colspan="6"><button class="add-row-btn" id="add-category-btn">+ Add Category</button></td>`;
  tbody.appendChild(addCatTr);

  mainTableContainer.appendChild(table);

  // Add event listeners after table is in DOM
  addMainTableListeners();
  setupGlobalTooltipListeners();
}

// Render Details Table Function (existing)
function renderDetailsTable(categoryId) {
  const cat = categories.find(c => c.id === categoryId)
  let heading = cat ? `${cat.category} Credits Distribution` : 'Credits Distribution'
  const catBaskets = baskets.filter(b => b.category_id === categoryId)
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
  `
  catBaskets.forEach(basket => {
    html += `<tr>
      <td><input class="editable-input" type="text" value="${basket.basket_name ?? ''}" data-type="basket" data-id="${basket.id}" data-field="basket_name"></td>
      <td><input class="editable-input" type="number" value="${basket.min_credits ?? ''}" data-type="basket" data-id="${basket.id}" data-field="min_credits"></td>
      <td><input class="editable-input" type="number" autocomplete="off" value="${basket.earned_credits ?? ''}" data-type="basket" data-id="${basket.id}" data-field="earned_credits"></td>
      <td><input class="editable-input" type="number" value="${basket.remaining_credits ?? ''}" data-type="basket" data-id="${basket.id}" data-field="remaining_credits"></td>
      <td><button class="delete-row-btn" data-delete="basket" data-id="${basket.id}">Delete</button></td>
    </tr>`
  })
  html += `<tr><td colspan="5"><button class="add-row-btn" data-add-basket="${categoryId}">+ Add Basket</button></td></tr>`
  html += '</tbody></table></div>'
  return html
}

function addMainTableListeners() {
  // Toggle details
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = function() {
      const catId = btn.getAttribute('data-toggle')
      const detailsRow = document.getElementById(`details-row-${catId}`)
      if (detailsRow.style.display === 'none') {
        detailsRow.style.display = '';
        btn.textContent = '-';
      } else {
        detailsRow.style.display = 'none';
        btn.textContent = '+';
      }
    }
  })
  // Editable inputs
  document.querySelectorAll('.editable-input').forEach(input => {
    input.oninput = function() {
      const type = input.dataset.type
      const id = input.dataset.id
      const field = input.dataset.field
      let value = input.value;
      // Convert to number if field expects it
      if (input.type === 'number') {
          value = parseFloat(value) || 0;
      }

      if (type === 'category') {
        // Find the category in the local `categories` array and update it directly
        const categoryToUpdate = categories.find(c => c.id == id);
        if (categoryToUpdate) {
            categoryToUpdate[field] = value;
            // Update remaining_credits for baskets only if earned_credits changes
            if (field === 'earned_credits' || field === 'min_credits') {
                const relatedBaskets = baskets.filter(b => b.category_id == id);
                relatedBaskets.forEach(bask => {
                    bask.remaining_credits = (parseFloat(bask.min_credits) || 0) - (parseFloat(bask.earned_credits) || 0);
                    // Mark for update if this change needs to be saved
                    if (!changes.baskets[bask.id]) changes.baskets[bask.id] = {};
                    changes.baskets[bask.id].remaining_credits = bask.remaining_credits;
                });
            }
        }
        if (!changes.categories[id]) changes.categories[id] = {}
        changes.categories[id][field] = value
      } else if (type === 'basket') {
        // Find the basket in the local `baskets` array and update it directly
        const basketToUpdate = baskets.find(b => b.id == id);
        if (basketToUpdate) {
            basketToUpdate[field] = value;
            // Recalculate remaining_credits if min_credits or earned_credits change
            if (field === 'min_credits' || field === 'earned_credits') {
                basketToUpdate.remaining_credits = (parseFloat(basketToUpdate.min_credits) || 0) - (parseFloat(basketToUpdate.earned_credits) || 0);
                // Ensure remaining_credits is also marked for update if it's not already
                if (!changes.baskets[id]) changes.baskets[id] = {};
                changes.baskets[id].remaining_credits = basketToUpdate.remaining_credits;
            }
        }
        if (!changes.baskets[id]) changes.baskets[id] = {}
        changes.baskets[id][field] = value
      }
      renderMainTable(); // Re-render to reflect live updates for totals
    }
  })
  // Add category
  document.getElementById('add-category-btn').onclick = function() {
    const newCat = {
      id: 'new-' + Date.now(),
      sl_no: categories.length + 1,
      category: '',
      total_credits: '',
      earned_credits: ''
    }
    categories.push(newCat)
    changes.newCategories.push(newCat)
    renderMainTable()
  }
  // Add basket
  document.querySelectorAll('[data-add-basket]').forEach(btn => {
    btn.onclick = function() {
      const catId = btn.getAttribute('data-add-basket')
      const newBasket = {
        id: 'new-' + Date.now(),
        category_id: parseInt(catId),
        basket_name: '',
        min_credits: '',
        earned_credits: '',
        remaining_credits: ''
      }
      baskets.push(newBasket)
      changes.newBaskets.push(newBasket)
      renderMainTable()
      // Open the details row again
      const detailsRow = document.getElementById(`details-row-${catId}`)
      detailsRow.style.display = 'none'
    }
  })
}