const API = "/api";

// Get saved token
function getToken() {
    return localStorage.getItem("token");
}

// Get logged-in user
function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

// Get form field safely
function getField(form, name) {
    return form.elements.namedItem(name);
}

// API request function
async function apiRequest(endpoint, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        if (!endpoint.includes("/auth/")) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }

        throw new Error(
            data.message || "Session expired. Please login again."
        );
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

// Display messages
function showMessage(element, message, type = "") {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`.trim();
    element.classList.remove("hidden");
}

// Prevent HTML injection
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Logout
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login.html";
}

// Check login
function requireLogin() {
    if (!getToken() || !getUser()) {
        window.location.href = "/login.html";
        return false;
    }

    return true;
}

// Navigation
function renderNavigation() {
    const user = getUser();
    const nav = document.querySelector("#navLinks");

    if (!nav) return;

    nav.innerHTML = `
        <a href="/">Home</a>

        ${user ? `
            <a href="/report.html">Report Item</a>
            <a href="/dashboard.html">My Dashboard</a>

            ${user.role === "admin"
                ? '<a href="/admin.html">Admin</a>'
                : ""}

            <button class="btn btn-small" id="logoutButton">
                Logout
            </button>
        ` : `
            <a href="/login.html">Login</a>
            <a href="/register.html">Register</a>
        `}
    `;

    document.querySelector("#logoutButton")
        ?.addEventListener("click", logout);
}

// Display item card
function itemCard(item, showClaim = true) {
    const date = item.date
        ? new Date(item.date).toLocaleDateString()
        : "Date unavailable";

    const owner = item.reportedBy?.name || "Campus user";

    const user = getUser();

    const ownerId =
        item.reportedBy?._id || item.reportedBy;

    const currentUserId = user?.id || user?._id;

    const canClaim =
        showClaim &&
        user &&
        item.status === "Available" &&
        String(ownerId) !== String(currentUserId);

    return `
        <article class="item-card">

            <span class="tag ${item.type === "Found"
                ? "tag-found"
                : "tag-lost"}">

                ${escapeHTML(item.type)}

            </span>

            <h3>${escapeHTML(item.name)}</h3>

            <p>
                <strong>Category:</strong>
                ${escapeHTML(item.category)}
            </p>

            <p>
                <strong>Location:</strong>
                ${escapeHTML(item.location)}
            </p>

            <p>
                <strong>Date:</strong>
                ${escapeHTML(date)}
            </p>

            <p>${escapeHTML(item.description)}</p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(item.status)}
            </p>

            <p>
                <strong>Reported by:</strong>
                ${escapeHTML(owner)}
            </p>

            ${item.image ? `
                <p>
                    <a href="${escapeHTML(item.image)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        View image
                    </a>
                </p>
            ` : ""}

            <div class="actions">

                ${canClaim ? `
                    <button
                        class="btn btn-small claim-button"
                        data-id="${escapeHTML(item._id)}">

                        Claim Item

                    </button>
                ` : ""}

            </div>

        </article>
    `;
}

// Load all items
async function loadItems() {
    const container = document.querySelector("#itemsList");

    if (!container) return;

    container.innerHTML =
        '<p class="empty-state">Loading items...</p>';

    try {
        const params = new URLSearchParams();

        const search =
            document.querySelector("#search")?.value.trim();

        const category =
            document.querySelector("#category")?.value;

        const location =
            document.querySelector("#location")?.value.trim();

        const type =
            document.querySelector("#type")?.value;

        const sort =
            document.querySelector("#sort")?.value;

        if (search) params.set("search", search);
        if (category) params.set("category", category);
        if (location) params.set("location", location);
        if (type) params.set("type", type);
        if (sort) params.set("sort", sort);

        const result = await apiRequest(
            `/items?${params.toString()}`
        );

        container.innerHTML = result.items.length
            ? result.items.map(item => itemCard(item)).join("")
            : '<p class="empty-state">No items found.</p>';

        container.querySelectorAll(".claim-button")
            .forEach(button => {
                button.addEventListener("click", () => {
                    submitClaim(button.dataset.id);
                });
            });

    } catch (error) {
        container.innerHTML = `
            <p class="message error">
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}

// Submit claim
async function submitClaim(itemId) {
    const message = prompt(
        "Describe the item details that help verify your claim:"
    );

    if (!message || !message.trim()) return;

    try {
        const result = await apiRequest("/claims", {
            method: "POST",

            body: JSON.stringify({
                itemId,
                message: message.trim()
            })
        });

        alert(result.message);

    } catch (error) {
        alert(error.message);
    }
}

// Login
function setupLogin() {
    const form = document.querySelector("#loginForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const message =
            document.querySelector("#formMessage");

        try {
            const data = await apiRequest("/auth/login", {
                method: "POST",

                body: JSON.stringify({
                    email: getField(form, "email").value.trim(),
                    password: getField(form, "password").value
                })
            });

            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            window.location.href =
                data.user.role === "admin"
                    ? "/admin.html"
                    : "/dashboard.html";

        } catch (error) {
            showMessage(message, error.message, "error");
        }
    });
}

// Register
function setupRegister() {
    const form = document.querySelector("#registerForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const message =
            document.querySelector("#formMessage");

        const name = getField(form, "name").value.trim();
        const email = getField(form, "email").value.trim();
        const password = getField(form, "password").value;
        const confirmPassword =
            getField(form, "confirmPassword").value;

        if (password !== confirmPassword) {
            showMessage(
                message,
                "Passwords do not match",
                "error"
            );

            return;
        }

        try {
            const data = await apiRequest("/auth/register", {
                method: "POST",

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            window.location.href = "/dashboard.html";

        } catch (error) {
            showMessage(message, error.message, "error");
        }
    });
}

// Report any item
function setupReport() {
    const form = document.querySelector("#reportForm");

    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const message =
            document.querySelector("#formMessage");

        if (!requireLogin()) return;

        // Read form values safely
        const itemName =
            getField(form, "name").value.trim();

        const category =
            getField(form, "category").value;

        const description =
            getField(form, "description").value.trim();

        const location =
            getField(form, "location").value.trim();

        const date =
            getField(form, "date").value;

        const type =
            getField(form, "type").value;

        const image =
            getField(form, "image").value.trim();

        if (!itemName) {
            showMessage(
                message,
                "Please enter the item name.",
                "error"
            );

            return;
        }

        if (!category || !description || !location || !date || !type) {
            showMessage(
                message,
                "Please fill in all required fields.",
                "error"
            );

            return;
        }

        try {
            const data = await apiRequest("/items", {
                method: "POST",

                body: JSON.stringify({
                    name: itemName,
                    category,
                    description,
                    location,
                    date,
                    type,
                    image
                })
            });

            showMessage(
                message,
                data.message || "Item reported successfully!",
                "success"
            );

            form.reset();

        } catch (error) {
            showMessage(message, error.message, "error");
        }
    });
}

// Dashboard
async function loadDashboard() {
    const itemsContainer =
        document.querySelector("#myItems");

    const claimsContainer =
        document.querySelector("#myClaims");

    if (!itemsContainer || !claimsContainer) return;

    if (!requireLogin()) return;

    const user = getUser();

    const welcomeName =
        document.querySelector("#welcomeName");

    if (welcomeName) {
        welcomeName.textContent = user?.name || "Student";
    }

    try {
        const [itemsResult, claimsResult] = await Promise.all([
            apiRequest("/items"),
            apiRequest("/claims/my")
        ]);

        const myItems = itemsResult.items.filter(item => {
            const ownerId =
                item.reportedBy?._id || item.reportedBy;

            const currentUserId = user.id || user._id;

            return String(ownerId) === String(currentUserId);
        });

        itemsContainer.innerHTML = myItems.length
            ? myItems.map(item => `
                <div class="item-card">

                    <h3>${escapeHTML(item.name)}</h3>

                    <p>
                        ${escapeHTML(item.type)}
                        ·
                        ${escapeHTML(item.status)}
                    </p>

                    <button
                        class="btn btn-danger btn-small delete-item"
                        data-id="${escapeHTML(item._id)}">

                        Delete

                    </button>

                </div>
            `).join("")
            : '<p class="empty-state">You have not reported any items yet.</p>';

        itemsContainer.querySelectorAll(".delete-item")
            .forEach(button => {
                button.addEventListener("click", async () => {

                    if (!confirm("Delete this listing?")) return;

                    try {
                        await apiRequest(
                            `/items/${button.dataset.id}`,
                            { method: "DELETE" }
                        );

                        loadDashboard();

                    } catch (error) {
                        alert(error.message);
                    }
                });
            });

        claimsContainer.innerHTML = claimsResult.claims.length
            ? claimsResult.claims.map(claim => `
                <div class="item-card">

                    <h3>
                        ${escapeHTML(
                            claim.item?.name || "Item unavailable"
                        )}
                    </h3>

                    <p>${escapeHTML(claim.message)}</p>

                    <p>
                        <strong>Claim status:</strong>
                        ${escapeHTML(claim.status)}
                    </p>

                </div>
            `).join("")
            : '<p class="empty-state">You have not submitted any claims yet.</p>';

    } catch (error) {
        showMessage(
            document.querySelector("#dashboardMessage"),
            error.message,
            "error"
        );
    }
}

// Admin dashboard
async function loadAdmin() {
    if (!document.querySelector("#adminStats")) return;

    if (!requireLogin()) return;

    if (getUser()?.role !== "admin") {
        window.location.href = "/dashboard.html";
        return;
    }

    try {
        const stats = await apiRequest("/admin/stats");

        const statsContainer =
            document.querySelector("#adminStats");

        statsContainer.innerHTML =
            Object.entries(stats).map(([key, value]) => `
                <div class="stat-card">

                    <h3>${escapeHTML(value)}</h3>

                    <p>
                        ${escapeHTML(
                            key.replace(/([A-Z])/g, " $1")
                        )}
                    </p>

                </div>
            `).join("");

        const [itemsData, claimsData] = await Promise.all([
            apiRequest("/items"),
            apiRequest("/admin/claims")
        ]);

        const itemsContainer =
            document.querySelector("#adminItems");

        itemsContainer.innerHTML = itemsData.items.length
            ? itemsData.items.map(item => `
                <div class="item-card">

                    <h3>${escapeHTML(item.name)}</h3>

                    <p>
                        ${escapeHTML(item.type)}
                        ·
                        ${escapeHTML(item.status)}
                    </p>

                    <div class="actions">

                        <button
                            class="btn btn-small status-button"
                            data-id="${escapeHTML(item._id)}"
                            data-status="Available">

                            Available

                        </button>

                        <button
                            class="btn btn-small status-button"
                            data-id="${escapeHTML(item._id)}"
                            data-status="Returned">

                            Returned

                        </button>

                    </div>

                </div>
            `).join("")
            : '<p class="empty-state">No items available.</p>';

        itemsContainer.querySelectorAll(".status-button")
            .forEach(button => {
                button.addEventListener("click", async () => {
                    try {
                        await apiRequest(
                            `/items/${button.dataset.id}/status`,
                            {
                                method: "PATCH",

                                body: JSON.stringify({
                                    status: button.dataset.status
                                })
                            }
                        );

                        loadAdmin();

                    } catch (error) {
                        alert(error.message);
                    }
                });
            });

        const claimsContainer =
            document.querySelector("#adminClaims");

        claimsContainer.innerHTML = claimsData.claims.length
            ? claimsData.claims.map(claim => `
                <div class="item-card">

                    <h3>
                        ${escapeHTML(
                            claim.item?.name || "Item unavailable"
                        )}
                    </h3>

                    <p>
                        Claimed by:
                        ${escapeHTML(
                            claim.claimedBy?.name || "Unknown"
                        )}
                    </p>

                    <p>${escapeHTML(claim.message)}</p>

                    <p>
                        Status:
                        ${escapeHTML(claim.status)}
                    </p>

                    ${claim.status === "Pending" ? `
                        <div class="actions">

                            <button
                                class="btn btn-success btn-small review-claim"
                                data-id="${escapeHTML(claim._id)}"
                                data-status="Approved">

                                Approve

                            </button>

                            <button
                                class="btn btn-danger btn-small review-claim"
                                data-id="${escapeHTML(claim._id)}"
                                data-status="Rejected">

                                Reject

                            </button>

                        </div>
                    ` : ""}

                </div>
            `).join("")
            : '<p class="empty-state">No claims submitted.</p>';

        claimsContainer.querySelectorAll(".review-claim")
            .forEach(button => {
                button.addEventListener("click", async () => {
                    try {
                        await apiRequest(
                            `/admin/claims/${button.dataset.id}`,
                            {
                                method: "PATCH",

                                body: JSON.stringify({
                                    status: button.dataset.status
                                })
                            }
                        );

                        loadAdmin();

                    } catch (error) {
                        alert(error.message);
                    }
                });
            });

    } catch (error) {
        showMessage(
            document.querySelector("#adminMessage"),
            error.message,
            "error"
        );
    }
}

// Run after page loads
document.addEventListener("DOMContentLoaded", () => {

    renderNavigation();

    setupLogin();

    setupRegister();

    setupReport();

    document.querySelector("#searchForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();
            loadItems();
        });

    document.querySelector("#resetSearch")
        ?.addEventListener("click", () => {
            document.querySelector("#searchForm")?.reset();
            loadItems();
        });

    loadItems();

    loadDashboard();

    loadAdmin();

});