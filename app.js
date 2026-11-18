/* ==========================================================================
   EstateSphere — Page Controllers & Frontend Interactions
   ========================================================================== */

(function (global) {
  'use strict';

  const State = global.EstateState;
  const Data = global.EstateData;
  const UI = global.EstateUI;

  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    params.forEach(function (val, key) {
      out[key] = val;
    });
    return out;
  }

  function populateCountrySelect(selectEl, includeAll) {
    if (!selectEl) return;
    const current = selectEl.value;
    let html = includeAll ? '<option value="">All Countries</option>' : '';
    Data.COUNTRIES.forEach(function (c) {
      html += '<option value="' + UI.escapeHTML(c.name) + '">' + UI.escapeHTML(c.name) + '</option>';
    });
    selectEl.innerHTML = html;
    if (current) selectEl.value = current;
  }

  function populateCitySelect(selectEl, countryName, properties) {
    if (!selectEl) return;
    const list = properties || State.getAllProperties();
    const citiesSet = new Set();
    list.forEach(function (p) {
      if (!countryName || p.country === countryName) {
        citiesSet.add(p.city);
      }
    });
    const cities = Array.from(citiesSet).sort();
    const prev = selectEl.value;
    let html = '<option value="">All Cities</option>';
    cities.forEach(function (city) {
      html += '<option value="' + UI.escapeHTML(city) + '">' + UI.escapeHTML(city) + '</option>';
    });
    selectEl.innerHTML = html;
    if (cities.indexOf(prev) !== -1) selectEl.value = prev;
  }

  function getPriceUSD(property) {
    return State.convertAmount(property.originalPrice, property.originalCurrency || 'USD', 'USD');
  }

  function sortProperties(list, sortKey) {
    const copy = list.slice();
    switch (sortKey) {
      case 'price-asc':
        copy.sort(function (a, b) { return getPriceUSD(a) - getPriceUSD(b); });
        break;
      case 'price-desc':
        copy.sort(function (a, b) { return getPriceUSD(b) - getPriceUSD(a); });
        break;
      case 'area-desc':
        copy.sort(function (a, b) { return Number(b.areaSqFt) - Number(a.areaSqFt); });
        break;
      case 'yield-desc':
        copy.sort(function (a, b) { return (b.rentalYieldPct || 0) - (a.rentalYieldPct || 0); });
        break;
      case 'newest':
        copy.sort(function (a, b) { return (b.constructionYear || 0) - (a.constructionYear || 0); });
        break;
      default:
        copy.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
        break;
    }
    return copy;
  }

  function matchesPriceRangeUSD(property, rangeKey) {
    if (!rangeKey) return true;
    const usd = getPriceUSD(property);
    if (rangeKey === 'under-400k') return usd < 400000;
    if (rangeKey === '400k-1m') return usd >= 400000 && usd <= 1000000;
    if (rangeKey === '1m-2.5m') return usd > 1000000 && usd <= 2500000;
    if (rangeKey === 'over-2.5m') return usd > 2500000;
    const numericMax = Number(rangeKey);
    if (!isNaN(numericMax) && numericMax > 0) return usd <= numericMax;
    return true;
  }

  function renderCountryCardHTML(countryObj) {
    const allProps = State.getAllProperties();
    const matches = allProps.filter(function (p) { return p.country === countryObj.name; });
    const count = matches.length;
    const curr = State.getCurrency();
    let startPriceHTML = 'On Request';
    if (matches.length > 0) {
      const minProp = matches.reduce(function (best, p) {
        return getPriceUSD(p) < getPriceUSD(best) ? p : best;
      }, matches[0]);
      const pr = State.getPropertyPricing(minProp, curr);
      startPriceHTML = State.formatMoney(pr.displayTotal, curr);
    }

    return (
      '<article class="country-card">' +
        '<img src="' + UI.escapeHTML(countryObj.image) + '" alt="' + UI.escapeHTML(countryObj.name) + ' real estate" loading="lazy">' +
        '<div class="country-card-scrim"></div>' +
        '<div class="country-card-body">' +
          '<span class="country-card-count">' + count + ' ' + (count === 1 ? 'Residence' : 'Residences') + ' Available</span>' +
          '<h3 class="country-card-title">' + UI.escapeHTML(countryObj.name) + '</h3>' +
          '<p class="country-card-cities">' + UI.escapeHTML(countryObj.cities.join(' · ')) + '</p>' +
          '<div class="country-card-footer">' +
            '<div class="country-card-price">' +
              '<span>Starting From</span>' +
              '<strong>' + startPriceHTML + '</strong>' +
            '</div>' +
            '<a href="properties.html?country=' + encodeURIComponent(countryObj.name) + '" class="btn btn--outline-light btn--sm">Explore</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  /* ========================================================================
     1. HOMEPAGE CONTROLLER
     ======================================================================== */
  function initHomePage() {
    const countrySel = document.getElementById('hero-country');
    populateCountrySelect(countrySel, true);

    let activeHeroStatus = '';
    document.querySelectorAll('.js-hero-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.js-hero-tab').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        activeHeroStatus = tab.dataset.status || '';
      });
    });

    const heroForm = document.getElementById('hero-search-form');
    if (heroForm) {
      heroForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const q = (document.getElementById('hero-keyword').value || '').trim();
        const country = document.getElementById('hero-country').value;
        const category = document.getElementById('hero-category').value;
        const beds = document.getElementById('hero-beds').value;
        const priceRange = document.getElementById('hero-price').value;

        if (q) State.addSearchHistory(q);
        else if (country) State.addSearchHistory(country);

        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (country) params.set('country', country);
        if (category) params.set('category', category);
        if (beds) params.set('beds', beds);
        if (priceRange) params.set('priceRange', priceRange);
        if (activeHeroStatus) params.set('status', activeHeroStatus);

        window.location.href = 'properties.html' + (params.toString() ? '?' + params.toString() : '');
      });
    }

    function renderHomeSections() {
      const all = State.getAllProperties();

      const featuredEl = document.getElementById('home-featured-grid');
      if (featuredEl) {
        const featured = all.filter(function (p) { return p.featured; }).slice(0, 6);
        featuredEl.innerHTML = featured.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(featuredEl);
      }

      const recentEl = document.getElementById('home-recent-grid');
      if (recentEl) {
        const recent = all.filter(function (p) { return p.awaitingVerification || p.recentlyAdded; }).slice(0, 3);
        recentEl.innerHTML = recent.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(recentEl);
      }

      const countriesEl = document.getElementById('home-countries-grid');
      if (countriesEl) {
        countriesEl.innerHTML = Data.COUNTRIES.slice(0, 8).map(renderCountryCardHTML).join('');
        UI.installImageFallbacks(countriesEl);
      }

      const popAptEl = document.getElementById('home-apartments-grid');
      if (popAptEl) {
        const apts = all.filter(function (p) { return p.popularApartment; }).slice(0, 3);
        popAptEl.innerHTML = apts.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(popAptEl);
      }

      const invEl = document.getElementById('home-investment-grid');
      if (invEl) {
        const inv = all
          .filter(function (p) { return p.isInvestment; })
          .sort(function (a, b) { return (b.rentalYieldPct || 0) - (a.rentalYieldPct || 0); })
          .slice(0, 3);
        invEl.innerHTML = inv.map(function (p) { return UI.renderPropertyCard(p, { showInvestment: true }); }).join('');
        UI.installImageFallbacks(invEl);
      }

      const testEl = document.getElementById('home-testimonials-grid');
      if (testEl) {
        testEl.innerHTML = Data.TESTIMONIALS.map(function (t) {
          return (
            '<article class="testimonial-card">' +
              '<p class="testimonial-quote">&ldquo;' + UI.escapeHTML(t.quote) + '&rdquo;</p>' +
              '<div class="testimonial-author">' +
                '<div><strong>' + UI.escapeHTML(t.name) + '</strong><span>' + UI.escapeHTML(t.role) + '</span></div>' +
                '<span style="color:var(--accent);letter-spacing:2px;" aria-label="5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>' +
              '</div>' +
            '</article>'
          );
        }).join('');
      }
    }

    renderHomeSections();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') renderHomeSections();
    });
  }

  /* ========================================================================
     2. PROPERTY GALLERY PAGE (ALL 10 CATEGORIES)
     ======================================================================== */
  function initPropertiesPage() {
    const query = getQueryParams();
    const state = {
      category: query.category || 'All Properties',
      q: query.q || '',
      country: query.country || '',
      city: query.city || '',
      beds: query.beds || '',
      priceRange: query.priceRange || '',
      status: query.status || '',
      sort: query.sort || 'featured'
    };

    const pillsEl = document.getElementById('gallery-category-pills');
    const qInput = document.getElementById('filter-q');
    const countrySel = document.getElementById('filter-country');
    const citySel = document.getElementById('filter-city');
    const bedsSel = document.getElementById('filter-beds');
    const priceSel = document.getElementById('filter-price');
    const statusSel = document.getElementById('filter-status');
    const sortSel = document.getElementById('filter-sort');
    const gridEl = document.getElementById('properties-grid');
    const countEl = document.getElementById('properties-count');
    const historyEl = document.getElementById('search-history-strip');
    const recentStripEl = document.getElementById('recently-viewed-grid');

    populateCountrySelect(countrySel, true);
    if (state.country) countrySel.value = state.country;
    populateCitySelect(citySel, state.country);
    if (state.city) citySel.value = state.city;
    if (qInput) qInput.value = state.q;
    if (bedsSel && state.beds) bedsSel.value = state.beds;
    if (priceSel && state.priceRange) priceSel.value = state.priceRange;
    if (statusSel && state.status) statusSel.value = state.status;
    if (sortSel && state.sort) sortSel.value = state.sort;

    function renderPills() {
      if (!pillsEl) return;
      pillsEl.innerHTML = Data.GALLERY_CATEGORIES.map(function (cat) {
        return '<button type="button" class="pill-btn' + (state.category === cat ? ' is-active' : '') + '" data-cat="' + UI.escapeHTML(cat) + '">' + UI.escapeHTML(cat) + '</button>';
      }).join('');
      pillsEl.querySelectorAll('.pill-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.category = btn.dataset.cat;
          renderPills();
          renderResults();
        });
      });
    }

    function renderHistory() {
      if (!historyEl) return;
      const history = State.getSearchHistory();
      if (history.length === 0) {
        historyEl.style.display = 'none';
        return;
      }
      historyEl.style.display = 'flex';
      historyEl.innerHTML =
        '<span>Recent Searches:</span>' +
        history.map(function (term) {
          return '<button type="button" class="history-chip" data-term="' + UI.escapeHTML(term) + '">' + UI.escapeHTML(term) + '</button>';
        }).join('') +
        '<button type="button" class="micro-action" id="clear-history-inline" style="margin-left:auto;">Clear</button>';

      historyEl.querySelectorAll('.history-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          state.q = chip.dataset.term;
          qInput.value = state.q;
          renderResults();
        });
      });
      const clearBtn = historyEl.querySelector('#clear-history-inline');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          State.clearSearchHistory();
          renderHistory();
        });
      }
    }

    function renderRecentlyViewed() {
      if (!recentStripEl) return;
      const sec = document.getElementById('recently-viewed-section');
      const ids = State.getRecentlyViewed();
      const props = ids.map(function (id) { return State.getPropertyById(id); }).filter(Boolean).slice(0, 3);
      if (props.length === 0) {
        if (sec) sec.style.display = 'none';
        return;
      }
      if (sec) sec.style.display = 'block';
      recentStripEl.innerHTML = props.map(function (p) { return UI.renderPropertyCard(p); }).join('');
      UI.installImageFallbacks(recentStripEl);
    }

    function renderResults() {
      const all = State.getAllProperties();
      const filtered = all.filter(function (p) {
        if (state.category && state.category !== 'All Properties') {
          const cats = p.categories || [];
          const matchCat =
            cats.indexOf(state.category) !== -1 ||
            p.type === state.category ||
            (state.category === 'Ready-to-Move Properties' && p.availability === 'Ready to Move') ||
            (state.category === 'Under-Construction Properties' && p.availability === 'Under Construction');
          if (!matchCat) return false;
        }
        if (state.country && p.country !== state.country) return false;
        if (state.city && p.city !== state.city) return false;
        if (state.beds && Number(p.bedrooms) < Number(state.beds)) return false;
        if (state.status && p.availability !== state.status) return false;
        if (!matchesPriceRangeUSD(p, state.priceRange)) return false;
        if (state.q) {
          const hay = (p.title + ' ' + p.id + ' ' + p.city + ' ' + p.country + ' ' + p.fullLocation + ' ' + p.type).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
        }
        return true;
      });

      const sorted = sortProperties(filtered, state.sort);
      if (countEl) {
        countEl.innerHTML = 'Showing <strong>' + sorted.length + '</strong> of ' + all.length + ' international residences';
      }

      if (sorted.length === 0) {
        gridEl.innerHTML =
          '<div class="empty-state" style="grid-column:1/-1;">' +
            '<h3>No Matching Residences Found</h3>' +
            '<p>Try broadening your country, price range, or category filters to explore our full global collection.</p>' +
            '<button type="button" class="btn btn--primary" id="inline-reset-filters">Reset All Filters</button>' +
          '</div>';
        const btn = document.getElementById('inline-reset-filters');
        if (btn) btn.addEventListener('click', resetFilters);
      } else {
        gridEl.innerHTML = sorted.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(gridEl);
      }
    }

    function resetFilters() {
      state.category = 'All Properties';
      state.q = '';
      state.country = '';
      state.city = '';
      state.beds = '';
      state.priceRange = '';
      state.status = '';
      state.sort = 'featured';
      qInput.value = '';
      countrySel.value = '';
      populateCitySelect(citySel, '');
      citySel.value = '';
      bedsSel.value = '';
      priceSel.value = '';
      statusSel.value = '';
      sortSel.value = 'featured';
      renderPills();
      renderResults();
    }

    qInput.addEventListener('input', function () {
      state.q = qInput.value.trim();
      renderResults();
    });
    qInput.addEventListener('change', function () {
      if (qInput.value.trim()) {
        State.addSearchHistory(qInput.value.trim());
        renderHistory();
      }
    });
    countrySel.addEventListener('change', function () {
      state.country = countrySel.value;
      state.city = '';
      populateCitySelect(citySel, state.country);
      renderResults();
    });
    citySel.addEventListener('change', function () { state.city = citySel.value; renderResults(); });
    bedsSel.addEventListener('change', function () { state.beds = bedsSel.value; renderResults(); });
    priceSel.addEventListener('change', function () { state.priceRange = priceSel.value; renderResults(); });
    statusSel.addEventListener('change', function () { state.status = statusSel.value; renderResults(); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; renderResults(); });

    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    const saveSearchBtn = document.getElementById('btn-save-search');
    if (saveSearchBtn) {
      saveSearchBtn.addEventListener('click', function () {
        const parts = [];
        if (state.category !== 'All Properties') parts.push(state.category);
        if (state.country) parts.push(state.country);
        if (state.city) parts.push(state.city);
        if (state.beds) parts.push(state.beds + '+ Bed');
        if (state.status) parts.push(state.status);
        if (state.q) parts.push('"' + state.q + '"');
        const label = parts.length > 0 ? parts.join(' · ') : 'All International Properties';
        State.saveSearch(label, Object.assign({}, state));
        UI.showToast('Search saved: ' + label);
      });
    }

    renderPills();
    renderHistory();
    renderResults();
    renderRecentlyViewed();

    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') {
        renderResults();
        renderRecentlyViewed();
      }
    });
  }

  /* ========================================================================
     3. APARTMENTS PAGE (ALL 11 DEDICATED FILTERS)
     ======================================================================== */
  function initApartmentsPage() {
    const isApartment = function (p) {
      const cats = p.categories || [];
      return (
        cats.indexOf('Apartments') !== -1 ||
        cats.indexOf('Luxury Apartments') !== -1 ||
        cats.indexOf('Studio Apartments') !== -1 ||
        cats.indexOf('Duplex Apartments') !== -1 ||
        p.type.toLowerCase().indexOf('apartment') !== -1 ||
        p.type === 'Penthouse'
      );
    };

    const state = {
      country: '',
      city: '',
      priceRange: '',
      beds: '',
      baths: '',
      size: '',
      furnished: '',
      tier: 'all',
      sort: 'featured'
    };

    const countrySel = document.getElementById('apt-country');
    const citySel = document.getElementById('apt-city');
    const priceSel = document.getElementById('apt-price');
    const bedsSel = document.getElementById('apt-beds');
    const bathsSel = document.getElementById('apt-baths');
    const sizeSel = document.getElementById('apt-size');
    const furnSel = document.getElementById('apt-furnished');
    const sortSel = document.getElementById('apt-sort');
    const gridEl = document.getElementById('apartments-grid');
    const countEl = document.getElementById('apartments-count');

    populateCountrySelect(countrySel, true);
    populateCitySelect(citySel, '', State.getAllProperties().filter(isApartment));

    document.querySelectorAll('.js-apt-tier').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.js-apt-tier').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.tier = btn.dataset.tier;
        render();
      });
    });

    function render() {
      const base = State.getAllProperties().filter(isApartment);
      const filtered = base.filter(function (p) {
        if (state.country && p.country !== state.country) return false;
        if (state.city && p.city !== state.city) return false;
        if (!matchesPriceRangeUSD(p, state.priceRange)) return false;
        if (state.beds && Number(p.bedrooms) < Number(state.beds)) return false;
        if (state.baths && Number(p.bathrooms) < Number(state.baths)) return false;
        if (state.size) {
          const area = Number(p.areaSqFt);
          if (state.size === 'under-1000' && area >= 1000) return false;
          if (state.size === '1000-2000' && (area < 1000 || area > 2000)) return false;
          if (state.size === 'over-2000' && area <= 2000) return false;
        }
        if (state.furnished) {
          if (state.furnished === 'Furnished' && p.furnished !== 'Fully Furnished') return false;
          if (state.furnished === 'Unfurnished' && p.furnished !== 'Unfurnished') return false;
          if (state.furnished === 'Semi-Furnished' && p.furnished !== 'Semi-Furnished') return false;
        }
        if (state.tier === 'ready' && p.availability !== 'Ready to Move') return false;
        if (state.tier === 'under' && p.availability !== 'Under Construction') return false;
        if (state.tier === 'new' && p.availability !== 'New Construction') return false;
        if (state.tier === 'luxury' && (p.categories || []).indexOf('Luxury Apartments') === -1 && p.type !== 'Luxury Apartment') return false;
        return true;
      });

      const sorted = sortProperties(filtered, state.sort);
      countEl.innerHTML = 'Showing <strong>' + sorted.length + '</strong> apartments across global cities';
      if (sorted.length === 0) {
        gridEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No Apartments Match Your Filters</h3><p>Adjust your bedroom, size, or furnishing preferences to view more international apartments.</p></div>';
      } else {
        gridEl.innerHTML = sorted.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(gridEl);
      }
    }

    countrySel.addEventListener('change', function () {
      state.country = countrySel.value;
      state.city = '';
      populateCitySelect(citySel, state.country, State.getAllProperties().filter(isApartment));
      render();
    });
    citySel.addEventListener('change', function () { state.city = citySel.value; render(); });
    priceSel.addEventListener('change', function () { state.priceRange = priceSel.value; render(); });
    bedsSel.addEventListener('change', function () { state.beds = bedsSel.value; render(); });
    bathsSel.addEventListener('change', function () { state.baths = bathsSel.value; render(); });
    sizeSel.addEventListener('change', function () { state.size = sizeSel.value; render(); });
    furnSel.addEventListener('change', function () { state.furnished = furnSel.value; render(); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });

    const resetBtn = document.getElementById('apt-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        Object.assign(state, { country: '', city: '', priceRange: '', beds: '', baths: '', size: '', furnished: '', tier: 'all', sort: 'featured' });
        countrySel.value = '';
        populateCitySelect(citySel, '', State.getAllProperties().filter(isApartment));
        citySel.value = '';
        priceSel.value = '';
        bedsSel.value = '';
        bathsSel.value = '';
        sizeSel.value = '';
        furnSel.value = '';
        sortSel.value = 'featured';
        document.querySelectorAll('.js-apt-tier').forEach(function (b) { b.classList.toggle('is-active', b.dataset.tier === 'all'); });
        render();
      });
    }

    render();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') render();
    });
  }

  /* ========================================================================
     4. FLATS PAGE (ALL 7 FLAT CATEGORIES)
     ======================================================================== */
  function initFlatsPage() {
    const isFlat = function (p) {
      return (p.flatTiers && p.flatTiers.length > 0) || (p.categories || []).indexOf('Flats') !== -1 || p.type === 'Flat';
    };

    const state = { tier: 'All Flats', country: '', beds: '', priceRange: '', sort: 'featured' };
    const countrySel = document.getElementById('flat-country');
    const bedsSel = document.getElementById('flat-beds');
    const priceSel = document.getElementById('flat-price');
    const sortSel = document.getElementById('flat-sort');
    const gridEl = document.getElementById('flats-grid');
    const countEl = document.getElementById('flats-count');

    populateCountrySelect(countrySel, true);

    document.querySelectorAll('.js-flat-tier').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.js-flat-tier').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.tier = btn.dataset.tier;
        render();
      });
    });

    function render() {
      const base = State.getAllProperties().filter(isFlat);
      const filtered = base.filter(function (p) {
        if (state.tier !== 'All Flats') {
          const tiers = p.flatTiers || [];
          const match =
            tiers.indexOf(state.tier) !== -1 ||
            (state.tier === 'Fully Furnished Flats' && p.furnished === 'Fully Furnished') ||
            (state.tier === 'Unfurnished Flats' && p.furnished === 'Unfurnished');
          if (!match) return false;
        }
        if (state.country && p.country !== state.country) return false;
        if (state.beds && Number(p.bedrooms) < Number(state.beds)) return false;
        if (!matchesPriceRangeUSD(p, state.priceRange)) return false;
        return true;
      });

      const sorted = sortProperties(filtered, state.sort);
      countEl.innerHTML = 'Showing <strong>' + sorted.length + '</strong> flats (' + UI.escapeHTML(state.tier) + ')';
      if (sorted.length === 0) {
        gridEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No Flats Match This Selection</h3><p>Try selecting "All Flats" or adjusting the country and price range.</p></div>';
      } else {
        gridEl.innerHTML = sorted.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(gridEl);
      }
    }

    countrySel.addEventListener('change', function () { state.country = countrySel.value; render(); });
    bedsSel.addEventListener('change', function () { state.beds = bedsSel.value; render(); });
    priceSel.addEventListener('change', function () { state.priceRange = priceSel.value; render(); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });

    render();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') render();
    });
  }

  /* ========================================================================
     5. VILLAS & PENTHOUSES PAGE
     ======================================================================== */
  function initVillasPage() {
    const isVillaOrPent = function (p) {
      return p.type === 'Villa' || p.type === 'Penthouse' || (p.categories || []).indexOf('Villas') !== -1 || (p.categories || []).indexOf('Penthouses') !== -1;
    };
    const state = { type: 'All', country: '', beds: '', sort: 'price-desc' };
    const countrySel = document.getElementById('villa-country');
    const bedsSel = document.getElementById('villa-beds');
    const sortSel = document.getElementById('villa-sort');
    const gridEl = document.getElementById('villas-grid');
    const countEl = document.getElementById('villas-count');

    populateCountrySelect(countrySel, true);

    document.querySelectorAll('.js-villa-type').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.js-villa-type').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.type = btn.dataset.type;
        render();
      });
    });

    function render() {
      const base = State.getAllProperties().filter(isVillaOrPent);
      const filtered = base.filter(function (p) {
        if (state.type !== 'All' && p.type !== state.type) return false;
        if (state.country && p.country !== state.country) return false;
        if (state.beds && Number(p.bedrooms) < Number(state.beds)) return false;
        return true;
      });
      const sorted = sortProperties(filtered, state.sort);
      countEl.innerHTML = 'Showing <strong>' + sorted.length + '</strong> villas &amp; penthouses';
      if (sorted.length === 0) {
        gridEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No Estates Match Your Criteria</h3><p>Adjust your country or bedroom selection to explore all villas and penthouses.</p></div>';
      } else {
        gridEl.innerHTML = sorted.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(gridEl);
      }
    }

    countrySel.addEventListener('change', function () { state.country = countrySel.value; render(); });
    bedsSel.addEventListener('change', function () { state.beds = bedsSel.value; render(); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });

    render();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') render();
    });
  }

  /* ========================================================================
     6. INDIVIDUAL PROPERTY DETAILS PAGE
     ======================================================================== */
  function initPropertyDetailsPage() {
    const params = getQueryParams();
    const all = State.getAllProperties();
    const prop = State.getPropertyById(params.id) || all[0];
    if (!prop) return;

    State.recordRecentlyViewed(prop.id);
    document.title = prop.title + ' (' + prop.id + ') | EstateSphere';

    let activeImgIdx = 0;
    const gallery = prop.gallery && prop.gallery.length ? prop.gallery : [{ label: 'Main View', url: UI.FALLBACK_SVG }];

    function renderDetails() {
      const pr = State.getPropertyPricing(prop);
      const fmt = State.formatMoney;
      const isFav = State.isFavourite(prop.id);
      const isComp = State.isInCompare(prop.id);

      const mount = document.getElementById('property-details-mount');
      if (!mount) return;

      const convertedBadge = pr.isConverted
        ? '<p style="font-size:0.8rem;color:var(--ink-muted);margin-top:0.25rem;">Converted display (' + pr.displayCurrency + ') · Original asking price: <strong>' + fmt(pr.originalTotal, pr.originalCurrency) + ' ' + pr.originalCurrency + '</strong></p>'
        : '<p style="font-size:0.8rem;color:var(--ink-muted);margin-top:0.25rem;">Original asking price in ' + pr.originalCurrency + '</p>';

      const amenitiesHTML = (prop.amenities || Data.AMENITIES_ALL).map(function (am) {
        return '<div class="amenity-item">' + UI.ICONS.check + '<span>' + UI.escapeHTML(am) + '</span></div>';
      }).join('');

      const nb = prop.nearby || {
        schools: 'International Schools within 10–15 mins',
        hospitals: 'Private Medical Centres within 10 mins',
        malls: 'Premier Shopping & Dining nearby',
        transit: 'Direct Metro / Transit access',
        airports: 'International Airport within 25–35 mins',
        businessDistricts: 'Prime Commercial District nearby'
      };

      const thumbsHTML = gallery.map(function (img, idx) {
        return (
          '<button type="button" class="gallery-thumb' + (idx === activeImgIdx ? ' is-active' : '') + '" data-idx="' + idx + '" aria-label="View ' + UI.escapeHTML(img.label) + '">' +
            '<img src="' + UI.escapeHTML(img.url) + '" alt="' + UI.escapeHTML(img.label) + '">' +
            '<span>' + UI.escapeHTML(img.label) + '</span>' +
          '</button>'
        );
      }).join('');

      mount.innerHTML =
        '<div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1.25rem;margin-bottom:1.75rem;">' +
          '<div>' +
            '<nav class="breadcrumb" style="color:var(--ink-muted);margin-bottom:0.65rem;">' +
              '<a href="index.html">Home</a><span>/</span>' +
              '<a href="properties.html">Properties</a><span>/</span>' +
              '<a href="properties.html?country=' + encodeURIComponent(prop.country) + '">' + UI.escapeHTML(prop.country) + '</a><span>/</span>' +
              '<span style="color:var(--ink-primary);">' + UI.escapeHTML(prop.id) + '</span>' +
            '</nav>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.65rem;">' +
              '<span class="badge badge--dark">' + UI.escapeHTML(prop.type) + '</span>' +
              '<span class="badge ' + (prop.awaitingVerification ? 'badge--pending' : (prop.availability === 'Ready to Move' ? 'badge--ready' : 'badge--construction')) + '">' + UI.escapeHTML(prop.awaitingVerification ? 'Awaiting Verification' : prop.availability) + '</span>' +
              '<span class="badge badge--gold">ID: ' + UI.escapeHTML(prop.id) + '</span>' +
            '</div>' +
            '<h1 style="font-size:clamp(2rem,4vw,3.2rem);margin-bottom:0.4rem;">' + UI.escapeHTML(prop.title) + '</h1>' +
            '<p style="color:var(--ink-secondary);display:flex;align-items:center;gap:0.4rem;">' + UI.ICONS.pin + '<span>' + UI.escapeHTML(prop.fullLocation) + '</span></p>' +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:0.6rem;">' +
            '<button type="button" class="btn btn--outline btn--sm js-fav-toggle' + (isFav ? ' is-active' : '') + '" data-id="' + UI.escapeHTML(prop.id) + '">' + (isFav ? 'Saved to Favourites' : 'Add to Favourites') + '</button>' +
            '<button type="button" class="btn btn--outline btn--sm js-compare-toggle' + (isComp ? ' is-active' : '') + '" data-id="' + UI.escapeHTML(prop.id) + '">' + (isComp ? 'In Comparison' : 'Compare Property') + '</button>' +
          '</div>' +
        '</div>' +

        '<div class="details-layout">' +
          '<div>' +
            '<div class="detail-panel" style="padding:1.1rem;">' +
              '<div class="gallery-main">' +
                '<img id="detail-main-img" src="' + UI.escapeHTML(gallery[activeImgIdx].url) + '" alt="' + UI.escapeHTML(prop.title) + ' - ' + UI.escapeHTML(gallery[activeImgIdx].label) + '">' +
                '<button type="button" class="gallery-nav-btn gallery-nav-btn--prev" id="gal-prev" aria-label="Previous image">&#8592;</button>' +
                '<button type="button" class="gallery-nav-btn gallery-nav-btn--next" id="gal-next" aria-label="Next image">&#8594;</button>' +
                '<span class="gallery-caption" id="gal-caption">' + UI.escapeHTML(gallery[activeImgIdx].label) + ' (' + (activeImgIdx + 1) + '/' + gallery.length + ')</span>' +
              '</div>' +
              '<div class="gallery-thumbs" id="gal-thumbs">' + thumbsHTML + '</div>' +
            '</div>' +

            '<div class="detail-panel">' +
              '<h2>Property Information &amp; Specifications</h2>' +
              '<div class="specs-table-grid">' +
                '<div class="spec-box"><span>Property ID</span><strong>' + UI.escapeHTML(prop.id) + '</strong></div>' +
                '<div class="spec-box"><span>Country &amp; City</span><strong>' + UI.escapeHTML(prop.city + ', ' + prop.country) + '</strong></div>' +
                '<div class="spec-box"><span>Property Type</span><strong>' + UI.escapeHTML(prop.type) + '</strong></div>' +
                '<div class="spec-box"><span>Availability</span><strong>' + UI.escapeHTML(prop.awaitingVerification ? 'Awaiting Verification' : prop.availability) + '</strong></div>' +
                '<div class="spec-box"><span>Bedrooms</span><strong>' + prop.bedrooms + ' Bedrooms</strong></div>' +
                '<div class="spec-box"><span>Bathrooms</span><strong>' + prop.bathrooms + ' Bathrooms</strong></div>' +
                '<div class="spec-box"><span>Balcony</span><strong>' + (prop.balconies || 1) + ' Private Balcony</strong></div>' +
                '<div class="spec-box"><span>Parking</span><strong>' + UI.escapeHTML(prop.parking || '1 Covered Bay') + '</strong></div>' +
                '<div class="spec-box"><span>Total Built-Up Area</span><strong>' + Number(prop.areaSqFt).toLocaleString() + ' sq ft</strong></div>' +
                '<div class="spec-box"><span>Floor Number</span><strong>' + UI.escapeHTML(prop.floor || 'Upper Level') + '</strong></div>' +
                '<div class="spec-box"><span>Construction Year</span><strong>' + UI.escapeHTML(prop.constructionYear || 2024) + '</strong></div>' +
                '<div class="spec-box"><span>Furnishing</span><strong>' + UI.escapeHTML(prop.furnished || 'Semi-Furnished') + '</strong></div>' +
              '</div>' +
            '</div>' +

            '<div class="detail-panel">' +
              '<h2>Architectural Overview</h2>' +
              '<p style="color:var(--ink-secondary);line-height:1.8;font-size:0.98rem;">' + UI.escapeHTML(prop.description) + '</p>' +
            '</div>' +

            '<div class="detail-panel">' +
              '<h2>Residence Amenities</h2>' +
              '<div class="amenities-grid">' + amenitiesHTML + '</div>' +
            '</div>' +

            '<div class="detail-panel">' +
              '<h2>Location &amp; Neighborhood Connectivity</h2>' +
              '<div class="proximity-grid">' +
                '<div class="proximity-card"><small>Nearby Schools</small><p>' + UI.escapeHTML(nb.schools) + '</p></div>' +
                '<div class="proximity-card"><small>Hospitals &amp; Healthcare</small><p>' + UI.escapeHTML(nb.hospitals) + '</p></div>' +
                '<div class="proximity-card"><small>Shopping Malls &amp; Dining</small><p>' + UI.escapeHTML(nb.malls) + '</p></div>' +
                '<div class="proximity-card"><small>Public Transportation</small><p>' + UI.escapeHTML(nb.transit) + '</p></div>' +
                '<div class="proximity-card"><small>International Airports</small><p>' + UI.escapeHTML(nb.airports) + '</p></div>' +
                '<div class="proximity-card"><small>Business Districts</small><p>' + UI.escapeHTML(nb.businessDistricts) + '</p></div>' +
              '</div>' +
            '</div>' +

            '<div class="detail-panel" style="padding:0;border:none;background:transparent;">' +
              '<h2 style="font-size:1.85rem;margin-bottom:1rem;border:none;padding:0;">Interactive Down Payment &amp; Mortgage Calculator</h2>' +
              '<div id="detail-calculator-mount"></div>' +
            '</div>' +
          '</div>' +

          '<aside class="sticky-sidebar">' +
            '<div class="detail-panel" style="margin-bottom:0;">' +
              '<span class="eyebrow" style="margin-bottom:0.4rem;">Transparent Pricing Breakdown</span>' +
              '<div style="font-family:var(--font-serif);font-size:2.4rem;font-weight:600;line-height:1.1;" class="tabular-nums">' + fmt(pr.displayTotal, pr.displayCurrency) + '</div>' +
              convertedBadge +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin:1.15rem 0;padding:1rem 0;border-top:1px solid var(--border-subtle);border-bottom:1px solid var(--border-subtle);">' +
                '<div><span style="display:block;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);">Down Payment (' + pr.downPaymentPct + '%)</span><strong style="font-size:1.1rem;" class="tabular-nums">' + fmt(pr.displayDownPayment, pr.displayCurrency) + '</strong></div>' +
                '<div><span style="display:block;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);">Remaining Balance</span><strong style="font-size:1.1rem;" class="tabular-nums">' + fmt(pr.displayRemaining, pr.displayCurrency) + '</strong></div>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.84rem;background:var(--bg-ivory);padding:0.75rem 0.9rem;border-radius:6px;margin-bottom:1rem;">' +
                '<span style="color:var(--ink-secondary);">Est. Installment (20y @ 5.5%)</span>' +
                '<strong class="tabular-nums">' + fmt(pr.estimatedMonthlyInstallment, pr.displayCurrency) + '/mo</strong>' +
              '</div>' +
              '<a href="financing.html" class="link-arrow" style="font-size:0.74rem;">Explore Mortgage &amp; Financing Guide &#8594;</a>' +
            '</div>' +

            '<div class="detail-panel" style="margin-bottom:0;">' +
              '<h3>Request Private Viewing</h3>' +
              '<form id="detail-enquiry-form" style="display:flex;flex-direction:column;gap:0.85rem;" novalidate>' +
                '<div class="field-group"><label class="field-label" for="de-name">Full Name *</label><input id="de-name" class="field-input" type="text" required></div>' +
                '<div class="field-group"><label class="field-label" for="de-email">Email Address *</label><input id="de-email" class="field-input" type="email" required></div>' +
                '<div class="field-group"><label class="field-label" for="de-phone">Phone Number *</label><input id="de-phone" class="field-input" type="tel" placeholder="+971 / +44 / +1 ..." required></div>' +
                '<div class="field-group"><label class="field-label" for="de-msg">Message *</label><textarea id="de-msg" class="field-textarea" style="min-height:90px;">I would like to schedule a private viewing and receive the payment schedule for ' + UI.escapeHTML(prop.title) + ' (' + UI.escapeHTML(prop.id) + ').</textarea></div>' +
                '<div class="field-error" id="de-err"></div>' +
                '<button type="submit" class="btn btn--primary btn--block">Submit Private Enquiry</button>' +
              '</form>' +
              '<div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border-subtle);font-size:0.83rem;color:var(--ink-secondary);">' +
                '<strong style="display:block;color:var(--ink-primary);margin-bottom:0.2rem;">Direct International Desk</strong>' +
                '<div>Email: advisory@estatesphere.com</div>' +
                '<div>Phone: +44 20 7946 0821 · +971 4 555 0190</div>' +
              '</div>' +
            '</div>' +
          '</aside>' +
        '</div>';

      UI.installImageFallbacks(mount);

      function setImage(idx) {
        activeImgIdx = (idx + gallery.length) % gallery.length;
        const mainImg = document.getElementById('detail-main-img');
        const cap = document.getElementById('gal-caption');
        if (mainImg) {
          mainImg.src = gallery[activeImgIdx].url;
          mainImg.alt = prop.title + ' - ' + gallery[activeImgIdx].label;
        }
        if (cap) cap.textContent = gallery[activeImgIdx].label + ' (' + (activeImgIdx + 1) + '/' + gallery.length + ')';
        document.querySelectorAll('#gal-thumbs .gallery-thumb').forEach(function (t) {
          t.classList.toggle('is-active', Number(t.dataset.idx) === activeImgIdx);
        });
      }

      document.getElementById('gal-prev').addEventListener('click', function () { setImage(activeImgIdx - 1); });
      document.getElementById('gal-next').addEventListener('click', function () { setImage(activeImgIdx + 1); });
      document.querySelectorAll('#gal-thumbs .gallery-thumb').forEach(function (t) {
        t.addEventListener('click', function () { setImage(Number(t.dataset.idx)); });
      });
      document.getElementById('detail-main-img').addEventListener('click', function () {
        UI.openModal(
          prop.title + ' — ' + gallery[activeImgIdx].label,
          '<img src="' + UI.escapeHTML(gallery[activeImgIdx].url) + '" alt="' + UI.escapeHTML(gallery[activeImgIdx].label) + '" style="width:100%;border-radius:8px;">',
          true
        );
      });

      UI.mountDownPaymentCalculator(document.getElementById('detail-calculator-mount'), {
        totalPrice: pr.displayTotal,
        downPaymentPct: pr.downPaymentPct,
        annualRate: 5.5,
        years: 20,
        currency: pr.displayCurrency
      });

      const demoUser = State.getDemoUser();
      if (demoUser) {
        document.getElementById('de-name').value = demoUser.name;
        document.getElementById('de-email').value = demoUser.email;
      }

      document.getElementById('detail-enquiry-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('de-name').value.trim();
        const email = document.getElementById('de-email').value.trim();
        const phone = document.getElementById('de-phone').value.trim();
        const msg = document.getElementById('de-msg').value.trim();
        const err = document.getElementById('de-err');
        if (name.length < 2) { err.textContent = 'Please enter your full name.'; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
        if (phone.length < 6) { err.textContent = 'Please enter a valid phone number.'; return; }
        if (msg.length < 10) { err.textContent = 'Please provide a brief enquiry message.'; return; }
        err.textContent = '';
        const saved = State.addEnquiry({
          type: 'Property Viewing Request',
          propertyId: prop.id,
          subject: prop.title + ' (' + prop.id + ')',
          name: name,
          email: email,
          phone: phone,
          message: msg
        });
        UI.showToast('Private viewing request sent (Ref: ' + saved.ref + ').');
      });

      const simEl = document.getElementById('similar-properties-grid');
      if (simEl) {
        const similar = State.getAllProperties()
          .filter(function (p) { return p.id !== prop.id && (p.country === prop.country || p.type === prop.type); })
          .slice(0, 3);
        simEl.innerHTML = similar.map(function (p) { return UI.renderPropertyCard(p); }).join('');
        UI.installImageFallbacks(simEl);
      }
    }

    renderDetails();
    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      if (e.key === 'ArrowLeft') {
        const prevBtn = document.getElementById('gal-prev');
        if (prevBtn) prevBtn.click();
      } else if (e.key === 'ArrowRight') {
        const nextBtn = document.getElementById('gal-next');
        if (nextBtn) nextBtn.click();
      }
    });
    State.subscribe(function (evt) {
      if (evt === 'currency-changed') renderDetails();
    });
  }

  /* ========================================================================
     7. MORTGAGE & FINANCING PAGE
     ======================================================================== */
  function initFinancingPage() {
    function mountCalc() {
      const mount = document.getElementById('financing-calculator-mount');
      if (!mount) return;
      const defaultPrice = Math.round(State.convertAmount(250000, 'USD', State.getCurrency()));
      UI.mountDownPaymentCalculator(mount, {
        totalPrice: defaultPrice,
        downPaymentPct: 20,
        annualRate: 5.5,
        years: 20,
        allowPropertyPick: true
      });
    }
    mountCalc();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed') mountCalc();
    });
  }

  /* ========================================================================
     8. GLOBAL LOCATIONS PAGE (ALL 12 COUNTRIES)
     ======================================================================== */
  function initLocationsPage() {
    let activeRegion = 'All';
    const gridEl = document.getElementById('locations-grid');

    document.querySelectorAll('.js-region-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.js-region-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeRegion = btn.dataset.region;
        render();
      });
    });

    function render() {
      if (!gridEl) return;
      const list = Data.COUNTRIES.filter(function (c) {
        return activeRegion === 'All' || c.region === activeRegion;
      });
      gridEl.innerHTML = list.map(renderCountryCardHTML).join('');
      UI.installImageFallbacks(gridEl);
    }

    render();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') render();
    });
  }

  /* ========================================================================
     9. INVESTMENT OPPORTUNITIES PAGE
     ======================================================================== */
  function initInvestmentPage() {
    let activeCat = 'All';
    const gridEl = document.getElementById('investment-grid');
    const calcEl = document.getElementById('investment-calculator-mount');

    document.querySelectorAll('.js-inv-cat').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.js-inv-cat').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeCat = btn.dataset.cat;
        render();
      });
    });

    function render() {
      const list = State.getAllProperties().filter(function (p) {
        if (!p.isInvestment && !p.rentalYieldPct) return false;
        if (activeCat === 'All') return true;
        return p.investmentCategory === activeCat;
      });
      if (gridEl) {
        gridEl.innerHTML = list.map(function (p) { return UI.renderPropertyCard(p, { showInvestment: true }); }).join('');
        UI.installImageFallbacks(gridEl);
      }
      if (calcEl) UI.mountInvestmentCalculator(calcEl);
    }

    render();
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'listings-changed') render();
    });
  }

  /* ========================================================================
     10. LIST YOUR PROPERTY PAGE
     ======================================================================== */
  function initListPropertyPage() {
    const countrySel = document.getElementById('lp-country');
    populateCountrySelect(countrySel, false);

    const priceInput = document.getElementById('lp-price');
    const dpInput = document.getElementById('lp-downpayment');
    const previewEl = document.getElementById('lp-math-preview');
    const form = document.getElementById('list-property-form');
    const submittedEl = document.getElementById('submitted-listings-grid');
    const fileInput = document.getElementById('lp-photo-file');
    let uploadedPhotoDataUrl = '';

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (file.size > 1500000) {
          UI.showToast('Please select an image under 1.5 MB for local demo storage.');
          return;
        }
        const reader = new FileReader();
        reader.onload = function (ev) {
          uploadedPhotoDataUrl = ev.target.result;
          UI.showToast('Property photograph attached for preview.');
        };
        reader.readAsDataURL(file);
      });
    }

    function updateMathPreview() {
      if (!previewEl) return;
      const total = Math.max(0, Number(priceInput.value) || 0);
      const dp = Math.min(total, Math.max(0, Number(dpInput.value) || 0));
      const rem = Math.max(0, total - dp);
      const pct = total > 0 ? Math.round((dp / total) * 100) : 0;
      previewEl.innerHTML =
        '<div><span>Total Price (USD)</span><strong>$' + total.toLocaleString() + '</strong></div>' +
        '<div><span>Down Payment (' + pct + '%)</span><strong>$' + dp.toLocaleString() + '</strong></div>' +
        '<div><span>Remaining Balance</span><strong>$' + rem.toLocaleString() + '</strong></div>';
    }

    if (priceInput) priceInput.addEventListener('input', updateMathPreview);
    if (dpInput) dpInput.addEventListener('input', updateMathPreview);
    updateMathPreview();

    function renderSubmitted() {
      if (!submittedEl) return;
      const list = State.getSubmittedListings();
      if (list.length === 0) {
        submittedEl.innerHTML =
          '<div class="empty-state" style="grid-column:1/-1;">' +
            '<h3>No Submitted Demo Listings Yet</h3>' +
            '<p>Properties submitted via the form above are saved locally in your browser and marked as <strong>Awaiting Verification</strong>.</p>' +
          '</div>';
        return;
      }
      submittedEl.innerHTML = list.map(function (p) {
        return (
          '<div>' +
            UI.renderPropertyCard(p) +
            '<button type="button" class="btn btn--outline btn--sm btn--block js-remove-listing" data-id="' + UI.escapeHTML(p.id) + '" style="margin-top:0.5rem;">Remove Demo Submission</button>' +
          '</div>'
        );
      }).join('');
      UI.installImageFallbacks(submittedEl);

      submittedEl.querySelectorAll('.js-remove-listing').forEach(function (btn) {
        btn.addEventListener('click', function () {
          State.removeSubmittedListing(btn.dataset.id);
          UI.showToast('Removed demo listing ' + btn.dataset.id + '.');
        });
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const errEl = document.getElementById('lp-error');
        const ownerName = document.getElementById('lp-owner').value.trim();
        const email = document.getElementById('lp-email').value.trim();
        const phone = document.getElementById('lp-phone').value.trim();
        const country = countrySel.value;
        const city = document.getElementById('lp-city').value.trim();
        const address = document.getElementById('lp-address').value.trim();
        const type = document.getElementById('lp-type').value;
        const title = document.getElementById('lp-title').value.trim();
        const description = document.getElementById('lp-desc').value.trim();
        const total = Number(priceInput.value) || 0;
        const dp = Number(dpInput.value) || 0;
        const beds = Number(document.getElementById('lp-beds').value) || 1;
        const baths = Number(document.getElementById('lp-baths').value) || 1;
        const area = Number(document.getElementById('lp-area').value) || 800;
        const availability = document.getElementById('lp-status').value;
        const photoUrl = document.getElementById('lp-photo-url').value.trim();

        if (ownerName.length < 2) { errEl.textContent = 'Please enter the owner or agent name.'; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email address.'; return; }
        if (phone.length < 6) { errEl.textContent = 'Please enter a valid contact phone number.'; return; }
        if (!city || !address || !title) { errEl.textContent = 'Please complete City, Property Address, and Property Title.'; return; }
        if (total < 20000) { errEl.textContent = 'Please enter a valid Total Property Price (minimum $20,000 USD).'; return; }
        if (dp <= 0 || dp >= total) { errEl.textContent = 'Down Payment must be greater than 0 and less than Total Property Price.'; return; }
        if (description.length < 20) { errEl.textContent = 'Please provide a descriptive overview (at least 20 characters).'; return; }

        errEl.textContent = '';
        const selectedAmenities = [];
        form.querySelectorAll('input[name="lp-amenities"]:checked').forEach(function (cb) {
          selectedAmenities.push(cb.value);
        });

        const dpPct = Math.round((dp / total) * 100);
        const mainImg = uploadedPhotoDataUrl || photoUrl || Data.PHOTOS.extVilla3;
        const newId = 'EST-USR-' + String(Date.now()).slice(-4);

        const cats = [type === 'Villa' ? 'Villas' : type === 'Flat' ? 'Flats' : type === 'Penthouse' ? 'Penthouses' : 'Apartments'];
        if (availability === 'Ready to Move') cats.push('Ready-to-Move Properties');
        if (availability === 'Under Construction') cats.push('Under-Construction Properties');

        const listing = {
          id: newId,
          title: title,
          country: country,
          city: city,
          fullLocation: address + ', ' + city + ', ' + country,
          type: type,
          categories: cats,
          flatTiers: type === 'Flat' ? ['Premium Flats'] : [],
          availability: availability,
          awaitingVerification: true,
          furnished: 'Semi-Furnished',
          originalCurrency: 'USD',
          originalPrice: Math.round(total),
          downPaymentPct: Math.max(5, Math.min(80, dpPct)),
          bedrooms: beds,
          bathrooms: baths,
          balconies: 1,
          parking: '1 Covered Bay',
          areaSqFt: area,
          floor: 'Standard',
          constructionYear: new Date().getFullYear(),
          featured: false,
          recentlyAdded: true,
          popularApartment: false,
          luxuryCollection: false,
          isInvestment: true,
          investmentCategory: 'Residential Investment Properties',
          rentalYieldPct: 5.5,
          appreciationPct: 5.0,
          ownerName: ownerName,
          ownerEmail: email,
          ownerPhone: phone,
          description: description,
          amenities: selectedAmenities.length ? selectedAmenities : ['24/7 Security', 'Covered Parking', 'Power Backup'],
          nearby: {
            schools: 'Local & International Schools nearby',
            hospitals: 'Regional Medical Centres accessible',
            malls: 'Retail & Dining destinations nearby',
            transit: 'Public transit connections nearby',
            airports: 'International Airport access',
            businessDistricts: 'City Commercial Core accessible'
          },
          gallery: [
            { label: 'Main View', url: mainImg },
            { label: 'Interior', url: Data.PHOTOS.living1 },
            { label: 'Bedroom', url: Data.PHOTOS.bedroom1 },
            { label: 'Kitchen', url: Data.PHOTOS.kitchen1 },
            { label: 'Bathroom', url: Data.PHOTOS.bath1 },
            { label: 'Balcony', url: Data.PHOTOS.balcony1 },
            { label: 'Exterior', url: Data.PHOTOS.extVilla3 }
          ]
        };

        State.addSubmittedListing(listing);
        uploadedPhotoDataUrl = '';
        form.reset();
        updateMathPreview();
        UI.showToast('Property "' + title + '" saved locally as Awaiting Verification (' + newId + ').');
      });
    }

    renderSubmitted();
    State.subscribe(function (evt) {
      if (evt === 'listings-changed' || evt === 'currency-changed') renderSubmitted();
    });
  }

  /* ========================================================================
     11. ABOUT US PAGE
     ======================================================================== */
  function initAboutPage() {
    const teamEl = document.getElementById('about-team-grid');
    if (teamEl) {
      teamEl.innerHTML = Data.TEAM.map(function (m) {
        return (
          '<article class="team-card">' +
            '<div class="team-avatar">' + UI.escapeHTML(m.initials) + '</div>' +
            '<div class="team-body">' +
              '<h3>' + UI.escapeHTML(m.name) + '</h3>' +
              '<div class="team-role">' + UI.escapeHTML(m.role) + '</div>' +
              '<p>' + UI.escapeHTML(m.bio) + '</p>' +
            '</div>' +
          '</article>'
        );
      }).join('');
    }
  }

  /* ========================================================================
     12. SERVICES PAGE (ALL 10 REAL ESTATE SERVICES)
     ======================================================================== */
  function initServicesPage() {
    const gridEl = document.getElementById('services-grid');
    if (!gridEl) return;

    gridEl.innerHTML = Data.SERVICES.map(function (s) {
      return (
        '<article class="service-card">' +
          '<div>' +
            '<div class="service-card-head">' +
              '<span class="service-num">' + s.num + '</span>' +
              '<span class="badge badge--gold">Advisory</span>' +
            '</div>' +
            '<h3>' + UI.escapeHTML(s.title) + '</h3>' +
            '<p>' + UI.escapeHTML(s.summary) + '</p>' +
            '<div class="service-points">' +
              s.points.map(function (pt) { return '<span>' + UI.escapeHTML(pt) + '</span>'; }).join('') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<button type="button" class="btn btn--outline btn--sm js-service-enquire" data-service="' + UI.escapeHTML(s.title) + '">Enquire About This Service</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    gridEl.querySelectorAll('.js-service-enquire').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const svc = btn.dataset.service;
        UI.openEnquiryModal({
          title: 'Service Consultation',
          subtitle: svc + ' — Speak with an EstateSphere specialist.',
          subject: 'Service Enquiry: ' + svc,
          defaultMessage: 'Hello EstateSphere team, I would like to arrange a consultation regarding ' + svc + '.',
          type: 'Service Enquiry'
        });
      });
    });
  }

  /* ========================================================================
     13. CONTACT US PAGE
     ======================================================================== */
  function initContactPage() {
    const countrySel = document.getElementById('ct-country');
    populateCountrySelect(countrySel, false);

    const officesEl = document.getElementById('contact-offices-grid');
    if (officesEl) {
      officesEl.innerHTML = Data.OFFICES.map(function (o) {
        return (
          '<article class="pillar-card" style="padding:1.5rem;">' +
            '<div style="font-size:0.72rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:0.35rem;">' + UI.escapeHTML(o.country) + '</div>' +
            '<h3 style="margin-bottom:0.5rem;">' + UI.escapeHTML(o.city) + ' Office</h3>' +
            '<p style="margin-bottom:0.55rem;">' + UI.escapeHTML(o.address) + '</p>' +
            '<div style="font-size:0.84rem;font-weight:600;color:var(--ink-primary);">' + UI.escapeHTML(o.phone) + '</div>' +
            '<div style="font-size:0.78rem;color:var(--ink-muted);margin-top:0.2rem;">' + UI.escapeHTML(o.hours) + '</div>' +
          '</article>'
        );
      }).join('');
    }

    const form = document.getElementById('contact-form');
    if (form) {
      const user = State.getDemoUser();
      if (user) {
        document.getElementById('ct-name').value = user.name;
        document.getElementById('ct-email').value = user.email;
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('ct-name').value.trim();
        const email = document.getElementById('ct-email').value.trim();
        const phone = document.getElementById('ct-phone').value.trim();
        const country = countrySel.value;
        const subject = document.getElementById('ct-subject').value.trim();
        const message = document.getElementById('ct-message').value.trim();
        const err = document.getElementById('ct-error');

        if (name.length < 2) { err.textContent = 'Please enter your full name.'; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
        if (phone.length < 6) { err.textContent = 'Please enter a valid phone number.'; return; }
        if (subject.length < 3) { err.textContent = 'Please enter a subject.'; return; }
        if (message.length < 10) { err.textContent = 'Please enter your message (at least 10 characters).'; return; }

        err.textContent = '';
        const saved = State.addEnquiry({
          type: 'Contact Desk',
          subject: subject + ' (' + country + ')',
          name: name,
          email: email,
          phone: phone,
          message: message
        });
        form.reset();
        UI.showToast('Thank you! Message received (Ref: ' + saved.ref + ') and logged in your Enquiry History.');
      });
    }
  }

  /* ========================================================================
     14. CLIENT PORTAL / ACCOUNT PAGE
     ======================================================================== */
  function initAccountPage() {
    let activeTab = (window.location.hash || '#favourites').replace('#', '') || 'favourites';
    const validTabs = ['favourites', 'compare', 'recent', 'searches', 'enquiries', 'profile'];
    if (validTabs.indexOf(activeTab) === -1) activeTab = 'favourites';

    const tabs = document.querySelectorAll('[data-dash-tab]');
    const panelEl = document.getElementById('account-panel-mount');

    function setTab(tab) {
      activeTab = tab;
      tabs.forEach(function (t) { t.classList.toggle('is-active', t.dataset.dashTab === tab); });
      renderPanel();
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        window.location.hash = t.dataset.dashTab;
        setTab(t.dataset.dashTab);
      });
    });

    function renderPanel() {
      if (!panelEl) return;

      if (activeTab === 'favourites') {
        const favs = State.getFavourites().map(function (id) { return State.getPropertyById(id); }).filter(Boolean);
        if (favs.length === 0) {
          panelEl.innerHTML = '<div class="empty-state"><h3>No Favourite Residences Saved</h3><p>Tap the heart icon on any property across EstateSphere to curate your private shortlist.</p><a href="properties.html" class="btn btn--primary">Explore Properties</a></div>';
        } else {
          panelEl.innerHTML = '<div class="property-grid">' + favs.map(function (p) { return UI.renderPropertyCard(p); }).join('') + '</div>';
          UI.installImageFallbacks(panelEl);
        }
        return;
      }

      if (activeTab === 'compare') {
        const ids = State.getCompareList();
        panelEl.innerHTML = UI.renderComparisonTableHTML(ids);
        UI.installImageFallbacks(panelEl);
        return;
      }

      if (activeTab === 'recent') {
        const list = State.getRecentlyViewed().map(function (id) { return State.getPropertyById(id); }).filter(Boolean);
        if (list.length === 0) {
          panelEl.innerHTML = '<div class="empty-state"><h3>No Recently Viewed Residences</h3><p>Open any property details page and it will automatically appear here for quick reference.</p><a href="properties.html" class="btn btn--primary">Browse Residences</a></div>';
        } else {
          panelEl.innerHTML = '<div class="property-grid">' + list.map(function (p) { return UI.renderPropertyCard(p); }).join('') + '</div>';
          UI.installImageFallbacks(panelEl);
        }
        return;
      }

      if (activeTab === 'searches') {
        const saved = State.getSavedSearches();
        const history = State.getSearchHistory();
        const savedHTML = saved.length === 0
          ? '<p style="color:var(--ink-secondary);font-size:0.9rem;">No saved searches yet. Use the "Save Search" button on the Properties page to bookmark filter combinations.</p>'
          : saved.map(function (s) {
              const qp = new URLSearchParams();
              Object.keys(s.params || {}).forEach(function (k) {
                if (s.params[k] && s.params[k] !== 'All Properties') qp.set(k, s.params[k]);
              });
              return (
                '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;padding:0.9rem 1rem;background:var(--bg-ivory);border:1px solid var(--border-subtle);border-radius:8px;margin-bottom:0.65rem;">' +
                  '<div><strong>' + UI.escapeHTML(s.label) + '</strong><div style="font-size:0.76rem;color:var(--ink-muted);">Saved ' + UI.escapeHTML(s.savedAt) + '</div></div>' +
                  '<div style="display:flex;gap:0.5rem;">' +
                    '<a href="properties.html?' + qp.toString() + '" class="btn btn--primary btn--sm">Run Search</a>' +
                    '<button type="button" class="btn btn--outline btn--sm js-del-search" data-id="' + UI.escapeHTML(s.id) + '">Remove</button>' +
                  '</div>' +
                '</div>'
              );
            }).join('');

        const histHTML = history.length === 0
          ? '<p style="color:var(--ink-secondary);font-size:0.9rem;">Your recent search terms will appear here.</p>'
          : '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">' +
              history.map(function (h) {
                return '<a href="properties.html?q=' + encodeURIComponent(h) + '" class="history-chip">' + UI.escapeHTML(h) + '</a>';
              }).join('') +
            '</div>' +
            '<button type="button" class="btn btn--outline btn--sm" id="dash-clear-history" style="margin-top:1rem;">Clear Search History</button>';

        panelEl.innerHTML =
          '<div class="split-2" style="align-items:start;">' +
            '<div class="detail-panel"><h3>Saved Searches</h3>' + savedHTML + '</div>' +
            '<div class="detail-panel"><h3>Search History</h3>' + histHTML + '</div>' +
          '</div>';

        panelEl.querySelectorAll('.js-del-search').forEach(function (btn) {
          btn.addEventListener('click', function () {
            State.removeSavedSearch(btn.dataset.id);
            renderPanel();
          });
        });
        const clr = panelEl.querySelector('#dash-clear-history');
        if (clr) {
          clr.addEventListener('click', function () {
            State.clearSearchHistory();
            renderPanel();
          });
        }
        return;
      }

      if (activeTab === 'enquiries') {
        const list = State.getEnquiries();
        if (list.length === 0) {
          panelEl.innerHTML = '<div class="empty-state"><h3>No Enquiries Logged Yet</h3><p>All property viewings, service consultations, and contact desk messages you submit will be tracked here.</p><a href="contact.html" class="btn btn--primary">Contact Advisory</a></div>';
          return;
        }
        panelEl.innerHTML = list.map(function (enq) {
          return (
            '<div class="detail-panel" style="margin-bottom:1rem;">' +
              '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.5rem;margin-bottom:0.5rem;">' +
                '<div><span class="badge badge--gold">' + UI.escapeHTML(enq.type) + '</span> <strong style="margin-left:0.4rem;">' + UI.escapeHTML(enq.subject) + '</strong></div>' +
                '<span style="font-size:0.78rem;color:var(--ink-muted);">Ref: ' + UI.escapeHTML(enq.ref) + ' · ' + UI.escapeHTML(enq.createdAt) + '</span>' +
              '</div>' +
              '<p style="font-size:0.9rem;color:var(--ink-secondary);margin-bottom:0.5rem;">' + UI.escapeHTML(enq.message) + '</p>' +
              '<div style="font-size:0.8rem;color:var(--ink-muted);">Submitted by ' + UI.escapeHTML(enq.name) + ' (' + UI.escapeHTML(enq.email) + ' · ' + UI.escapeHTML(enq.phone) + ')</div>' +
            '</div>'
          );
        }).join('');
        return;
      }

      if (activeTab === 'profile') {
        const user = State.getDemoUser();
        panelEl.innerHTML =
          '<div class="detail-panel">' +
            '<div class="disclaimer-box" style="margin-bottom:1.25rem;">' +
              '<strong>Demonstration-Only Account:</strong> Profile sign-in, registration, saved properties, and enquiries are persisted strictly in your browser’s <code>localStorage</code> for demonstration purposes and are not secure production accounts.' +
            '</div>' +
            (user
              ? '<h3>Signed In: ' + UI.escapeHTML(user.name) + '</h3>' +
                '<p style="color:var(--ink-secondary);margin-bottom:1.25rem;">Email: <strong>' + UI.escapeHTML(user.email) + '</strong> · Country: <strong>' + UI.escapeHTML(user.country) + '</strong> · Joined: ' + UI.escapeHTML(user.joinedAt) + '</p>' +
                '<button type="button" class="btn btn--outline" id="dash-signout-btn">Sign Out (Demo)</button>'
              : '<h3>Guest Session</h3>' +
                '<p style="color:var(--ink-secondary);margin-bottom:1.25rem;">Sign in or create a local demonstration profile to personalize enquiry forms and organize your saved residences.</p>' +
                '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn--primary" id="dash-signin-btn">Sign In (Demo)</button>' +
                  '<button type="button" class="btn btn--outline" id="dash-register-btn">Register (Demo)</button>' +
                '</div>'
            ) +
          '</div>';

        const outBtn = panelEl.querySelector('#dash-signout-btn');
        if (outBtn) {
          outBtn.addEventListener('click', function () {
            State.signOutDemoUser();
            UI.showToast('Signed out of demonstration account.');
            renderPanel();
          });
        }
        const inBtn = panelEl.querySelector('#dash-signin-btn');
        if (inBtn) inBtn.addEventListener('click', function () { UI.openAuthModal('signin'); });
        const regBtn = panelEl.querySelector('#dash-register-btn');
        if (regBtn) regBtn.addEventListener('click', function () { UI.openAuthModal('register'); });
      }
    }

    setTab(activeTab);
    window.addEventListener('hashchange', function () {
      const h = (window.location.hash || '#favourites').replace('#', '');
      if (validTabs.indexOf(h) !== -1) setTab(h);
    });
    State.subscribe(function (evt) {
      if (evt === 'currency-changed' || evt === 'favourites-changed' || evt === 'compare-changed' || evt === 'auth-changed') {
        renderPanel();
      }
    });
  }

  /* ========================================================================
     BOOTSTRAP
     ======================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    UI.initShell();
    const page = document.body.dataset.page || 'home';
    switch (page) {
      case 'home': initHomePage(); break;
      case 'properties': initPropertiesPage(); break;
      case 'apartments': initApartmentsPage(); break;
      case 'flats': initFlatsPage(); break;
      case 'villas': initVillasPage(); break;
      case 'property-details': initPropertyDetailsPage(); break;
      case 'financing': initFinancingPage(); break;
      case 'locations': initLocationsPage(); break;
      case 'investment': initInvestmentPage(); break;
      case 'list-property': initListPropertyPage(); break;
      case 'about': initAboutPage(); break;
      case 'services': initServicesPage(); break;
      case 'contact': initContactPage(); break;
      case 'account': initAccountPage(); break;
      default: break;
    }
  });
})(window);
