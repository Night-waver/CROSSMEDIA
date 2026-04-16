const SUPABASE_URL      = 'https://hkveihgxtfpznqfgyllj.supabase.co';       
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmVpaGd4dGZwem5xZmd5bGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzQzNTYsImV4cCI6MjA5MDgxMDM1Nn0.9ZVzz9XQNQv2tslPX65PykI4C475FWvAWKd8GY2AEKE';  

const SB = {
    async req(path, options = {}) {
        const token = await _getValidToken();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); 
        let res;
        try {
            res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': options.prefer || 'return=representation',
                    ...(options.headers || {})
                }
            });
        } catch(e) {
            clearTimeout(timeout);
            if (e.name === 'AbortError') throw new Error('Request timed out. Check your Supabase URL and internet connection.');
            throw new Error('Network error: ' + e.message);
        }
        clearTimeout(timeout);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.hint || `HTTP ${res.status} — check your Supabase URL and anon key`);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    },
    get:    (t, q = '')  => SB.req(`${t}?${q}`),
    post:   (t, b)       => SB.req(t, { method: 'POST', body: JSON.stringify(b) }),
    patch:  (t, q, b)    => SB.req(`${t}?${q}`, { method: 'PATCH', body: JSON.stringify(b), prefer: 'return=representation' }),
    del:    (t, q)       => SB.req(`${t}?${q}`, { method: 'DELETE', prefer: 'return=minimal' }),

    async authReq(path, body) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            clearTimeout(timeout);
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || data.error_description || data.error || 'Auth error');
            return data;
        } catch(e) {
            clearTimeout(timeout);
            if (e.name === 'AbortError') throw new Error('Auth request timed out — check your SUPABASE_URL in db.js');
            throw e;
        }
    }
};

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `<div style="font-family:monospace;padding:40px;background:#0f0f0f;color:#ff2d6b;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px">
            <div style="font-size:2rem">⚠️</div>
            <div style="font-size:1.2rem;font-weight:bold">Supabase not configured</div>
            <div style="color:#888;font-size:0.9rem">Open db.js and replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your real values.</div>
        </div>`;
    });
}

const TMDB_API_KEY = 'fd9c958f47dc8b72d28eca888354e9ad';
const RAWG_API_KEY = 'c8728ddc04e64902a8c59d24c9e45099';

(function _migrateSession() {
    try {
        const old = sessionStorage.getItem('cm_session');
        if (old && !localStorage.getItem('cm_session')) {
            localStorage.setItem('cm_session', old);
        }
        sessionStorage.removeItem('cm_session');
    } catch(e) {}
})();

function authGetSession() {
    const raw = localStorage.getItem('cm_session');
    return raw ? JSON.parse(raw) : null;
}
function _saveSession(data) {
    localStorage.setItem('cm_session', JSON.stringify(data));
}
function authLogout() {
    const s = authGetSession();
    localStorage.removeItem('cm_session');
    if (s?.access_token) {
        fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${s.access_token}` }
        }).catch(() => {});
    }
}

let _refreshPromise = null;

async function _refreshSession() {
    if (_refreshPromise) return _refreshPromise;
    _refreshPromise = (async () => {
        try {
            const s = authGetSession();
            if (!s?.refresh_token) return null;
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method:  'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
                body:    JSON.stringify({ refresh_token: s.refresh_token })
            });
            const data = await res.json();
            if (!res.ok || !data.access_token) {
                
                localStorage.removeItem('cm_session');
                return null;
            }
            const updated = {
                ...s,
                access_token:  data.access_token,
                refresh_token: data.refresh_token || s.refresh_token,
                expires_at:    Date.now() + (data.expires_in ?? 3600) * 1000
            };
            _saveSession(updated);
            return updated;
        } catch(e) {
            return null;
        } finally {
            _refreshPromise = null;
        }
    })();
    return _refreshPromise;
}

async function _getValidToken() {
    const s = authGetSession();
    if (!s) return SUPABASE_ANON_KEY;
    if (Date.now() > (s.expires_at ?? 0) - 60_000) {
        const fresh = await _refreshSession();
        return fresh ? fresh.access_token : SUPABASE_ANON_KEY;
    }
    return s.access_token;
}
function authIsAdmin() {
    return authGetSession()?.is_admin === true;
}
function authGetCurrentUser() {
    const s = authGetSession();
    if (!s) return null;
    return {
        bio:         s.bio || '',
        avatarColor: s.avatar_color || '#888',
        avatarUrl:   s.avatar_url || null,
        joinedAt:    s.joined_at || new Date().toISOString()
    };
}

async function authRegister(username, password, bio = '') {
    if (!username || !password) return { ok: false, error: 'Username and password required.' };
    if (password.length < 6)    return { ok: false, error: 'Password must be at least 6 characters.' };

    
    try {
        const existing = await SB.get('profiles', `username=eq.${encodeURIComponent(username)}&select=id`);
        if (existing && existing.length > 0) return { ok: false, error: 'Username already taken.' };
    } catch(e) {}

    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g,'')}@crossmedia.local`;
    try {
        const data = await SB.authReq('signup', { email, password });
        const userId = data.user?.id;
        if (!userId) return { ok: false, error: 'Registration failed. Please try again.' };

        const colors = ['#ff3131','#39ff14','#00ffff','#ff8c00','#bf5fff','#ff69b4','#ffd700'];
        const avatarColor = colors[Math.floor(Math.random() * colors.length)];
        const now = new Date().toISOString();

        
        _saveSession({
            user_id:       userId,
            username,
            access_token:  data.access_token,
            refresh_token: data.refresh_token || null,
            expires_at:    Date.now() + (data.expires_in ?? 3600) * 1000,
            is_admin:      false,
            avatar_color:  avatarColor,
            avatar_url:    null,
            bio:           bio || '',
            joined_at:     now
        });

        
        try {
            await SB.post('profiles', { id: userId, username, bio: bio || '', avatar_color: avatarColor, is_admin: false });
        } catch(profileErr) {
            console.warn('Profile insert note:', profileErr.message);
        }

        return { ok: true };
    } catch(e) {
        return { ok: false, error: e.message || 'Registration failed.' };
    }
}

async function authLogin(username, password) {
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g,'')}@crossmedia.local`;
    try {
        const data = await SB.authReq('token?grant_type=password', { email, password });
        const userId = data.user?.id;

        const profiles = await SB.get('profiles', `id=eq.${userId}&select=*`);
        const profile  = profiles?.[0];

        _saveSession({
            user_id:       userId,
            username:      profile?.username || username,
            access_token:  data.access_token,
            refresh_token: data.refresh_token || null,
            expires_at:    Date.now() + (data.expires_in ?? 3600) * 1000,
            is_admin:      profile?.is_admin  || false,
            avatar_color:  profile?.avatar_color || '#888',
            avatar_url:    profile?.avatar_url || null,
            bio:           profile?.bio || '',
            joined_at:     profile?.created_at || new Date().toISOString()
        });
        return { ok: true, role: profile?.is_admin ? 'admin' : 'user' };
    } catch(e) {
        return { ok: false, error: 'Invalid username or password.' };
    }
}

async function userUpdateProfile(bio) {
    const s = authGetSession();
    if (!s) return;
    await SB.patch('profiles', `id=eq.${s.user_id}`, { bio });
    s.bio = bio;
    _saveSession(s);
}

async function getUserProfile() {
    const s = authGetSession();
    if (!s) return null;
    const rows = await SB.get('profiles', `id=eq.${s.user_id}&select=*`);
    const p = rows?.[0];
    if (p) { s.bio = p.bio; s.avatar_color = p.avatar_color; s.avatar_url = p.avatar_url || null; s.joined_at = p.created_at; _saveSession(s); }
    return p;
}

async function userUpdateAvatar(url) {
    const s = authGetSession();
    if (!s) return;
    await SB.patch('profiles', `id=eq.${s.user_id}`, { avatar_url: url });
    s.avatar_url = url;
    _saveSession(s);
}

async function userUploadAvatar(file) {
    const s = authGetSession();
    if (!s) throw new Error('Not logged in');
    const token = await _getValidToken();
    const ext   = file.name.split('.').pop().toLowerCase();
    const path  = `${s.user_id}/avatar.${ext}`;
    
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: 'POST',
        headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type':  file.type,
            'x-upsert':      'true',
        },
        body: file
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Upload failed (${res.status})`);
    }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
    await userUpdateAvatar(publicUrl);
    return publicUrl;
}

async function userToggleFavorite(mediaId) {
    const s = authGetSession();
    if (!s || s.is_admin) return false;
    const existing = await SB.get('favorites', `user_id=eq.${s.user_id}&media_id=eq.${mediaId}&select=id`);
    if (existing && existing.length > 0) {
        await SB.del('favorites', `user_id=eq.${s.user_id}&media_id=eq.${mediaId}`);
        return false;
    } else {
        await SB.post('favorites', { user_id: s.user_id, media_id: mediaId });
        return true;
    }
}

async function userIsFavorite(mediaId) {
    const s = authGetSession();
    if (!s || s.is_admin) return false;
    const rows = await SB.get('favorites', `user_id=eq.${s.user_id}&media_id=eq.${mediaId}&select=id`);
    return rows && rows.length > 0;
}

async function getUserFavorites() {
    const s = authGetSession();
    if (!s) return [];
    const rows = await SB.get('favorites', `user_id=eq.${s.user_id}&select=media_id`);
    return rows ? rows.map(r => r.media_id) : [];
}

async function userSetRating(mediaId, stars) {
    const s = authGetSession();
    if (!s || s.is_admin) return;
    const existing = await SB.get('ratings', `user_id=eq.${s.user_id}&media_id=eq.${mediaId}&select=id`);
    if (existing && existing.length > 0) {
        await SB.patch('ratings', `user_id=eq.${s.user_id}&media_id=eq.${mediaId}`, { stars });
    } else {
        await SB.post('ratings', { user_id: s.user_id, media_id: mediaId, stars });
    }
}

async function userGetRating(mediaId) {
    const s = authGetSession();
    if (!s || s.is_admin) return 0;
    const rows = await SB.get('ratings', `user_id=eq.${s.user_id}&media_id=eq.${mediaId}&select=stars`);
    return rows?.[0]?.stars || 0;
}

async function getUserRatings() {
    const s = authGetSession();
    if (!s) return {};
    const rows = await SB.get('ratings', `user_id=eq.${s.user_id}&select=media_id,stars`);
    const map = {};
    if (rows) rows.forEach(r => { map[r.media_id] = r.stars; });
    return map;
}

async function dbGetAll() {
    try {
        const rows = await SB.get('media', 'select=*&order=id.asc');
        return rows || [];
    } catch(e) {
        console.error('dbGetAll failed:', e.message);
        throw e;
    }
}
async function dbGetById(id)   { const rows = await SB.get('media', `id=eq.${id}&select=*`); return rows?.[0] || null; }
async function dbAdd(item)     { const rows = await SB.post('media', item); return rows?.[0] || null; }
async function dbUpdate(id, u) { const rows = await SB.patch('media', `id=eq.${id}`, u); return rows?.[0] || null; }
async function dbDelete(id)    { await SB.del('media', `id=eq.${id}`); }

async function getReviews(mediaId) {
    
    return await SB.get('comments', `media_id=eq.${mediaId}&parent_id=is.null&select=*&order=created_at.desc`) || [];
}

async function getAllReviews(limit = 40) {
    return await SB.get('comments', `parent_id=is.null&select=*&order=created_at.desc&limit=${limit}`) || [];
}

async function getUserReviews(userId) {
    return await SB.get('comments', `user_id=eq.${userId}&parent_id=is.null&select=*&order=created_at.desc`) || [];
}

async function getReplies(parentId) {
    return await SB.get('comments', `parent_id=eq.${parentId}&select=*&order=created_at.asc`) || [];
}

async function addReview(mediaId, text, parentId = null) {
    const s = authGetSession();
    if (!s) return null;
    const payload = {
        media_id: mediaId,
        user_id:  s.user_id,
        username: s.username,
        is_admin: s.is_admin || false,
        text,
    };
    
    if (parentId !== null) payload.parent_id = parentId;
    const rows = await SB.post('comments', payload);
    return rows?.[0] || null;
}

async function deleteReview(commentId) {
    const s = authGetSession();
    if (!s) return;
    
    await SB.del('comments', `parent_id=eq.${commentId}`);
    if (s.is_admin) {
        await SB.del('comments', `id=eq.${commentId}`);
    } else {
        await SB.del('comments', `id=eq.${commentId}&user_id=eq.${s.user_id}`);
    }
}

async function likeReview(commentId) {
    
    const s = authGetSession();
    if (!s) return { liked: false, count: 0 };
    try {
        
        const existing = await SB.get('review_likes', `comment_id=eq.${commentId}&user_id=eq.${s.user_id}&select=id`);
        if (existing && existing.length > 0) {
            
            await SB.del('review_likes', `comment_id=eq.${commentId}&user_id=eq.${s.user_id}`);
            await SB.patch('comments', `id=eq.${commentId}`, { likes: -1 }); 
            return { liked: false };
        } else {
            
            await SB.post('review_likes', { comment_id: commentId, user_id: s.user_id });
            return { liked: true };
        }
    } catch(e) {
        console.warn('Like error:', e.message);
        return { liked: false };
    }
}

async function getReviewLikes(commentIds) {
    
    const s = authGetSession();
    if (!s || !commentIds.length) return new Set();
    try {
        const ids = commentIds.join(',');
        const rows = await SB.get('review_likes', `user_id=eq.${s.user_id}&comment_id=in.(${ids})&select=comment_id`) || [];
        return new Set(rows.map(r => r.comment_id));
    } catch(e) { return new Set(); }
}

async function getLikeCounts(commentIds) {
    if (!commentIds.length) return {};
    try {
        const ids = commentIds.join(',');
        const rows = await SB.get('review_likes', `comment_id=in.(${ids})&select=comment_id`) || [];
        const counts = {};
        rows.forEach(r => { counts[r.comment_id] = (counts[r.comment_id] || 0) + 1; });
        return counts;
    } catch(e) { return {}; }
}

async function getAvatarUrls(usernames) {
    
    if (!usernames || usernames.length === 0) return {};
    try {
        const unique = [...new Set(usernames)];
        const rows = await SB.get('profiles', `username=in.(${unique.map(u => `"${u}"`).join(',')})&select=username,avatar_url`);
        const map = {};
        if (rows) rows.forEach(r => { if (r.avatar_url) map[r.username] = r.avatar_url; });
        return map;
    } catch(e) { return {}; }
}
async function fetchMoviePoster(title, year = '') {
    if (TMDB_API_KEY) {
        try {
            const res  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`);
            const data = await res.json();
            const path = data.results?.[0]?.poster_path;
            if (path) return `https://image.tmdb.org/t/p/w500${path}`;
        } catch(e) {}
    }
    return `https://placehold.co/300x450/1a0a0a/ff3131?text=${encodeURIComponent(title.slice(0,18))}&font=oswald`;
}

async function fetchGameCover(title) {
    if (RAWG_API_KEY) {
        try {
            
            const query = encodeURIComponent(title);
            const res = await fetch(
                `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${query}&page_size=5&search_precise=true`,
                { headers: { 'User-Agent': 'CROSSMEDIA/1.0' } }
            );
            if (!res.ok) throw new Error(`RAWG ${res.status}`);
            const data = await res.json();
            
            const hit = data.results?.find(g => g.background_image);
            if (hit?.background_image) return hit.background_image;
            
            const res2 = await fetch(
                `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${query}&page_size=5`,
                { headers: { 'User-Agent': 'CROSSMEDIA/1.0' } }
            );
            const data2 = await res2.json();
            const hit2 = data2.results?.find(g => g.background_image);
            if (hit2?.background_image) return hit2.background_image;
        } catch(e) {
            console.warn('RAWG fetch failed for:', title, e.message);
        }
    }
    return `https://placehold.co/300x450/0a1a0a/39ff14?text=${encodeURIComponent(title.slice(0,18))}&font=oswald`;
}

async function resolveImage(item) {
    
    if (item.image && !item.image.includes('placehold.co')) return item.image;
    const url = item.type === 'movie'
        ? await fetchMoviePoster(item.title, item.year)
        : await fetchGameCover(item.title);
    
    if (!url.includes('placehold.co')) {
        dbUpdate(item.id, { image: url }).catch(() => {});
    }
    return url;
}

async function resolveImages(items, onUpdate) {
    await Promise.all(items.map(async item => {
        const url = await resolveImage(item);
        if (onUpdate) onUpdate(item.id, url);
    }));
}
