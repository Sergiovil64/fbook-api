// UI de prueba — vanilla JS, sin frameworks ni build step.
// Objetivo: registrar/loguear un usuario real vía Cognito, publicar posts/comentarios
// contra el backend real en AWS, y visualizar el resultado de la moderación IA
// (moderationStatus / toxicityScore / lang) que calculan fbook-translator + fbook-bullying-classifier.

const CFG = window.FBOOK_CONFIG;
const USERS_MAP_KEY = 'fbook_web_test_users'; // correo -> id de Dynamo (Usuario.id, distinto del sub de Cognito)

const state = {
  idToken: null,
  usuarioId: null,
  correo: null,
};

const $ = (id) => document.getElementById(id);

function getUsersMap() {
  try {
    return JSON.parse(localStorage.getItem(USERS_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

function rememberUsuarioId(correo, id) {
  const map = getUsersMap();
  map[correo] = id;
  localStorage.setItem(USERS_MAP_KEY, JSON.stringify(map));
}

function showMsg(el, text, type = 'error') {
  el.innerHTML = text ? `<div class="msg ${type}">${text}</div>` : '';
}

// ---------- Cognito (llamada directa a la API pública, sin SDK) ----------

async function cognitoInitiateAuth(correo, password) {
  const res = await fetch(`https://cognito-idp.${CFG.cognito.region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CFG.cognito.clientId,
      AuthParameters: { USERNAME: correo, PASSWORD: password },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.__type || 'No se pudo iniciar sesión en Cognito');
  }
  return data.AuthenticationResult.IdToken;
}

// ---------- Backend Fbook ----------

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.idToken) headers.Authorization = `Bearer ${state.idToken}`;
  const res = await fetch(`${CFG.apiBaseUrl}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status} en ${path}`);
  }
  return data;
}

// ---------- Auth UI ----------

$('tabLogin').addEventListener('click', () => {
  $('tabLogin').classList.remove('inactive');
  $('tabRegister').classList.add('inactive');
  $('loginForm').classList.remove('hidden');
  $('registerForm').classList.add('hidden');
});

$('tabRegister').addEventListener('click', () => {
  $('tabRegister').classList.remove('inactive');
  $('tabLogin').classList.add('inactive');
  $('registerForm').classList.remove('hidden');
  $('loginForm').classList.add('hidden');
});

$('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMsg($('globalMsg'));
  try {
    const usuario = await api('/v1/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('regNombre').value,
        correo: $('regCorreo').value,
        password: $('regPassword').value,
      }),
    });
    rememberUsuarioId(usuario.correo, usuario.id);
    showMsg($('globalMsg'), `Usuario creado (id: ${usuario.id}). Ahora iniciá sesión.`, 'info');
    $('tabLogin').click();
    $('loginCorreo').value = usuario.correo;
  } catch (err) {
    showMsg($('globalMsg'), err.message);
  }
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMsg($('globalMsg'));
  const correo = $('loginCorreo').value;
  const password = $('loginPassword').value;
  try {
    const idToken = await cognitoInitiateAuth(correo, password);
    state.idToken = idToken;
    // Fuente de verdad: preguntarle al backend el id (Dynamo) por correo. Así funciona sin
    // depender de localStorage ni de que el usuario lo haya guardado/pegado a mano — clave para
    // que el login funcione igual desde cualquier navegador o dispositivo.
    let usuarioId;
    try {
      const usuario = await api(`/v1/usuarios/by-correo/${encodeURIComponent(correo)}`);
      usuarioId = usuario.id;
    } catch {
      usuarioId = $('loginUsuarioId').value.trim() || getUsersMap()[correo];
    }
    if (!usuarioId) {
      throw new Error(
        'No pude encontrar tu perfil de usuario. Registrate de nuevo, o si ya tenés el ID ' +
        '(Dynamo) completá el campo opcional "ID de usuario".',
      );
    }
    state.usuarioId = usuarioId;
    state.correo = correo;
    rememberUsuarioId(correo, usuarioId);
    enterApp();
  } catch (err) {
    showMsg($('globalMsg'), err.message);
  }
});

$('logoutBtn').addEventListener('click', () => {
  state.idToken = null;
  state.usuarioId = null;
  state.correo = null;
  $('appSection').classList.add('hidden');
  $('authSection').classList.remove('hidden');
});

function enterApp() {
  $('authSection').classList.add('hidden');
  $('appSection').classList.remove('hidden');
  $('whoAmI').textContent = `${state.correo} (usuarioId: ${state.usuarioId})`;
  loadFeed();
}

// ---------- Posts ----------

$('postBtn').addEventListener('click', async () => {
  const contenido = $('postContenido').value.trim();
  if (!contenido) return;
  showMsg($('postMsg'), 'Publicando y moderando con IA (traductor + clasificador)…', 'info');
  try {
    const post = await api('/v1/publicaciones', {
      method: 'POST',
      body: JSON.stringify({ idUsuario: state.usuarioId, contenido }),
    });
    $('postContenido').value = '';
    showMsg(
      $('postMsg'),
      `Resultado: <span class="badge ${post.moderationStatus}">${post.moderationStatus}</span>` +
        moderationMeta(post),
      'info',
    );
    await loadFeed();
  } catch (err) {
    showMsg($('postMsg'), err.message);
  }
});

$('refreshBtn').addEventListener('click', loadFeed);

function moderationMeta(item) {
  const parts = [];
  if (item.toxicityScore !== undefined) parts.push(`score ${item.toxicityScore.toFixed(3)}`);
  if (item.lang) parts.push(`lang ${item.lang}`);
  return parts.length ? `<span class="meta">${parts.join(' · ')}</span>` : '';
}

async function loadFeed() {
  $('feed').innerHTML = '<div class="loading">Cargando…</div>';
  try {
    const { items } = await api('/v1/publicaciones');
    const posts = (items || []).sort((a, b) => b.fecha - a.fecha);
    if (posts.length === 0) {
      $('feed').innerHTML = '<p class="loading">Todavía no hay publicaciones.</p>';
      return;
    }
    $('feed').innerHTML = '';
    posts.forEach((post) => $('feed').appendChild(renderPost(post)));
  } catch (err) {
    $('feed').innerHTML = '';
    showMsg($('globalMsg'), err.message);
  }
}

function renderPost(post) {
  const div = document.createElement('div');
  div.className = 'post';
  div.innerHTML = `
    <div class="post-header">
      <span>usuario ${post.idUsuario.slice(0, 8)}… · ${new Date(post.fecha).toLocaleString()}</span>
      <span><span class="badge ${post.moderationStatus}">${post.moderationStatus}</span>${moderationMeta(post)}</span>
    </div>
    <div class="post-body"></div>
    <button class="toggle-link" data-id="${post.id}">Ver / agregar comentarios</button>
    <div class="comments hidden" id="comments-${post.id}"></div>
  `;
  div.querySelector('.post-body').textContent = post.contenido; // textContent evita inyección de HTML
  div.querySelector('.toggle-link').addEventListener('click', (e) => toggleComments(post.id, e.target));
  return div;
}

// ---------- Comments ----------

async function toggleComments(postId, btn) {
  const box = $(`comments-${postId}`);
  const opening = box.classList.contains('hidden');
  box.classList.toggle('hidden');
  btn.textContent = opening ? 'Ocultar comentarios' : 'Ver / agregar comentarios';
  if (opening) await loadComments(postId, box);
}

async function loadComments(postId, box) {
  box.innerHTML = '<div class="loading">Cargando comentarios…</div>';
  try {
    // No hay filtro por idPublicacion en la API; se trae todo y se filtra en el cliente
    // (aceptable para esta UI de prueba con volumen bajo de datos).
    const { items } = await api('/v1/comentarios');
    const comentarios = (items || [])
      .filter((c) => c.idPublicacion === postId)
      .sort((a, b) => a.fComentario - b.fComentario);

    box.innerHTML = '';
    comentarios.forEach((c) => box.appendChild(renderComment(c)));

    const form = document.createElement('div');
    form.className = 'comment-form';
    form.innerHTML = `
      <input type="text" maxlength="300" placeholder="Escribí un comentario...">
      <button>Comentar</button>
    `;
    const input = form.querySelector('input');
    const button = form.querySelector('button');
    button.addEventListener('click', () => submitComment(postId, input, box));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitComment(postId, input, box);
    });
    box.appendChild(form);
  } catch (err) {
    box.innerHTML = '';
    showMsg($('globalMsg'), err.message);
  }
}

function renderComment(c) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.innerHTML = `<span class="badge ${c.moderationStatus}">${c.moderationStatus}</span>${moderationMeta(c)} — `;
  const span = document.createElement('span');
  span.textContent = c.texto;
  div.appendChild(span);
  return div;
}

async function submitComment(postId, input, box) {
  const texto = input.value.trim();
  if (!texto) return;
  input.disabled = true;
  try {
    await api('/v1/comentarios', {
      method: 'POST',
      body: JSON.stringify({ idPublicacion: postId, idUsuario: state.usuarioId, texto }),
    });
    input.value = '';
    await loadComments(postId, box);
  } catch (err) {
    showMsg($('globalMsg'), err.message);
  } finally {
    input.disabled = false;
  }
}
