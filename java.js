"use strict";

const header = document.querySelector("header");

if (header) {
    window.addEventListener("scroll", () => {
        header.classList.toggle("sticky", window.scrollY > 0);
    });
}

const menuButton = document.querySelector("#menu-icon");
const navMenu = document.querySelector(".navmenu");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("open");
        menuButton.classList.toggle("bx-x", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("open");
            menuButton.classList.remove("bx-x");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open menu");
        });
    });
}

document.querySelectorAll(".heart-icon").forEach((wrapper) => {
    const icon = wrapper.querySelector("i");

    if (!icon) return;

    wrapper.addEventListener("click", () => {
        const isLiked = icon.classList.toggle("liked");
        icon.classList.toggle("bx-heart", !isLiked);
        icon.classList.toggle("bxs-heart", isLiked);
        wrapper.classList.remove("burst");
        void wrapper.offsetWidth;
        wrapper.classList.add("burst");
    });
});

const searchToggle = document.querySelector("#search-toggle");
const searchForm = document.querySelector("#product-search-form");
const searchInput = document.querySelector("#product-search");
const searchStatus = document.querySelector("#search-status");
const productCards = Array.from(document.querySelectorAll(".products .row"));

if (searchToggle && searchForm && searchInput && searchStatus) {
    searchToggle.addEventListener("click", () => {
        const isOpening = searchForm.hidden;
        searchForm.hidden = !isOpening;
        searchToggle.setAttribute("aria-expanded", String(isOpening));

        if (isOpening) searchInput.focus();
    });

    const filterProducts = () => {
        const query = searchInput.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        productCards.forEach((card) => {
            const matches = card.textContent.toLocaleLowerCase().includes(query);
            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        if (query) {
            searchStatus.textContent = visibleCount === 1
                ? "1 product found."
                : `${visibleCount} products found.`;
        } else {
            searchStatus.textContent = `${visibleCount} products in the collection.`;
        }
    };

    searchInput.addEventListener("input", filterProducts);
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        filterProducts();
        document.querySelector("#trending")?.scrollIntoView({ behavior: "smooth" });
    });
}

const accountPage = document.querySelector("#account-page");

if (accountPage) {
    const accountTabs = Array.from(accountPage.querySelectorAll("[data-account-tab]"));
    const accountForms = Array.from(accountPage.querySelectorAll("[data-account-form]"));
    const accountStatus = accountPage.querySelector("#account-status");
    const sessionPanel = accountPage.querySelector("#account-session");
    const logoutButton = accountPage.querySelector("#account-logout");
    const storageKey = "kumo-demo-accounts";
    const sessionKey = "kumo-demo-session";

    const showStatus = (message, isError = false) => {
        accountStatus.textContent = message;
        accountStatus.classList.toggle("is-error", isError);
    };

    const showAccountView = (view) => {
        accountTabs.forEach((tab) => {
            const isSelected = tab.dataset.accountTab === view;
            tab.setAttribute("aria-pressed", String(isSelected));
        });
        accountForms.forEach((form) => {
            form.hidden = form.dataset.accountForm !== view;
        });
        showStatus("");
    };

    const readAccounts = () => {
        const storedAccounts = localStorage.getItem(storageKey);
        if (!storedAccounts) return {};

        const accounts = JSON.parse(storedAccounts);
        if (!accounts || Array.isArray(accounts) || typeof accounts !== "object") {
            throw new Error("The saved demo account data is invalid. Clear this site's browser storage and try again.");
        }
        return accounts;
    };

    const derivePasswordHash = async (password, salt) => {
        if (!window.crypto?.subtle) {
            throw new Error("Secure password checks are not available in this browser. Open the site using localhost or HTTPS.");
        }

        const key = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const hash = await window.crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
            key,
            256
        );
        return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
    };

    const displaySession = () => {
        const email = sessionStorage.getItem(sessionKey);
        if (!email) return;

        sessionPanel.hidden = false;
        sessionPanel.querySelector("[data-session-email]").textContent = email;
    };

    accountTabs.forEach((tab) => {
        tab.addEventListener("click", () => showAccountView(tab.dataset.accountTab));
    });

    accountPage.querySelector("#register-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = form.elements.email.value.trim().toLocaleLowerCase();
        const password = form.elements.password.value;
        const confirmation = form.elements.confirmPassword.value;

        if (password.length < 8) {
            showStatus("Choose a password with at least 8 characters.", true);
            return;
        }
        if (password !== confirmation) {
            showStatus("Those passwords do not match.", true);
            return;
        }

        try {
            const accounts = readAccounts();
            if (accounts[email]) {
                showStatus("An account already exists for that email. Try signing in instead.", true);
                return;
            }

            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            accounts[email] = {
                salt: Array.from(salt, (byte) => byte.toString(16).padStart(2, "0")).join(""),
                passwordHash: await derivePasswordHash(password, salt)
            };
            localStorage.setItem(storageKey, JSON.stringify(accounts));
            sessionStorage.setItem(sessionKey, email);
            form.reset();
            showStatus("Your demo account is ready.");
            displaySession();
        } catch (error) {
            showStatus(error instanceof Error ? error.message : "The account could not be created.", true);
        }
    });

    accountPage.querySelector("#login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = form.elements.email.value.trim().toLocaleLowerCase();
        const password = form.elements.password.value;

        try {
            const account = readAccounts()[email];
            if (!account || !/^[a-f0-9]{32}$/.test(account.salt) || !/^[a-f0-9]{64}$/.test(account.passwordHash)) {
                showStatus("We could not find a demo account with those details.", true);
                return;
            }

            const salt = Uint8Array.from(account.salt.match(/.{2}/g), (byte) => parseInt(byte, 16));
            const passwordHash = await derivePasswordHash(password, salt);
            if (passwordHash !== account.passwordHash) {
                showStatus("The email or password is incorrect.", true);
                return;
            }

            sessionStorage.setItem(sessionKey, email);
            form.reset();
            showStatus("You are signed in.");
            displaySession();
        } catch (error) {
            showStatus(error instanceof Error ? error.message : "Sign-in could not be completed.", true);
        }
    });

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem(sessionKey);
        sessionPanel.hidden = true;
        showStatus("You have signed out.");
    });

    displaySession();
    showAccountView("login");
}
