

// document.addEventListener('DOMContentLoaded', () => {
//     // --- ICON MAP ---
//     const ICONS = {
//         Web: `<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`,
//         Desktop: `<rect x="3" y="3" width="18" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17v4"/>`,
//         Mobile: `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>`,
//         Bot: `<rect x="4" y="6" width="16" height="12" rx="2" ry="2"/><circle cx="8" cy="10" r="1"/><circle cx="16" cy="10" r="1"/><path d="M8 15h8"/>`,
//         Script: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`
//     };

//     // --- GENERIC MODAL HANDLER FACTORY ---
//     function createModalHandler(config) {
//         const {
//             openBtnId, modalId, closeBtnId, cancelBtnId,
//             nameId, urlId, descId,
//             ddlBtnId, ddlMenuId, selTextId, selIconId,
//             submitBtnId, tagGroupId,
//             endpoint
//         } = config;

//         // Element refs
//         const openBtn = document.getElementById(openBtnId);
//         const modal = document.getElementById(modalId);
//         const closeBtn = document.getElementById(closeBtnId);
//         const cancelBtn = document.getElementById(cancelBtnId);
//         const nameInput = document.getElementById(nameId);
//         const urlInput = document.getElementById(urlId);
//         const descInput = document.getElementById(descId);
//         const ddlBtn = document.getElementById(ddlBtnId);
//         const ddlMenu = document.getElementById(ddlMenuId);
//         const selText = document.getElementById(selTextId);
//         const selIcon = document.getElementById(selIconId);
//         const submitBtn = document.getElementById(submitBtnId);
//         const tagGroup = document.getElementById(tagGroupId);
//         const tagButtons = tagGroup.querySelectorAll('.tag-btn');

//         const tagSelected = document.querySelector('.selected-tags');

//         let selectedTags = [''];
//         const DEFAULT_CAT = 'Web';

//         function reset() {
//             nameInput.value = '';
//             urlInput.value = '';
//             descInput.value = '';
//             selText.textContent = DEFAULT_CAT;
//             selIcon.innerHTML = ICONS[DEFAULT_CAT];
//             ddlMenu.classList.add('hidden');
//             selectedTags = [];
//             tagSelected.classList.add('hidden');
//             tagSelected.innerHTML = '';
//             selectedTags = [''];
//         }

//         function open() {
//             document.body.classList.add('overflow-hidden');
//             modal.classList.replace('hidden', 'flex');
//             reset();
//         }

//         function close() {
//             document.body.classList.remove('overflow-hidden');
//             modal.classList.replace('flex', 'hidden');
//             reset();
//         }

//         function fill(data) {
//             nameInput.value = data.name;
//             urlInput.value = data.url;
//             descInput.value = data.description;
//             selText.textContent = data.platform;
//             selIcon.innerHTML = ICONS[data.platform] || '';
//             ddlMenu.classList.add('hidden');
//             selectedTags = [];
//             tagButtons.forEach(btn => {
//                 const t = btn.dataset.tag;
//                 if (data.tags.includes(t)) {
//                     btn.classList.add('bg-purple-100');
//                     selectedTags.push(t);
//                 } else {
//                     btn.classList.remove('bg-purple-100');
//                 }
//             });
//         }

//         openBtn && openBtn.addEventListener('click', open);
//         closeBtn && closeBtn.addEventListener('click', close);
//         cancelBtn && cancelBtn.addEventListener('click', close);
//         modal && modal.addEventListener('click', e => e.target === modal && close());

//         ddlBtn.addEventListener('click', e => {
//             e.stopPropagation();
//             if (!modal.classList.contains('hidden')) ddlMenu.classList.toggle('hidden');
//         });
//         document.addEventListener('click', () => {
//             if (!modal.classList.contains('hidden')) ddlMenu.classList.add('hidden');
//         });
//         ddlMenu.addEventListener('click', e => {
//             if (modal.classList.contains('hidden')) return;
//             const item = e.target.closest('[data-option]');
//             if (!item) return;
//             const opt = item.dataset.option;
//             selText.textContent = opt;
//             selIcon.innerHTML = ICONS[opt] || '';
//             ddlMenu.classList.add('hidden');
//         });

//         tagGroup.addEventListener('click', e => {
//             const btn = e.target.closest('.tag-btn');
//             if (!btn) return;
//             const tag = btn.dataset.tag;
//             const i = selectedTags.indexOf(tag);
//             if (i > -1) {
//                 selectedTags.splice(i, 1);
//                 btn.classList.remove('bg-purple-100');
//             } else {
//                 selectedTags.push(tag);
//                 btn.classList.add('bg-purple-100');
//             }
//         });

//         submitBtn.addEventListener('click', () => {
//             const name = nameInput.value.trim();
//             const url = urlInput.value.trim();
//             const desc = descInput.value.trim();
//             const cat = selText.textContent.trim();
//             if (!name || !desc || !cat) {
//                 return alert('Please fill in all fields + category.');
//             }

//             const payload = {
//                 name,
//                 url,
//                 description: desc,
//                 platform: cat,
//                 tags: selectedTags
//             };

//             // Add ID for edit requests
//             const id = submitBtn.dataset.id;
//             if (id) {
//                 payload.id = id;
//             }

//             console.log(`${config.name} payload:`, payload);

//             fetch(endpoint, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'X-CSRFToken': getCookie('csrftoken'),
//                 },
//                 body: JSON.stringify(payload)
//             })
//                 .then(async r => {
//                     const text = await r.text();  // read raw response
//                     console.log("Raw response:", text);
//                     try {
//                         const json = JSON.parse(text);
//                         if (json.success) {
//                             close();
//                             showToast('Bookmark added!', 'success');
//                             // alert(`${config.name} successful!`);
//                         } else {
//                             showToast(json.error || 'Something went wrong', 'error');
//                         }
//                     } catch (err) {
//                         console.error("JSON parse error", err);;
//                     }
//                 })
//                 .catch(e => {
//                     console.error(e);
//                 });
//         });

//         return { open, close, fill };
//     }

//     // Instantiate
//     const addHandler = createModalHandler({
//         name: 'Add',
//         openBtnId: 'openModalAddBtn',
//         modalId: 'modalAdd',
//         closeBtnId: 'add-closeModalBtn',
//         cancelBtnId: 'add-cancelModalBtn',
//         nameId: 'add-name',
//         urlId: 'add-url',
//         descId: 'add-description',
//         ddlBtnId: 'add-dropdownButton',
//         ddlMenuId: 'add-dropdownMenu',
//         selTextId: 'add-selectedText',
//         selIconId: 'add-selectedIcon',
//         submitBtnId: 'add-submitBookmarkBtn',
//         tagGroupId: 'tagGroup',
//         endpoint: 'add/'
//     });

//     const editHandler = createModalHandler({
//         name: 'Edit',
//         openBtnId: 'openModalEditBtn',
//         modalId: 'modalEdit',
//         closeBtnId: 'edit-closeModalBtn',
//         cancelBtnId: 'edit-cancelModalBtn',
//         nameId: 'edit-name',
//         urlId: 'edit-url',
//         descId: 'edit-description',
//         ddlBtnId: 'edit-dropdownButton',
//         ddlMenuId: 'edit-dropdownMenu',
//         selTextId: 'edit-selectedText',
//         selIconId: 'edit-selectedIcon',
//         submitBtnId: 'edit-updateBookmarkBtn',
//         tagGroupId: 'edit-tagGroup',
//         endpoint: 'edit/'
//     });

//     // Delegated edit click
//     document.body.addEventListener('click', e => {
//         const btn = e.target.closest('[data-action="edit"]');
//         if (!btn) return;
//         const card = btn.closest('.card');
//         if (!card) return;

//         const data = {
//             id: card.dataset.bmId,
//             name: card.querySelector('h3').textContent.trim(),
//             url: card.querySelector('a').href,
//             description: card.querySelector('p').textContent.trim(),
//             platform: card.dataset.platform,
//             tags: JSON.parse(card.dataset.tags || '[]')
//         };

//         // console.log(data);

//         // stash the bm-id on the update button if needed
//         editHandler.open();
//         editHandler.fill(data);

//         document.getElementById('edit-updateBookmarkBtn').dataset.id = data.id;
//     });

//     // --- Delegated delete click ---
//     document.body.addEventListener('click', e => {
//         const btn = e.target.closest('[data-action="delete"]');
//         if (!btn) return;

//         const bmId = btn.dataset.id;
//         if (!confirm('Are you sure you want to delete this bookmark?')) return;

//         fetch(`delete/${bmId}/`, {
//             method: 'DELETE',
//             headers: {
//                 'X-CSRFToken': getCookie('csrftoken'),
//             },
//         })
//             .then(res => res.json())
//             .then(json => {
//                 if (json.success) {
//                     // remove the card from the DOM
//                     const card = btn.closest('.card');
//                     card?.remove();
//                     showToast('Bookmark deleted', 'success');
//                 } else {
//                     showToast(json.error || 'Could not delete bookmark', 'error');
//                 }
//             })
//             .catch(err => {
//                 console.error(err);
//                 showToast('Request failed', 'error');
//             });
//     });

// });


// // tags management
// const commonTags = [
//     "development", "android", "linux", "mac", "hacking",
//     "script", "editing", "design", "video", "image", "ai"
// ];
// let selectedTags = [];
// let isCollapsed = false;
// let highlightedIndex = -1;

// const searchBar = document.querySelector('.search-bar');
// const tagsList = document.querySelector('.tags-list');
// const selectedTagsDiv = document.querySelector('.selected-tags');
// const doneButton = document.querySelector('.done-button');
// const selectTagsArea = document.querySelector('.tag-selector');

// searchBar.addEventListener('focus', () => {
//     isCollapsed = false;
//     toggleSelectedTagsDiv();

//     tagsList.classList.remove('hidden');
//     populateTagsList();
// });

// searchBar.addEventListener('blur', () => {
//     setTimeout(() => {
//         tagsList.classList.add('hidden');
//     }, 200);
// });

// searchBar.addEventListener('input', () => {
//     const searchTerm = searchBar.value.trim().toLowerCase();
//     populateTagsList(searchTerm);
// });

// searchBar.addEventListener('keydown', handleKeydown);

// doneButton.addEventListener('click', () => {
//     isCollapsed = true;
//     renderSelectedTags(); // Ensure the div is updated and displayed
//     toggleSelectedTagsDiv(); // Update visibility based on state
//     tagsList.classList.add('hidden'); // Close dropdown
// });

// document.addEventListener('click', (event) => {
//     const isClickInside = selectTagsArea.contains(event.target);
//     if (!isClickInside) {
//         tagsList.classList.add('hidden');
//     }
// });

// function populateTagsList(searchTerm = "") {
//     tagsList.innerHTML = '';
//     highlightedIndex = -1;
//     let tagsToShow;

//     if (searchTerm) {
//         tagsToShow = commonTags.filter(tag =>
//             tag.toLowerCase().includes(searchTerm)
//         );
//         if (tagsToShow.length === 0 && !selectedTags.includes(searchTerm)) {
//             const li = document.createElement('li');
//             li.className = 'p-2 text-xs cursor-pointer text-white hover:bg-purple-600 md:text-sm';
//             li.textContent = `Add "${searchTerm}"`;
//             li.addEventListener('click', () => addTag(searchTerm));
//             tagsList.appendChild(li);
//         }
//     } else {
//         tagsToShow = commonTags.slice(0, 5);
//     }

//     tagsToShow.forEach(tag => {
//         const li = document.createElement('li');
//         if (selectedTags.includes(tag)) {
//             li.className = 'p-2 bg-theme text-xs text-white md:text-sm';
//             li.textContent = tag + ' ✓';
//         } else {
//             li.className = 'p-2 text-xs cursor-pointer text-white hover:bg-purple-600 md:text-sm';
//             li.textContent = tag;
//             li.addEventListener('click', () => addTag(tag));
//         }
//         tagsList.appendChild(li);
//     });

//     if (tagsList.children.length > 0) {
//         highlightedIndex = 0;
//         highlightItem(0);
//     }
// }

// function addTag(tag) {
//     if (!selectedTags.includes(tag)) {
//         selectedTags.push(tag);
//         renderSelectedTags();
//         toggleSelectedTagsDiv();
//         doneButton.disabled = false;
//         searchBar.value = '';
//         populateTagsList();
//         const lastTag = selectedTagsDiv.lastChild;
//         if (lastTag) {
//             lastTag.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
//         }
//     }
// }

// function removeTag(tag) {
//     selectedTags = selectedTags.filter(t => t !== tag);
//     renderSelectedTags();
//     toggleSelectedTagsDiv();
//     doneButton.disabled = selectedTags.length === 0;
//     populateTagsList();
// }

// function renderSelectedTags() {
//     selectedTagsDiv.innerHTML = '';
//     selectedTags.forEach(tag => {
//         const span = document.createElement('span');
//         span.className = 'tag flex items-center text-[10px] text-white px-2 py-1 m-1 rounded-xl sm: md:text-sm ';
//         span.textContent = tag;
//         const removeBtn = document.createElement('button');
//         removeBtn.className = 'ml-2 text-white cursor-pointer bg-transparent border-none opacity-70 transition-opacity hover:opacity-100 focus:ring-offset-purple-700 disabled:pointer-events-none';
//         removeBtn.textContent = 'X';
//         removeBtn.addEventListener('click', () => removeTag(tag));
//         span.appendChild(removeBtn);
//         selectedTagsDiv.appendChild(span);
//     });
// }

// function toggleSelectedTagsDiv() {
//     if (selectedTags.length === 0) {
//         selectedTagsDiv.classList.add('hidden');
//     } else {
//         selectedTagsDiv.classList.remove('hidden');
//         if (isCollapsed) {
//             selectedTagsDiv.classList.add('max-h-9','max-h-[50px]', 'overflow-hidden');
//             selectedTagsDiv.classList.remove('max-h-24', 'overflow-y-auto');
//         } else {
//             selectedTagsDiv.classList.add('max-h-24', 'overflow-y-auto');
//             selectedTagsDiv.classList.remove('max-h-9','max-h-[50px]', 'overflow-hidden');
//         }
//     }
// }

// function handleKeydown(e) {
//     const listItems = Array.from(tagsList.children);
//     if (e.key === 'ArrowDown') {
//         e.preventDefault();
//         if (highlightedIndex < listItems.length - 1) {
//             highlightedIndex++;
//         } else {
//             highlightedIndex = 0;
//         }
//         highlightItem(highlightedIndex);
//     } else if (e.key === 'ArrowUp') {
//         e.preventDefault();
//         if (highlightedIndex > 0) {
//             highlightedIndex--;
//         } else {
//             highlightedIndex = listItems.length - 1;
//         }
//         highlightItem(highlightedIndex);
//     } else if (e.key === 'Enter') {
//         e.preventDefault();
//         if (highlightedIndex >= 0 && highlightedIndex < listItems.length) {
//             const selectedItem = listItems[highlightedIndex];
//             if (selectedItem.textContent.startsWith('Add "')) {
//                 const tag = searchBar.value.trim();
//                 addTag(tag);
//             } else {
//                 const tag = selectedItem.textContent.replace(' ✓', '');
//                 addTag(tag);
//             }
//         }
//     }
// }

// function highlightItem(index) {
//     const listItems = Array.from(tagsList.children);
//     listItems.forEach((item, i) => {
//         if (i === index) {
//             item.classList.add('bg-purple-600');
//         } else {
//             item.classList.remove('bg-purple-600');
//         }
//     });
// }


// fetch('add-bookmark/', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'X-CSRFToken': getCookie('csrftoken'),
//     },
//     body: JSON.stringify(payload),
// })
//     .then(r => r.json())
//     .then(json => {
//         if (json.success) {
//             console.log('Created bookmark id=', json.id);
//             // close modal, refresh list, etc.
//             closeModal();
//             payload = {};
//             alert('Add bookmark ok');

//             const tagSpans = selectedTags
//                 .map(tag => `<span class="tag">${tag}</span>`)
//                 .join('');
//             const cardMarkup = `
//                     <div class="card">
//                         <h3>${name}</h3>
//                         <a href="${url}" class="url">
//                         ${url}
//                         </a>
//                         <p>${description}</p>
//                         <div class="tags">
//                         ${tagSpans}
//                         </div>
//                     </div>
//                     `;

//             const cardsContainer = document.getElementById('cards');
//             cardsContainer.insertAdjacentHTML('afterbegin', cardMarkup);

//         } else {
//             alert('Error: ' + json.error);
//         }
//     })
//     .catch(err => {
//         console.error(err);
//         alert('Request failed');
//     });