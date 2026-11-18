/* ==========================================================================
   EstateSphere — Shared Luxury UI Components
   Navigation, Footer, Property Cards, Calculators, Modals, Compare & Toasts
   ========================================================================== */

(function (global) {
  'use strict';

  const FALLBACK_SVG =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#E9E0D3"/><stop offset="100%" stop-color="#D4C5B0"/></linearGradient></defs>' +
        '<rect width="1200" height="750" fill="url(#g)"/>' +
        '<rect x="260" y="210" width="680" height="330" fill="none" stroke="#9E7E52" stroke-width="2" opacity="0.5"/>' +
        '<text x="600" y="365" text-anchor="middle" font-family="Georgia,serif" font-size="44" fill="#1B1815" letter-spacing="6">ESTATESPHERE</text>' +
        '<text x="600" y="415" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#5B534B" letter-spacing="4">ARCHITECTURAL RESIDENCE</text>' +
      '</svg>'
    );

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function installImageFallbacks(root) {
    const scope = root || document;
    scope.querySelectorAll('img').forEach(function (img) {
      if (img.dataset.fallbackBound) return;
      img.dataset.fallbackBound = '1';
      img.addEventListener('error', function () {
        if (img.src !== FALLBACK_SVG) {
          img.src = FALLBACK_SVG;
        }
      });
    });
  }

  // Toast Notifications
  function ensureToastContainer() {
    let el = document.getElementById('es-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'es-toast-container';
      el.className = 'toast-container';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(message, duration) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML =
      '<span>' + escapeHTML(message) + '</span>' +
      '<button type="button" aria-label="Dismiss notification" style="color:rgba(255,255,255,0.7);font-size:1.1rem;line-height:1;">&times;</button>';
    toast.querySelector('button').addEventListener('click', function () {
      toast.remove();
    });
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, duration || 3800);
  }

  // SVG Icons
  const ICONS = {
    heart: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFill: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    compare: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" style="flex-shrink:0;margin-top:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    bed: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 18v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M2 11V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4"/><path d="M2 15h20"/></svg>',
    bath: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3z"/><path d="M6 12V6a2 2 0 0 1 2-2h1"/></svg>',
    area: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>',
    arrowRight: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };

  const NAV_ITEMS = [
    { label: 'Home', href: 'index.html', key: 'home' },
    { label: 'About Us', href: 'about.html', key: 'about' },
    { label: 'Properties', href: 'properties.html', key: 'properties' },
    { label: 'Apartments', href: 'apartments.html', key: 'apartments' },
    { label: 'Flats', href: 'flats.html', key: 'flats' },
    { label: 'Villas', href: 'villas.html', key: 'villas' },
    { label: 'Locations', href: 'locations.html', key: 'locations' },
    { label: 'Investment', href: 'investment.html', key: 'investment' },
    { label: 'Services', href: 'services.html', key: 'services' },
    { label: 'Contact Us', href: 'contact.html', key: 'contact' }
  ];

  // Render Sticky Header & Mobile Drawer
  function renderHeader() {
    const mount = document.getElementById('site-header-mount');
    if (!mount) return;

    const currentPage = document.body.dataset.page || 'home';
    const isHeroHeader = currentPage === 'home';
    const activeCurrency = global.EstateState.getCurrency();
    const favCount = global.EstateState.getFavourites().length;
    const demoUser = global.EstateState.getDemoUser();

    const currencyOptions = Object.keys(global.EstateData.CURRENCIES)
      .map(function (code) {
        return '<option value="' + code + '"' + (code === activeCurrency ? ' selected' : '') + '>' + code + '</option>';
      })
      .join('');

    const navLinksHTML = NAV_ITEMS.map(function (item) {
      const active = item.key === currentPage ? ' is-active' : '';
      return '<a href="' + item.href + '" class="nav-link' + active + '">' + item.label + '</a>';
    }).join('');

    const mobileLinksHTML = NAV_ITEMS.map(function (item) {
      const active = item.key === currentPage ? ' is-active' : '';
      return '<a href="' + item.href + '" class="' + active + '"><span>' + item.label + '</span>' + ICONS.arrowRight + '</a>';
    }).join('');

    const userLabel = demoUser ? escapeHTML(demoUser.name.split(' ')[0]) : 'Sign In';

    mount.innerHTML =
      '<header class="site-header' + (isHeroHeader ? ' is-transparent' : '') + '" id="site-header">' +
        '<div class="nav-inner">' +
          '<a href="index.html" class="nav-brand" aria-label="EstateSphere Home">' +
            '<span class="nav-brand-mark" aria-hidden="true">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></svg>' +
            '</span>' +
            '<span class="nav-brand-text">' +
              '<span class="nav-brand-name">EstateSphere</span>' +
              '<span class="nav-brand-tagline">Discover Your Place in the World</span>' +
            '</span>' +
          '</a>' +

          '<nav class="nav-links" aria-label="Primary Navigation">' + navLinksHTML + '</nav>' +

          '<div class="nav-actions">' +
            '<label class="sr-only" for="global-currency-select">Select Currency</label>' +
            '<select id="global-currency-select" class="currency-select" title="Display Currency">' + currencyOptions + '</select>' +

            '<a href="account.html#favourites" class="nav-icon-btn" title="Favourite Properties" aria-label="Favourite Properties">' +
              ICONS.heart +
              '<span class="nav-badge" id="nav-fav-count" data-count="' + favCount + '">' + (favCount > 0 ? favCount : '') + '</span>' +
            '</a>' +

            (demoUser
              ? '<a href="account.html" class="nav-signin-btn nav-icon-btn" style="width:auto;border-radius:4px;" title="Client Portal">' + ICONS.user + '<span>' + userLabel + '</span></a>'
              : '<button type="button" class="nav-signin-btn nav-icon-btn" style="width:auto;border-radius:4px;" id="nav-signin-trigger">' + ICONS.user + '<span>Sign In</span></button>'
            ) +

            '<a href="list-property.html" class="btn btn--primary nav-cta-list">List Your Property</a>' +

            '<button type="button" class="nav-hamburger" id="mobile-menu-open" aria-label="Open Navigation Menu">' + ICONS.menu + '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +

      '<div class="mobile-drawer-backdrop" id="mobile-drawer-backdrop"></div>' +
      '<aside class="mobile-drawer" id="mobile-drawer" aria-label="Mobile Navigation">' +
        '<div class="mobile-drawer-header">' +
          '<span class="nav-brand-name">EstateSphere</span>' +
          '<button type="button" class="modal-close" id="mobile-menu-close" aria-label="Close Menu">&times;</button>' +
        '</div>' +
        '<div class="mobile-drawer-body">' +
          '<nav class="mobile-nav-list">' +
            mobileLinksHTML +
            '<a href="financing.html"><span>Mortgage &amp; Financing</span>' + ICONS.arrowRight + '</a>' +
            '<a href="account.html"><span>Client Portal &amp; Saved</span>' + ICONS.arrowRight + '</a>' +
          '</nav>' +
          '<div class="mobile-drawer-controls">' +
            '<div class="field-group">' +
              '<label class="field-label" for="mobile-currency-select">Display Currency</label>' +
              '<select id="mobile-currency-select" class="field-select">' + currencyOptions + '</select>' +
            '</div>' +
            '<a href="list-property.html" class="btn btn--primary btn--block">List Your Property</a>' +
            (demoUser
              ? '<a href="account.html" class="btn btn--outline btn--block">Account: ' + userLabel + '</a>'
              : '<button type="button" class="btn btn--outline btn--block" id="mobile-signin-trigger">Sign In / Register (Demo)</button>'
            ) +
          '</div>' +
        '</div>' +
      '</aside>';

    bindHeaderEvents();
  }

  function bindHeaderEvents() {
    const header = document.getElementById('site-header');
    if (header) {
      const onScroll = function () {
        if (window.scrollY > 32) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    ['global-currency-select', 'mobile-currency-select'].forEach(function (id) {
      const sel = document.getElementById(id);
      if (sel) {
        sel.addEventListener('change', function () {
          global.EstateState.setCurrency(sel.value);
          showToast('Display currency updated to ' + sel.value + '.');
        });
      }
    });

    const openBtn = document.getElementById('mobile-menu-open');
    const closeBtn = document.getElementById('mobile-menu-close');
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');

    function setDrawer(open) {
      if (!drawer || !backdrop) return;
      drawer.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    if (openBtn) openBtn.addEventListener('click', function () { setDrawer(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
    if (backdrop) backdrop.addEventListener('click', function () { setDrawer(false); });

    const signInBtn = document.getElementById('nav-signin-trigger');
    const mobileSignInBtn = document.getElementById('mobile-signin-trigger');
    if (signInBtn) signInBtn.addEventListener('click', function () { openAuthModal('signin'); });
    if (mobileSignInBtn) {
      mobileSignInBtn.addEventListener('click', function () {
        setDrawer(false);
        openAuthModal('signin');
      });
    }
  }

  function syncHeaderBadges() {
    const favCount = global.EstateState.getFavourites().length;
    const badge = document.getElementById('nav-fav-count');
    if (badge) {
      badge.dataset.count = String(favCount);
      badge.textContent = favCount > 0 ? String(favCount) : '';
    }
    const curr = global.EstateState.getCurrency();
    ['global-currency-select', 'mobile-currency-select'].forEach(function (id) {
      const sel = document.getElementById(id);
      if (sel && sel.value !== curr) sel.value = curr;
    });
  }

  // Multi-Column Luxury Footer
  function renderFooter() {
    const mount = document.getElementById('site-footer-mount');
    if (!mount) return;
    const rateInfo = global.EstateState.getRateInfo();

    mount.innerHTML =
      '<footer class="site-footer">' +
        '<div class="container">' +
          '<div class="footer-grid">' +
            '<div class="footer-brand">' +
              '<a href="index.html" class="nav-brand" style="color:#fff;">' +
                '<span class="nav-brand-mark">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></svg>' +
                '</span>' +
                '<span class="nav-brand-text">' +
                  '<span class="nav-brand-name" style="color:#fff;">EstateSphere</span>' +
                  '<span class="nav-brand-tagline" style="color:rgba(255,255,255,0.6);">Discover Your Place in the World</span>' +
                '</span>' +
              '</a>' +
              '<p>An international luxury real estate brokerage curating architectural apartments, flats, penthouses, and coastal villas across 12 premier destinations.</p>' +
              '<div class="footer-rate-note" id="footer-rate-note">' +
                'Display currency: <strong>' + rateInfo.currency + '</strong> · ' + escapeHTML(rateInfo.source) +
                '. Converted figures are indicative; original asking prices are always displayed.' +
              '</div>' +
            '</div>' +

            '<div class="footer-col">' +
              '<h4>Company</h4>' +
              '<ul>' +
                '<li><a href="about.html">About Us</a></li>' +
                '<li><a href="services.html">Our Services</a></li>' +
                '<li><a href="about.html#careers">Careers</a></li>' +
                '<li><a href="contact.html">Contact</a></li>' +
                '<li><a href="financing.html">Mortgage &amp; Financing</a></li>' +
              '</ul>' +
            '</div>' +

            '<div class="footer-col">' +
              '<h4>Properties</h4>' +
              '<ul>' +
                '<li><a href="apartments.html">Apartments</a></li>' +
                '<li><a href="flats.html">Flats</a></li>' +
                '<li><a href="villas.html">Villas</a></li>' +
                '<li><a href="properties.html?category=Luxury%20Apartments">Luxury Properties</a></li>' +
                '<li><a href="investment.html">Investment Properties</a></li>' +
              '</ul>' +
            '</div>' +

            '<div class="footer-col">' +
              '<h4>Destinations</h4>' +
              '<ul>' +
                '<li><a href="properties.html?country=United%20Arab%20Emirates">Dubai</a></li>' +
                '<li><a href="properties.html?country=United%20Kingdom">London</a></li>' +
                '<li><a href="properties.html?country=United%20States">New York</a></li>' +
                '<li><a href="properties.html?country=Singapore">Singapore</a></li>' +
                '<li><a href="properties.html?country=India">India</a></li>' +
              '</ul>' +
            '</div>' +

            '<div class="footer-col">' +
              '<h4>Customer Support</h4>' +
              '<ul>' +
                '<li><a href="contact.html#help-center">Help Center</a></li>' +
                '<li><a href="contact.html#faqs">FAQs</a></li>' +
                '<li><a href="contact.html#privacy">Privacy Policy</a></li>' +
                '<li><a href="contact.html#terms">Terms &amp; Conditions</a></li>' +
                '<li><a href="account.html">Client Portal</a></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +

          '<div class="footer-bottom">' +
            '<div>&copy; ' + new Date().getFullYear() + ' EstateSphere International Realty. All rights reserved. Demonstration showcase using local browser storage.</div>' +
            '<div class="social-row" aria-label="Social Media">' +
              '<a href="contact.html#offices" class="social-link" aria-label="Instagram">IG</a>' +
              '<a href="contact.html#offices" class="social-link" aria-label="LinkedIn">IN</a>' +
              '<a href="contact.html#offices" class="social-link" aria-label="YouTube">YT</a>' +
              '<a href="contact.html#offices" class="social-link" aria-label="X">X</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  // Status Badge Helper
  function getStatusBadgeClass(status, awaitingVerification) {
    if (awaitingVerification) return 'badge--pending';
    const s = (status || '').toLowerCase();
    if (s.indexOf('ready') !== -1) return 'badge--ready';
    if (s.indexOf('under') !== -1) return 'badge--construction';
    return 'badge--gold';
  }

  // Reusable Luxury Property Card
  function renderPropertyCard(property, opts) {
    const options = opts || {};
    const pricing = global.EstateState.getPropertyPricing(property);
    const fmt = global.EstateState.formatMoney;
    const isFav = global.EstateState.isFavourite(property.id);
    const isComp = global.EstateState.isInCompare(property.id);
    const mainPhoto = (property.gallery && property.gallery[0] && property.gallery[0].url) || property.image || FALLBACK_SVG;

    const statusLabel = property.awaitingVerification ? 'Awaiting Verification' : property.availability;
    const statusClass = getStatusBadgeClass(property.availability, property.awaitingVerification);

    const convertedNote = pricing.isConverted
      ? '<div class="price-original-note">Converted display · Original asking: ' +
        fmt(pricing.originalTotal, pricing.originalCurrency) + ' ' + pricing.originalCurrency + '</div>'
      : '<div class="price-original-note">Original asking price (' + pricing.originalCurrency + ')</div>';

    const yieldStrip = options.showInvestment && property.rentalYieldPct
      ? '<div class="property-card-yield">' +
          '<span>Est. Gross Yield: ' + property.rentalYieldPct + '% p.a.</span>' +
          '<span>Est. Rent: ' + fmt(Math.round((pricing.displayTotal * (property.rentalYieldPct / 100)) / 12), pricing.displayCurrency) + '/mo</span>' +
        '</div>'
      : '';

    return (
      '<article class="property-card" data-property-id="' + escapeHTML(property.id) + '">' +
        '<div class="property-card-media">' +
          '<a href="property-details.html?id=' + encodeURIComponent(property.id) + '">' +
            '<img src="' + escapeHTML(mainPhoto) + '" alt="' + escapeHTML(property.title) + '" loading="lazy">' +
          '</a>' +
          '<div class="property-card-badges">' +
            '<span class="badge badge--dark">' + escapeHTML(property.type) + '</span>' +
            '<span class="badge ' + statusClass + '">' + escapeHTML(statusLabel) + '</span>' +
          '</div>' +
          '<div class="property-card-quick">' +
            '<button type="button" class="icon-pill js-fav-toggle' + (isFav ? ' is-active' : '') + '" data-id="' + escapeHTML(property.id) + '" title="' + (isFav ? 'Remove from Favourites' : 'Add to Favourites') + '" aria-label="Toggle Favourite">' +
              (isFav ? ICONS.heartFill : ICONS.heart) +
            '</button>' +
            '<button type="button" class="icon-pill js-compare-toggle' + (isComp ? ' is-active' : '') + '" data-id="' + escapeHTML(property.id) + '" title="' + (isComp ? 'Remove from Compare' : 'Compare Property') + '" aria-label="Toggle Compare">' +
              ICONS.compare +
            '</button>' +
          '</div>' +
          '<span class="property-card-id">' + escapeHTML(property.id) + '</span>' +
        '</div>' +

        '<div class="property-card-body">' +
          '<div class="property-card-meta">' +
            '<span>' + escapeHTML(property.country) + ' · ' + escapeHTML(property.city) + '</span>' +
            '<span>' + escapeHTML(property.furnished || 'Residential') + '</span>' +
          '</div>' +

          '<h3 class="property-card-title">' +
            '<a href="property-details.html?id=' + encodeURIComponent(property.id) + '">' + escapeHTML(property.title) + '</a>' +
          '</h3>' +

          '<p class="property-card-location">' + ICONS.pin + '<span>' + escapeHTML(property.fullLocation) + '</span></p>' +

          '<div class="price-ledger">' +
            '<div class="price-ledger-total">' +
              '<span class="price-ledger-label">Total Price</span>' +
              '<div>' +
                '<div class="price-ledger-amount">' + fmt(pricing.displayTotal, pricing.displayCurrency) + '</div>' +
                convertedNote +
              '</div>' +
            '</div>' +
            '<div class="price-ledger-split">' +
              '<div class="price-ledger-item">' +
                '<span>Down Payment (' + pricing.downPaymentPct + '%)</span>' +
                '<strong>' + fmt(pricing.displayDownPayment, pricing.displayCurrency) + '</strong>' +
              '</div>' +
              '<div class="price-ledger-item" style="text-align:right;">' +
                '<span>Remaining Balance</span>' +
                '<strong>' + fmt(pricing.displayRemaining, pricing.displayCurrency) + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +

          yieldStrip +

          '<div class="property-specs">' +
            '<div class="spec-item">' + ICONS.bed + '<strong>' + property.bedrooms + '</strong> Bed</div>' +
            '<div class="spec-item">' + ICONS.bath + '<strong>' + property.bathrooms + '</strong> Bath</div>' +
            '<div class="spec-item">' + ICONS.area + '<strong>' + Number(property.areaSqFt).toLocaleString() + '</strong> sq ft</div>' +
          '</div>' +

          '<div class="property-card-actions">' +
            '<a href="property-details.html?id=' + encodeURIComponent(property.id) + '" class="btn btn--primary btn--sm">View Details</a>' +
            '<button type="button" class="btn btn--outline btn--sm js-enquire-trigger" data-id="' + escapeHTML(property.id) + '">Enquire Now</button>' +
          '</div>' +

          '<div class="property-card-secondary-actions">' +
            '<button type="button" class="micro-action js-fav-toggle' + (isFav ? ' is-active' : '') + '" data-id="' + escapeHTML(property.id) + '">' +
              (isFav ? ICONS.heartFill : ICONS.heart) +
              '<span>' + (isFav ? 'Saved' : 'Add to Favourites') + '</span>' +
            '</button>' +
            '<button type="button" class="micro-action js-compare-toggle' + (isComp ? ' is-active' : '') + '" data-id="' + escapeHTML(property.id) + '">' +
              ICONS.compare +
              '<span>' + (isComp ? 'Comparing' : 'Compare Property') + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  // Floating Compare Bar & Side-by-Side Comparison Modal
  function renderCompareBar() {
    let bar = document.getElementById('es-compare-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'es-compare-bar';
      bar.className = 'compare-bar';
      document.body.appendChild(bar);
    }
    const ids = global.EstateState.getCompareList();
    if (ids.length === 0) {
      bar.classList.remove('is-visible');
      bar.innerHTML = '';
      return;
    }

    const names = ids.map(function (id) {
      const p = global.EstateState.getPropertyById(id);
      return p ? escapeHTML(p.city) : id;
    });

    bar.classList.add('is-visible');
    bar.innerHTML =
      '<div class="compare-bar-items">' +
        '<strong>Compare (' + ids.length + '/3):</strong> ' +
        '<span>' + names.join(' · ') + '</span>' +
      '</div>' +
      '<button type="button" class="btn btn--gold btn--sm" id="es-open-compare-modal">Compare Now</button>' +
      '<button type="button" class="btn btn--outline-light btn--sm" id="es-clear-compare">Clear</button>';

    bar.querySelector('#es-open-compare-modal').addEventListener('click', openCompareModal);
    bar.querySelector('#es-clear-compare').addEventListener('click', function () {
      global.EstateState.clearCompare();
      showToast('Property comparison list cleared.');
    });
  }

  function renderComparisonTableHTML(ids) {
    const props = ids.map(function (id) { return global.EstateState.getPropertyById(id); }).filter(Boolean);
    if (props.length === 0) {
      return '<div class="empty-state"><h3>No Properties Selected</h3><p>Select up to 3 properties using the Compare button on any listing card to inspect them side by side.</p><a href="properties.html" class="btn btn--primary">Browse Properties</a></div>';
    }
    const fmt = global.EstateState.formatMoney;

    const headCols = props.map(function (p) {
      const img = (p.gallery && p.gallery[0] && p.gallery[0].url) || FALLBACK_SVG;
      return (
        '<td>' +
          '<img src="' + escapeHTML(img) + '" alt="' + escapeHTML(p.title) + '" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px;margin-bottom:0.6rem;">' +
          '<strong style="display:block;font-family:var(--font-serif);font-size:1.25rem;">' + escapeHTML(p.title) + '</strong>' +
          '<span style="font-size:0.78rem;color:var(--ink-muted);">' + escapeHTML(p.id) + ' · ' + escapeHTML(p.city) + ', ' + escapeHTML(p.country) + '</span>' +
          '<div style="margin-top:0.65rem;display:flex;gap:0.4rem;flex-wrap:wrap;">' +
            '<a href="property-details.html?id=' + encodeURIComponent(p.id) + '" class="btn btn--primary btn--sm">Details</a>' +
            '<button type="button" class="btn btn--outline btn--sm js-compare-toggle" data-id="' + escapeHTML(p.id) + '">Remove</button>' +
          '</div>' +
        '</td>'
      );
    }).join('');

    function row(label, fn) {
      return '<tr><th>' + label + '</th>' + props.map(function (p) { return '<td class="tabular-nums">' + fn(p) + '</td>'; }).join('') + '</tr>';
    }

    return (
      '<div class="compare-table-wrap">' +
        '<table class="compare-table">' +
          '<tbody>' +
            '<tr><th>Residence</th>' + headCols + '</tr>' +
            row('Property Type', function (p) { return escapeHTML(p.type); }) +
            row('Availability', function (p) { return escapeHTML(p.awaitingVerification ? 'Awaiting Verification' : p.availability); }) +
            row('Total Price', function (p) {
              const pr = global.EstateState.getPropertyPricing(p);
              return '<strong>' + fmt(pr.displayTotal, pr.displayCurrency) + '</strong>' +
                (pr.isConverted ? '<br><small style="color:var(--ink-muted);">Orig: ' + fmt(pr.originalTotal, pr.originalCurrency) + ' ' + pr.originalCurrency + '</small>' : '');
            }) +
            row('Down Payment', function (p) {
              const pr = global.EstateState.getPropertyPricing(p);
              return fmt(pr.displayDownPayment, pr.displayCurrency) + ' (' + pr.downPaymentPct + '%)';
            }) +
            row('Remaining Balance', function (p) {
              const pr = global.EstateState.getPropertyPricing(p);
              return fmt(pr.displayRemaining, pr.displayCurrency);
            }) +
            row('Est. Monthly (20y @ 5.5%)', function (p) {
              const pr = global.EstateState.getPropertyPricing(p);
              return fmt(pr.estimatedMonthlyInstallment, pr.displayCurrency) + ' / mo';
            }) +
            row('Bedrooms / Bathrooms', function (p) { return p.bedrooms + ' Bed · ' + p.bathrooms + ' Bath'; }) +
            row('Built-Up Area', function (p) { return Number(p.areaSqFt).toLocaleString() + ' sq ft'; }) +
            row('Furnishing', function (p) { return escapeHTML(p.furnished || 'N/A'); }) +
            row('Est. Gross Yield', function (p) { return p.rentalYieldPct ? p.rentalYieldPct + '% p.a. (Est.)' : '—'; }) +
          '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  // Generic Modal Shell
  function openModal(title, bodyHTML, wide) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.id = 'es-active-modal';
    backdrop.className = 'modal-backdrop is-open';
    backdrop.innerHTML =
      '<div class="modal-dialog' + (wide ? ' modal-dialog--wide' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal-header">' +
          '<h3>' + escapeHTML(title) + '</h3>' +
          '<button type="button" class="modal-close" aria-label="Close modal">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' + bodyHTML + '</div>' +
      '</div>';

    backdrop.querySelector('.modal-close').addEventListener('click', closeModal);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    installImageFallbacks(backdrop);
    return backdrop;
  }

  function closeModal() {
    const existing = document.getElementById('es-active-modal');
    if (existing) existing.remove();
    document.body.style.overflow = '';
  }

  function openCompareModal() {
    const ids = global.EstateState.getCompareList();
    const modal = openModal('Side-by-Side Property Comparison', renderComparisonTableHTML(ids), true);
    modal.addEventListener('click', function (e) {
      const btn = e.target.closest('.js-compare-toggle');
      if (btn) {
        setTimeout(function () {
          const updated = global.EstateState.getCompareList();
          if (updated.length === 0) closeModal();
          else modal.querySelector('.modal-body').innerHTML = renderComparisonTableHTML(updated);
        }, 10);
      }
    });
  }

  // Auth Modal (Demonstration-Only Sign In & Registration)
  function openAuthModal(initialMode) {
    const mode = initialMode || 'signin';
    const countriesOpts = global.EstateData.COUNTRIES.map(function (c) {
      return '<option value="' + escapeHTML(c.name) + '">' + escapeHTML(c.name) + '</option>';
    }).join('');

    const html =
      '<div class="disclaimer-box" style="margin-bottom:1.2rem;">' +
        '<strong>Demonstration Account Notice:</strong> Authentication and account profiles are stored locally in your browser via <code>localStorage</code> for demonstration only and are not secure production accounts.' +
      '</div>' +
      '<div class="dashboard-tabs" style="margin-bottom:1.25rem;">' +
        '<button type="button" class="dash-tab' + (mode === 'signin' ? ' is-active' : '') + '" data-auth-tab="signin">Sign In</button>' +
        '<button type="button" class="dash-tab' + (mode === 'register' ? ' is-active' : '') + '" data-auth-tab="register">Register</button>' +
      '</div>' +

      '<form id="es-signin-form" style="display:' + (mode === 'signin' ? 'flex' : 'none') + ';flex-direction:column;gap:0.9rem;" novalidate>' +
        '<div class="field-group">' +
          '<label class="field-label" for="auth-in-email">Email Address</label>' +
          '<input id="auth-in-email" type="email" class="field-input" value="demo@estatesphere.com" required>' +
        '</div>' +
        '<div class="field-group">' +
          '<label class="field-label" for="auth-in-pass">Password (4+ chars for demo)</label>' +
          '<input id="auth-in-pass" type="password" class="field-input" value="demo1234" required>' +
        '</div>' +
        '<div class="field-error" id="auth-in-error"></div>' +
        '<button type="submit" class="btn btn--primary btn--block">Sign In to Demo Portal</button>' +
      '</form>' +

      '<form id="es-register-form" style="display:' + (mode === 'register' ? 'flex' : 'none') + ';flex-direction:column;gap:0.9rem;" novalidate>' +
        '<div class="field-group">' +
          '<label class="field-label" for="auth-reg-name">Full Name</label>' +
          '<input id="auth-reg-name" type="text" class="field-input" placeholder="e.g. Sophia Laurent" required>' +
        '</div>' +
        '<div class="field-group">' +
          '<label class="field-label" for="auth-reg-email">Email Address</label>' +
          '<input id="auth-reg-email" type="email" class="field-input" placeholder="sophia@example.com" required>' +
        '</div>' +
        '<div class="form-grid-2">' +
          '<div class="field-group">' +
            '<label class="field-label" for="auth-reg-pass">Demo Password</label>' +
            '<input id="auth-reg-pass" type="password" class="field-input" placeholder="Min 4 characters" required>' +
          '</div>' +
          '<div class="field-group">' +
            '<label class="field-label" for="auth-reg-country">Country</label>' +
            '<select id="auth-reg-country" class="field-select">' + countriesOpts + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="field-error" id="auth-reg-error"></div>' +
        '<button type="submit" class="btn btn--primary btn--block">Create Demo Account</button>' +
      '</form>';

    const modal = openModal('EstateSphere Client Access', html, false);
    const tabs = modal.querySelectorAll('[data-auth-tab]');
    const inForm = modal.querySelector('#es-signin-form');
    const regForm = modal.querySelector('#es-register-form');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const target = tab.dataset.authTab;
        tabs.forEach(function (t) { t.classList.toggle('is-active', t.dataset.authTab === target); });
        inForm.style.display = target === 'signin' ? 'flex' : 'none';
        regForm.style.display = target === 'register' ? 'flex' : 'none';
      });
    });

    inForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = modal.querySelector('#auth-in-email').value.trim();
      const pass = modal.querySelector('#auth-in-pass').value;
      const errEl = modal.querySelector('#auth-in-error');
      if (!email || !pass) {
        errEl.textContent = 'Please enter both email and password.';
        return;
      }
      const res = global.EstateState.signInDemoUser(email, pass);
      if (!res.ok) {
        errEl.textContent = res.message;
        return;
      }
      closeModal();
      renderHeader();
      showToast('Signed in as ' + res.user.name + ' (Demo Account).');
    });

    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = modal.querySelector('#auth-reg-name').value.trim();
      const email = modal.querySelector('#auth-reg-email').value.trim();
      const pass = modal.querySelector('#auth-reg-pass').value;
      const country = modal.querySelector('#auth-reg-country').value;
      const errEl = modal.querySelector('#auth-reg-error');
      if (name.length < 2) { errEl.textContent = 'Please enter your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email address.'; return; }
      if (pass.length < 4) { errEl.textContent = 'Please choose a password of at least 4 characters.'; return; }
      const res = global.EstateState.registerDemoUser(name, email, pass, country);
      if (!res.ok) {
        errEl.textContent = res.message;
        return;
      }
      closeModal();
      renderHeader();
      showToast('Demo account created for ' + res.user.name + '.');
    });
  }

  // Property or Service Enquiry Modal
  function openEnquiryModal(config) {
    const cfg = config || {};
    const user = global.EstateState.getDemoUser();
    const subjectDefault = cfg.subject || 'Private Residence Consultation';

    const html =
      '<p style="font-size:0.9rem;color:var(--ink-secondary);margin-bottom:1.15rem;">' +
        escapeHTML(cfg.subtitle || 'Complete the details below and a dedicated EstateSphere international advisor will respond promptly.') +
      '</p>' +
      '<form id="es-modal-enquiry-form" style="display:flex;flex-direction:column;gap:0.9rem;" novalidate>' +
        '<div class="form-grid-2">' +
          '<div class="field-group">' +
            '<label class="field-label" for="enq-name">Full Name *</label>' +
            '<input id="enq-name" class="field-input" type="text" value="' + escapeHTML(user ? user.name : '') + '" required>' +
          '</div>' +
          '<div class="field-group">' +
            '<label class="field-label" for="enq-email">Email Address *</label>' +
            '<input id="enq-email" class="field-input" type="email" value="' + escapeHTML(user ? user.email : '') + '" required>' +
          '</div>' +
        '</div>' +
        '<div class="form-grid-2">' +
          '<div class="field-group">' +
            '<label class="field-label" for="enq-phone">Phone / WhatsApp *</label>' +
            '<input id="enq-phone" class="field-input" type="tel" placeholder="+1 212 555 0199" required>' +
          '</div>' +
          '<div class="field-group">' +
            '<label class="field-label" for="enq-subject">Subject</label>' +
            '<input id="enq-subject" class="field-input" type="text" value="' + escapeHTML(subjectDefault) + '" required>' +
          '</div>' +
        '</div>' +
        '<div class="field-group">' +
          '<label class="field-label" for="enq-message">Message *</label>' +
          '<textarea id="enq-message" class="field-textarea" placeholder="Share preferred viewing dates, financing questions, or portfolio requirements...">' +
            escapeHTML(cfg.defaultMessage || '') +
          '</textarea>' +
        '</div>' +
        '<div class="field-error" id="enq-error"></div>' +
        '<button type="submit" class="btn btn--primary btn--block">Send Private Enquiry</button>' +
      '</form>';

    const modal = openModal(cfg.title || 'Enquire with EstateSphere', html, false);
    const form = modal.querySelector('#es-modal-enquiry-form');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = modal.querySelector('#enq-name').value.trim();
      const email = modal.querySelector('#enq-email').value.trim();
      const phone = modal.querySelector('#enq-phone').value.trim();
      const subject = modal.querySelector('#enq-subject').value.trim();
      const message = modal.querySelector('#enq-message').value.trim();
      const errEl = modal.querySelector('#enq-error');

      if (name.length < 2) { errEl.textContent = 'Please provide your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email address.'; return; }
      if (phone.length < 6) { errEl.textContent = 'Please provide a valid phone number.'; return; }
      if (message.length < 10) { errEl.textContent = 'Please include a short message (at least 10 characters).'; return; }

      const saved = global.EstateState.addEnquiry({
        type: cfg.type || 'Property Enquiry',
        propertyId: cfg.propertyId || null,
        subject: subject,
        name: name,
        email: email,
        phone: phone,
        message: message
      });

      closeModal();
      showToast('Enquiry submitted (Ref: ' + saved.ref + '). Saved to your Enquiry History.');
    });
  }

  // Reusable Interactive Down Payment & Mortgage Calculator
  function mountDownPaymentCalculator(container, opts) {
    if (!container) return;
    const cfg = opts || {};
    const currency = cfg.currency || global.EstateState.getCurrency();
    const initialPrice = Math.round(cfg.totalPrice || 650000);
    const initialDownPct = cfg.downPaymentPct != null ? Number(cfg.downPaymentPct) : 20;
    const initialRate = cfg.annualRate != null ? Number(cfg.annualRate) : 5.5;
    const initialYears = cfg.years != null ? Number(cfg.years) : 20;
    const uid = 'calc-' + Math.random().toString(36).slice(2, 7);

    const propertySelectHTML = cfg.allowPropertyPick
      ? '<div class="field-group">' +
          '<label class="field-label" for="' + uid + '-pick">Pre-Fill From Any EstateSphere Residence</label>' +
          '<select id="' + uid + '-pick" class="field-select">' +
            '<option value="">Custom Property Amount</option>' +
            global.EstateState.getAllProperties().map(function (p) {
              const pr = global.EstateState.getPropertyPricing(p);
              return '<option value="' + escapeHTML(p.id) + '">' + escapeHTML(p.title) + ' — ' + escapeHTML(p.city) + ' (' + global.EstateState.formatMoney(pr.displayTotal, pr.displayCurrency) + ')</option>';
            }).join('') +
          '</select>' +
        '</div>'
      : '';

    container.innerHTML =
      '<div class="calc-card">' +
        '<div class="calc-grid">' +
          '<div class="calc-inputs">' +
            propertySelectHTML +
            '<div class="field-group">' +
              '<label class="field-label" for="' + uid + '-price">Total Property Price (<span class="js-calc-curr">' + currency + '</span>)</label>' +
              '<input id="' + uid + '-price" type="number" class="field-input tabular-nums" min="10000" step="5000" value="' + initialPrice + '">' +
            '</div>' +

            '<div class="field-group">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<label class="field-label" for="' + uid + '-dp-pct">Down Payment Percentage</label>' +
                '<strong class="tabular-nums" id="' + uid + '-dp-pct-label">' + initialDownPct + '%</strong>' +
              '</div>' +
              '<input id="' + uid + '-dp-pct" type="range" class="range-slider" min="5" max="80" step="1" value="' + initialDownPct + '">' +
              '<div class="calc-preset-row">' +
                [10, 15, 20, 25, 30, 40].map(function (pct) {
                  return '<button type="button" class="preset-btn' + (pct === initialDownPct ? ' is-active' : '') + '" data-pct="' + pct + '">' + pct + '%</button>';
                }).join('') +
              '</div>' +
            '</div>' +

            '<div class="form-grid-2">' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-loan">Loan Amount (<span class="js-calc-curr">' + currency + '</span>)</label>' +
                '<input id="' + uid + '-loan" type="number" class="field-input tabular-nums" min="0" step="5000" value="' + Math.round(initialPrice * (1 - initialDownPct / 100)) + '">' +
              '</div>' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-rate">Estimated Interest Rate (% p.a.)</label>' +
                '<input id="' + uid + '-rate" type="number" class="field-input tabular-nums" min="0" max="20" step="0.1" value="' + initialRate + '">' +
              '</div>' +
            '</div>' +

            '<div class="field-group">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<label class="field-label" for="' + uid + '-years">Loan Duration (Years)</label>' +
                '<strong class="tabular-nums" id="' + uid + '-years-label">' + initialYears + ' Years</strong>' +
              '</div>' +
              '<input id="' + uid + '-years" type="range" class="range-slider" min="5" max="35" step="1" value="' + initialYears + '">' +
            '</div>' +
          '</div>' +

          '<div class="calc-results">' +
            '<div>' +
              '<div class="calc-headline">' +
                '<span class="calc-headline-label">Estimated Monthly Mortgage Payment</span>' +
                '<div class="calc-headline-value" id="' + uid + '-out-monthly">$0</div>' +
                '<div style="font-size:0.78rem;color:rgba(255,255,255,0.68);margin-top:0.3rem;" id="' + uid + '-out-meta"></div>' +
              '</div>' +

              '<div class="calc-breakdown-grid" style="margin-top:1.25rem;">' +
                '<div class="calc-stat"><span>Down Payment Amount</span><strong id="' + uid + '-out-dp">$0</strong></div>' +
                '<div class="calc-stat"><span>Remaining Property Amount</span><strong id="' + uid + '-out-rem">$0</strong></div>' +
                '<div class="calc-stat"><span>Total Estimated Interest</span><strong id="' + uid + '-out-int">$0</strong></div>' +
                '<div class="calc-stat"><span>Total Estimated Repayment</span><strong id="' + uid + '-out-total">$0</strong></div>' +
              '</div>' +

              '<div style="margin-top:1.35rem;">' +
                '<div class="calc-bar">' +
                  '<div class="calc-bar-seg" id="' + uid + '-bar-dp" style="background:#C6AA80;width:20%;"></div>' +
                  '<div class="calc-bar-seg" id="' + uid + '-bar-loan" style="background:#FAF8F5;width:55%;"></div>' +
                  '<div class="calc-bar-seg" id="' + uid + '-bar-int" style="background:#8C6F47;width:25%;"></div>' +
                '</div>' +
                '<div class="calc-bar-legend">' +
                  '<span><i class="legend-dot" style="background:#C6AA80;"></i>Down Payment</span>' +
                  '<span><i class="legend-dot" style="background:#FAF8F5;"></i>Loan Principal</span>' +
                  '<span><i class="legend-dot" style="background:#8C6F47;"></i>Est. Interest</span>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="disclaimer-box">' +
              '<strong>Estimate Disclaimer:</strong> Mortgage, down payment, and installment figures are illustrative estimates only. Actual interest rates, down payment minimums, taxes, and eligibility depend on your lender, residency status, and property country.' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    const priceInput = container.querySelector('#' + uid + '-price');
    const dpSlider = container.querySelector('#' + uid + '-dp-pct');
    const dpLabel = container.querySelector('#' + uid + '-dp-pct-label');
    const loanInput = container.querySelector('#' + uid + '-loan');
    const rateInput = container.querySelector('#' + uid + '-rate');
    const yearsSlider = container.querySelector('#' + uid + '-years');
    const yearsLabel = container.querySelector('#' + uid + '-years-label');
    const presetBtns = container.querySelectorAll('.preset-btn');
    const pickSel = container.querySelector('#' + uid + '-pick');

    function update(source) {
      const curr = cfg.fixedCurrency || global.EstateState.getCurrency();
      container.querySelectorAll('.js-calc-curr').forEach(function (el) { el.textContent = curr; });

      let price = Math.max(0, Number(priceInput.value) || 0);
      let dpPct = Number(dpSlider.value) || 0;

      if (source === 'loan' && price > 0) {
        const loanVal = Math.min(price, Math.max(0, Number(loanInput.value) || 0));
        dpPct = Number((((price - loanVal) / price) * 100).toFixed(1));
        dpSlider.value = Math.min(80, Math.max(5, Math.round(dpPct)));
      }

      const res = global.EstateState.calculateMortgage({
        totalPrice: price,
        downPaymentPct: dpPct,
        annualRate: Number(rateInput.value) || 0,
        years: Number(yearsSlider.value) || 20
      });

      if (source !== 'loan') {
        loanInput.value = res.loanAmount;
      }

      dpLabel.textContent = (Math.round(res.downPaymentPct * 10) / 10) + '%';
      yearsLabel.textContent = res.years + ' Years (' + res.months + ' mos)';

      presetBtns.forEach(function (b) {
        b.classList.toggle('is-active', Number(b.dataset.pct) === Math.round(res.downPaymentPct));
      });

      const fmt = global.EstateState.formatMoney;
      container.querySelector('#' + uid + '-out-monthly').textContent = fmt(res.monthlyPayment, curr);
      container.querySelector('#' + uid + '-out-meta').textContent =
        res.downPaymentPct + '% down · ' + res.annualRate.toFixed(1) + '% est. rate · ' + res.years + '-year term';
      container.querySelector('#' + uid + '-out-dp').textContent = fmt(res.downPaymentAmount, curr);
      container.querySelector('#' + uid + '-out-rem').textContent = fmt(res.remainingAmount, curr);
      container.querySelector('#' + uid + '-out-int').textContent = fmt(res.totalInterest, curr);
      container.querySelector('#' + uid + '-out-total').textContent = fmt(res.totalRepayment, curr);

      const denom = Math.max(1, res.downPaymentAmount + res.loanAmount + res.totalInterest);
      container.querySelector('#' + uid + '-bar-dp').style.width = ((res.downPaymentAmount / denom) * 100).toFixed(1) + '%';
      container.querySelector('#' + uid + '-bar-loan').style.width = ((res.loanAmount / denom) * 100).toFixed(1) + '%';
      container.querySelector('#' + uid + '-bar-int').style.width = ((res.totalInterest / denom) * 100).toFixed(1) + '%';
    }

    priceInput.addEventListener('input', function () { update('price'); });
    dpSlider.addEventListener('input', function () { update('pct'); });
    loanInput.addEventListener('input', function () { update('loan'); });
    rateInput.addEventListener('input', function () { update('rate'); });
    yearsSlider.addEventListener('input', function () { update('years'); });

    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        dpSlider.value = btn.dataset.pct;
        update('pct');
      });
    });

    if (pickSel) {
      pickSel.addEventListener('change', function () {
        const prop = global.EstateState.getPropertyById(pickSel.value);
        if (!prop) return;
        const pr = global.EstateState.getPropertyPricing(prop);
        priceInput.value = pr.displayTotal;
        dpSlider.value = pr.downPaymentPct;
        update('pick');
      });
    }

    update('init');
  }

  // Reusable Investment Return Estimator
  function mountInvestmentCalculator(container) {
    if (!container) return;
    const curr = global.EstateState.getCurrency();
    const defaultPrice = Math.round(global.EstateState.convertAmount(500000, 'USD', curr));
    const uid = 'inv-' + Math.random().toString(36).slice(2, 7);

    container.innerHTML =
      '<div class="calc-card">' +
        '<div class="calc-grid">' +
          '<div class="calc-inputs">' +
            '<div class="field-group">' +
              '<label class="field-label" for="' + uid + '-price">Acquisition Price (' + curr + ')</label>' +
              '<input id="' + uid + '-price" type="number" class="field-input tabular-nums" min="50000" step="10000" value="' + defaultPrice + '">' +
            '</div>' +
            '<div class="form-grid-2">' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-dp">Down Payment (%)</label>' +
                '<input id="' + uid + '-dp" type="number" class="field-input tabular-nums" min="10" max="100" step="5" value="25">' +
              '</div>' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-yield">Est. Gross Rental Yield (% p.a.)</label>' +
                '<input id="' + uid + '-yield" type="number" class="field-input tabular-nums" min="1" max="18" step="0.2" value="6.8">' +
              '</div>' +
            '</div>' +
            '<div class="form-grid-3">' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-exp">Annual Costs (%)</label>' +
                '<input id="' + uid + '-exp" type="number" class="field-input tabular-nums" min="0" max="8" step="0.1" value="1.2">' +
              '</div>' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-appr">Est. Appreciation (%)</label>' +
                '<input id="' + uid + '-appr" type="number" class="field-input tabular-nums" min="0" max="15" step="0.2" value="5.5">' +
              '</div>' +
              '<div class="field-group">' +
                '<label class="field-label" for="' + uid + '-yrs">Holding Period (Yrs)</label>' +
                '<input id="' + uid + '-yrs" type="number" class="field-input tabular-nums" min="1" max="30" step="1" value="5">' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="calc-results">' +
            '<div>' +
              '<div class="calc-headline">' +
                '<span class="calc-headline-label">Estimated Monthly Net Rental Income</span>' +
                '<div class="calc-headline-value" id="' + uid + '-monthly">$0</div>' +
                '<div style="font-size:0.78rem;color:rgba(255,255,255,0.68);margin-top:0.3rem;" id="' + uid + '-net-yield"></div>' +
              '</div>' +
              '<div class="calc-breakdown-grid" style="margin-top:1.25rem;">' +
                '<div class="calc-stat"><span>Initial Capital (Down Payment)</span><strong id="' + uid + '-cap">$0</strong></div>' +
                '<div class="calc-stat"><span>Est. Annual Net Rent</span><strong id="' + uid + '-ann">$0</strong></div>' +
                '<div class="calc-stat"><span>Projected Value (End of Term)</span><strong id="' + uid + '-future">$0</strong></div>' +
                '<div class="calc-stat"><span>Est. Combined Gain + Rent</span><strong id="' + uid + '-total">$0</strong></div>' +
              '</div>' +
            '</div>' +
            '<div class="disclaimer-box">' +
              '<strong>Important Notice:</strong> All rental yields, appreciation projections, and return figures are illustrative estimates only and are <strong>not guaranteed returns</strong>. Property markets fluctuate and local taxes, vacancies, and financing costs apply.' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    function calc() {
      const c = global.EstateState.getCurrency();
      const fmt = global.EstateState.formatMoney;
      const out = global.EstateState.calculateInvestment({
        price: container.querySelector('#' + uid + '-price').value,
        downPaymentPct: container.querySelector('#' + uid + '-dp').value,
        grossYieldPct: container.querySelector('#' + uid + '-yield').value,
        expensesPct: container.querySelector('#' + uid + '-exp').value,
        appreciationPct: container.querySelector('#' + uid + '-appr').value,
        years: container.querySelector('#' + uid + '-yrs').value
      });

      container.querySelector('#' + uid + '-monthly').textContent = fmt(out.monthlyNetRent, c);
      container.querySelector('#' + uid + '-net-yield').textContent =
        'Est. Net Yield: ' + out.netYieldPct + '% p.a. · Holding horizon: ' + out.years + ' years';
      container.querySelector('#' + uid + '-cap').textContent = fmt(out.initialCapital, c);
      container.querySelector('#' + uid + '-ann').textContent = fmt(out.annualNetRent, c);
      container.querySelector('#' + uid + '-future').textContent = fmt(out.projectedFutureValue, c);
      container.querySelector('#' + uid + '-total').textContent = fmt(out.estimatedTotalReturn, c);
    }

    container.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', calc);
    });
    calc();
  }

  // Global Delegated Card Action Handlers
  function bindGlobalCardDelegation() {
    document.addEventListener('click', function (e) {
      const favBtn = e.target.closest('.js-fav-toggle');
      if (favBtn) {
        e.preventDefault();
        const id = favBtn.dataset.id;
        const added = global.EstateState.toggleFavourite(id);
        showToast(added ? 'Added residence to Favourites.' : 'Removed residence from Favourites.');
        refreshCardButtonStates(id);
        return;
      }

      const compBtn = e.target.closest('.js-compare-toggle');
      if (compBtn) {
        e.preventDefault();
        const id = compBtn.dataset.id;
        const res = global.EstateState.toggleCompare(id);
        if (!res.ok && res.reason === 'limit') {
          showToast('You can compare up to 3 properties at once. Remove one to add another.');
          return;
        }
        showToast(res.added ? 'Added property to side-by-side comparison.' : 'Removed property from comparison.');
        refreshCardButtonStates(id);
        return;
      }

      const enqBtn = e.target.closest('.js-enquire-trigger');
      if (enqBtn) {
        e.preventDefault();
        const prop = global.EstateState.getPropertyById(enqBtn.dataset.id);
        if (prop) {
          const pr = global.EstateState.getPropertyPricing(prop);
          openEnquiryModal({
            title: 'Enquire: ' + prop.title,
            subtitle: prop.id + ' · ' + prop.fullLocation + ' · ' + global.EstateState.formatMoney(pr.displayTotal, pr.displayCurrency),
            subject: 'Enquiry for ' + prop.title + ' (' + prop.id + ')',
            defaultMessage: 'Hello EstateSphere Advisory, I would like to request the brochure, floor plan, and viewing availability for ' + prop.title + ' (' + prop.id + ').',
            propertyId: prop.id,
            type: 'Property Enquiry'
          });
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function refreshCardButtonStates(propertyId) {
    const isFav = global.EstateState.isFavourite(propertyId);
    const isComp = global.EstateState.isInCompare(propertyId);

    document.querySelectorAll('.js-fav-toggle[data-id="' + propertyId + '"]').forEach(function (btn) {
      btn.classList.toggle('is-active', isFav);
      if (btn.classList.contains('icon-pill')) {
        btn.innerHTML = isFav ? ICONS.heartFill : ICONS.heart;
        btn.title = isFav ? 'Remove from Favourites' : 'Add to Favourites';
      } else {
        btn.innerHTML = (isFav ? ICONS.heartFill : ICONS.heart) + '<span>' + (isFav ? 'Saved' : 'Add to Favourites') + '</span>';
      }
    });

    document.querySelectorAll('.js-compare-toggle[data-id="' + propertyId + '"]').forEach(function (btn) {
      btn.classList.toggle('is-active', isComp);
      if (btn.classList.contains('micro-action')) {
        btn.innerHTML = ICONS.compare + '<span>' + (isComp ? 'Comparing' : 'Compare Property') + '</span>';
      } else if (btn.classList.contains('btn')) {
        btn.textContent = isComp ? 'In Comparison' : 'Compare Property';
      }
    });
  }

  function initShell() {
    renderHeader();
    renderFooter();
    renderCompareBar();
    bindGlobalCardDelegation();
    installImageFallbacks(document);

    global.EstateState.subscribe(function (evt) {
      if (evt === 'favourites-changed') syncHeaderBadges();
      if (evt === 'compare-changed') renderCompareBar();
      if (evt === 'currency-changed') {
        syncHeaderBadges();
        renderFooter();
      }
      if (evt === 'auth-changed') {
        renderHeader();
      }
    });
  }

  global.EstateUI = {
    FALLBACK_SVG: FALLBACK_SVG,
    ICONS: ICONS,
    escapeHTML: escapeHTML,
    installImageFallbacks: installImageFallbacks,
    showToast: showToast,
    initShell: initShell,
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderPropertyCard: renderPropertyCard,
    renderComparisonTableHTML: renderComparisonTableHTML,
    openModal: openModal,
    closeModal: closeModal,
    openCompareModal: openCompareModal,
    openAuthModal: openAuthModal,
    openEnquiryModal: openEnquiryModal,
    mountDownPaymentCalculator: mountDownPaymentCalculator,
    mountInvestmentCalculator: mountInvestmentCalculator
  };
})(window);
