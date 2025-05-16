
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
            document.body.classList.add('overflow-hidden');
            modal.classList.replace('hidden', 'flex');
            if (resetForm) reset();
        }
        function close() {
            document.body.classList.remove('overflow-hidden');
            modal.classList.replace('flex', 'hidden');
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


    const addModal = modalFactory('add', 'add/', 'Added');
    const editModal = modalFactory('edit', 'edit/', 'Updated');




    // --------- searching feature functions 

    const searchInput = document.getElementById('searchInput');
    const categoryGroup = document.getElementById('categoryGroup');
    const tagGroup = document.getElementById('tagGroup');
    const defaultCards = document.getElementById('defaultCards');
    const searchResults = document.getElementById('searchResults');   // container wrapper section
    const resultsInner = document.getElementById('searchResultsDiv'); // inner cards div
    const noResults = document.getElementById('noResults');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const filterSummary = document.getElementById('filterSummary');

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
                // noResults.classList.add('hidden');
                // searchResults.classList.remove('hidden');

                // Show search results
                searchResults.classList.remove('opacity-0', 'max-h-0');
                searchResults.classList.add('opacity-100', 'max-h-[1000px]');

                // Hide “no results”
                noResults.classList.add('opacity-0');
                noResults.classList.remove('opacity-100');

                resultsInner.classList.remove('opacity-0', 'max-h-0');
                resultsInner.classList.add('opacity-100', 'max-h-[1000px]');

                json.results.forEach(bm => {
                    const card = document.createElement('div');
                    card.className = 'card p-4 md:p-6 relative cursor-pointer';
                    card.dataset.bmId = bm.id;
                    card.dataset.platform = bm.platform;
                    card.dataset.tags = JSON.stringify(bm.tags);

                    // Build tag spans (max 3 + “+N”)
                    const maxTags = 3;
                    const visibleTags = bm.tags.slice(0, maxTags);
                    const extraCount = bm.tags.length - maxTags;
                    const tagsHtml = visibleTags
                        .map(t => `<span class="text-[10px] sm:text-xs md:text-sm tag">${t}</span>`)
                        .join(' ');
                    const moreHtml = extraCount > 0
                        ? `<span class="text-[10px] sm:text-xs md:text-sm tag">+${extraCount}</span>`
                        : '';

                    card.innerHTML = `
                        <div class="absolute top-1.5 right-2 flex space-x-2">
                            <!-- Edit button -->
                            <button id="edit-openBtn" type="button" aria-label="Edit"
                                class="inline-flex items-center justify-center h-8 px-2 text-xs font-medium text-gray-500 transition-colors bg-transparent rounded-xl hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50 disabled:pointer-events-none"
                                data-action="edit" data-id="${bm.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                                </svg>
                            </button>

                            <!-- Delete button -->
                            <button type="button" aria-label="Delete"
                                class="inline-flex items-center justify-center h-8 px-2 text-xs font-medium text-gray-500 transition-colors bg-transparent rounded-xl hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50 disabled:pointer-events-none"
                                data-action="delete" data-id="${bm.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                        <h3 class="mb-2 font-semibold text-lg md:text-xl truncate">${bm.name}</h3>
                        <a href="${bm.url}" target="_blank"
                            class="url inline-block text-[#58a6ff] mb-3 break-all text-xs truncate md:text-sm hover:underline">
                            ${bm.url}
                        </a>
                        <p class="text-xs text-gray-400 mb-3 leading-[1.4] line-clamp-2">${bm.description}</p>
                        <div class="tags mt-3 flex flex-wrap gap-1 md:gap-2 max-h-[1.5rem] md:max-h-[2rem] overflow-hidden">
                            <span class="text-[10px] md:text-xs tag">${bm.platform}</span>
                            ${tagsHtml}
                            ${moreHtml}
                        </div>
                        `;
                    resultsInner.appendChild(card);
                });
            } else {

                searchResults.classList.remove('opacity-0', 'max-h-0');
                searchResults.classList.add('opacity-100', 'max-h-[1000px]');

                // Hide “no results”
                noResults.classList.remove('opacity-0');
                noResults.classList.add('opacity-100');
                console.log("request true");
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
        console.log(selectedTags);
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



    const viewModal = document.getElementById('view-modal');
    const viewEditBtn = document.getElementById('view-editBtn');
    const viewDeleteBtn = document.getElementById('view-deleteBtn');
    const viewCloseBtn = document.getElementById('view-closeBtn');
    const viewName = document.getElementById('view-name');
    const viewUrl = document.getElementById('view-url');
    const viewDescription = document.getElementById('view-description');
    const viewPlatform = document.getElementById('view-platform');
    const viewTags = document.getElementById('view-tags');


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
        viewPlatform.textContent = data.platform;

        viewTags.innerHTML = data.tags
            .map(t => `<span class="text-[10px] sm:text-xs md:text-sm tag">${t}</span>`)
            .join('');

        // 3) Show the modal
        viewModal.classList.remove('hidden');
    }

    viewCloseBtn.addEventListener('click', () => {
        viewModal.classList.add('hidden');
    });
    console.log('close btn:', viewCloseBtn);
    
    viewModal.addEventListener('click', e => {
        if (e.target === viewModal) {
            viewModal.classList.add('hidden');
        }
    });

    document.body.addEventListener('click', e => {
        const card = e.target.closest('.card');
        if (!card) return;
        console.log("open");
        openViewModal(card);
    });

    // Then your Edit button in the modal can use that same `currentCardData`:
    viewEditBtn.addEventListener('click', () => {
        if (!currentCardData) return;
        editModal.open(false);
        editModal.fill(currentCardData);
        viewModal.classList.add('hidden');

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
                    viewModal.classList.add('hidden');
                } else {
                    showToast(json.error || 'Delete failed', 'error');
                }
            });
    });


























    // function openViewModal(card) {
    //     const name = card.querySelector('h3').textContent;
    //     const url = card.querySelector('a.url')?.href || '#';
    //     const desc = card.querySelector('p')?.textContent || '';
    //     const platform = card.dataset.platform;
    //     const tags = JSON.parse(card.dataset.tags || '[]');

    //     viewCard.dataset.bmId = card.dataset.bmId;
    //     viewCard.dataset.platform = platform;
    //     viewCard.dataset.tags = card.dataset.tags;

    //     viewName.textContent = name;
    //     viewUrl.textContent = url;
    //     viewUrl.href = url;
    //     viewDescription.textContent = desc;

    //     viewTags.innerHTML = '';
    //     viewPlatform.textContent = platform;
    //     tags.forEach(t => {
    //         const span = document.createElement('span');
    //         span.className = 'text-[10px] sm:text-xs md:text-sm tag';
    //         span.textContent = t;
    //         viewTags.appendChild(span);
    //     });

    //     viewModal.classList.remove('hidden');
    // }

    // // Close handler
    // viewCloseBtn.addEventListener('click', () => {
    //     viewModal.classList.add('hidden');
    //     console.log("click close");
    // });
    // // click outside to close
    // viewModal.addEventListener('click', e => {
    //     if (e.target === viewModal) viewModal.classList.add('hidden');
    // });

    // // Delegate clicks on cards (but ignore clicks on edit/delete buttons)
    // document.body.addEventListener('click', e => {
    //     const card = e.target.closest('.card');
    //     if (!card) return;

    //     // if clicked an inner edit/delete button, bail
    //     if (e.target.closest('button[data-action]')) return;

    //     openViewModal(card);
    // });




});

