// ----------------------------------------------------
// FIREBASE AUTHENTICATION LOGIC
// ----------------------------------------------------
let currentUser = null;

function initFirebaseAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    if (!window.firebaseAuth || !loginBtn) return;

    const { auth, provider, signInWithPopup, signOut, onAuthStateChanged } = window.firebaseAuth;

    // Auth State Observer
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            loginBtn.style.display = 'none';
            userProfile.style.display = 'flex';
            userName.innerText = user.displayName ? user.displayName.split(' ')[0] : 'Creator';
            userAvatar.src = user.photoURL || '';
            currentUser = user;
            if (typeof syncStudioPromptsWithCloud === 'function') syncStudioPromptsWithCloud();
        } else {
            loginBtn.style.display = 'flex';
            userProfile.style.display = 'none';
            currentUser = null;
            if (typeof loadLocalStudioPrompts === 'function') loadLocalStudioPrompts();
        }
    });

    // Login handler
    loginBtn.addEventListener('click', async () => {
        try {
            loginBtn.innerHTML = '<div class="loader" style="width:16px;height:16px;border-width:2px;display:inline-block;"></div>';
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed: ' + (error.message || 'Unknown error'));
            loginBtn.innerHTML = 'Login';
        }
    });

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth).catch(console.error);
        });
    }
}

// Listen for Firebase to be ready (it loads as an ES module, AFTER regular scripts)
window.addEventListener('firebase-ready', initFirebaseAuth);
// Fallback: if firebase-ready already fired before this listener was added
if (window.firebaseAuth) initFirebaseAuth();

const apiKey = 'AIzaSyCMTIhHDAJW6fWiqngicaJfv-frBMOKoGY';
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

// Helper function for API calls
async function fetchGemini(promptText) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { response_mime_type: "application/json" }
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const text = data.candidates[0].content.parts[0].text;
    try {
        return JSON.parse(text);
    } catch(err) {
        const cleanStr = text.replace(/```[A-Za-z0-9]*\n?/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanStr);
    }
}

// 1. BIO GENERATOR
const bioForm = document.getElementById('bioForm');
if (bioForm) {
    bioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const niche = document.getElementById('niche').value.trim();
        const hobbies = document.getElementById('hobbies').value.trim();
        const btn = document.getElementById('generateBtn');
        const loader = document.getElementById('loader');
        const btnText = document.querySelector('.btn-text');
        const resultsContainer = document.getElementById('results');
        
        btn.disabled = true; loader.style.display = 'block'; btnText.style.display = 'none';
        resultsContainer.classList.add('hidden'); resultsContainer.classList.remove('fade-in');
        
        const promptText = `You are a world-class social media manager helping Indian creators. Generate 3 premium bios for "${name}". Niche: "${niche}". Hobbies: "${hobbies}".
IMPORTANT: The user may be Indian. Blend modern aesthetics, use a tiny bit of Hinglish/Indian cool factor to make it engaging, but keep it highly professional.
Return exact JSON: {"instagram": "...", "twitter": "...", "youtube": "..."}`;

        try {
            const bios = await fetchGemini(promptText);
            document.getElementById('insta-bio').innerText = bios.instagram || 'Unable to generate.';
            document.getElementById('twitter-bio').innerText = bios.twitter || 'Unable to generate.';
            document.getElementById('youtube-bio').innerText = bios.youtube || 'Unable to generate.';
            
            resultsContainer.classList.remove('hidden'); resultsContainer.classList.add('fade-in');
            setTimeout(() => resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (error) {
            console.error(error); alert('Oops! Something went wrong. Check your API key or try again.');
        } finally {
            btn.disabled = false; loader.style.display = 'none'; btnText.style.display = 'block';
        }
    });
}

// 2. TITLE GENERATOR
const titleForm = document.getElementById('titleForm');
if (titleForm) {
    titleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = document.getElementById('titleTopic').value.trim();
        const type = document.getElementById('titleType').value.trim();
        const tone = document.getElementById('titleTone').value.trim();
        const btn = document.getElementById('generateTitleBtn');
        const loader = document.getElementById('titleLoader');
        const btnText = document.querySelector('#generateTitleBtn .btn-text');
        const resultsContainer = document.getElementById('titleResults');
        
        btn.disabled = true; loader.style.display = 'block'; btnText.style.display = 'none';
        resultsContainer.classList.add('hidden'); resultsContainer.classList.remove('fade-in');
        
        const promptText = `Generate 5 highly clickable and viral titles for a ${type} about "${topic}". The requested tone is: "${tone}". 
Return exact JSON array wrapped in an object: {"titles": ["title 1", "title 2", "title 3", "title 4", "title 5"]}`;

        try {
            const res = await fetchGemini(promptText);
            const listText = res.titles.map((t, i) => `${i + 1}. ${t}`).join('\n\n');
            document.getElementById('generated-titles').innerText = listText || 'Unable to generate.';
            
            resultsContainer.classList.remove('hidden'); resultsContainer.classList.add('fade-in');
            setTimeout(() => resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (error) {
            console.error(error); alert('Oops! Something went wrong. Check your API key or try again.');
        } finally {
            btn.disabled = false; loader.style.display = 'none'; btnText.style.display = 'block';
        }
    });
}

// 3. HASHTAG STRATEGY
const hashtagForm = document.getElementById('hashtagForm');
if (hashtagForm) {
    hashtagForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const niche = document.getElementById('hashNiche').value.trim();
        const platform = document.getElementById('hashPlatform').value.trim();
        const btn = document.getElementById('generateHashBtn');
        const loader = document.getElementById('hashLoader');
        const btnText = document.querySelector('#generateHashBtn .btn-text');
        const resultsContainer = document.getElementById('hashResults');
        
        btn.disabled = true; loader.style.display = 'block'; btnText.style.display = 'none';
        resultsContainer.classList.add('hidden'); resultsContainer.classList.remove('fade-in');
        
        const promptText = `Act as an expert social media growth strategist. Provide the best performing hashtags for a creator in the "${niche}" niche posting on "${platform}".
Provide 2 sets of hashtags separated exactly in this JSON format:
{"broad": "#trending #viral (20 broad tags)", "niche": "#specific #tags (15 niche tags)"}
Space separated strings for each.`;

        try {
            const res = await fetchGemini(promptText);
            document.getElementById('broad-tags').innerText = res.broad || 'Unable to generate.';
            document.getElementById('niche-tags').innerText = res.niche || 'Unable to generate.';
            
            resultsContainer.classList.remove('hidden'); resultsContainer.classList.add('fade-in');
            setTimeout(() => resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (error) {
            console.error(error); alert('Oops! Something went wrong. Check your API key or try again.');
        } finally {
            btn.disabled = false; loader.style.display = 'none'; btnText.style.display = 'block';
        }
    });
}

// 4. SCRIPT WRITER
const scriptWriterForm = document.getElementById('scriptWriterForm');
if (scriptWriterForm) {
    scriptWriterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = document.getElementById('scriptTopic').value.trim();
        const type = document.getElementById('scriptType').value.trim();
        const tone = document.getElementById('scriptTone').value.trim();
        const btn = document.getElementById('generateScriptBtn');
        const loader = document.getElementById('scriptLoader');
        const btnText = document.querySelector('#generateScriptBtn .btn-text');
        const resultsContainer = document.getElementById('scriptResults');
        
        btn.disabled = true; loader.style.display = 'block'; btnText.style.display = 'none';
        resultsContainer.classList.add('hidden'); resultsContainer.classList.remove('fade-in');
        
        const promptText = `Act as an expert content creator. Write a short, highly engaging ${type} script or caption about "${topic}". The requested tone is: "${tone}". 
Include visual/audio cues if it's a video. Ensure the hook in the first 3 seconds is extremely strong.
Return exact JSON format: {"script": "Your full text string here. Use \\n for line breaks."}`;

        try {
            const res = await fetchGemini(promptText);
            document.getElementById('generated-script').innerText = res.script || 'Unable to generate.';
            
            resultsContainer.classList.remove('hidden'); resultsContainer.classList.add('fade-in');
            setTimeout(() => resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (error) {
            console.error(error); alert('Oops! Something went wrong. Check your API key or try again.');
        } finally {
            btn.disabled = false; loader.style.display = 'none'; btnText.style.display = 'block';
        }
    });
}

// Global Copy functionality
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;
        
        const textToCopy = targetElement.innerText;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('copied');
            }, 2000);
        });
    });
});

// ----------------------------------------------------
// 5. SMART PROMPT STUDIO LOGIC
// ----------------------------------------------------
const studioForm = document.getElementById('studioSearchForm');
if (studioForm) {
    // State management for saved prompts
    let savedPrompts = [];
    
    // Cloud setup
    const { db, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } = window.firebaseDb || {};

    const renderSavedPrompts = () => {
        const container = document.getElementById('savedPromptsContainer');
        if (!container) return;
        
        if (savedPrompts.length === 0) {
            container.innerHTML = '<p style="font-size: 1.1rem; color: var(--text-muted);">No saved prompts yet. Click `Save` on a prompt you like!</p>';
            return;
        }

        container.innerHTML = savedPrompts.map((prompt, index) => `
            <div class="prompt-card" style="padding: 1rem; margin-bottom: 1rem; border-width: 2px;">
                <p class="prompt-text" style="font-size: 1.1rem; margin-bottom: 0.5rem; line-height: 1.4; max-height: 4.2em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;" id="saved-${index}">${prompt}</p>
                <div class="prompt-actions" style="gap: 0.5rem; justify-content: space-between;">
                    <div>
                        <button class="action-btn copy studio-action" data-type="copy" data-target="saved-${index}" style="padding: 0.2rem 0.8rem; font-size: 0.9rem;">Copy</button>
                    </div>
                    <button class="action-btn save studio-action" data-type="unsave" data-index="${index}" data-text="${encodeURIComponent(prompt)}" style="padding: 0.2rem 0.8rem; font-size: 0.9rem; border-color: var(--primary); background: #ffeaa7;">Remove</button>
                </div>
            </div>
        `).join('');
    };

    // Load from local storage initially (Fallback)
    window.loadLocalStudioPrompts = () => {
        savedPrompts = JSON.parse(localStorage.getItem('ai_hub_saved_prompts') || '[]');
        renderSavedPrompts();
    };

    // Called automatically by Auth Observer when user logs in
    window.syncStudioPromptsWithCloud = async () => {
        if (!currentUser || !db) return;
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                savedPrompts = cloudData.savedPrompts || [];
                
                // Merge local storage if any exist
                const local = JSON.parse(localStorage.getItem('ai_hub_saved_prompts') || '[]');
                if (local.length > 0) {
                    const newPrompts = local.filter(p => !savedPrompts.includes(p));
                    if (newPrompts.length > 0) {
                       await updateDoc(userRef, { savedPrompts: [...savedPrompts, ...newPrompts] });
                       savedPrompts = [...savedPrompts, ...newPrompts];
                    }
                    localStorage.removeItem('ai_hub_saved_prompts'); // Clear local after push
                }
            } else {
                // First time login, create document and push local items if any
                const local = JSON.parse(localStorage.getItem('ai_hub_saved_prompts') || '[]');
                await setDoc(userRef, { savedPrompts: local });
                savedPrompts = local;
                localStorage.removeItem('ai_hub_saved_prompts');
            }
            renderSavedPrompts();
        } catch (error) {
            console.error("Cloud sync failed:", error);
            loadLocalStudioPrompts(); // Fallback
        }
    };

    // Initial load
    if (!currentUser) loadLocalStudioPrompts();


    // Generate HTML for a prompt card ... [unchanged] ...
    const createPromptCardHTML = (id, title, promptText) => `
        <div class="prompt-card fade-in">
            <h3 style="color: var(--primary); margin-bottom: 5px;">${title}</h3>
            <p class="prompt-text" id="prompt-txt-${id}">${promptText}</p>
            <div class="prompt-actions">
                <button class="action-btn copy studio-action" data-type="copy" data-target="prompt-txt-${id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copy Prompt
                </button>
                <button class="action-btn save studio-action" data-type="save" data-target="prompt-txt-${id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    Save to Favorites
                </button>
                <button class="action-btn remix studio-action" data-type="remix" data-query="${title}" data-parent="prompt-txt-${id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
                    Remix (Variations)
                </button>
            </div>
            <div id="remix-results-${id}" style="margin-top: 1.5rem; display: none;"></div>
        </div>
    `;

    // Handle Generation ... [unchanged] ...
    studioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('studioPromptInput').value.trim();
        const btn = document.getElementById('studioGenerateBtn');
        const loader = document.getElementById('studioLoader');
        const btnText = document.querySelector('#studioGenerateBtn .btn-text');
        const container = document.getElementById('generatedPromptContainer');

        btn.disabled = true; loader.style.display = 'block'; btnText.style.display = 'none';
        container.innerHTML = '<p style="font-size:1.2rem; color:var(--text-muted);">Generating master prompt...</p>';

        const aiPrompt = `Act as an expert Prompt Engineer. The user wants inspiration for the following idea: "${input}". 
        Write ONE highly detailed, optimized, professional prompt that they can copy-paste into an AI generation tool (Midjourney, ChatGPT, Runway, etc.) to get the exact result. 
        It MUST be highly structured with subject, lighting, style, rendering details, format/camera, etc. Make it powerful!
        Return exact JSON format: {"title": "Short descriptive title", "prompt": "The detailed string..."}`;

        try {
            const res = await fetchGemini(aiPrompt);
            const uuid = Date.now();
            container.innerHTML = createPromptCardHTML(uuid, res.title || input, res.prompt);
        } catch (error) {
            console.error(error); 
            container.innerHTML = `<p style="color:var(--primary);">Oops! Something went wrong. Check API Key.</p>`;
        } finally {
            btn.disabled = false; loader.style.display = 'none'; btnText.style.display = 'block';
        }
    });

    // Handle Event Delegation
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.studio-action');
        if (!btn) return;

        const type = btn.dataset.type;

        if (type === 'copy') {
            const el = document.getElementById(btn.dataset.target);
            if (el) {
                navigator.clipboard.writeText(el.innerText).then(() => {
                    const svg = btn.innerHTML;
                    btn.innerHTML = '✨ Copied!';
                    setTimeout(() => btn.innerHTML = svg, 1500);
                });
            }
        } 
        else if (type === 'save') {
            const el = document.getElementById(btn.dataset.target);
            if (el) {
                const text = el.innerText;
                if (!savedPrompts.includes(text)) {
                    savedPrompts.push(text);
                    renderSavedPrompts();
                    
                    if (currentUser && db) {
                        try {
                            const userRef = doc(db, 'users', currentUser.uid);
                            await updateDoc(userRef, { savedPrompts: arrayUnion(text) }).catch(async (e) => {
                                if (e.code === 'not-found') await setDoc(userRef, { savedPrompts: [text] });
                            });
                        } catch(err) { console.error("Cloud save err:", err); }
                    } else {
                         localStorage.setItem('ai_hub_saved_prompts', JSON.stringify(savedPrompts));
                    }
                    
                    const svg = btn.innerHTML;
                    btn.innerHTML = '✅ Saved';
                    btn.classList.add('saved');
                    setTimeout(() => { btn.innerHTML = svg; btn.classList.remove('saved'); }, 2000);
                }
            }
        }
        else if (type === 'unsave') {
            const textToRemove = decodeURIComponent(btn.dataset.text);
            savedPrompts = savedPrompts.filter(p => p !== textToRemove);
            renderSavedPrompts();

            if (currentUser && db) {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userRef, { savedPrompts: arrayRemove(textToRemove) });
                } catch(err) { console.error("Cloud unsave err:", err); }
            } else {
                localStorage.setItem('ai_hub_saved_prompts', JSON.stringify(savedPrompts));
            }
        }
        else if (type === 'remix') {
             // ... [unchanged] ...
            const id = btn.dataset.parent.replace('prompt-txt-', '');
            const resContainer = document.getElementById(`remix-results-${id}`);
            const query = btn.dataset.query;
            const originalPrompt = document.getElementById(btn.dataset.parent).innerText;

            btn.disabled = true;
            btn.innerHTML = '<div class="loader" style="display:inline-block; border-color:var(--text-main); border-top-color:transparent; width:16px; height:16px; border-width:2px; margin-right:5px;"></div> Remixing...';
            resContainer.style.display = 'block';
            resContainer.innerHTML = '<p style="color:var(--text-muted); font-size:1rem;">Generating 2 unique variations...</p>';

            const aiPrompt = `Act as an expert Prompt Engineer. Take the following original prompt: "${originalPrompt}". 
            Generate TWO completely unique but excellent variations of it based on the core concept: "${query}". Change the style, medium, tone, or camera completely. Keep them highly professional.
            Return exact JSON array wrapped in an object: {"variations": ["Variation 1 text...", "Variation 2 text..."]}`;

            try {
                const res = await fetchGemini(aiPrompt);
                let html = '<h4 style="margin-bottom: 10px; color: var(--text-main);">Remixed Variations:</h4>';
                
                res.variations.forEach((v, i) => {
                    const u = Date.now() + i;
                    html += `
                        <div style="background: rgba(0,0,0,0.03); border: 2px dashed var(--border-color); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                            <p id="remix-txt-${u}" style="font-size: 1.1rem; line-height: 1.5; margin-bottom: 0.8rem;">${v}</p>
                            <div style="display:flex; gap:10px;">
                                <button class="action-btn copy studio-action" data-type="copy" data-target="remix-txt-${u}" style="font-size:0.9rem; padding: 0.2rem 0.8rem;">Copy</button>
                                <button class="action-btn save studio-action" data-type="save" data-target="remix-txt-${u}" style="font-size:0.9rem; padding: 0.2rem 0.8rem;">Save</button>
                            </div>
                        </div>
                    `;
                });
                resContainer.innerHTML = html;
            } catch (err) {
                console.error(err);
                resContainer.innerHTML = '<p style="color:red;">Failed to remix. Try again.</p>';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg> Remix (Variations)';
            }
        }
    });

    // Handle trending Pills clicks
    document.querySelectorAll('.trending-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const input = document.getElementById('studioPromptInput');
            input.value = pill.innerText;
            // trigger submit
            document.getElementById('studioGenerateBtn').click();
        });
    });
}
