/**
 * KisanSetu — Client-Side Mock Authentication & Session Layer
 * 
 * ARCHITECTURAL DISCLAIMER:
 * Frontend route protection and localStorage session management implemented here
 * are for prototype simulation and UX evaluation only. Real authorization will be
 * strictly enforced by the FastAPI backend using JWT, secure HTTP-only cookies,
 * and role-based access control (RBAC).
 */

const SESSION_STORAGE_KEY = "kisansetu_user";
const REGISTRATION_STORAGE_KEY = "kisansetu_pending_registration";
const REGISTERED_USERS_KEY = "kisansetu_registered_accounts";

// Pre-configured Fictional Mock Credentials for SIH Prototype
const MOCK_USERS = [
  {
    id: "USR-FARMER-01",
    name: "Demo Farmer",
    email: "farmer@demo.com",
    password: "Farmer@123",
    role: "farmer",
    phone: "+91 98765 43210",
    profileCompleted: true
  },
  {
    id: "USR-OPERATOR-01",
    name: "Demo Operator",
    email: "operator@demo.com",
    password: "Operator@123",
    role: "operator",
    centerId: "CTR-HR-01",
    centerName: "Karnal Central Procurement Center (Demo)",
    profileCompleted: true
  },
  {
    id: "USR-ADMIN-01",
    name: "Demo District Admin",
    email: "admin@demo.com",
    password: "Admin@123",
    role: "district_admin",
    district: "Karnal District",
    profileCompleted: true
  },
  {
    id: "USR-SUPERADMIN-01",
    name: "Demo Super Admin",
    email: "superadmin@demo.com",
    password: "Super@123",
    role: "super_admin",
    profileCompleted: true
  }
];

// Target dashboards by role relative to /pages/
const ROLE_DASHBOARDS_FROM_PAGES = {
  farmer: "../farmer/dashboard.html",
  operator: "../operator/dashboard.html",
  district_admin: "../admin/dashboard.html",
  super_admin: "../admin/super-admin-dashboard.html"
};

/**
 * Helper to get dynamically registered users from localStorage
 */
function getDynamicallyRegisteredUsers() {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Helper to persist a newly registered farmer account for subsequent logins
 */
function saveRegisteredFarmerAccount(userObj, password) {
  try {
    const users = getDynamicallyRegisteredUsers();
    users.push({
      ...userObj,
      password: password
    });
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Error persisting mock account:", e);
  }
}

const KisanAuth = {
  MOCK_USERS,

  /**
   * Mock login with credential validation and portal role-mismatch checking
   * @param {string} email
   * @param {string} password
   * @param {string} expectedRole Fixed expected role for the portal ('farmer', 'operator', 'district_admin', 'super_admin')
   * @param {string|null} customRedirectUrl Optional custom redirect URL relative to the calling portal
   */
  login(email, password, expectedRole, customRedirectUrl = null) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Check pre-configured demo users + dynamically registered farmers
    const allUsers = [...MOCK_USERS, ...getDynamicallyRegisteredUsers()];
    const matchedUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser || matchedUser.password !== cleanPass) {
      return {
        success: false,
        error: "Invalid email or password."
      };
    }

    // Role verification against the portal's expected role
    if (expectedRole && matchedUser.role !== expectedRole) {
      const portalNames = {
        farmer: "Farmer",
        operator: "Procurement Operator",
        district_admin: "District Admin",
        super_admin: "Super Admin"
      };
      const portalTitle = portalNames[expectedRole] || expectedRole;
      return {
        success: false,
        error: `This account does not have access to the ${portalTitle} portal.`
      };
    }

    // Create session payload (omit raw password)
    const sessionUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      phone: matchedUser.phone || "",
      profileCompleted: matchedUser.profileCompleted || false,
      centerId: matchedUser.centerId || null,
      centerName: matchedUser.centerName || null,
      district: matchedUser.district || null,
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));

    const redirectUrl = customRedirectUrl || ROLE_DASHBOARDS_FROM_PAGES[matchedUser.role] || "../farmer/dashboard.html";

    return {
      success: true,
      user: sessionUser,
      redirectUrl: redirectUrl
    };
  },

  /**
   * Step 1: Record pending farmer registration without authenticating
   */
  registerFarmer(accountData) {
    if (!accountData.name || !accountData.phone || !accountData.email || !accountData.password) {
      return {
        success: false,
        error: "Please complete all required fields."
      };
    }

    if (accountData.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters."
      };
    }

    const pendingData = {
      name: accountData.name.trim(),
      phone: accountData.phone.trim(),
      email: accountData.email.trim().toLowerCase(),
      password: accountData.password,
      role: "farmer",
      registeredAt: new Date().toISOString()
    };

    // Store in separate pending onboarding state
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(pendingData));

    return {
      success: true,
      redirectUrl: "complete-profile.html"
    };
  },

  /**
   * Retrieve pending registration data if currently in onboarding flow
   */
  getPendingRegistration() {
    try {
      const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Step 2: Complete farmer profile, activate session, and clean pending state
   */
  completeFarmerProfile(profileData) {
    const pending = this.getPendingRegistration();
    const current = this.getCurrentUser();

    if (!pending && !current) {
      return {
        success: false,
        error: "No registration in progress. Please start from the registration page."
      };
    }

    const base = pending || current;
    const finalUser = {
      id: "USR-FARMER-" + Math.floor(1000 + Math.random() * 9000),
      name: base.name || "Demo Farmer",
      email: base.email,
      phone: base.phone,
      role: "farmer",
      profileCompleted: true,
      profile: {
        village: profileData.village || "",
        district: profileData.district || "",
        state: profileData.state || "",
        pincode: profileData.pincode || "",
        farmSize: profileData.farmSize || "",
        primaryCrop: profileData.primaryCrop || "",
        preferredCenterId: profileData.preferredCenterId || "",
        preferredCenterName: profileData.preferredCenterName || ""
      },
      activatedAt: new Date().toISOString()
    };

    // Store final authenticated user session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(finalUser));

    // Remove pending registration key
    localStorage.removeItem(REGISTRATION_STORAGE_KEY);

    // Save into registered accounts so user can log in again with chosen password
    if (pending && pending.password) {
      saveRegisteredFarmerAccount(finalUser, pending.password);
    }

    return {
      success: true,
      user: finalUser,
      redirectUrl: "../farmer/dashboard.html"
    };
  },

  /**
   * Get current authenticated user session object or null
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Terminate current session and redirect to login
   */
  logout(redirectPath = "../pages/login.html") {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.href = redirectPath;
  },

  /**
   * Helper to resolve the relative URL of a role's dashboard
   * from the context of another dashboard or page.
   * @param {string} targetRole 'farmer' | 'operator' | 'district_admin' | 'super_admin'
   * @param {string} currentContextRole The role/directory context currently executing
   */
  getDashboardUrl(targetRole, currentContextRole) {
    if (currentContextRole === "admin" || currentContextRole === "district_admin" || currentContextRole === "super_admin") {
      if (targetRole === "district_admin") return "dashboard.html";
      if (targetRole === "super_admin") return "super-admin-dashboard.html";
      if (targetRole === "farmer") return "../farmer/dashboard.html";
      if (targetRole === "operator") return "../operator/dashboard.html";
    }
    if (currentContextRole === "operator") {
      if (targetRole === "operator") return "dashboard.html";
      if (targetRole === "farmer") return "../farmer/dashboard.html";
      if (targetRole === "district_admin") return "../admin/dashboard.html";
      if (targetRole === "super_admin") return "../admin/super-admin-dashboard.html";
    }
    if (currentContextRole === "farmer") {
      if (targetRole === "farmer") return "dashboard.html";
      if (targetRole === "operator") return "../operator/dashboard.html";
      if (targetRole === "district_admin") return "../admin/dashboard.html";
      if (targetRole === "super_admin") return "../admin/super-admin-dashboard.html";
    }
    // General fallback (e.g. from /pages/)
    const fallbackMap = {
      farmer: "../farmer/dashboard.html",
      operator: "../operator/dashboard.html",
      district_admin: "../admin/dashboard.html",
      super_admin: "../admin/super-admin-dashboard.html"
    };
    return fallbackMap[targetRole] || "../farmer/dashboard.html";
  },

  /**
   * Prototype client-side route protection
   * Checks if user is logged in and belongs to the authorized role.
   * - If unauthenticated: redirects to the specific portal login page.
   * - If authenticated with a different role: redirects to the authenticated user's own dashboard.
   * @param {string} expectedRole 'farmer' | 'operator' | 'district_admin' | 'super_admin'
   * @param {string} [loginPath] Optional custom login path for the portal
   */
  requireAuth(expectedRole, loginPath) {
    const user = this.getCurrentUser();

    // Default portal login mapping if no specific loginPath provided
    const defaultLoginPaths = {
      farmer: "../pages/login.html",
      operator: "login.html",
      district_admin: "login.html",
      super_admin: "super-admin-login.html"
    };

    const targetLogin = loginPath || (expectedRole ? defaultLoginPaths[expectedRole] : "../pages/login.html");

    if (!user) {
      window.location.href = targetLogin;
      return null;
    }

    if (expectedRole && user.role !== expectedRole) {
      // User is already authenticated in another role -> redirect to their own role dashboard
      const userDashboard = this.getDashboardUrl(user.role, expectedRole);
      window.location.href = userDashboard;
      return null;
    }

    return user;
  }
};

// Export to window for browser vanilla JS usage
if (typeof window !== "undefined") {
  window.KisanAuth = KisanAuth;
}

