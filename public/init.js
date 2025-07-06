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

        // Utility: Create note element
        function createNoteElement(note) {
            const el = document.createElement('div');
            el.className = 'sticky-note';
            el.style.left = (note.x || 100) + 'px';
            el.style.top = (note.y || 100) + 'px';
            el.style.background = note.color || '#fff9c4';
            el.setAttribute('data-id', note.id);

            // Textarea for content
            const textarea = document.createElement('textarea');
            textarea.value = note.content;
            textarea.placeholder = 'Write a note...';
            textarea.addEventListener('change', async (e) => {
                console.log('[StickyNotes] Updating note content', note.id, textarea.value);
                await updateNote(note.id, { content: textarea.value });
            });
            el.appendChild(textarea);

            // Actions (delete)
            const actions = document.createElement('div');
            actions.className = 'note-actions';
            const delBtn = document.createElement('button');
            delBtn.className = 'note-action-btn';
            delBtn.title = 'Delete';
            delBtn.innerHTML = '🗑️';
            delBtn.onclick = async () => {
                console.log('[StickyNotes] Deleting note', note.id);
                await deleteNote(note.id);
            };
            actions.appendChild(delBtn);
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
        if (addNoteBtn) {
            addNoteBtn.onclick = function() {
                console.log('[StickyNotes] Add note button clicked');
                createNote();
            };
        } else {
            console.warn('[StickyNotes] Add note button not found');
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
    })();
}); 