/**
 * Nour Portfolio - Main Interaction Script
 * Cleaned & Optimized Version
 */

// Configuration & Constants
const ROLE_TYPING_SPEED = 70;
const ROLE_DELETE_SPEED = 40;
const ROLE_DELAY = 1500;
const MOBILE_NAV_BREAKPOINT = 768;
const CARD_SELECTOR = [
    ".about-panel",
    ".about-node",
    ".skills-metric",
    ".skill-group",
    ".project-card",
    ".service-card",
    ".experience-metric",
    ".experience-card",
    ".contact-panel",
    ".contact-form",
    ".contact-item",
    ".contact-availability"
].join(", ");

// Global DOM Elements
const elements = {
    body: document.body,
    themeToggle: document.querySelector(".theme-toggle"),
    menuToggle: document.querySelector(".menu-toggle"),
    navList: document.getElementById("nav-list"),
    heroRoleTyped: document.getElementById("hero-role-typed"),
    matrixCanvas: document.getElementById("matrix-bg"),
    backToTop: document.getElementById("back-to-top")
};

let LIVE_PROJECTS = [
    {
        title: "Bio AI Portfolio | Allaa Saboukh",
        category: "portfolio",
        description: "A premium, high-impact professional portfolio for a Bio AI Engineer, showcasing specialized expertise in medical AI, computer vision, and deep learning systems.",
        details: [
            "Features: Automated AI pipelines, premium UI/UX, and complex data visualization",
            "Specialized: Medical AI (Sugary App), Robotics, and Industrial Automation",
            "Owner: Allaa Saboukh | Bio AI Engineer"
        ],
        stack: ["Bio AI", "PyTorch", "Computer Vision"],
        previewUrl: "https://allaasaboukh.vercel.app/",
        githubUrl: "https://github.com/nour714/Portfolio-Allaa.git",
        visual: "portfolio",
        image: "images/img1.png",
        accent: "#16f2d1",
        accentSoft: "rgba(22, 242, 209, 0.2)"
    },
    {
        title: "Senior Surveyor Portfolio | Hisham Ibrahim",
        category: "portfolio",
        description: "A high-end, luxury-grade digital portfolio for a Senior Surveyor, featuring construction staking, topographic surveys, and large-scale infrastructure projects.",
        details: [
            "Expertise: Topographic Surveys, Construction Staking, Quantity Takeoffs",
            "Signature Projects: Future of Egypt, New Delta, New Alamein City",
            "Technical Stack: AutoCAD Civil 3D, Sokkia Link, Total Station & GPS"
        ],
        stack: ["Civil 3D", "Surveying", "AutoCAD"],
        previewUrl: "https://hisham-five.vercel.app/",
        githubUrl: "https://github.com/nour714/portfolio-Hisham.git",
        visual: "portfolio",
        image: "images/img2.png",
        accent: "#ffd700",
        accentSoft: "rgba(255, 215, 0, 0.15)"
    },
    {
        title: "LUXE | Premium E-commerce",
        category: "web",
        description: "A sophisticated e-commerce platform for a premium fashion brand, focusing on high-end aesthetics, luxury craftsmanship, and a seamless shopping experience.",
        details: [
            "Features: Boutique listings, curated collections, and specialized product showcases",
            "Aesthetics: Minimalist luxury, responsive editorial layout, and smooth transitions",
            "Focus: High-performance frontend delivery for premium brands"
        ],
        stack: ["HTML", "CSS", "UI Systems"],
        previewUrl: "https://luxe-one-virid.vercel.app/",
        githubUrl: "https://github.com/nour714/LUXE.git",
        visual: "web",
        image: "images/img3.png", // Using a consistent preview image for now
        accent: "#a67c52",
        accentSoft: "rgba(166, 124, 82, 0.18)"
    },
     {
        title: "Qahwatuna | Premium Coffee Experience",
        category: "web",
        description: "A luxurious specialty coffee shop website featuring a curated menu, artisan brewing processes, and an immersive gallery. Designed to evoke the vibe of high-end cafes.",
        details: [
            "Features: Dynamic menu categories, interactive gallery, and location integration",
            "Aesthetics: Warm artisan tones, premium typography, and fluid GSAP animations",
            "Outcome: A digital sanctuary for coffee enthusiasts and specialty brands"
        ],
        stack: ["GSAP", "Specialty UI", "Scroll Reveal"],
        previewUrl: "https://qahwatuna.vercel.app/",
        githubUrl: "https://github.com/nour714/Qahwatuna.git",
        visual: "web",
        image: "images/img4.png",
        accent: "#d4a373",
        accentSoft: "rgba(212, 163, 115, 0.2)"
    }
];

let typingTimer = 0;
let typingRunId = 0;

const defaultServiceIcons = Array.from(document.querySelectorAll(".service-card .service-icon-box"))
    .map((icon) => icon.innerHTML);

const defaultSkillIcons = new Map(
    Array.from(document.querySelectorAll(".skill-chip")).map((chip) => [
        chip.querySelector("span:last-child")?.textContent?.trim() || "",
        chip.querySelector(".skill-icon")?.outerHTML || ""
    ])
);

const SERVICE_SHOWCASE_PRESETS = [
    {
        eyebrow: "Portfolio Systems",
        tags: ["CV Sites", "Business Web", "Landing Pages"]
    },
    {
        eyebrow: "Product Engineering",
        tags: ["Frontend UI", "Backend Logic", "Full Stack"]
    },
    {
        eyebrow: "Growth Infrastructure",
        tags: ["API Integration", "Databases", "Maintenance"]
    }
];

const prefetchedPreviewUrls = new Set();
const loadedPreviewUrls = new Set();

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
}[char]));

const toCleanArray = (value) => Array.isArray(value)
    ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];

const getServicePreset = (index = 0) => {
    if (!SERVICE_SHOWCASE_PRESETS.length) {
        return { eyebrow: "Digital Services", tags: [] };
    }

    return SERVICE_SHOWCASE_PRESETS[index % SERVICE_SHOWCASE_PRESETS.length];
};

const getServiceEyebrow = (service = {}, index = 0) => {
    const explicit = String(service.eyebrow || service.category || "").trim();
    return explicit || getServicePreset(index).eyebrow;
};

const getServiceTags = (service = {}, index = 0) => {
    const explicit = toCleanArray(service.tags);
    return explicit.length ? explicit.slice(0, 3) : getServicePreset(index).tags;
};

const setTextIfPresent = (selector, value, root = document) => {
    const el = root.querySelector(selector);
    const text = String(value ?? "").trim();
    if (el && text) el.textContent = text;
};

const setHtmlIfPresent = (selector, html, root = document) => {
    const el = root.querySelector(selector);
    if (el && html) el.innerHTML = html;
};

const setLinkIfPresent = (selector, { text = "", href = "" } = {}, root = document) => {
    const el = root.querySelector(selector);
    if (!el) return;
    if (String(text).trim()) el.textContent = text;
    if (String(href).trim()) el.setAttribute("href", href);
};

const setImageIfPresent = (selector, { src = "", alt = "" } = {}, root = document) => {
    const el = root.querySelector(selector);
    if (!el) return;
    if (String(src).trim()) {
        el.setAttribute("src", src);
        el.setAttribute("data-fallback-src", src);
    }
    if (String(alt).trim()) {
        el.setAttribute("alt", alt);
    }
};

const fallbackBadge = (value = "") => escapeHtml(
    String(value)
        .trim()
        .split(/\s+/)
        .map((part) => part[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "UI"
);

const extractWhatsAppLabel = (url = "", fallback = "") => {
    const match = String(url).match(/wa\.me\/(\d+)/i);
    return match?.[1] || fallback || url;
};

const normalizeProjectItem = (project = {}, index = 0) => {
    const fallback = LIVE_PROJECTS[index] || {};
    const details = toCleanArray(project.details).length
        ? toCleanArray(project.details)
        : toCleanArray(project.highlights).length
            ? toCleanArray(project.highlights)
            : toCleanArray(fallback.details);
    const stack = toCleanArray(project.stack).length
        ? toCleanArray(project.stack)
        : toCleanArray(project.tech).length
            ? toCleanArray(project.tech)
            : toCleanArray(project.meta).length
                ? toCleanArray(project.meta)
                : toCleanArray(fallback.stack);

    return {
        ...fallback,
        ...project,
        title: project.title || fallback.title || "",
        category: String(project.category || fallback.category || "").trim().toLowerCase(),
        description: project.description || fallback.description || "",
        details,
        stack,
        previewUrl: project.previewUrl || fallback.previewUrl || "#",
        githubUrl: project.githubUrl || fallback.githubUrl || "#",
        visual: project.visual || fallback.visual || "generic",
        image: project.image || fallback.image || "",
        accent: project.accent || fallback.accent || "#16f2d1",
        accentSoft: project.accentSoft || fallback.accentSoft || "rgba(22, 242, 209, 0.2)"
    };
};

const renderAboutMetrics = (metrics = []) => {
    const track = document.querySelector(".about-track");
    if (!track || !metrics.length) return;

    track.innerHTML = metrics.map((item) => `
        <article class="about-node">
            <strong>${escapeHtml(item.value || "")}</strong>
            <span>${escapeHtml(item.label || "")}</span>
        </article>
    `).join("");

    requestAnimationFrame(() => refreshAnimatedCards());
};

const renderSkillGroupsFromData = (groups = []) => {
    const board = document.querySelector(".skills-board");
    if (!board || !groups.length) return;

    board.innerHTML = groups.map((group) => `
        <article class="skill-group interactive-card reveal is-visible">
            <div class="skill-group-head">
                <h3>${escapeHtml(group.title || "")}</h3>
                <span class="skill-group-label">${escapeHtml(group.label || "")}</span>
            </div>
            <ul class="skill-tags">
                ${toCleanArray(group.items).map((item) => `
                    <li class="skill-chip is-visible">
                        ${defaultSkillIcons.get(item) || `<span class="skill-icon fallback-icon" aria-hidden="true">${fallbackBadge(item)}</span>`}
                        <span>${escapeHtml(item)}</span>
                    </li>
                `).join("")}
            </ul>
        </article>
    `).join("");

    requestAnimationFrame(() => refreshAnimatedCards());
};

const renderServiceCardsFromData = (services = []) => {
    const grid = document.querySelector(".services-grid");
    if (!grid || !services.length) return;

    grid.innerHTML = services.map((service, index) => {
        const iconMarkup = (defaultServiceIcons.length
            ? defaultServiceIcons[index % defaultServiceIcons.length]
            : "") || `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3l7 4v5c0 5-3.4 8.7-7 10-3.6-1.3-7-5-7-10V7l7-4z"></path>
                <path d="M9 12l2 2 4-4"></path>
            </svg>
        `;
        const eyebrow = getServiceEyebrow(service, index);
        const tags = getServiceTags(service, index);

        return `
            <article class="service-card interactive-card reveal is-visible">
                <div class="service-card__top">
                    <span class="service-card__eyebrow is-visible">${escapeHtml(eyebrow)}</span>
                    <div class="service-icon-box is-visible">
                        ${iconMarkup}
                    </div>
                </div>
                <div class="service-card__body">
                    <h3 class="is-visible">${escapeHtml(service.title || "")}</h3>
                    <p class="is-visible">${escapeHtml(service.description || "")}</p>
                    ${tags.length ? `
                        <ul class="service-features">
                            ${tags.map((tag) => `<li class="is-visible">${escapeHtml(tag)}</li>`).join("")}
                        </ul>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");

    requestAnimationFrame(() => refreshAnimatedCards());
};

const renderProjectFiltersFromData = (filters = []) => {
    const container = document.querySelector(".project-filters");
    if (!container || !filters.length) return;

    container.innerHTML = filters.map((label, index) => {
        const cleanLabel = String(label || "").trim();
        const filterValue = cleanLabel.toLowerCase();

        return `
            <button class="filter-btn${index === 0 ? " is-active" : ""}" data-filter="${escapeHtml(filterValue)}">
                ${escapeHtml(cleanLabel)}
            </button>
        `;
    }).join("");

    initProjectFilters();
};

const applyPortfolioContent = (data = {}) => {
    if (!data || typeof data !== "object") return;

    if (data.hero) {
        setTextIfPresent(".hero-text h1 span", data.hero.name);
        if (String(data.hero.roles || "").trim() && elements.heroRoleTyped) {
            elements.heroRoleTyped.setAttribute("data-roles", data.hero.roles);
            elements.heroRoleTyped.textContent = data.hero.roles.split("|")[0].trim() || data.hero.roles;
            initTyping();
        }
        setTextIfPresent(".hero-copy", data.hero.summary);
        setImageIfPresent(".hero-avatar-img", { src: data.hero.avatarUrl, alt: data.hero.avatarAlt });
        setLinkIfPresent(".hero-actions a:nth-child(1)", { text: data.hero.primaryText, href: data.hero.primaryUrl });
        setLinkIfPresent(".hero-actions a:nth-child(2)", { text: data.hero.secondaryText, href: data.hero.secondaryUrl });
    }

    if (data.about) {
        setTextIfPresent(".about-status", data.about.status);
        setTextIfPresent(".about-location", data.about.location);
        setTextIfPresent("#about-title", data.about.title);
        setTextIfPresent(".about-copy", data.about.copy);
        setTextIfPresent(".about-signature", data.about.signature);
        renderAboutMetrics(Array.isArray(data.about.metrics) ? data.about.metrics : []);
    }

    if (data.skills) {
        setTextIfPresent("#skills-title", data.skills.title);
        setTextIfPresent(".skills-copy", data.skills.copy);
        renderSkillGroupsFromData(Array.isArray(data.skills.groups) ? data.skills.groups : []);

        if (String(data.skills.note || "").trim()) {
            setHtmlIfPresent(".skills-note", `
                <strong>${escapeHtml(data.skills.noteLabel || "Focus:")}</strong> ${escapeHtml(data.skills.note)}
            `);
        }
    }

    if (data.projects) {
        setTextIfPresent(".live-projects .section-kicker", data.projects.kicker);
        setTextIfPresent("#projects-title", data.projects.title);
        setTextIfPresent(".live-projects-copy", data.projects.copy);
        setTextIfPresent(".live-projects-summary-label", data.projects.summaryLabel);
        setTextIfPresent(".live-projects-summary strong", data.projects.summaryCopy);

        if (Array.isArray(data.projects.items) && data.projects.items.length) {
            LIVE_PROJECTS = data.projects.items.map(normalizeProjectItem);
        }

        if (Array.isArray(data.projects.filters) && data.projects.filters.length) {
            renderProjectFiltersFromData(data.projects.filters);
        }

        const activeFilter = document.querySelector(".project-filters .filter-btn.is-active")?.dataset.filter || "all";
        renderLiveProjects(activeFilter);
    }

    if (data.services) {
        setTextIfPresent("#services-title", data.services.title);
        setTextIfPresent(".services-copy", data.services.copy);
        renderServiceCardsFromData(Array.isArray(data.services.items) ? data.services.items : []);
    }

    if (data.contact) {
        setTextIfPresent("#contact-title", data.contact.title);
        setTextIfPresent(".contact-copy", data.contact.copy);
        setLinkIfPresent(".contact-actions a:nth-child(1)", { text: data.contact.primaryText, href: data.contact.primaryUrl });
        setLinkIfPresent(".contact-actions a:nth-child(2)", { text: data.contact.secondaryText, href: data.contact.secondaryUrl });

        const emailHref = data.contact.email ? `mailto:${data.contact.email}` : "";
        setLinkIfPresent(".contact-item:nth-child(1)", { href: emailHref });
        setTextIfPresent(".contact-item:nth-child(1) .contact-value", data.contact.email);
        setLinkIfPresent(".contact-item:nth-child(2)", { href: data.contact.whatsapp });
        setTextIfPresent(".contact-item:nth-child(2) .contact-value", extractWhatsAppLabel(data.contact.whatsapp, document.querySelector(".contact-item:nth-child(2) .contact-value")?.textContent?.trim() || ""));
        setTextIfPresent(".contact-item:nth-child(3) .contact-value", data.contact.location);
        setTextIfPresent(".contact-item:nth-child(4) .contact-value", data.contact.linkedinLabel);
        setTextIfPresent(".contact-item:nth-child(5) .contact-value", data.contact.githubLabel);
        setTextIfPresent(".contact-availability-title", data.contact.availabilityTitle);
        setTextIfPresent(".contact-availability-copy", data.contact.availabilityCopy);
        setTextIfPresent(".contact-panel-head h3", data.contact.panelTitle);
        setTextIfPresent(".contact-panel-head p", data.contact.panelCopy);
        setTextIfPresent(".contact-form-head h3", data.contact.formTitle);
        setTextIfPresent(".contact-form-head p", data.contact.formCopy);
        setTextIfPresent("#contact-status-note", data.contact.formNote);
        setTextIfPresent(".contact-form button[type='submit']", data.contact.formSubmit);
    }

    if (data.social) {
        document.querySelectorAll(".hero-social-link[aria-label*='GitHub'], footer a[aria-label='GitHub'], .contact-item[href*='github.com']")
            .forEach((link) => {
                if (String(data.social.github || "").trim()) link.setAttribute("href", data.social.github);
            });

        document.querySelectorAll(".hero-social-link[aria-label*='LinkedIn'], footer a[aria-label='LinkedIn'], .contact-item[href*='linkedin.com']")
            .forEach((link) => {
                if (String(data.social.linkedin || "").trim()) link.setAttribute("href", data.social.linkedin);
            });

        document.querySelectorAll(".hero-social-link[aria-label*='WhatsApp'], footer a[aria-label='WhatsApp']")
            .forEach((link) => {
                if (String(data.social.whatsapp || "").trim()) link.setAttribute("href", data.social.whatsapp);
            });

        if (String(data.social.email || "").trim()) {
            setTextIfPresent(".contact-item:nth-child(1) .contact-value", data.social.email);
            setLinkIfPresent(".contact-item:nth-child(1)", { href: `mailto:${data.social.email}` });
        }
    }
};

const buildProjectPreviewButton = (project, index) => `
    <button
        type="button"
        class="live-project-link live-project-link--primary"
        data-project-preview="${index}"
        aria-label="Open live preview for ${escapeHtml(project.title)}"
    >
        <span>Live Preview</span>
    </button>
`;

const buildGithubLink = (project) => `
    <a
        class="live-project-link live-project-link--secondary"
        href="${escapeHtml(project.githubUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View GitHub repository for ${escapeHtml(project.title)}"
    >
        <span>GitHub</span>
        <span class="live-project-link__icon">&rarr;</span>
    </a>
`;

const buildProjectVisual = (project) => {
    if (project.image) {
        return `
            <div class="live-project-card__visual live-project-card__visual--image" aria-hidden="true" 
                 style="background-image: url('${escapeHtml(project.image)}');">
            </div>
        `;
    }

    if (project.visual === "portfolio") {
        return `
            <div class="live-project-card__visual live-project-card__visual--portfolio" aria-hidden="true">
                <div class="live-project-mini-window">
                    <div class="live-project-mini-window__bar">
                        <span class="live-project-mini-window__dot"></span>
                        <span class="live-project-mini-window__dot"></span>
                        <span class="live-project-mini-window__dot"></span>
                    </div>
                    <div class="live-project-mini-window__body">
                        <div class="live-project-mini-nav">
                            <span class="live-project-mini-brand">Nour</span>
                            <span class="live-project-mini-tab is-active">Home</span>
                            <span class="live-project-mini-tab">Projects</span>
                            <span class="live-project-mini-tab">Contact</span>
                        </div>
                        <div class="live-project-mini-hero">
                            <div class="live-project-mini-copy">
                                <span class="live-project-mini-kicker">AI Engineer</span>
                                <strong>Hi, I'm Nour</strong>
                                <span class="live-project-mini-line"></span>
                                <span class="live-project-mini-line live-project-mini-line--short"></span>
                            </div>
                            <div class="live-project-mini-avatar"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="live-project-card__visual live-project-card__visual--${escapeHtml(project.visual || "generic")}" aria-hidden="true">
            <div class="live-project-visual-grid">
                <span class="live-project-visual-block live-project-visual-block--wide"></span>
                <span class="live-project-visual-block"></span>
                <span class="live-project-visual-block"></span>
                <span class="live-project-visual-block live-project-visual-block--tall"></span>
                <span class="live-project-visual-block"></span>
            </div>
        </div>
    `;
};

const renderLiveProjects = (filter = "all") => {
    const grid = document.getElementById("live-projects-grid");
    if (!grid) return;

    const filteredProjects = filter === "all" 
        ? LIVE_PROJECTS 
        : LIVE_PROJECTS.filter(p => p.category === filter);

    grid.innerHTML = filteredProjects.map((project, idx) => {
        // Re-find the real index in the global array for the modal
        const globalIndex = LIVE_PROJECTS.indexOf(project);
        
        return `
            <article class="project-card live-project-card is-visible" 
                     style="--project-accent: ${project.accent}; --project-accent-soft: ${project.accentSoft}; animation: cardFadeIn 0.5s ease forwards ${idx * 0.1}s; opacity: 0;">
                ${buildProjectVisual(project)}

                <div class="live-project-card__body">
                    <h3 class="live-project-card__title">${escapeHtml(project.title)}</h3>
                    <p class="live-project-card__description">${escapeHtml(project.description)}</p>
                </div>

                <ul class="live-project-tags" aria-label="${escapeHtml(project.title)} tech stack">
                    ${project.stack.map((tag) => `<li class="live-project-tag is-visible">${escapeHtml(tag)}</li>`).join("")}
                </ul>

                <div class="live-project-card__actions">
                    ${buildProjectPreviewButton(project, globalIndex)}
                    ${buildGithubLink(project)}
                </div>
            </article>
        `;
    }).join("");

    requestAnimationFrame(() => refreshAnimatedCards());
};

/**
 * Project Filtering System
 */
const initProjectFilters = () => {
    const filterContainer = document.querySelector(".project-filters");
    if (!filterContainer) return;

    const buttons = filterContainer.querySelectorAll(".filter-btn");
    
    buttons.forEach(btn => {
        if (btn.dataset.filterBound === "true") return;
        btn.dataset.filterBound = "true";
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;
            
            // UI Update
            buttons.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            
            // Re-render
            renderLiveProjects(filter);
        });
    });
};

const prefetchProjectPreview = (project) => {
    if (!project?.previewUrl || prefetchedPreviewUrls.has(project.previewUrl)) return;

    prefetchedPreviewUrls.add(project.previewUrl);

    try {
        const previewUrl = new URL(project.previewUrl, window.location.href);

        if (previewUrl.origin !== window.location.origin) {
            const preconnect = document.createElement("link");
            preconnect.rel = "preconnect";
            preconnect.href = previewUrl.origin;
            document.head.appendChild(preconnect);

            const dnsPrefetch = document.createElement("link");
            dnsPrefetch.rel = "dns-prefetch";
            dnsPrefetch.href = previewUrl.origin;
            document.head.appendChild(dnsPrefetch);
            return;
        }

        const prefetch = document.createElement("link");
        prefetch.rel = "prefetch";
        prefetch.href = previewUrl.href;
        prefetch.as = "document";
        document.head.appendChild(prefetch);
    } catch {
        // Ignore malformed preview URLs and keep the modal functional.
    }
};

/**
 * Utility: Safe LocalStorage Access
 */
const storage = {
    get: (key, fallback) => {
        try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
    },
    set: (key, value) => {
        try { localStorage.setItem(key, value); } catch {}
    }
};

/**
 * Theme Management
 */
const initTheme = () => {
    const applyTheme = (theme) => {
        const isLight = theme === "light";
        elements.body.classList.toggle("light-mode", isLight);
        if (elements.themeToggle) {
            elements.themeToggle.setAttribute("aria-pressed", String(isLight));
            elements.themeToggle.title = isLight ? "Switch to dark mode" : "Switch to light mode";
            const toggleText = elements.themeToggle.querySelector(".theme-toggle-text");
            if (toggleText) toggleText.textContent = isLight ? "Dark" : "Light";
        }
        window.dispatchEvent(new Event("themechange"));
    };

    const savedTheme = storage.get("preferred-theme", "dark");
    applyTheme(savedTheme);

    elements.themeToggle?.addEventListener("click", () => {
        const next = elements.body.classList.contains("light-mode") ? "dark" : "light";
        applyTheme(next);
        storage.set("preferred-theme", next);
    });
};

/**
 * Navigation & Menu
 */
const initNavigation = () => {
    if (!elements.menuToggle || !elements.navList) return;

    const toggleMenu = (forceClose = false) => {
        const isOpen = forceClose ? false : elements.menuToggle.getAttribute("aria-expanded") !== "true";
        elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
        elements.navList.classList.toggle("open", isOpen);
    };

    elements.menuToggle.addEventListener("click", () => toggleMenu());

    // Close on click outside or link click
    document.addEventListener("click", (e) => {
        if (elements.navList.classList.contains("open")) {
            if (!elements.navList.contains(e.target) && !elements.menuToggle.contains(e.target)) {
                toggleMenu(true);
            }
        }
    });

    elements.navList.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => toggleMenu(true));
    });

    // Active link highlighting on scroll
    const sections = Array.from(elements.navList.querySelectorAll("a"))
        .map(link => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const updateActiveLink = () => {
        const scrollPos = window.scrollY + 100; // Adjusted offset
        let current = sections[0];

        sections.forEach(section => {
            if (section.offsetTop <= scrollPos) current = section;
        });

        const activeLink = elements.navList.querySelector(`a[href="#${current?.id}"]`);
        const indicator = elements.navList.querySelector(".nav-indicator");

        elements.navList.querySelectorAll("a").forEach(link => {
            link.classList.toggle("is-active", link === activeLink);
        });

        if (activeLink && indicator) {
            indicator.style.width = `${activeLink.offsetWidth}px`;
            indicator.style.left = `${activeLink.offsetLeft}px`;
            indicator.style.opacity = "1";
        } else if (indicator) {
            indicator.style.opacity = "0";
        }
    };

    window.addEventListener("scroll", updateActiveLink, { passive: true });
    window.addEventListener("resize", updateActiveLink); // Recalculate on resize
    updateActiveLink();

    // Scroll Transformation for Navbar
    const header = document.querySelector(".site-header");
    const handleScroll = () => {
        if (header) {
            header.classList.toggle("is-scrolled", window.scrollY > 50);
        }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
};

/**
 * Hero Section Typing Animation
 */
const initTyping = () => {
    if (!elements.heroRoleTyped) return;
    const runId = ++typingRunId;
    clearTimeout(typingTimer);

    const roles = (elements.heroRoleTyped.getAttribute("data-roles") || "Web Developer")
        .split("|")
        .map(role => role.trim())
        .filter(Boolean);

    if (roles.length === 0) {
        elements.heroRoleTyped.textContent = "Web Developer";
        return;
    }

    let roleIdx = 0, charIdx = 0, isDeleting = false;

    const tick = () => {
        if (runId !== typingRunId) return;
        const fullTxt = roles[roleIdx];
        elements.heroRoleTyped.textContent = isDeleting
            ? fullTxt.substring(0, charIdx--)
            : fullTxt.substring(0, charIdx++);

        let speed = isDeleting ? ROLE_DELETE_SPEED : ROLE_TYPING_SPEED;

        if (!isDeleting && charIdx === fullTxt.length + 1) {
            isDeleting = true;
            speed = ROLE_DELAY;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            roleIdx = (roleIdx + 1) % roles.length;
            speed = 500;
        }

        typingTimer = setTimeout(tick, speed);
    };

    tick();
};

/**
 * Matrix Background Animation
 */
const initMatrix = () => {
    const canvas = elements.matrixCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~".split("");
    const fontSize = 16;
    let columns = 0, drops = [];

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / fontSize);
        drops = new Array(columns).fill(0).map(() => Math.random() * -100);
    };

    const draw = () => {
        const isLight = elements.body.classList.contains("light-mode");
        ctx.fillStyle = isLight ? "rgba(240, 244, 248, 0.1)" : "rgba(5, 8, 22, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = isLight ? "#0f8b79" : "#19e6a7";
        ctx.font = `${fontSize}px monospace`;

        drops.forEach((y, i) => {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, y * fontSize);
            if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    };

    window.addEventListener("resize", resize);
    resize();
    setInterval(draw, 50);
};

/**
 * Card Animation System
 */
const initCardAnimations = () => {
    const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
    if (!cards.length) return;

    const groupIndexes = new Map();

    cards.forEach(card => {
        const parent = card.parentElement;
        const groupKey = parent || document.body;
        const index = groupIndexes.get(groupKey) || 0;

        card.classList.add("interactive-card", "reveal");
        card.style.setProperty("--reveal-delay", `${Math.min(index * 80, 480)}ms`);

        groupIndexes.set(groupKey, index + 1);
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsPointerMotion = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (prefersReducedMotion || !supportsPointerMotion) return;

    cards.forEach(card => {
        if (card.dataset.cardMotionBound === "true") return;
        card.dataset.cardMotionBound = "true";

        const resetCard = () => {
            card.style.setProperty("--card-rotate-x", "0deg");
            card.style.setProperty("--card-rotate-y", "0deg");
            card.style.setProperty("--spot-x", "50%");
            card.style.setProperty("--spot-y", "50%");
        };

        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const rotateY = ((x / rect.width) - 0.5) * 16;
            const rotateX = (0.5 - (y / rect.height)) * 14;

            card.style.setProperty("--spot-x", `${x}px`);
            card.style.setProperty("--spot-y", `${y}px`);
            card.style.setProperty("--card-rotate-x", `${rotateX.toFixed(2)}deg`);
            card.style.setProperty("--card-rotate-y", `${rotateY.toFixed(2)}deg`);
        });

        card.addEventListener("pointerleave", resetCard);
        card.addEventListener("pointercancel", resetCard);
        card.addEventListener("focusout", resetCard);
    });
};

/**
 * Scroll Reveal Effects
 */
const initScrollReveal = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach(el => {
        if (el.dataset.revealObserved === "true" || el.classList.contains("is-visible")) return;
        el.dataset.revealObserved = "true";
        observer.observe(el);
    });
};

/**
 * Skill Chips Animations
 */
const initSkillAnimations = () => {
    const animationGroups = document.querySelectorAll(".skill-group, .live-project-card, .service-card");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const elements = entry.target.querySelectorAll(".skill-chip, .live-project-tag, .live-project-card__eyebrow, .service-card__eyebrow, .service-card h3, .service-card p, .service-icon-box, .service-features li");
                elements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add("is-visible");
                    }, index * 80);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    animationGroups.forEach(group => {
        if (group.dataset.staggerBound === "true") return;
        group.dataset.staggerBound = "true";
        observer.observe(group);
    });
};

const refreshAnimatedCards = () => {
    initCardAnimations();
    initSkillAnimations();
    initScrollReveal();
};

const initFirebasePortfolioSync = () => {
    if (document.body.classList.contains("admin-only")) return;

    const syncPortfolioContent = async () => {
        const api = window.FirebaseAdminAPI;
        if (!api?.loadPortfolioData) return;

        try {
            const data = await api.loadPortfolioData();
            if (data) applyPortfolioContent(data);
        } catch (error) {
            console.warn("[Portfolio] Could not load remote content:", error);
        }
    };

    const bindRealtimeUpdates = () => {
        const api = window.FirebaseAdminAPI;
        if (!api?.onPortfolioUpdate) return;

        api.onPortfolioUpdate((data) => {
            if (data) applyPortfolioContent(data);
        });
    };

    syncPortfolioContent();
    bindRealtimeUpdates();
};

/**
 * Project Modal Logic
 */
const initModals = () => {
    const overlay = document.getElementById("project-modal-overlay");
    const closeBtn = document.getElementById("project-modal-close");
    const titleEl = document.getElementById("project-modal-title");
    const descEl = document.getElementById("project-modal-description");
    const detailsEl = document.getElementById("project-modal-details");
    const tagsEl = document.getElementById("project-modal-tags");
    const externalLinkEl = document.getElementById("project-modal-external");
    const loaderEl = document.getElementById("project-modal-loader");
    const iframeEl = document.getElementById("project-modal-iframe");
    if (!overlay || !closeBtn || !titleEl || !descEl || !detailsEl || !tagsEl || !externalLinkEl || !loaderEl || !iframeEl) return;

    let lastTrigger = null;
    let activePreviewUrl = "";

    const setLoadingState = (isLoading) => {
        loaderEl.hidden = !isLoading;
        loaderEl.setAttribute("aria-hidden", String(!isLoading));
        iframeEl.classList.toggle("is-loading", isLoading);
    };

    const openModal = (project, trigger) => {
        if (!project) return;

        lastTrigger = trigger || null;
        titleEl.textContent = project.title;
        descEl.textContent = project.description;
        detailsEl.innerHTML = (project.details || [])
            .map((detail) => `<li class="project-preview-modal__detail">${escapeHtml(detail)}</li>`)
            .join("");
        tagsEl.innerHTML = project.stack.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("");
        externalLinkEl.href = project.previewUrl;
        iframeEl.title = `${project.title} live preview`;

        const shouldReload = activePreviewUrl !== project.previewUrl;
        const hasCachedLoad = loadedPreviewUrls.has(project.previewUrl);
        setLoadingState(shouldReload || !hasCachedLoad);

        if (shouldReload) {
            activePreviewUrl = project.previewUrl;
            iframeEl.src = project.previewUrl;
        }

        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
    };

    const closeModal = () => {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        lastTrigger?.focus();
    };

    iframeEl.addEventListener("load", () => {
        if (activePreviewUrl) {
            loadedPreviewUrls.add(activePreviewUrl);
        }
        setLoadingState(false);
    });

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-project-preview]");
        if (!btn) return;

        const project = LIVE_PROJECTS[Number(btn.dataset.projectPreview)];
        openModal(project, btn);
    });

    document.addEventListener("pointerover", (e) => {
        const btn = e.target.closest("[data-project-preview]");
        if (!btn) return;
        prefetchProjectPreview(LIVE_PROJECTS[Number(btn.dataset.projectPreview)]);
    });

    document.addEventListener("focusin", (e) => {
        const btn = e.target.closest("[data-project-preview]");
        if (!btn) return;
        prefetchProjectPreview(LIVE_PROJECTS[Number(btn.dataset.projectPreview)]);
    });

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
    });
};

/**
 * Counter Animation
 */
const initCounters = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10);
                let current = 0;
                const step = target / 50;
                const interval = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        el.textContent = target;
                        clearInterval(interval);
                    } else {
                        el.textContent = Math.floor(current);
                    }
                }, 20);
                observer.unobserve(el);
            }
        });
    }, { threshold: 1 });

    document.querySelectorAll(".stat-number[data-target]").forEach(n => observer.observe(n));
};

/**
 * Back to Top Button Logic
 */
const initBackToTop = () => {
    const btn = elements.backToTop;
    if (!btn) return;

    const handleScroll = () => {
        if (window.scrollY > 500) {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            btn.style.transform = "translateY(0)";
        } else {
            btn.style.opacity = "0";
            btn.style.pointerEvents = "none";
            btn.style.transform = "translateY(10px)";
        }
    };

    btn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
};

// Global Boot
const boot = () => {
    initTheme();
    initNavigation();
    initTyping();
    initMatrix();
    renderLiveProjects();
    refreshAnimatedCards();
    initModals();
    initCounters();
    initBackToTop();
    initProjectFilters();
    
    // External link handling
    document.querySelectorAll("a[target='_blank']").forEach(a => {
        if (!a.rel) a.rel = "noopener noreferrer";
    });

    if (window.__firebaseReady) {
        initFirebasePortfolioSync();
    } else {
        window.addEventListener("firebase-ready", initFirebasePortfolioSync, { once: true });
    }
};

document.addEventListener("DOMContentLoaded", boot);
