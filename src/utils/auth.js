// Primary auth: localStorage. Supabase is a silent optional background sync.
// Import supabase lazily to avoid crashing if it's misconfigured.
let _supabase = null;
async function getSupabase() {
  if (_supabase) return _supabase;
  try {
    const mod = await import('../lib/supabase.js');
    _supabase = mod.supabase;
  } catch {
    _supabase = null;
  }
  return _supabase;
}

const CURRENT_USER_KEY = 'fairlance_current_user';
const USERS_KEY = 'fairlance_users';

const hashPassword = async (password) => {
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.log('Hashing failed, using fallback');
    return btoa(password);
  }
};

// ── Sign Up ──────────────────────────────────────────────────────
export async function signUp(name, email, password, role) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  // Silent Supabase background sync (optional)
  try {
    const sb = await getSupabase();
    if (sb) {
      await sb.from('users').insert({
        id: user.id,
        name,
        email: user.email,
        password: hashedPassword,
        role,
        created_at: user.createdAt
      });
    }
  } catch (e) {
    console.log('Supabase sync failed silently:', e);
  }

  return user;
}

// ── Login ────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const users = JSON.parse(localStorage.getItem('fairlance_users') || '[]');

  const hashedPassword = await hashPassword(password);

  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashedPassword);

  // BACKWARD COMPATIBILITY (old plaintext users)
  if (!user) {
    user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
      // upgrade user to hashed password
      user.password = hashedPassword;
      localStorage.setItem('fairlance_users', JSON.stringify(users));
    }
  }

  // Supabase fallback
  if (!user) {
    try {
      const sb = await getSupabase();
      if (sb) {
        const { data } = await sb
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (data) {
          const dbUser = data;

          if (dbUser.password === hashedPassword) {
            user = dbUser;

            const allUsers = JSON.parse(localStorage.getItem('fairlance_users') || '[]');
            const exists = allUsers.find(u => u.id === user.id);

            if (!exists) {
              allUsers.push(user);
              localStorage.setItem('fairlance_users', JSON.stringify(allUsers));
            }
          }
        }
      }
    } catch (e) {
      console.log('Supabase login fallback failed silently', e);
    }
  }

  if (user) {
    localStorage.setItem('fairlance_current_user', JSON.stringify(user));
    return user;
  }

  throw new Error('Invalid email or password');
};

// ── Logout ───────────────────────────────────────────────────────
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ── Session Helpers ──────────────────────────────────────────────
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}
