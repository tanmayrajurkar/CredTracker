// Initialize Supabase client
try {
    const supabaseUrl = window.config.SUPABASE_URL;
    const supabaseKey = window.config.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing');
    }
    
    // Create and expose the Supabase client with CORS configuration
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: {
                getItem: (key) => {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : null;
                },
                setItem: (key, value) => {
                    localStorage.setItem(key, JSON.stringify(value));
                },
                removeItem: (key) => {
                    localStorage.removeItem(key);
                }
            }
        },
        global: {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        }
    });
    window.supabaseClient = supabaseClient;
    
    // Set up auth state change listener
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            window.currentUser = session.user;
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event, session }
            }));
        } else if (event === 'SIGNED_OUT') {
            // Clear all auth-related data
            window.currentUser = null;
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event, session: null }
            }));
        }
    });

    // Check initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.currentUser = session.user;
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event: 'SIGNED_IN', session }
            }));
        } else {
            // Ensure we're logged out if no session
            window.currentUser = null;
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
        }
    }).catch(error => {
        console.error('Error checking initial session:', error);
        if (error.message.includes('CORS')) {
            console.error('CORS error detected. Please check your Supabase project settings and ensure your domain is allowed.');
        }
    });
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    window.supabaseClient = null;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[StickyNotes] DOMContentLoaded');
    // Sticky Notes Logic
    (function() {
        const notesContainer = document.getElementById('sticky-notes-container');
        const addNoteBtn = document.getElementById('add-sticky-note-btn');
        let notes = [];
        let userId = null;

        console.log('[StickyNotes] notesContainer:', notesContainer);
        console.log('[StickyNotes] addNoteBtn:', addNoteBtn);

        // Track cut notes in memory and persist in localStorage
        let cutNoteIds = [];
        const CUT_NOTES_KEY = 'sticky_cut_note_ids';
        function saveCutNotesToStorage() {
            localStorage.setItem(CUT_NOTES_KEY, JSON.stringify(cutNoteIds));
        }
        function loadCutNotesFromStorage() {
            try {
                const stored = localStorage.getItem(CUT_NOTES_KEY);
                cutNoteIds = stored ? JSON.parse(stored) : [];
            } catch (e) {
                cutNoteIds = [];
            }
        }
        loadCutNotesFromStorage();
        // Utility: Create note element
        function createNoteElement(note) {
            const el = document.createElement('div');
            el.className = 'sticky-note';
            el.style.left = (note.x || 100) + 'px';
            el.style.top = (note.y || 100) + 'px';
            el.style.background = note.color || '#fff9c4';
            el.setAttribute('data-id', note.id);
            if (cutNoteIds.includes(note.id)) {
                el.style.display = 'none';
            }

            // Textarea for content
            const textarea = document.createElement('textarea');
            textarea.value = note.content;
            textarea.placeholder = 'Write a note...';
            textarea.addEventListener('change', async (e) => {
                console.log('[StickyNotes] Updating note content', note.id, textarea.value);
                await updateNote(note.id, { content: textarea.value });
            });
            el.appendChild(textarea);

            // Actions (delete, cut)
            const actions = document.createElement('div');
            actions.className = 'note-actions';
            const delBtn = document.createElement('button');
            delBtn.className = 'note-action-btn';
            delBtn.title = 'Delete';
            delBtn.innerHTML = '🗑️';
            delBtn.onclick = async () => {
                hideStickyTooltip();
                console.log('[StickyNotes] Deleting note', note.id);
                await deleteNote(note.id);
            };
            delBtn.onmouseenter = function(e) {
                showStickyTooltip('Delete: Permanently remove this note', e.clientX, e.clientY);
            };
            delBtn.onmousemove = function(e) {
                showStickyTooltip('Delete: Permanently remove this note', e.clientX, e.clientY);
            };
            delBtn.onmouseleave = hideStickyTooltip;
            actions.appendChild(delBtn);
            // Cut button
            const cutBtn = document.createElement('button');
            cutBtn.className = 'note-action-btn';
            cutBtn.title = 'Cut: Temporarily hide this note from the screen (can be restored)';
            cutBtn.innerHTML = '✂️';
            cutBtn.onclick = () => {
                hideStickyTooltip();
                if (!cutNoteIds.includes(note.id)) {
                    cutNoteIds.push(note.id);
                    saveCutNotesToStorage();
                    renderNotes();
                }
            };
            cutBtn.onmouseenter = function(e) {
                showStickyTooltip('Cut: Temporarily hide this note from the screen (can be restored)', e.clientX, e.clientY);
            };
            cutBtn.onmousemove = function(e) {
                showStickyTooltip('Cut: Temporarily hide this note from the screen (can be restored)', e.clientX, e.clientY);
            };
            cutBtn.onmouseleave = hideStickyTooltip;
            actions.appendChild(cutBtn);
            el.appendChild(actions);

            // Drag logic
            let offsetX, offsetY, dragging = false;
            el.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'TEXTAREA' || e.target.classList.contains('note-action-btn')) return;
                dragging = true;
                el.classList.add('dragging');
                offsetX = e.clientX - el.offsetLeft;
                offsetY = e.clientY - el.offsetTop;
                document.body.style.userSelect = 'none';
            });
            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                el.style.left = (e.clientX - offsetX) + 'px';
                el.style.top = (e.clientY - offsetY) + 'px';
            });
            document.addEventListener('mouseup', async (e) => {
                if (dragging) {
                    dragging = false;
                    el.classList.remove('dragging');
                    document.body.style.userSelect = '';
                    // Save new position
                    console.log('[StickyNotes] Updating note position', note.id, el.style.left, el.style.top);
                    await updateNote(note.id, {
                        x: parseFloat(el.style.left),
                        y: parseFloat(el.style.top)
                    });
                }
            });
            // Hide tooltip when mouse leaves the sticky note (for Delete/Cut)
            el.addEventListener('mouseleave', hideStickyTooltip);
            return el;
        }

        // Render all notes
        function renderNotes() {
            if (!notesContainer) return;
            console.log('[StickyNotes] Rendering notes:', notes);
            notesContainer.innerHTML = '';
            notes.forEach(note => {
                console.log('[StickyNotes] Rendering note:', note.id, 'x:', note.x, 'y:', note.y, 'content:', note.content);
                const el = createNoteElement(note);
                notesContainer.appendChild(el);
            });
        }

        // Fetch notes from Supabase
        async function fetchNotes() {
            if (!userId) return;
            console.log('[StickyNotes] Fetching notes for user:', userId);
            const { data, error } = await window.supabaseClient
                .from('sticky_notes')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            if (error) {
                console.error('[StickyNotes] Error fetching notes:', error);
            }
            notes = data || [];
            renderNotes();
        }

        // Create note
        async function createNote() {
            if (!userId) {
                console.warn('[StickyNotes] No userId, cannot create note');
                return;
            }
            console.log('[StickyNotes] Creating new note for user:', userId);
            const { data, error } = await window.supabaseClient
                .from('sticky_notes')
                .insert([{ user_id: userId, content: '', x: 120, y: 120, color: '#fff9c4' }])
                .select();
            if (error) {
                console.error('[StickyNotes] Error creating note:', error);
            }
            if (data && data[0]) {
                notes.unshift(data[0]);
                renderNotes();
            }
        }

        // Update note
        async function updateNote(id, fields) {
            console.log('[StickyNotes] Updating note', id, fields);
            const { data, error } = await window.supabaseClient
                .from('sticky_notes')
                .update({ ...fields, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select();
            if (error) {
                console.error('[StickyNotes] Error updating note:', error);
            }
            if (data && data[0]) {
                const idx = notes.findIndex(n => n.id === id);
                if (idx !== -1) {
                    notes[idx] = { ...notes[idx], ...fields, updated_at: data[0].updated_at };
                    renderNotes();
                }
            }
        }

        // Delete note
        async function deleteNote(id) {
            console.log('[StickyNotes] Deleting note', id);
            const { error } = await window.supabaseClient
                .from('sticky_notes')
                .delete()
                .eq('id', id);
            if (error) {
                console.error('[StickyNotes] Error deleting note:', error);
            }
            notes = notes.filter(n => n.id !== id);
            renderNotes();
        }

        // Add note button
        const dropdownMenu = document.getElementById('sticky-notes-dropdown');
        const dropdownAddNote = document.getElementById('dropdown-add-note');
        const dropdownShowNotes = document.getElementById('dropdown-show-notes');
        // Toggle dropdown
        if (addNoteBtn) {
            addNoteBtn.onclick = function(e) {
                e.stopPropagation();
                if (dropdownMenu.style.display === 'block') {
                    dropdownMenu.style.display = 'none';
                } else {
                    dropdownMenu.style.display = 'block';
                }
            };
        }
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (dropdownMenu && dropdownMenu.style.display === 'block' && !dropdownMenu.contains(e.target) && e.target !== addNoteBtn) {
                dropdownMenu.style.display = 'none';
            }
        });
        // Dropdown actions
        if (dropdownAddNote) {
            dropdownAddNote.onclick = function(e) {
                e.stopPropagation();
                dropdownMenu.style.display = 'none';
                createNote();
            };
        }
        // Modal for notes list
        let notesListModal = document.getElementById('sticky-notes-list-modal');
        if (!notesListModal) {
            notesListModal = document.createElement('div');
            notesListModal.id = 'sticky-notes-list-modal';
            notesListModal.className = 'sticky-notes-list-modal';
            notesListModal.style.display = 'none';
            notesListModal.innerHTML = `
                <div class="sticky-notes-list-modal-content">
                    <span class="sticky-notes-list-modal-close">&times;</span>
                    <h3>All Sticky Notes</h3>
                    <ul id="sticky-notes-list-ul"></ul>
                </div>
            `;
            document.body.appendChild(notesListModal);
        }
        // In showNotesListModal, add restore button for cut notes
        function showNotesListModal() {
            const ul = document.getElementById('sticky-notes-list-ul');
            ul.innerHTML = '';
            if (notes.length === 0) {
                ul.innerHTML = '<li style="padding:12px; color:#888;">No notes found.</li>';
            } else {
                notes.forEach(note => {
                    const li = document.createElement('li');
                    li.className = 'sticky-notes-list-item';
                    li.textContent = note.content ? note.content.substring(0, 40) + (note.content.length > 40 ? '...' : '') : '(Empty Note)';
                    li.title = note.content;
                    li.style.cursor = 'pointer';
                    if (cutNoteIds.includes(note.id)) {
                        li.style.opacity = '0.5';
                        const restoreBtn = document.createElement('button');
                        restoreBtn.textContent = 'Restore';
                        restoreBtn.className = 'restore-note-btn';
                        restoreBtn.title = 'Restore: Bring this note back to the screen';
                        restoreBtn.style.marginLeft = '16px';
                        restoreBtn.onclick = function(e) {
                            hideStickyTooltip();
                            e.stopPropagation();
                            cutNoteIds = cutNoteIds.filter(id => id !== note.id);
                            saveCutNotesToStorage();
                            renderNotes();
                            showNotesListModal();
                        };
                        restoreBtn.onmouseenter = function(e) {
                            showStickyTooltip('Restore: Bring this note back to the screen', e.clientX, e.clientY);
                        };
                        restoreBtn.onmousemove = function(e) {
                            showStickyTooltip('Restore: Bring this note back to the screen', e.clientX, e.clientY);
                        };
                        restoreBtn.onmouseleave = hideStickyTooltip;
                        li.appendChild(restoreBtn);
                    }
                    li.onclick = function() {
                        notesListModal.style.display = 'none';
                        // Find the note element and scroll to it
                        const el = notesContainer.querySelector(`[data-id='${note.id}']`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.boxShadow = '0 0 0 4px #ffd600';
                            setTimeout(() => { el.style.boxShadow = ''; }, 1200);
                        }
                    };
                    // Hide tooltip when mouse leaves the list item (for Restore)
                    li.addEventListener('mouseleave', hideStickyTooltip);
                    ul.appendChild(li);
                });
            }
            notesListModal.style.display = 'block';
        }
        // Close modal logic
        notesListModal.querySelector('.sticky-notes-list-modal-close').onclick = function() {
            notesListModal.style.display = 'none';
        };
        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && notesListModal.style.display === 'block') {
                notesListModal.style.display = 'none';
            }
        });
        // Update dropdownShowNotes click
        if (dropdownShowNotes) {
            dropdownShowNotes.onclick = function(e) {
                e.stopPropagation();
                dropdownMenu.style.display = 'none';
                showNotesListModal();
            };
        }

        // Listen for auth changes
        window.addEventListener('authStateChanged', (e) => {
            const session = e.detail.session;
            userId = session && session.user ? session.user.id : null;
            console.log('[StickyNotes] Auth state changed. userId:', userId);
            if (userId) {
                fetchNotes();
            } else {
                notes = [];
                renderNotes();
            }
        });

        // If already logged in
        if (window.currentUser && window.currentUser.id) {
            userId = window.currentUser.id;
            console.log('[StickyNotes] Already logged in. userId:', userId);
            fetchNotes();
        }

        // --- Custom Tooltip Logic ---
        let stickyTooltip = document.getElementById('sticky-tooltip');
        if (!stickyTooltip) {
            stickyTooltip = document.createElement('div');
            stickyTooltip.id = 'sticky-tooltip';
            stickyTooltip.style.display = 'none';
            stickyTooltip.className = 'sticky-tooltip';
            document.body.appendChild(stickyTooltip);
        }
        function showStickyTooltip(text, x, y) {
            stickyTooltip.textContent = text;
            stickyTooltip.style.display = 'block';
            stickyTooltip.style.left = x + 12 + 'px';
            stickyTooltip.style.top = y + 12 + 'px';
        }
        function hideStickyTooltip() {
            stickyTooltip.style.display = 'none';
        }
        // --- End Custom Tooltip Logic ---
    })();

    // --- Curriculum & Roadmaps Dropdown Logic ---
    const curriculumBtn = document.getElementById('curriculum-roadmaps-btn');
    const curriculumDropdown = document.getElementById('curriculum-roadmaps-dropdown');
    const curriculumOptionsDropdown = document.getElementById('curriculum-options-dropdown');
    let selectedCourse = null;

    if (curriculumBtn && curriculumDropdown && curriculumOptionsDropdown) {
      curriculumBtn.onclick = function(e) {
        e.stopPropagation();
        // Hide sticky notes dropdown if open
        const stickyDropdown = document.getElementById('sticky-notes-dropdown');
        if (stickyDropdown) stickyDropdown.style.display = 'none';
        // Toggle curriculum dropdown
        if (curriculumDropdown.style.display === 'block') {
          curriculumDropdown.style.display = 'none';
          curriculumOptionsDropdown.style.display = 'none';
        } else {
          curriculumDropdown.style.display = 'block';
          curriculumOptionsDropdown.style.display = 'none';
        }
      };

      // First dropdown: course selection
      curriculumDropdown.querySelectorAll('.curriculum-dropdown-item').forEach(btn => {
        btn.onclick = function(e) {
          e.stopPropagation();
          selectedCourse = btn.getAttribute('data-course');
          // Position the options dropdown next to the clicked course
          const rect = btn.getBoundingClientRect();
          const dropdownRect = curriculumDropdown.getBoundingClientRect();
          // Default: show to the right
          curriculumOptionsDropdown.classList.remove('dropdown-left');
          curriculumOptionsDropdown.style.left = btn.offsetLeft + btn.offsetWidth + 'px';
          curriculumOptionsDropdown.style.right = 'auto';
          curriculumOptionsDropdown.style.top = btn.offsetTop + 'px';
          curriculumOptionsDropdown.style.display = 'block';
          // Check if it would go out of the viewport
          setTimeout(() => {
            const optionsRect = curriculumOptionsDropdown.getBoundingClientRect();
            if (optionsRect.right > window.innerWidth) {
              // Show to the left
              curriculumOptionsDropdown.classList.add('dropdown-left');
              curriculumOptionsDropdown.style.left = 'auto';
              curriculumOptionsDropdown.style.right = (dropdownRect.width + 4) + 'px';
            } else {
              curriculumOptionsDropdown.classList.remove('dropdown-left');
            }
          }, 0);
          // Hide other dropdowns
          curriculumDropdown.style.display = 'block';
        };
      });

      // Second dropdown: option selection (roadmap/curriculum)
      curriculumOptionsDropdown.querySelectorAll('.curriculum-option-item').forEach(btn => {
        btn.onclick = function(e) {
          e.stopPropagation();
          curriculumDropdown.style.display = 'none';
          curriculumOptionsDropdown.style.display = 'none';
          // Show PDF modal as before
          let pdfPath = '';
          let title = '';
          const btnText = btn.getAttribute('data-option');
          if (selectedCourse === 'B. Tech. CSE') {
            if (btnText === 'Curriculum') {
              pdfPath = 'roadmaps_and_curriculum/B.Tech CSE Curriculum.pdf';
              title = 'B. Tech. CSE Curriculum';
            } else if (btnText === 'Roadmap') {
              pdfPath = 'roadmaps_and_curriculum/B.Tech CSE  Roadmap.pdf';
              title = 'B. Tech. CSE Roadmap';
            }
          } else if (selectedCourse === 'Int. M tech CSE') {
            if (btnText === 'Curriculum') {
              pdfPath = 'roadmaps_and_curriculum/M tech-Curriculum-AY2023-24 onwards -Revised_1.1.pdf';
              title = 'Int. M tech CSE Curriculum';
            } else if (btnText === 'Roadmap') {
              pdfPath = 'roadmaps_and_curriculum/M.Tech (CSE) - Semester wise Roadmap.pdf';
              title = 'Int. M tech CSE Roadmap';
            }
          }
          if (pdfPath) {
            showPDFModal(title, pdfPath);
          }
        };
      });

      // Hide dropdowns when clicking outside
      document.addEventListener('click', function(e) {
        if (curriculumDropdown.style.display === 'block' && !curriculumDropdown.contains(e.target) && e.target !== curriculumBtn) {
          curriculumDropdown.style.display = 'none';
          curriculumOptionsDropdown.style.display = 'none';
        }
        if (curriculumOptionsDropdown.style.display === 'block' && !curriculumOptionsDropdown.contains(e.target) && !curriculumDropdown.contains(e.target)) {
          curriculumOptionsDropdown.style.display = 'none';
        }
      });
    }

    // --- PDF Modal Logic ---
    let pdfModal = document.getElementById('pdf-viewer-modal');
    if (!pdfModal) {
        pdfModal = document.createElement('div');
        pdfModal.id = 'pdf-viewer-modal';
        pdfModal.className = 'sticky-notes-list-modal';
        pdfModal.style.display = 'none';
        pdfModal.style.zIndex = '2000';
        pdfModal.innerHTML = `
            <div class="sticky-notes-list-modal-content" style="max-width: 90vw; max-height: 90vh; width: 800px;">
                <span class="sticky-notes-list-modal-close" id="pdf-modal-close">&times;</span>
                <h3 id="pdf-modal-title" style="margin-bottom: 18px;">PDF Viewer</h3>
                <div id="pdf-embed-container" style="width:100%;height:70vh;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border-radius:8px;overflow:hidden;">
                </div>
            </div>
        `;
        document.body.appendChild(pdfModal);
    }
    function showPDFModal(title, pdfPath) {
        document.getElementById('pdf-modal-title').textContent = title;
        const embedContainer = document.getElementById('pdf-embed-container');
        embedContainer.innerHTML = `<embed src="${pdfPath}" type="application/pdf" width="100%" height="100%" style="min-height:400px; border-radius:8px; background:#fff;" onerror=\"this.style.display='none';document.getElementById('pdf-embed-container').innerHTML='<div style=\\'color:red;padding:24px;text-align:center;font-size:1.1rem;\\'>PDF could not be loaded. Please check the file path or try again later.</div>'\" />`;
        pdfModal.style.display = 'block';
    }
    function hidePDFModal() {
        pdfModal.style.display = 'none';
        document.getElementById('pdf-embed-container').innerHTML = '';
    }
    pdfModal.querySelector('#pdf-modal-close').onclick = hidePDFModal;
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && pdfModal.style.display === 'block') {
            hidePDFModal();
        }
    });
    document.addEventListener('click', function(e) {
        if (pdfModal && pdfModal.style.display === 'block' && !pdfModal.contains(e.target)) {
            hidePDFModal();
        }
    });
}); 