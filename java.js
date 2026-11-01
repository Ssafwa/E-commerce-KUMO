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

const productCards = Array.from(document.querySelectorAll(".products .row"));
const productDetails = [
    { category: "sets", description: "A relaxed outfit with a light top and patterned trousers. The easy shape makes it a versatile pick for everyday wear." },
    { category: "bottoms", description: "A casual look featuring a dark jacket and warm-toned shorts. Pair the shorts with a simple tee for an easy weekend outfit." },
    { category: "sets", description: "A playful printed shorts outfit with a soft pink top. A casual set for warm days and laid-back plans." },
    { category: "dresses", description: "A flowing floral maxi dress in a bright, warm palette. The full-length shape makes it an easy one-piece outfit." },
    { category: "bottoms", description: "Dark straight-leg jeans styled with a simple top. An everyday denim shape that pairs easily with tees, shirts, or knits." },
    { category: "sets", description: "A printed kurta and coordinating light trousers. A classic two-piece look with a subtle all-over pattern." },
    { category: "sets", description: "A patterned top paired with light, relaxed trousers. Wear the pieces together or style them separately." },
    { category: "sets", description: "A blue denim jacket styled with relaxed olive trousers. Wear the jacket over a simple tee for an easy layered look." },
    { category: "menswear", description: "A smart-casual button-up shirt with a soft collar and an easy everyday silhouette. Pair with trousers or denim." }
];
const catalog = productCards.map((card, index) => {
    const name = card.querySelector(".price h4")?.textContent.trim() || `Product ${index + 1}`;
    const priceText = card.querySelector(".price p")?.textContent || "";
    const price = Number(priceText.match(/\$([\d,]+(?:\.\d{2})?)/)?.[1]?.replaceAll(",", ""));
    const details = productDetails[index];

    if (!details || !Number.isFinite(price) || price <= 0) {
        throw new Error(`Product details or a valid starting price are missing for ${name}.`);
    }

    const productId = String(index);
    card.dataset.productId = productId;
    card.dataset.category = details.category;
    card.dataset.price = String(price);

    const image = card.querySelector("img");
    if (image && !image.alt) image.alt = name;

    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "product-details-button";
    detailsButton.dataset.showDetails = productId;
    detailsButton.textContent = "Quick view";

    const buyControls = document.createElement("div");
    buyControls.className = "product-buy-controls";
    const sizeLabel = document.createElement("label");
    sizeLabel.className = "product-size-label";
    sizeLabel.htmlFor = `product-size-${index}`;
    sizeLabel.textContent = "Size / length";
    const sizeSelect = document.createElement("select");
    sizeSelect.className = "product-size";
    sizeSelect.id = `product-size-${index}`;
    sizeSelect.setAttribute("aria-label", `Choose size or length for ${name}`);
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Choose size";
    sizeSelect.append(placeholderOption);
    ["XS", "S", "M", "L", "XL", "XXL"].forEach((size) => {
        const option = document.createElement("option");
        option.value = size;
        option.textContent = size;
        sizeSelect.append(option);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-to-cart";
    addButton.dataset.addToCart = productId;
    addButton.textContent = "Add to bag";
    addButton.setAttribute("aria-label", `Add ${name} to bag`);
    addButton.disabled = true;
    sizeSelect.addEventListener("change", () => {
        addButton.disabled = !sizeSelect.value;
        addButton.setAttribute("aria-label", `Add ${name}, size ${sizeSelect.value || "not selected"}, to bag`);
    });
    buyControls.append(sizeLabel, sizeSelect, addButton);
    card.append(detailsButton, buyControls);

    return {
        id: productId,
        name,
        price,
        image: image?.getAttribute("src") || "",
        category: details.category,
        description: details.description,
        featuredOrder: index,
        sizes: ["XS", "S", "M", "L", "XL", "XXL"]
    };
});

const ratingStorageKey = "kumo-demo-ratings";
const favoritesStorageKey = "kumo-demo-favorites";
const readLocalList = (key) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};
let favorites = readLocalList(favoritesStorageKey).filter((id) => catalog.some((product) => product.id === id));
let ratings = readLocalList(ratingStorageKey).filter((entry) =>
    entry && catalog.some((product) => product.id === entry.id)
    && Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5
);

const renderRating = (card, product) => {
    const ratingGroup = card.querySelector(".ratting");
    if (!ratingGroup) return;

    const ownRating = ratings.find((entry) => entry.id === product.id)?.rating || 0;
    const summary = ratings.filter((entry) => entry.id === product.id);
    const average = summary.length
        ? summary.reduce((total, entry) => total + entry.rating, 0) / summary.length
        : 0;
    ratingGroup.replaceChildren();
    ratingGroup.setAttribute("role", "radiogroup");
    ratingGroup.setAttribute("aria-label", `Rate ${product.name}`);
    ratingGroup.onmouseleave = () => renderRating(card, product);

    const saveRating = (rating) => {
        const previousRatings = ratings;
        ratings = ratings.filter((entry) => entry.id !== product.id);
        ratings.push({ id: product.id, rating });
        try {
            localStorage.setItem(ratingStorageKey, JSON.stringify(ratings));
            renderRating(card, product);
            card.querySelectorAll(".rating-star")[rating - 1]?.focus();
        } catch {
            ratings = previousRatings;
            renderRating(card, product);
            window.alert("Your rating could not be saved in this browser.");
        }
    };

    for (let rating = 1; rating <= 5; rating += 1) {
        const button = document.createElement("button");
        const icon = document.createElement("i");
        button.type = "button";
        button.className = "rating-star";
        button.setAttribute("role", "radio");
        button.setAttribute("aria-label", `${rating} out of 5 stars`);
        button.setAttribute("aria-checked", String(ownRating === rating));
        button.tabIndex = ownRating === rating || (!ownRating && rating === 1) ? 0 : -1;
        icon.className = `bx ${rating <= Math.round(average) ? "bxs-star" : "bx-star"}`;
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);
        ratingGroup.append(button);

        button.addEventListener("mouseenter", () => {
            ratingGroup.querySelectorAll(".rating-star").forEach((star, index) => {
                star.querySelector("i").classList.toggle("bxs-star", index < rating);
                star.querySelector("i").classList.toggle("bx-star", index >= rating);
            });
        });
        button.addEventListener("click", () => saveRating(rating));
        button.addEventListener("keydown", (event) => {
            let nextRating;
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                nextRating = rating === 5 ? 1 : rating + 1;
            } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                nextRating = rating === 1 ? 5 : rating - 1;
            } else if (event.key === "Home") {
                nextRating = 1;
            } else if (event.key === "End") {
                nextRating = 5;
            } else {
                return;
            }

            event.preventDefault();
            saveRating(nextRating);
            card.querySelectorAll(".rating-star")[nextRating - 1].focus();
        });
    }

    const score = document.createElement("span");
    score.className = "rating-summary";
    score.textContent = summary.length ? `${average.toFixed(1)} (${summary.length})` : "Rate this item";
    ratingGroup.append(score);
};

productCards.forEach((card, index) => {
    const product = catalog[index];
    renderRating(card, product);

    const favoriteButton = card.querySelector(".heart-icon");
    if (!favoriteButton) return;
    favoriteButton.setAttribute("role", "button");
    favoriteButton.setAttribute("tabindex", "0");

    const updateFavorite = () => {
        const isFavorite = favorites.includes(product.id);
        favoriteButton.setAttribute("aria-pressed", String(isFavorite));
        favoriteButton.setAttribute("aria-label", `${isFavorite ? "Remove" : "Save"} ${product.name} ${isFavorite ? "from" : "to"} favorites`);
        favoriteButton.querySelector("i")?.classList.toggle("bxs-heart", isFavorite);
        favoriteButton.querySelector("i")?.classList.toggle("bx-heart", !isFavorite);
    };
    const toggleFavorite = () => {
        const previousFavorites = favorites;
        favorites = favorites.includes(product.id)
            ? favorites.filter((id) => id !== product.id)
            : [...favorites, product.id];
        try {
            localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
            updateFavorite();
            applyProductFilters();
        } catch {
            favorites = previousFavorites;
            updateFavorite();
            window.alert("This favorite could not be saved in your browser.");
        }
    };

    favoriteButton.addEventListener("click", toggleFavorite);
    favoriteButton.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleFavorite();
        }
    });
    updateFavorite();
});

const searchToggle = document.querySelector("#search-toggle");
const searchForm = document.querySelector("#product-search-form");
const searchInput = document.querySelector("#product-search");
const searchStatus = document.querySelector("#search-status");
const categoryFilter = document.querySelector("#category-filter");
const priceFilter = document.querySelector("#price-filter");
const sizeFilter = document.querySelector("#size-filter");
const sortProducts = document.querySelector("#sort-products");
const favoritesFilter = document.querySelector("#favorites-filter");
const filterStatus = document.querySelector("#filter-status");
const productGrid = document.querySelector(".products");
let searchQuery = "";
let showFavoritesOnly = false;

const applyProductFilters = () => {
    if (!productGrid) return;

    const category = categoryFilter?.value || "all";
    const maxPrice = priceFilter?.value === "all" ? Infinity : Number(priceFilter?.value);
    const size = sizeFilter?.value || "all";
    let visibleCount = 0;

    productCards.forEach((card, index) => {
        const product = catalog[index];
        const searchableText = `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase();
        const matches = searchableText.includes(searchQuery)
            && (category === "all" || product.category === category)
            && product.price <= maxPrice
            && (size === "all" || product.sizes.includes(size))
            && (!showFavoritesOnly || favorites.includes(product.id));
        card.hidden = !matches;
        if (matches) visibleCount += 1;
    });

    const sort = sortProducts?.value || "featured";
    const sortedCards = [...productCards].sort((first, second) => {
        const firstProduct = catalog[Number(first.dataset.productId)];
        const secondProduct = catalog[Number(second.dataset.productId)];
        if (sort === "name-asc") return firstProduct.name.localeCompare(secondProduct.name);
        if (sort === "price-asc") return firstProduct.price - secondProduct.price;
        if (sort === "price-desc") return secondProduct.price - firstProduct.price;
        return firstProduct.featuredOrder - secondProduct.featuredOrder;
    });
    sortedCards.forEach((card) => productGrid.append(card));

    filterStatus.textContent = showFavoritesOnly && favorites.length === 0
        ? "No saved favorites yet. Tap a heart to save a product."
        : `${visibleCount} ${visibleCount === 1 ? "product" : "products"} shown.`;
};

if (searchToggle && searchForm && searchInput && searchStatus) {
    searchToggle.addEventListener("click", () => {
        const isOpening = searchForm.hidden;
        searchForm.hidden = !isOpening;
        searchToggle.setAttribute("aria-expanded", String(isOpening));

        if (isOpening) searchInput.focus();
    });

    searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLocaleLowerCase();
        applyProductFilters();
        searchStatus.textContent = filterStatus.textContent;
    });
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        searchQuery = searchInput.value.trim().toLocaleLowerCase();
        applyProductFilters();
        searchStatus.textContent = filterStatus.textContent;
        document.querySelector("#trending")?.scrollIntoView({ behavior: "smooth" });
    });
}

[
    categoryFilter,
    priceFilter,
    sizeFilter,
    sortProducts
].forEach((control) => control?.addEventListener("change", applyProductFilters));

favoritesFilter?.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesFilter.setAttribute("aria-pressed", String(showFavoritesOnly));
    applyProductFilters();
});

document.querySelector("#clear-filters")?.addEventListener("click", () => {
    if (categoryFilter) categoryFilter.value = "all";
    if (priceFilter) priceFilter.value = "all";
    if (sizeFilter) sizeFilter.value = "all";
    if (sortProducts) sortProducts.value = "featured";
    if (searchInput) searchInput.value = "";
    searchQuery = "";
    showFavoritesOnly = false;
    favoritesFilter?.setAttribute("aria-pressed", "false");
    applyProductFilters();
    if (searchStatus) searchStatus.textContent = "";
});

applyProductFilters();

const detailsDialog = document.querySelector("#product-details");
const detailsBackdrop = document.querySelector("#details-backdrop");
if (detailsDialog && detailsBackdrop) {
    const closeDetails = () => {
        detailsDialog.hidden = true;
        detailsBackdrop.hidden = true;
    };

    document.querySelectorAll("[data-show-details]").forEach((button) => {
        button.addEventListener("click", () => {
            const product = catalog[Number(button.dataset.showDetails)];
            if (!product) return;
            document.querySelector("#details-title").dataset.productId = button.dataset.showDetails;
            document.querySelector("#details-image").src = product.image;
            document.querySelector("#details-image").alt = product.name;
            document.querySelector("#details-title").textContent = product.name;
            document.querySelector("#details-category").textContent = {
                sets: "Sets & outfits",
                bottoms: "Trousers & shorts",
                dresses: "Dresses & kurtas",
                menswear: "Men's clothing"
            }[product.category];
            document.querySelector("#details-price").textContent = `From $${product.price.toFixed(2)}`;
            document.querySelector("#details-description").textContent = product.description;
            detailsDialog.hidden = false;
            detailsBackdrop.hidden = false;
            document.querySelector("#details-close").focus();
        });
    });

    const detailsShop = document.querySelector("#details-shop");
    detailsShop.addEventListener("click", () => {
        const productId = Number(document.querySelector("#details-title").dataset.productId);
        const selector = document.querySelector(`#product-size-${productId}`);
        closeDetails();
        selector?.focus();
    });
    document.querySelector("#details-close").addEventListener("click", closeDetails);
    detailsBackdrop.addEventListener("click", closeDetails);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !detailsDialog.hidden) closeDetails();
    });
}

const cartToggle = document.querySelector("#cart-toggle");
const cartPanel = document.querySelector("#cart-panel");
const cartBackdrop = document.querySelector("#cart-backdrop");

if (cartToggle && cartPanel && cartBackdrop) {
    const cartItemsElement = document.querySelector("#cart-items");
    const cartCountElement = document.querySelector("#cart-count");
    const cartSubtotalElement = document.querySelector("#cart-subtotal");
    const cartEmptyElement = document.querySelector("#cart-empty");
    const cartStatusElement = document.querySelector("#cart-status");
    const checkoutToggle = document.querySelector("#checkout-toggle");
    const checkoutForm = document.querySelector("#checkout-form");
    const orderConfirmation = document.querySelector("#order-confirmation");
    const keepShoppingButton = document.querySelector("#keep-shopping");
    const cartStorageKey = "kumo-demo-cart";
    let cart = [];

    try {
        const savedCart = localStorage.getItem(cartStorageKey);
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (!Array.isArray(parsedCart) || parsedCart.some((item) =>
                !item || !/^\d+$/.test(item.id) || !Number.isInteger(item.quantity)
                || item.quantity < 1 || item.quantity > 99
                || !catalog.some((product) => product.id === item.id)
            )) {
                throw new Error("Saved cart data is invalid. Clear this site's browser storage and try again.");
            }
            const restoredCart = parsedCart.map((item) => ({
                ...item,
                size: item.size || "M"
            }));
            if (restoredCart.some((item) => !["XS", "S", "M", "L", "XL", "XXL"].includes(item.size))) {
                throw new Error("Saved cart sizes are invalid. Clear this site's browser storage and try again.");
            }
            cart = restoredCart;
        }
    } catch (error) {
        cartStatusElement.textContent = error instanceof Error
            ? error.message
            : "Your saved cart could not be loaded.";
        cartStatusElement.classList.add("is-error");
    }

    const saveCart = () => {
        try {
            localStorage.setItem(cartStorageKey, JSON.stringify(cart));
            cartStatusElement.textContent = "";
            cartStatusElement.classList.remove("is-error");
            return true;
        } catch {
            cartStatusElement.textContent = "Cart changes could not be saved in this browser.";
            cartStatusElement.classList.add("is-error");
            return false;
        }
    };

    const money = (amount) => `$${amount.toFixed(2)}`;

    const renderCart = () => {
        cartItemsElement.replaceChildren();
        let itemCount = 0;
        let subtotal = 0;

        cart.forEach((item) => {
            const product = catalog.find((entry) => entry.id === item.id);
            if (!product) return;
            itemCount += item.quantity;
            subtotal += product.price * item.quantity;

            const row = document.createElement("div");
            row.className = "cart-item";
            const details = document.createElement("div");
            details.className = "cart-item-details";
            const name = document.createElement("h3");
            name.textContent = product.name;
            const price = document.createElement("p");
            price.textContent = `${money(product.price)} each · Size / length: ${item.size}`;
            details.append(name, price);

            const controls = document.createElement("div");
            controls.className = "cart-item-controls";
            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.dataset.cartAction = "decrease";
            decrease.dataset.productId = item.id;
            decrease.dataset.size = item.size;
            decrease.setAttribute("aria-label", `Remove one ${product.name}`);
            decrease.textContent = "−";
            const quantity = document.createElement("span");
            quantity.textContent = String(item.quantity);
            quantity.setAttribute("aria-label", `Quantity ${item.quantity}`);
            const increase = document.createElement("button");
            increase.type = "button";
            increase.dataset.cartAction = "increase";
            increase.dataset.productId = item.id;
            increase.dataset.size = item.size;
            increase.setAttribute("aria-label", `Add one ${product.name}`);
            increase.textContent = "+";
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "cart-remove";
            remove.dataset.cartAction = "remove";
            remove.dataset.productId = item.id;
            remove.dataset.size = item.size;
            remove.textContent = "Remove";
            controls.append(decrease, quantity, increase, remove);
            row.append(details, controls);
            cartItemsElement.append(row);
        });

        cartCountElement.textContent = String(itemCount);
        cartToggle.setAttribute("aria-label", `Open shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`);
        cartEmptyElement.hidden = cart.length > 0;
        checkoutToggle.disabled = cart.length === 0;
        cartSubtotalElement.textContent = money(subtotal);
    };

    const openCart = () => {
        cartPanel.hidden = false;
        cartBackdrop.hidden = false;
        cartToggle.setAttribute("aria-expanded", "true");
        cartPanel.querySelector("#cart-close").focus();
    };

    const closeCart = () => {
        cartPanel.hidden = true;
        cartBackdrop.hidden = true;
        cartToggle.setAttribute("aria-expanded", "false");
        cartToggle.focus();
    };

    cartToggle.addEventListener("click", openCart);
    keepShoppingButton?.addEventListener("click", () => {
        closeCart();
        document.querySelector("#trending")?.scrollIntoView({ behavior: "smooth" });
    });
    cartPanel.querySelector("#cart-close").addEventListener("click", closeCart);
    cartBackdrop.addEventListener("click", closeCart);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !cartPanel.hidden) closeCart();
    });

    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
        button.addEventListener("click", () => {
            const productId = button.dataset.addToCart;
            const size = button.closest(".product-buy-controls").querySelector(".product-size").value;
            if (!size) {
                cartStatusElement.textContent = "Choose a size or length before adding this product.";
                cartStatusElement.classList.add("is-error");
                return;
            }
            const existingItem = cart.find((item) => item.id === productId && item.size === size);
            if (existingItem) {
                if (existingItem.quantity >= 99) {
                    cartStatusElement.textContent = "You can add up to 99 of each product.";
                    cartStatusElement.classList.add("is-error");
                    return;
                }
                existingItem.quantity += 1;
            } else {
                cart.push({ id: productId, size, quantity: 1 });
            }

            orderConfirmation.hidden = true;
            checkoutForm.hidden = true;
            renderCart();
            saveCart();
            openCart();
        });
    });

    cartItemsElement.addEventListener("click", (event) => {
        const button = event.target.closest("[data-cart-action]");
        if (!button) return;

        const item = cart.find((entry) =>
            entry.id === button.dataset.productId && entry.size === button.dataset.size
        );
        if (!item) return;

        if (button.dataset.cartAction === "increase" && item.quantity < 99) {
            item.quantity += 1;
        } else if (button.dataset.cartAction === "decrease" && item.quantity > 1) {
            item.quantity -= 1;
        } else if (button.dataset.cartAction === "remove"
            || (button.dataset.cartAction === "decrease" && item.quantity === 1)) {
            cart = cart.filter((entry) => entry !== item);
        }

        orderConfirmation.hidden = true;
        renderCart();
        saveCart();
    });

    checkoutToggle.addEventListener("click", () => {
        checkoutForm.hidden = false;
        checkoutForm.querySelector("input").focus();
    });

    checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (cart.length === 0) return;

        const orderReference = `KMO-${Date.now().toString(36).toUpperCase()}`;
        const formData = new FormData(checkoutForm);
        const email = String(formData.get("email")).trim().toLocaleLowerCase();
        const order = {
            reference: orderReference,
            name: String(formData.get("name")).trim(),
            email,
            createdAt: new Date().toISOString(),
            items: cart.map((item) => {
                const product = catalog.find((entry) => entry.id === item.id);
                return {
                    name: product.name,
                    price: product.price,
                    size: item.size,
                    quantity: item.quantity
                };
            }),
            total: cart.reduce((total, item) => {
                const product = catalog.find((entry) => entry.id === item.id);
                return total + product.price * item.quantity;
            }, 0)
        };

        try {
            const previousOrders = JSON.parse(localStorage.getItem("kumo-demo-orders") || "[]");
            if (!Array.isArray(previousOrders)) {
                throw new Error("Saved order history is invalid.");
            }
            localStorage.setItem("kumo-demo-orders", JSON.stringify([...previousOrders, order]));
            localStorage.removeItem(cartStorageKey);
        } catch (error) {
            cartStatusElement.textContent = error instanceof Error
                ? `${error.message} The demo order was not completed.`
                : "The demo order could not be saved.";
            cartStatusElement.classList.add("is-error");
            return;
        }

        cart = [];
        checkoutForm.reset();
        checkoutForm.hidden = true;
        renderCart();
        cartStatusElement.textContent = "";
        cartStatusElement.classList.remove("is-error");
        orderConfirmation.textContent = `Demo order ${orderReference} saved to this browser. No payment was taken and nothing will be shipped.`;
        orderConfirmation.hidden = false;
    });

    renderCart();
}

const accountPage = document.querySelector("#account-page");

if (accountPage) {
    const accountTabs = Array.from(accountPage.querySelectorAll("[data-account-tab]"));
    const accountForms = Array.from(accountPage.querySelectorAll("[data-account-form]"));
    const accountStatus = accountPage.querySelector("#account-status");
    const sessionPanel = accountPage.querySelector("#account-session");
    const logoutButton = accountPage.querySelector("#account-logout");
    const ordersSection = accountPage.querySelector("#account-orders");
    const ordersList = accountPage.querySelector("#order-history-list");
    const ordersEmpty = accountPage.querySelector("#order-history-empty");
    const favoritesList = accountPage.querySelector("#account-favorites-list");
    const favoritesEmpty = accountPage.querySelector("#account-favorites-empty");
    const storageKey = "kumo-demo-accounts";
    const sessionKey = "kumo-demo-session";
    const favoriteNames = [
        "Half Running Set",
        "Utility Shorts",
        "Printed Shorts Set",
        "Floral Maxi Dress",
        "Everyday Straight Jeans",
        "Fancy Salwar Suits",
        "Printed Top & Trousers",
        "Denim Jacket & Trousers",
        "Men's Casual Shirt"
    ];

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

    const renderFavorites = () => {
        favoritesList.replaceChildren();
        const savedIds = readLocalList(favoritesStorageKey)
            .filter((id) => /^\d+$/.test(id) && favoriteNames[Number(id)]);
        favoritesEmpty.hidden = savedIds.length > 0;

        savedIds.forEach((id) => {
            const row = document.createElement("div");
            row.className = "account-order";
            const name = document.createElement("strong");
            name.textContent = favoriteNames[Number(id)];
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "text-button";
            remove.textContent = "Remove";
            remove.addEventListener("click", () => {
                const nextFavorites = readLocalList(favoritesStorageKey).filter((favoriteId) => favoriteId !== id);
                try {
                    localStorage.setItem(favoritesStorageKey, JSON.stringify(nextFavorites));
                    renderFavorites();
                } catch {
                    window.alert("This favorite could not be removed from browser storage.");
                }
            });
            row.append(name, remove);
            favoritesList.append(row);
        });
    };

    const renderOrderHistory = (email) => {
        ordersList.replaceChildren();
        ordersSection.hidden = !email;
        if (!email) return;

        let orders;
        try {
            orders = JSON.parse(localStorage.getItem("kumo-demo-orders") || "[]");
            if (!Array.isArray(orders)) throw new Error("Saved order history is invalid.");
        } catch {
            ordersEmpty.textContent = "Order history could not be read from this browser.";
            ordersEmpty.hidden = false;
            return;
        }

        const customerOrders = orders.filter((order) => order?.email === email).reverse();
        ordersEmpty.textContent = "No demo orders for this email yet.";
        ordersEmpty.hidden = customerOrders.length > 0;

        customerOrders.forEach((order) => {
            const article = document.createElement("article");
            article.className = "account-order";
            const heading = document.createElement("h3");
            heading.textContent = order.reference;
            const date = document.createElement("p");
            const parsedDate = new Date(order.createdAt);
            date.textContent = Number.isNaN(parsedDate.getTime())
                ? "Date unavailable"
                : parsedDate.toLocaleDateString();
            const summary = document.createElement("p");
            summary.textContent = (Array.isArray(order.items) ? order.items : [])
                .map((item) => `${item.name} · ${item.size} × ${item.quantity}`)
                .join(", ");
            const total = document.createElement("strong");
            total.textContent = `Demo total: $${Number(order.total || 0).toFixed(2)}`;
            article.append(heading, date, summary, total);
            ordersList.append(article);
        });
    };

    const displaySession = () => {
        const email = sessionStorage.getItem(sessionKey);
        sessionPanel.hidden = !email;
        if (email) {
            try {
                const account = readAccounts()[email];
                sessionPanel.querySelector("[data-session-name]").textContent =
                    account?.name || email.split("@")[0];
                sessionPanel.querySelector("[data-session-email]").textContent = email;
            } catch (error) {
                showStatus(error instanceof Error ? error.message : "Account details could not be loaded.", true);
            }
        }
        renderOrderHistory(email);
    };

    accountTabs.forEach((tab) => {
        tab.addEventListener("click", () => showAccountView(tab.dataset.accountTab));
    });

    accountPage.querySelector("#register-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = form.elements.name.value.trim();
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
                name,
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
        renderOrderHistory("");
        showStatus("You have signed out.");
    });

    showAccountView("login");
    renderFavorites();
    displaySession();
}
