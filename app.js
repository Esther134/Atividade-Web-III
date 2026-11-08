const USERS_API = "https://jsonplaceholder.typicode.com/users";
const PHOTOS_API = "https://jsonplaceholder.typicode.com/photos?_limit=100";
const PHOTOS_PER_PAGE = 20;

const loginScreen = document.querySelector("#login-screen");
const galleryScreen = document.querySelector("#gallery-screen");
const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginMessage = document.querySelector("#login-message");
const galleryMessage = document.querySelector("#gallery-message");
const galleryContent = document.querySelector("#gallery-content");
const photoList = document.querySelector("#photo-list");
const photoSearch = document.querySelector("#photo-search");
const photoCount = document.querySelector("#photo-count");
const pagination = document.querySelector("#pagination");
const photoDetail = document.querySelector("#photo-detail");
const detailImage = document.querySelector("#detail-image");
const detailTitle = document.querySelector("#detail-title");

let photos = [];
let currentPage = 1;
let isGalleryLoaded = false;

loginForm.addEventListener("submit", handleLogin);
document.querySelector("#logout-button").addEventListener("click", logout);
document.querySelector("#back-button").addEventListener("click", showGalleryList);
photoSearch.addEventListener("input", () => {
  currentPage = 1;
  renderGallery();
});

async function handleLogin(event) {
  event.preventDefault();
  clearLoginMessage();

  const formData = new FormData(loginForm);
  const username = formData.get("username").trim();
  const password = formData.get("password").trim();

  if (!username || !password) {
    showLoginMessage("Preencha o usuário e a senha para continuar.");
    return;
  }

  setLoginLoading(true);

  try {
    const response = await fetch(USERS_API);
    if (!response.ok) {
      throw new Error(`A consulta de usuários falhou (HTTP ${response.status}).`);
    }

    const users = await response.json();
    const matchingUser = users.find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
        && user.email.toLowerCase() === password.toLowerCase(),
    );

    if (!matchingUser) {
      showLoginMessage("Usuário ou senha incorretos. Confira os dados e tente novamente.");
      return;
    }

    loginScreen.hidden = true;
    galleryScreen.hidden = false;
    photoSearch.value = "";
    currentPage = 1;

    if (!isGalleryLoaded) {
      await loadPhotos();
    }
  } catch (error) {
    showLoginMessage("Não foi possível validar o acesso. Verifique sua conexão e tente novamente.");
    console.error("Erro ao consultar usuários:", error);
  } finally {
    setLoginLoading(false);
  }
}

async function loadPhotos() {
  galleryContent.hidden = false;
  photoDetail.hidden = true;
  galleryMessage.hidden = false;
  galleryMessage.classList.remove("is-error");
  galleryMessage.textContent = "Carregando fotos...";
  photoList.replaceChildren();
  pagination.hidden = true;
  photoCount.textContent = "";

  try {
    const response = await fetch(PHOTOS_API);
    if (!response.ok) {
      throw new Error(`A consulta de fotos falhou (HTTP ${response.status}).`);
    }

    const result = await response.json();
    if (!Array.isArray(result)) {
      throw new Error("A resposta da API de fotos tem um formato inválido.");
    }

    photos = result.filter(
      (photo) => typeof photo.title === "string"
        && typeof photo.thumbnailUrl === "string"
        && typeof photo.url === "string",
    );
    isGalleryLoaded = true;
    galleryMessage.hidden = true;
    renderGallery();
  } catch (error) {
    galleryMessage.textContent = "Não foi possível carregar as fotos. Verifique sua conexão e tente novamente.";
    galleryMessage.classList.add("is-error");
    console.error("Erro ao consultar fotos:", error);
  }
}

function renderGallery() {
  const searchTerm = photoSearch.value.trim().toLocaleLowerCase("pt-BR");
  const filteredPhotos = photos.filter((photo) => photo.title.toLocaleLowerCase("pt-BR").includes(searchTerm));
  const pageCount = Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE);
  currentPage = Math.min(Math.max(currentPage, 1), Math.max(pageCount, 1));
  const start = (currentPage - 1) * PHOTOS_PER_PAGE;
  const visiblePhotos = filteredPhotos.slice(start, start + PHOTOS_PER_PAGE);

  photoList.replaceChildren();
  photoCount.textContent = `${filteredPhotos.length} ${filteredPhotos.length === 1 ? "foto" : "fotos"}`;

  if (filteredPhotos.length === 0) {
    galleryMessage.textContent = "Nenhuma foto encontrada para essa busca.";
    galleryMessage.classList.remove("is-error");
    galleryMessage.hidden = false;
  } else {
    galleryMessage.hidden = true;
  }

  for (const photo of visiblePhotos) {
    const item = document.createElement("button");
    item.className = "photo-card";
    item.type = "button";
    item.setAttribute("aria-label", `Ampliar foto: ${photo.title}`);

    const thumbnail = document.createElement("img");
    thumbnail.src = photo.thumbnailUrl;
    thumbnail.alt = "";
    thumbnail.width = 32;
    thumbnail.height = 32;
    thumbnail.loading = "lazy";

    const title = document.createElement("span");
    title.className = "photo-title";
    title.textContent = photo.title;

    item.append(thumbnail, title);
    item.addEventListener("click", () => showPhoto(photo));
    photoList.append(item);
  }

  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  pagination.replaceChildren();
  pagination.hidden = pageCount <= 1;

  if (pageCount <= 1) {
    return;
  }

  addPageButton("Anterior", currentPage - 1, currentPage === 1);
  for (let page = 1; page <= pageCount; page += 1) {
    addPageButton(String(page), page, false, page === currentPage);
  }
  addPageButton("Próxima", currentPage + 1, currentPage === pageCount);
}

function addPageButton(label, page, disabled, isCurrent = false) {
  const button = document.createElement("button");
  button.className = `page-button${isCurrent ? " is-current" : ""}`;
  button.type = "button";
  button.textContent = label;
  button.disabled = disabled;
  if (isCurrent) {
    button.setAttribute("aria-current", "page");
  }
  button.addEventListener("click", () => {
    currentPage = page;
    renderGallery();
    document.querySelector(".gallery-heading").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  pagination.append(button);
}

function showPhoto(photo) {
  detailImage.src = photo.url;
  detailImage.alt = photo.title;
  detailTitle.textContent = photo.title;
  galleryContent.hidden = true;
  photoDetail.hidden = false;
}

function showGalleryList() {
  detailImage.removeAttribute("src");
  detailImage.alt = "";
  photoDetail.hidden = true;
  galleryContent.hidden = false;
}

function logout() {
  loginForm.reset();
  clearLoginMessage();
  detailImage.removeAttribute("src");
  detailImage.alt = "";
  photoDetail.hidden = true;
  galleryScreen.hidden = true;
  loginScreen.hidden = false;
}

function showLoginMessage(message) {
  loginMessage.textContent = message;
  loginMessage.hidden = false;
}

function clearLoginMessage() {
  loginMessage.textContent = "";
  loginMessage.hidden = true;
}

function setLoginLoading(isLoading) {
  loginButton.disabled = isLoading;
  loginButton.querySelector(".button-label").hidden = isLoading;
  loginButton.querySelector(".button-spinner").hidden = !isLoading;
}
