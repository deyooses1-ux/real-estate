/* ==========================================================================
   EstateSphere — State Management, Currency Engine & Financial Calculators
   Demo persistence via localStorage
   ========================================================================== */

(function (global) {
  'use strict';

  const KEYS = {
    CURRENCY: 'estatesphere_currency',
    RATES_CACHE: 'estatesphere_rates_cache',
    FAVOURITES: 'estatesphere_favourites',
    COMPARE: 'estatesphere_compare',
    RECENTLY_VIEWED: 'estatesphere_recently_viewed',
    SAVED_SEARCHES: 'estatesphere_saved_searches',
    SEARCH_HISTORY: 'estatesphere_search_history',
    ENQUIRIES: 'estatesphere_enquiries',
    SUBMITTED_LISTINGS: 'estatesphere_submitted_listings',
    DEMO_USER: 'estatesphere_demo_user',
    DEMO_USERS_DB: 'estatesphere_demo_users_db'
  };

  const listeners = new Set();

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // Storage quota or restricted mode fallback
    }
  }

  function notify(eventName, detail) {
    listeners.forEach(function (fn) {
      try {
        fn(eventName, detail);
      } catch (err) {
        console.error('EstateState listener error:', err);
      }
    });
    document.dispatchEvent(new CustomEvent('estatesphere:' + eventName, { detail: detail }));
  }

  // Exchange Rates State (Base: USD = 1)
  function getFallbackRates() {
    const out = {};
    const currencies = global.EstateData.CURRENCIES;
    Object.keys(currencies).forEach(function (code) {
      out[code] = currencies[code].fallbackRate;
    });
    return out;
  }

  const rateState = {
    rates: getFallbackRates(),
    source: 'Demo fallback rates',
    updatedAt: null
  };

  function loadCachedRates() {
    const cached = readJSON(KEYS.RATES_CACHE, null);
    if (cached && cached.rates && cached.timestamp) {
      const ageMs = Date.now() - cached.timestamp;
      if (ageMs < 24 * 60 * 60 * 1000) {
        rateState.rates = Object.assign(getFallbackRates(), cached.rates);
        rateState.source = 'Live reference rates';
        rateState.updatedAt = new Date(cached.timestamp).toLocaleDateString();
        return true;
      }
    }
    return false;
  }

  function fetchLiveRates() {
    if (loadCachedRates()) return;
    if (typeof fetch !== 'function') return;

    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (res) {
        if (!res.ok) throw new Error('Rate fetch failed');
        return res.json();
      })
      .then(function (data) {
        if (data && data.result === 'success' && data.rates) {
          const picked = {};
          Object.keys(global.EstateData.CURRENCIES).forEach(function (code) {
            if (typeof data.rates[code] === 'number') {
              picked[code] = data.rates[code];
            }
          });
          rateState.rates = Object.assign(getFallbackRates(), picked);
          rateState.source = 'Live reference rates';
          rateState.updatedAt = new Date().toLocaleDateString();
          writeJSON(KEYS.RATES_CACHE, { rates: picked, timestamp: Date.now() });
          notify('currency-changed', { currency: getCurrency(), ratesUpdated: true });
        }
      })
      .catch(function () {
        // Silently retain fallback demo rates
        rateState.source = 'Demo fallback rates';
      });
  }

  function getCurrency() {
    const stored = localStorage.getItem(KEYS.CURRENCY);
    if (stored && global.EstateData.CURRENCIES[stored]) return stored;
    return 'USD';
  }

  function setCurrency(code) {
    if (!global.EstateData.CURRENCIES[code]) return;
    localStorage.setItem(KEYS.CURRENCY, code);
    notify('currency-changed', { currency: code });
  }

  function getRateInfo() {
    return {
      currency: getCurrency(),
      source: rateState.source,
      updatedAt: rateState.updatedAt,
      rates: rateState.rates
    };
  }

  function convertAmount(amount, fromCurrency, toCurrency) {
    const from = fromCurrency || 'USD';
    const to = toCurrency || getCurrency();
    if (from === to) return amount;
    const fromRate = rateState.rates[from] || 1;
    const toRate = rateState.rates[to] || 1;
    const inUSD = amount / fromRate;
    return inUSD * toRate;
  }

  function formatMoney(amount, currencyCode) {
    const code = currencyCode || getCurrency();
    const meta = global.EstateData.CURRENCIES[code] || global.EstateData.CURRENCIES.USD;
    const rounded = Math.round(Number(amount) || 0);
    const locale = code === 'INR' ? 'en-IN' : 'en-US';
    const formatted = rounded.toLocaleString(locale);
    return meta.symbol + formatted;
  }

  // Exact mathematical pricing breakdown for any property
  function getPropertyPricing(property, targetCurrency) {
    const dispCode = targetCurrency || getCurrency();
    const origCode = property.originalCurrency || 'USD';
    const origTotal = Math.round(Number(property.originalPrice) || 0);
    const dpPct = Number(property.downPaymentPct) || 20;

    const isConverted = dispCode !== origCode;
    const displayTotal = isConverted
      ? Math.round(convertAmount(origTotal, origCode, dispCode))
      : origTotal;

    const displayDownPayment = Math.round((displayTotal * dpPct) / 100);
    const displayRemaining = displayTotal - displayDownPayment;

    const origDownPayment = Math.round((origTotal * dpPct) / 100);
    const origRemaining = origTotal - origDownPayment;

    // Optional reference monthly installment (20 yrs @ 5.5% illustrative estimate)
    const mort = calculateMortgage({
      totalPrice: displayTotal,
      downPaymentPct: dpPct,
      annualRate: 5.5,
      years: 20
    });

    return {
      displayCurrency: dispCode,
      displayTotal: displayTotal,
      displayDownPayment: displayDownPayment,
      displayRemaining: displayRemaining,
      downPaymentPct: dpPct,
      originalCurrency: origCode,
      originalTotal: origTotal,
      originalDownPayment: origDownPayment,
      originalRemaining: origRemaining,
      isConverted: isConverted,
      estimatedMonthlyInstallment: mort.monthlyPayment
    };
  }

  // Exact Mortgage & Down Payment Calculator
  function calculateMortgage(opts) {
    const totalPrice = Math.max(0, Number(opts.totalPrice) || 0);
    let downPaymentPct = Number(opts.downPaymentPct);
    if (isNaN(downPaymentPct)) downPaymentPct = 20;
    downPaymentPct = Math.min(95, Math.max(0, downPaymentPct));

    const downPaymentAmount = Math.round((totalPrice * downPaymentPct) / 100);
    const loanAmount = Math.max(0, totalPrice - downPaymentAmount);

    const annualRate = Math.max(0, Number(opts.annualRate) || 0);
    const years = Math.max(1, Number(opts.years) || 20);
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;

    let monthlyPayment = 0;
    if (loanAmount > 0) {
      if (monthlyRate === 0) {
        monthlyPayment = loanAmount / months;
      } else {
        const factor = Math.pow(1 + monthlyRate, months);
        monthlyPayment = (loanAmount * (monthlyRate * factor)) / (factor - 1);
      }
    }

    const totalRepayment = monthlyPayment * months;
    const totalInterest = Math.max(0, totalRepayment - loanAmount);

    return {
      totalPrice: totalPrice,
      downPaymentPct: downPaymentPct,
      downPaymentAmount: downPaymentAmount,
      loanAmount: loanAmount,
      remainingAmount: loanAmount,
      annualRate: annualRate,
      years: years,
      months: months,
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment),
      totalOutlayWithDownPayment: Math.round(totalRepayment + downPaymentAmount)
    };
  }

  // Investment Return Estimator
  function calculateInvestment(opts) {
    const price = Math.max(0, Number(opts.price) || 0);
    const downPct = Math.min(100, Math.max(5, Number(opts.downPaymentPct) || 20));
    const grossYieldPct = Math.max(0, Number(opts.grossYieldPct) || 6);
    const expensesPct = Math.max(0, Number(opts.expensesPct) || 1.2);
    const appreciationPct = Math.max(0, Number(opts.appreciationPct) || 5);
    const years = Math.max(1, Number(opts.years) || 5);

    const initialCapital = Math.round((price * downPct) / 100);
    const annualGrossRent = Math.round((price * grossYieldPct) / 100);
    const annualExpenses = Math.round((price * expensesPct) / 100);
    const annualNetRent = Math.max(0, annualGrossRent - annualExpenses);
    const monthlyNetRent = Math.round(annualNetRent / 12);
    const netYieldPct = price > 0 ? ((annualNetRent / price) * 100) : 0;

    const projectedFutureValue = Math.round(price * Math.pow(1 + appreciationPct / 100, years));
    const estimatedCapitalGain = projectedFutureValue - price;
    const cumulativeNetRent = annualNetRent * years;
    const estimatedTotalReturn = estimatedCapitalGain + cumulativeNetRent;
    const estimatedCashOnCashPct = initialCapital > 0 ? ((annualNetRent / initialCapital) * 100) : 0;

    return {
      price: price,
      initialCapital: initialCapital,
      annualGrossRent: annualGrossRent,
      annualExpenses: annualExpenses,
      annualNetRent: annualNetRent,
      monthlyNetRent: monthlyNetRent,
      netYieldPct: Number(netYieldPct.toFixed(2)),
      projectedFutureValue: projectedFutureValue,
      estimatedCapitalGain: estimatedCapitalGain,
      cumulativeNetRent: cumulativeNetRent,
      estimatedTotalReturn: estimatedTotalReturn,
      estimatedCashOnCashPct: Number(estimatedCashOnCashPct.toFixed(2)),
      years: years
    };
  }

  // All Properties (Built-in + User Submitted Demo Listings)
  function getSubmittedListings() {
    return readJSON(KEYS.SUBMITTED_LISTINGS, []);
  }

  function addSubmittedListing(listing) {
    const current = getSubmittedListings();
    current.unshift(listing);
    writeJSON(KEYS.SUBMITTED_LISTINGS, current);
    notify('listings-changed', { listing: listing });
    return listing;
  }

  function removeSubmittedListing(id) {
    const filtered = getSubmittedListings().filter(function (item) {
      return item.id !== id;
    });
    writeJSON(KEYS.SUBMITTED_LISTINGS, filtered);
    notify('listings-changed', { removedId: id });
  }

  function getAllProperties() {
    return getSubmittedListings().concat(global.EstateData.PROPERTIES);
  }

  function getPropertyById(id) {
    return getAllProperties().find(function (p) {
      return p.id === id;
    }) || null;
  }

  // Favourites
  function getFavourites() {
    return readJSON(KEYS.FAVOURITES, []);
  }

  function isFavourite(id) {
    return getFavourites().indexOf(id) !== -1;
  }

  function toggleFavourite(id) {
    const list = getFavourites();
    const idx = list.indexOf(id);
    let added = false;
    if (idx === -1) {
      list.unshift(id);
      added = true;
    } else {
      list.splice(idx, 1);
    }
    writeJSON(KEYS.FAVOURITES, list);
    notify('favourites-changed', { id: id, added: added, count: list.length });
    return added;
  }

  // Compare (up to 3)
  function getCompareList() {
    return readJSON(KEYS.COMPARE, []);
  }

  function isInCompare(id) {
    return getCompareList().indexOf(id) !== -1;
  }

  function toggleCompare(id) {
    const list = getCompareList();
    const idx = list.indexOf(id);
    if (idx !== -1) {
      list.splice(idx, 1);
      writeJSON(KEYS.COMPARE, list);
      notify('compare-changed', { list: list, added: false });
      return { ok: true, added: false, list: list };
    }
    if (list.length >= 3) {
      return { ok: false, reason: 'limit', list: list };
    }
    list.push(id);
    writeJSON(KEYS.COMPARE, list);
    notify('compare-changed', { list: list, added: true });
    return { ok: true, added: true, list: list };
  }

  function clearCompare() {
    writeJSON(KEYS.COMPARE, []);
    notify('compare-changed', { list: [] });
  }

  // Recently Viewed
  function getRecentlyViewed() {
    return readJSON(KEYS.RECENTLY_VIEWED, []);
  }

  function recordRecentlyViewed(id) {
    const list = getRecentlyViewed().filter(function (x) { return x !== id; });
    list.unshift(id);
    writeJSON(KEYS.RECENTLY_VIEWED, list.slice(0, 8));
  }

  // Saved Searches
  function getSavedSearches() {
    return readJSON(KEYS.SAVED_SEARCHES, []);
  }

  function saveSearch(label, paramsObj) {
    const list = getSavedSearches();
    const entry = {
      id: 'SRCH-' + Date.now(),
      label: label,
      params: paramsObj,
      savedAt: new Date().toLocaleDateString()
    };
    list.unshift(entry);
    writeJSON(KEYS.SAVED_SEARCHES, list.slice(0, 12));
    notify('searches-changed', { list: list });
    return entry;
  }

  function removeSavedSearch(id) {
    const list = getSavedSearches().filter(function (s) { return s.id !== id; });
    writeJSON(KEYS.SAVED_SEARCHES, list);
    notify('searches-changed', { list: list });
  }

  // Search History
  function getSearchHistory() {
    return readJSON(KEYS.SEARCH_HISTORY, []);
  }

  function addSearchHistory(term) {
    const clean = (term || '').trim();
    if (!clean) return;
    const list = getSearchHistory().filter(function (t) {
      return t.toLowerCase() !== clean.toLowerCase();
    });
    list.unshift(clean);
    writeJSON(KEYS.SEARCH_HISTORY, list.slice(0, 8));
  }

  function clearSearchHistory() {
    writeJSON(KEYS.SEARCH_HISTORY, []);
  }

  // Enquiry History
  function getEnquiries() {
    return readJSON(KEYS.ENQUIRIES, []);
  }

  function addEnquiry(entry) {
    const list = getEnquiries();
    const item = Object.assign({
      ref: 'ENQ-' + String(Date.now()).slice(-6),
      createdAt: new Date().toLocaleString()
    }, entry);
    list.unshift(item);
    writeJSON(KEYS.ENQUIRIES, list.slice(0, 25));
    notify('enquiries-changed', { item: item });
    return item;
  }

  // Demo Authentication (Explicitly Demonstration-Only)
  function getDemoUser() {
    return readJSON(KEYS.DEMO_USER, null);
  }

  function registerDemoUser(name, email, password, country) {
    const users = readJSON(KEYS.DEMO_USERS_DB, []);
    const exists = users.find(function (u) {
      return u.email.toLowerCase() === email.toLowerCase();
    });
    if (exists) {
      return { ok: false, message: 'A demo account with this email already exists. Please sign in.' };
    }
    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      country: country || 'United States',
      joinedAt: new Date().toLocaleDateString()
    };
    users.push(newUser);
    writeJSON(KEYS.DEMO_USERS_DB, users);
    const session = { name: newUser.name, email: newUser.email, country: newUser.country, joinedAt: newUser.joinedAt };
    writeJSON(KEYS.DEMO_USER, session);
    notify('auth-changed', { user: session });
    return { ok: true, user: session };
  }

  function signInDemoUser(email, password) {
    const users = readJSON(KEYS.DEMO_USERS_DB, []);
    const match = users.find(function (u) {
      return u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password;
    });
    if (!match) {
      // Allow quick demo access if user uses demo@estatesphere.com
      if (email.trim().toLowerCase() === 'demo@estatesphere.com' && password.length >= 4) {
        const guest = {
          name: 'Victoria Sterling (Demo)',
          email: 'demo@estatesphere.com',
          country: 'United Kingdom',
          joinedAt: new Date().toLocaleDateString()
        };
        writeJSON(KEYS.DEMO_USER, guest);
        notify('auth-changed', { user: guest });
        return { ok: true, user: guest };
      }
      return { ok: false, message: 'Invalid demo credentials. Register a new demo account or try demo@estatesphere.com with any 4+ character password.' };
    }
    const session = { name: match.name, email: match.email, country: match.country, joinedAt: match.joinedAt };
    writeJSON(KEYS.DEMO_USER, session);
    notify('auth-changed', { user: session });
    return { ok: true, user: session };
  }

  function signOutDemoUser() {
    localStorage.removeItem(KEYS.DEMO_USER);
    notify('auth-changed', { user: null });
  }

  function subscribe(fn) {
    listeners.add(fn);
    return function () { listeners.delete(fn); };
  }

  // Trigger live exchange-rate refresh on load
  fetchLiveRates();

  global.EstateState = {
    getCurrency: getCurrency,
    setCurrency: setCurrency,
    getRateInfo: getRateInfo,
    convertAmount: convertAmount,
    formatMoney: formatMoney,
    getPropertyPricing: getPropertyPricing,
    calculateMortgage: calculateMortgage,
    calculateInvestment: calculateInvestment,
    getAllProperties: getAllProperties,
    getPropertyById: getPropertyById,
    getSubmittedListings: getSubmittedListings,
    addSubmittedListing: addSubmittedListing,
    removeSubmittedListing: removeSubmittedListing,
    getFavourites: getFavourites,
    isFavourite: isFavourite,
    toggleFavourite: toggleFavourite,
    getCompareList: getCompareList,
    isInCompare: isInCompare,
    toggleCompare: toggleCompare,
    clearCompare: clearCompare,
    getRecentlyViewed: getRecentlyViewed,
    recordRecentlyViewed: recordRecentlyViewed,
    getSavedSearches: getSavedSearches,
    saveSearch: saveSearch,
    removeSavedSearch: removeSavedSearch,
    getSearchHistory: getSearchHistory,
    addSearchHistory: addSearchHistory,
    clearSearchHistory: clearSearchHistory,
    getEnquiries: getEnquiries,
    addEnquiry: addEnquiry,
    getDemoUser: getDemoUser,
    registerDemoUser: registerDemoUser,
    signInDemoUser: signInDemoUser,
    signOutDemoUser: signOutDemoUser,
    subscribe: subscribe
  };
})(window);
