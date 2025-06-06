
// grab CSRF from cookie
function getCookie(name) {
    let v = null;
    document.cookie.split(';').forEach(c => {
        const [k, val] = c.trim().split('=');
        if (k === name) v = decodeURIComponent(val);
    });
    return v;
}

document.addEventListener('DOMContentLoaded', () => {

    // --------- Vars ---------- 

    // --------- searching

    const searchInput = document.getElementById('searchInput');
    const categoryGroup = document.getElementById('categoryGroup');
    const tagGroup = document.getElementById('tagGroup');
    const defaultCards = document.getElementById('defaultCards');
    const defaultCardsInner = document.getElementById('cards');
    const searchResults = document.getElementById('searchResults');   // container wrapper section
    const resultsInner = document.getElementById('searchResultsDiv'); // inner cards div
    const noResults = document.getElementById('noResults');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const filterSummary = document.getElementById('filterSummary');

    // --------- view modal

    const viewModal = document.getElementById('view-modal');
    const viewCard = document.getElementById('view-card');
    const viewEditBtn = document.getElementById('view-editBtn');
    const viewDeleteBtn = document.getElementById('view-deleteBtn');
    const viewCloseBtn = document.getElementById('view-closeBtn');
    const viewName = document.getElementById('view-name');
    const viewUrl = document.getElementById('view-url');
    const viewDescription = document.getElementById('view-description');
    const viewTags = document.getElementById('view-tags');


    // --------- Bookmark add, edit, delete, functions 

    // ─── ICON MAP (your existing) ────────────────────────────────────────────
    const ICONS = {
        Web: `<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`,
        Desktop: `<rect x="3" y="3" width="18" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17v4"/>`,
        Mobile: `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>`,
        Bot: `<rect x="4" y="6" width="16" height="12" rx="2" ry="2"/><circle cx="8" cy="10" r="1"/><circle cx="16" cy="10" r="1"/><path d="M8 15h8"/>`,
        Script: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`
    };

    // ─── TagManager CLASS ────────────────────────────────────────────────────
    class TagManager {
        constructor(rootSelector, doneBtnSelector = '.done-button') {
            this.commonTags = ["development", "android", "linux", "mac", "hacking",
                "script", "editing", "design", "video", "image", "ai"];
            this.selectedTags = [];
            this.isCollapsed = false;
            this.highlightedIndex = -1;

            this.root = document.querySelector(rootSelector);
            this.searchBar = this.root.querySelector('.search-bar');
            this.tagsList = this.root.querySelector('.tags-list');
            this.selectedDiv = this.root.querySelector('.selected-tags');
            this.doneBtn = this.root.querySelector(doneBtnSelector);
            this.container = this.root.querySelector('.tag-selector');

            this._bindEvents();
            this._reset();
        }

        _bindEvents() {
            this.searchBar.addEventListener('focus', () => {
                this.isCollapsed = false;
                this._updateVisibility();
                this.tagsList.classList.remove('hidden');
                this._populate();
            });
            this.searchBar.addEventListener('blur', () =>
                setTimeout(() => this.tagsList.classList.add('hidden'), 200)
            );
            this.searchBar.addEventListener('input', () =>
                this._populate(this.searchBar.value.trim().toLowerCase())
            );
            this.searchBar.addEventListener('keydown', e => this._nav(e));

            this.doneBtn.addEventListener('click', () => {
                this.isCollapsed = true;
                this._renderSelected();
                this._updateVisibility();
                this.tagsList.classList.add('hidden');
            });

            document.addEventListener('click', e => {
                if (!this.container.contains(e.target)) {
                    this.tagsList.classList.add('hidden');
                }
            });

            this.tagsList.addEventListener('click', e => {
                const tag = e.target.dataset.add;
                if (tag) this._add(tag);
            });
            this.selectedDiv.addEventListener('click', e => {
                const rem = e.target.dataset.remove;
                if (rem) this._remove(rem);
            });
        }

        _reset(initial = []) {
            this.selectedTags = Array.from(initial);
            this.searchBar.value = '';
            this.highlightedIndex = -1;
            this._renderSelected();
            this._updateVisibility();
            this._populate();
            this.doneBtn.disabled = this.selectedTags.length === 0;
        }

        setTags(tags = []) { this._reset(tags); }
        getTags() { return Array.from(this.selectedTags); }

        _populate(filter = "") {
            this.tagsList.innerHTML = '';
            this.highlightedIndex = -1;
            let candidates = filter
                ? this.commonTags.filter(t => t.includes(filter))
                : this.commonTags.slice(0, 5);

            if (filter && !this.commonTags.includes(filter)
                && !this.selectedTags.includes(filter)) {
                this.tagsList.append(this._makeItem(`Add "${filter}"`, 'add', filter,
                    'p-2 text-xs cursor-pointer text-white hover:bg-purple-600 md:text-sm'));
            }

            candidates.forEach(tag => {
                const chosen = this.selectedTags.includes(tag);
                const cls = chosen
                    ? 'p-2 bg-theme text-xs text-white md:text-sm'
                    : 'p-2 text-xs cursor-pointer text-white hover:bg-purple-600 md:text-sm';
                const txt = chosen ? `${tag} ✓` : tag;
                this.tagsList.append(this._makeItem(txt, 'add', tag, cls));
            });

            if (this.tagsList.children.length) {
                this.highlightedIndex = 0;
                this._highlight(0);
            }
        }

        _makeItem(text, key, val, cls) {
            const li = document.createElement('li');
            li.className = cls;
            li.textContent = text;
            li.dataset[key] = val;
            return li;
        }

        _add(tag) {
            if (!this.selectedTags.includes(tag)) {
                this.selectedTags.push(tag);
                this._renderSelected();
                this._updateVisibility();
                this.doneBtn.disabled = false;
                this.searchBar.value = '';
                this._populate();
                this.selectedDiv.lastChild?.scrollIntoView({ behavior: 'smooth' });
            }
        }

        _remove(tag) {
            this.selectedTags = this.selectedTags.filter(t => t !== tag);
            this._renderSelected();
            this._updateVisibility();
            this.doneBtn.disabled = !this.selectedTags.length;
            this._populate();
        }

        _renderSelected() {
            this.selectedDiv.innerHTML = '';
            this.selectedTags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag flex items-center text-xs text-white px-2 py-1 m-1 rounded-xl md:text-sm';
                span.textContent = tag;
                const btn = document.createElement('button');
                btn.className = 'ml-2 text-white cursor-pointer bg-transparent border-none opacity-70 hover:opacity-100';
                btn.textContent = '×';
                btn.dataset.remove = tag;
                span.append(btn);
                this.selectedDiv.append(span);
            });
        }

        _updateVisibility() {
            if (!this.selectedTags.length) {
                this.selectedDiv.classList.add('hidden');
                return;
            }

            this.selectedDiv.classList.remove('hidden');
            this.selectedDiv.scrollTop = 0;

            if (this.isCollapsed) {
                this.selectedDiv.classList.add('max-h-[2.2rem]', 'md:max-h-[3.1rem]', 'overflow-hidden');
                this.selectedDiv.classList.remove('max-h-24', 'overflow-y-auto');
            } else {
                this.selectedDiv.classList.add('max-h-24', 'overflow-y-auto');
                this.selectedDiv.classList.remove('max-h-[2.2rem]', 'md:max-h-[3.1rem]', 'overflow-hidden');
            }
        }

        _nav(e) {
            const items = Array.from(this.tagsList.children);
            if (!items.length) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.highlightedIndex = e.key === 'ArrowDown'
                    ? (this.highlightedIndex + 1) % items.length
                    : (this.highlightedIndex - 1 + items.length) % items.length;
                this._highlight(this.highlightedIndex);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = items[this.highlightedIndex]?.dataset.add;
                if (tag) this._add(tag);
            }
        }

        _highlight(idx) {
            Array.from(this.tagsList.children).forEach((li, i) =>
                li.classList.toggle('bg-purple-600', i === idx)
            );
        }
    }

    // ─── modalFactory ────────────────
    function modalFactory(prefix, endpoint, actionLabel) {
        const q = id => document.getElementById(`${prefix}-${id}`);
        const openBtn = q('openBtn'),
            modal = q('modal'),
            modalContent = q('modal-content'),
            closeBtn = q('closeBtn'),
            cancelBtn = q('cancelBtn'),
            nameIn = q('name'),
            urlIn = q('url'),
            descIn = q('description'),
            ddlBtn = q('dropdownBtn'),
            ddlMenu = q('dropdownMenu'),
            selText = q('selectedText'),
            selIcon = q('selectedIcon'),
            submitBtn = q('submit');

        // build a TagManager for this modal
        const tagManager = new TagManager(`#${prefix}-modal`);

        function reset() {
            [nameIn, urlIn, descIn].forEach(i => i.value = '');
            selText.textContent = 'Web';
            selIcon.innerHTML = ICONS.Web;
            ddlMenu.classList.add('hidden');
            tagManager.setTags([]);               // reset tags
            submitBtn.removeAttribute('data-id');
        }

        function open(resetForm = true) {
            showModal(modal, modalContent);
            if (resetForm) reset();
        }
        function close() {
            hideModal(modal, modalContent);
            reset();
        }

        function fill(data) {
            nameIn.value = data.name;
            urlIn.value = data.url;
            descIn.value = data.description;
            selText.textContent = data.platform;
            selIcon.innerHTML = ICONS[data.platform] || '';
            tagManager.setTags(data.tags || []);    // preload tags
            submitBtn.dataset.id = data.id;
        }

        ddlBtn.addEventListener('click', e => {
            e.stopPropagation();
            ddlMenu.classList.toggle('hidden');
        });


        ddlMenu.addEventListener('click', e => {
            const opt = e.target.closest('[data-option]')?.dataset.option;
            if (opt) {
                selText.textContent = opt;
                selIcon.innerHTML = ICONS[opt] || '';
                ddlMenu.classList.add('hidden');
            }
        });

        document.addEventListener('click', () => ddlMenu.classList.add('hidden'));

        if (openBtn) {
            openBtn.addEventListener('click', open);
        }
        closeBtn.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        modal.addEventListener('click', e => e.target === modal && close());

        // ─── Add card  ───────────────────────────────
        submitBtn.addEventListener('click', () => {
            const name = nameIn.value.trim(),
                url = urlIn.value.trim(),
                desc = descIn.value.trim(),
                cat = selText.textContent.trim();
            if (!name || !url || !desc || !cat) return alert('All fields required');
            const payload = {
                name, url, description: desc,
                platform: cat,
                tags: tagManager.getTags()   // grab selected tags
            };
            const id = submitBtn.dataset.id;
            if (id) payload.id = id;

            const tags = tagManager.getTags();

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(payload)
            })
                .then(r => r.json())
                .then(json => {
                    if (json.success) {
                        close();
                        let cardElement;
                        if (id) {
                            cardElement = renderCard(false, id, name, url, desc, cat, tags);
                        } else {
                            cardElement = renderCard(true, json.id, name, url, desc, cat, tags);
                        }
                        defaultCardsInner.prepend(cardElement);
                        checkCardCount();
                        showToast(`Bookmark ${actionLabel} !`, 'success');
                    } else {
                        showToast('Error', 'error');
                    }
                })
                .catch(() => showToast('Network error', 'error'));
        });

        return {
            open,
            fill
        };
    }

    function renderCard(isNew, id, name, url, description, platform, tags) {
        // 1. Decide whether to create or select
        let card;
        if (isNew) {
            card = document.createElement('div');
            card.className = 'card p-4 md:p-6 relative cursor-pointer';
            card.dataset.bmId = id;
        } else {
            card = document.querySelector(`.card[data-bm-id="${id}"]`);
            if (!card) return; // nothing to update
        }

        // 2. Always update these
        card.dataset.platform = platform;
        card.dataset.tags = JSON.stringify(tags);

        // 3. Rebuild innerHTML
        const maxTags = 3;
        const visibleTags = tags.slice(0, maxTags);
        const extraCount = tags.length - maxTags;
        const tagsHtml = visibleTags
            .map(t => `<span class="text-[10px] sm:text-xs md:text-sm tag">${t}</span>`)
            .join(' ');
        const moreHtml = extraCount > 0
            ? `<span class="text-[10px] sm:text-xs md:text-sm tag">+${extraCount}</span>`
            : '';

        card.innerHTML = `
            <h3 class="mb-2 font-semibold text-lg md:text-xl truncate">${name}</h3>
            <a href="${url}" target="_blank"
                class="url inline-block text-[#58a6ff] mb-3 break-all text-xs truncate md:text-sm hover:underline">
                ${url}
            </a>
            <p class="text-xs text-gray-400 mb-3 leading-[1.4] line-clamp-2">${description}</p>
            <div class="tags mt-3 flex flex-wrap gap-1 md:gap-2 max-h-[1.5rem] md:max-h-[2rem] overflow-hidden">
                <span class="text-[10px] md:text-xs tag">${platform}</span>
                ${tagsHtml}
                ${moreHtml}
            </div>
            `;

        // 4. If new, prepend; if existing, nothing else to do
        if (isNew) {
            return card;
        }
    }

    const addModal = modalFactory('add', 'add/', 'Added');
    const editModal = modalFactory('edit', 'edit/', 'Updated');

    // --------- veiw modal functions 

    let currentCardData = null;

    function openViewModal(card) {
        // 1) Build the data object & stash it
        const data = {
            id: card.dataset.bmId,
            name: card.querySelector('h3').textContent,
            url: card.querySelector('a.url')?.href || '#',
            description: card.querySelector('p')?.textContent || '',
            platform: card.dataset.platform,
            tags: JSON.parse(card.dataset.tags || '[]'),
        };
        currentCardData = data;

        // 2) Populate the modal fields
        viewName.textContent = data.name;
        viewUrl.textContent = data.url;
        viewUrl.href = data.url;
        viewDescription.textContent = data.description;

        const tagsHtml = data.tags
            .map(t => `<span class="text-[10px] sm:text-xs md:text-sm tag">${t}</span>`)
            .join('');

        viewTags.innerHTML = `
            <span class="text-[10px] sm:text-xs md:text-sm tag">
            ${data.platform} </span>
            ${tagsHtml}
        `;

        // 3) Show the modal
        showModal(viewModal, viewCard);

    }

    viewCloseBtn.addEventListener('click', () => {
        hideModal(viewModal, viewCard);
    });

    viewModal.addEventListener('click', e => {
        if (e.target === viewModal) {
            hideModal(viewModal, viewCard);
        }
    });

    document.body.addEventListener('click', e => {
        const card = e.target.closest('.card');
        if (!card) return;
        openViewModal(card);
    });

    // Then your Edit button in the modal can use that same `currentCardData`:
    viewEditBtn.addEventListener('click', () => {
        if (!currentCardData) return;
        editModal.open(false);
        editModal.fill(currentCardData);
        hideModal(viewModal, viewCard);

    });

    // And your Delete button:
    viewDeleteBtn.addEventListener('click', () => {
        if (!currentCardData) return;
        if (!confirm('Delete this bookmark?')) return;

        fetch(`delete/${currentCardData.id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        })
            .then(r => r.json())
            .then(json => {
                if (json.success) {
                    document.querySelector(`.card[data-bm-id="${currentCardData.id}"]`)?.remove();
                    showToast('Deleted', 'success');
                    checkCardCount();
                    hideModal(viewModal, viewCard);
                } else {
                    showToast(json.error || 'Delete failed', 'error');
                }
            });
    });


    // --------- animate open/close modal 
    
    function showModal(modalWrapper, modalContent) {
        document.body.classList.add('overflow-hidden');
        // Enable interaction
        modalWrapper.classList.remove('opacity-0', 'pointer-events-none');
        modalWrapper.classList.add('opacity-100', 'pointer-events-auto');
    
        // Animate content
        modalContent.classList.remove('opacity-0', 'scale-95');
        modalContent.classList.add('opacity-100', 'scale-100');
    }
    
    function hideModal(modalWrapper, modalContent) {
        document.body.classList.remove('overflow-hidden');
        // Start content fade out
        modalContent.classList.remove('opacity-100', 'scale-100');
        modalContent.classList.add('opacity-0', 'scale-95');
    
        // Start overlay fade out
        modalWrapper.classList.remove('opacity-100');
        modalWrapper.classList.add('opacity-0');
    
        // Wait for animation to complete, then disable pointer events
        setTimeout(() => {
            modalWrapper.classList.add('pointer-events-none');
            modalWrapper.classList.remove('pointer-events-auto');
        }, 300); // match Tailwind duration-300
    }

    // --------- check no bookmarks functions 
    function checkCardCount() {
        const cardsContainer = document.getElementById('cards');
        const noBookmarksMsg = document.getElementById('no-bookmarks');
    
        const cardCount = cardsContainer.querySelectorAll('.card').length;
    
        if (cardCount < 1) {
            noBookmarksMsg.classList.remove('hidden');
        } else {
            noBookmarksMsg.classList.add('hidden');
        }
    }
    checkCardCount();


    // --------- searching feature functions 

    let selectedCategory = '';
    let selectedTags = [];

    function debounce(fn, ms = 300) {
        let id;
        return (...args) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...args), ms);
        };
    }

    function updateClearButton() {
        const active = searchInput.value.trim() || selectedCategory || selectedTags.length;
        clearFilterBtn.classList.toggle('hidden', !active);
    }
    function renderFilterSummary() {
        const parts = [];
        if (searchInput.value.trim()) parts.push(`"${searchInput.value.trim()}"`);
        if (selectedCategory) parts.push(selectedCategory);
        parts.push(...selectedTags);
        filterSummary.textContent = parts.length
            ? `Filtering by: ${parts.join(', ')}`
            : '';
    }

    // Fetch and render
    async function fetchSearchResults() {
        updateClearButton();
        renderFilterSummary();

        const params = new URLSearchParams();
        const q = searchInput.value.trim();
        if (q) params.append('q', q);
        if (selectedCategory) params.append('category', selectedCategory);
        selectedTags.forEach(t => params.append('tags[]', t));

        try {
            const res = await fetch(`search/?${params}`);
            const json = await res.json();
            defaultCards.classList.add('hidden');
            resultsInner.innerHTML = '';

            if (json.results.length) {

                // Show search results
                searchResults.classList.remove('opacity-0', 'max-h-0');
                searchResults.classList.add('opacity-100', 'max-h-[1000px]');

                // Hide “no results”
                noResults.classList.add('opacity-0');
                noResults.classList.remove('opacity-100');

                resultsInner.classList.remove('opacity-0', 'max-h-0');
                resultsInner.classList.add('opacity-100', 'max-h-[1000px]');

                json.results.forEach(bm => {

                    resultsInner.appendChild(renderCard(true, bm.id, bm.name, bm.url, bm.description, bm.platform, bm.tags));
                });
            } else {

                searchResults.classList.remove('opacity-0', 'max-h-0');
                searchResults.classList.add('opacity-100', 'max-h-[1000px]');

                // Hide “no results”
                noResults.classList.remove('opacity-0');
                noResults.classList.add('opacity-100');
            }
        } catch (e) {
            console.error('Search error:', e);
        }
    }

    const debouncedFetch = debounce(fetchSearchResults, 300);

    function debouncedSearch() {
        // if no filters/search left, reset entirely
        const hasSearch = !!searchInput.value.trim();
        const hasCategory = !!selectedCategory;
        const hasAnyFilter = hasSearch || hasCategory || selectedTags.length > 0;

        if (!hasAnyFilter) {
            clearFilters();
        }
        else {
            debouncedFetch();
        }
    }

    // Events
    searchInput.addEventListener('input', debouncedSearch);

    categoryGroup.addEventListener('click', e => {
        const btn = e.target.closest('button[data-category]');
        if (!btn) return;
        const cat = btn.dataset.category;

        // toggle—only one allowed
        if (selectedCategory === cat) {
            selectedCategory = '';
            btn.classList.remove('bg-[#703edb]');
        } else {
            // clear old
            categoryGroup.querySelectorAll('button').forEach(b => b.classList.remove('bg-[#703edb]'));
            selectedCategory = cat;
            btn.classList.add('bg-[#703edb]');
        }

        debouncedSearch();
    });

    tagGroup.addEventListener('click', e => {
        const btn = e.target.closest('button[data-tag]');
        if (!btn) return;
        const tag = btn.dataset.tag;

        // toggle independent
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter(t => t !== tag);
            btn.classList.remove('bg-[#703edb]');
        } else {
            selectedTags.push(tag);
            btn.classList.add('bg-[#703edb]');
        }
        debouncedSearch();
    });

    function clearFilters() {
        // Reset all
        searchInput.value = '';
        selectedCategory = '';
        selectedTags = [];

        categoryGroup.querySelectorAll('button').forEach(b => b.classList.remove('bg-[#703edb]'));
        tagGroup.querySelectorAll('button').forEach(b => b.classList.remove('bg-[#703edb]'));

        defaultCards.classList.remove('hidden');
        clearFilterBtn.classList.add('hidden');

        searchResults.classList.add('opacity-0', 'max-h-0');
        searchResults.classList.remove('opacity-100', 'max-h-[1000px]');

        noResults.classList.add('opacity-0');
        noResults.classList.remove('opacity-100');

        resultsInner.classList.add('opacity-0', 'max-h-0');
        resultsInner.classList.remove('opacity-100', 'max-h-[1000px]');

        resultsInner.innerHTML = '';
        filterSummary.textContent = '';
    }

    clearFilterBtn.addEventListener('click', clearFilters);

});
