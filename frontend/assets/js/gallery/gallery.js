const IMG_API_BASE = API_CONFIG.IMAGES_API;

let currentPage = 1;

let totalPages = 1;

let isLoading = false;

let hasMorePages = true;

let loadingObserver = null;

let imageObserver = null;

async function fetchImages(page = 1, perPage = 10) {
    if (isLoading || !hasMorePages) return {
        images: [],
        pagination: null
    };
    isLoading = true;
    try {
        const url = IMG_API_BASE + `list.php?page=${page}&per_page=${perPage}`;
        const res = await fetch(url, {
            credentials: "include"
        });
        if (!res.ok) {
            const errorText = await res.text();
            isLoading = false;
            return {
                images: [],
                pagination: null
            };
        }
        const responseText = await res.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            isLoading = false;
            return {
                images: [],
                pagination: null
            };
        }
        isLoading = false;
        const pagination = data.pagination || null;
        if (pagination) {
            hasMorePages = page < pagination.total_pages;
        } else {
            hasMorePages = false;
        }
        return {
            images: data.images || [],
            pagination: pagination
        };
    } catch (err) {
        isLoading = false;
        return {
            images: [],
            pagination: null
        };
    }
}

function openLoginOrRegister() {
    if (typeof openPopup === "function" && typeof showAuthForm === "function") {
        openPopup();
        showAuthForm("login");
    } else {
        window.location.href = "/auth/login.html";
    }
}

window.openLoginOrRegister = openLoginOrRegister;

function promptLogin(action = "continue") {
    if (typeof openPopup === "function" && typeof showAuthForm === "function") {
        openPopup();
        showAuthForm("login");
        setTimeout(() => {
            const popup = document.getElementById("rightPopup");
            if (popup) {
                const header = popup.querySelector(".popup-header");
                if (header) {
                    const message = document.createElement("div");
                    message.style.cssText = "background: #fff3cd; color: #856404; padding: 12px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #ffc107; font-size: 0.9em;";
                    message.textContent = `Please login to ${action}.`;
                    header.insertAdjacentElement("afterend", message);
                }
            }
        }, 100);
    } else {
        alert(`Please login to ${action}.`);
        window.location.href = "/auth/login.html";
    }
}

async function toggleLike(imageId) {
    try {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const res = await fetchFn(IMG_API_BASE + "likes.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                image_id: imageId
            })
        });
        const data = await res.json();
        if (!data.success) {
            if (data.error && (data.error.includes("Not logged in") || data.error.includes("login") || data.error.includes("unauthorized"))) {
                promptLogin("like this image");
            } else {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(document.querySelector(`[data-image-id="${imageId}"] .actions-div`), data.error, "error");
                } else {
                    alert(data.error);
                }
            }
            return;
        }
        const card = document.querySelector(`[data-image-id="${imageId}"]`);
        if (card) {
            const likeBtn = card.querySelector(".like-btn");
            if (likeBtn) {
                try {
                    const res = await fetch(IMG_API_BASE + `list.php?page=1&per_page=1000`, {
                        credentials: "include"
                    });
                    const data = await res.json();
                    if (data.images) {
                        const img = data.images.find(i => i.id === imageId);
                        if (img) {
                            const countSpan = likeBtn.querySelector(".action-count");
                            if (countSpan) {
                                countSpan.textContent = img.likes_count || 0;
                            } else {
                                likeBtn.innerHTML = await renderTemplate("components/like-button", {
                                    likesCount: img.likes_count || 0
                                });
                            }
                        }
                    }
                } catch (e) {
                    renderGallery(1);
                }
            }
        }
    } catch (err) {
        if (typeof showInlineMessage === "function") {
            showInlineMessage(document.querySelector(`[data-image-id="${imageId}"] .actions-div`), "Failed to like/unlike", "error");
        } else {
            alert("Failed to like/unlike: " + err);
        }
    }
}

let currentModalImageId = null;

async function fetchCommentsForImage(imageId) {
    try {
        const res = await fetch(IMG_API_BASE + `list.php?page=1&per_page=1000`, {
            credentials: "include"
        });
        const data = await res.json();
        if (data.images) {
            const image = data.images.find(img => img.id === imageId);
            if (image) {
                return image.comments || [];
            }
        }
        return [];
    } catch (err) {
        return [];
    }
}

async function openCommentsModal(imageId, comments = [], imageCaption = null) {
    currentModalImageId = imageId;
    const modal = document.getElementById("commentsModal");
    const commentsList = document.getElementById("commentsList");
    const commentsInput = document.getElementById("commentsInput");
    const submitBtn = document.getElementById("commentsSubmitBtn");
    if (!modal) return;
    modal.dataset.imageId = imageId;
    modal.classList.add("active");
    if (!imageCaption) {
        const imageCard = document.querySelector(`[data-image-id="${imageId}"]`);
        if (imageCard) {
            const commentBtn = imageCard.querySelector(".comment-btn");
            if (commentBtn && commentBtn.dataset.imageCaption) {
                imageCaption = commentBtn.dataset.imageCaption;
            }
        }
    }
    commentsList.innerHTML = await loadTemplate("states/comments-loading");
    const freshComments = await fetchCommentsForImage(imageId);
    commentsList.innerHTML = "";
    if (imageCaption) {
        const captionItem = document.createElement("div");
        captionItem.className = "comment-item caption-item";
        const captionText = document.createElement("div");
        captionText.className = "comment-text";
        captionText.textContent = imageCaption;
        captionItem.appendChild(captionText);
        commentsList.appendChild(captionItem);
        const separator = document.createElement("div");
        separator.className = "comments-separator";
        commentsList.appendChild(separator);
    }
    if (freshComments.length === 0) {
        if (!imageCaption) {
            commentsList.innerHTML = await loadTemplate("states/comments-empty");
        }
    } else {
        for (const c of freshComments) {
            const commentItem = document.createElement("div");
            commentItem.className = "comment-item";
            commentItem.innerHTML = await renderTemplate("components/comment-item", {
                username: c.username || "Unknown",
                comment: c.comment || ""
            });
            commentsList.appendChild(commentItem);
        }
    }
    setTimeout(() => {
        commentsList.scrollTop = commentsList.scrollHeight;
    }, 100);
    let loggedIn = false;
    if (typeof isLoggedIn === "function") {
        try {
            loggedIn = await isLoggedIn();
        } catch (e) {
            loggedIn = false;
        }
    }
    if (loggedIn) {
        commentsInput.disabled = false;
        commentsInput.placeholder = "Add a comment...";
        submitBtn.disabled = false;
        commentsInput.style.cursor = "text";
        setTimeout(() => commentsInput.focus(), 100);
    } else {
        commentsInput.disabled = true;
        commentsInput.placeholder = "Login to comment";
        submitBtn.disabled = true;
        commentsInput.style.cursor = "pointer";
        commentsInput.onclick = () => {
            closeCommentsModal();
            promptLogin("comment on this image");
        };
    }
}

function closeCommentsModal() {
    const modal = document.getElementById("commentsModal");
    const commentsInput = document.getElementById("commentsInput");
    if (modal) {
        modal.classList.remove("active");
    }
    if (commentsInput) {
        commentsInput.value = "";
    }
    currentModalImageId = null;
}

async function submitCommentFromModal() {
    const imageId = currentModalImageId || document.getElementById("commentsModal")?.dataset.imageId;
    const commentsInput = document.getElementById("commentsInput");
    const submitBtn = document.getElementById("commentsSubmitBtn");
    if (!imageId || !commentsInput || !submitBtn) return;
    const comment = commentsInput.value.trim();
    if (!comment) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";
    try {
        await addComment(imageId, comment);
        commentsInput.value = "";
    } catch (err) {
        if (typeof showInlineMessage === "function") {
            showInlineMessage(submitBtn, "Failed to add comment", "error");
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Post";
        commentsInput.focus();
    }
}

function setupCommentsModal() {
    const modal = document.getElementById("commentsModal");
    if (modal) {
        modal.addEventListener("click", e => {
            if (e.target === modal) {
                closeCommentsModal();
            }
        });
    }
    const commentsInput = document.getElementById("commentsInput");
    if (commentsInput) {
        commentsInput.addEventListener("keypress", e => {
            if (e.key === "Enter" && !commentsInput.disabled) {
                submitCommentFromModal();
            }
        });
    }
}

async function addComment(imageId, comment) {
    try {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const res = await fetchFn(IMG_API_BASE + "comments.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                image_id: imageId,
                comment: comment
            })
        });
        const data = await res.json();
        if (!data.success) {
            if (data.error && (data.error.includes("Not logged in") || data.error.includes("login") || data.error.includes("unauthorized"))) {
                closeCommentsModal();
                promptLogin("comment on this image");
            } else {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(document.querySelector(`[data-image-id="${imageId}"] .commentBtn`), data.error, "error");
                } else {
                    alert(data.error);
                }
            }
        } else {
            const card = document.querySelector(`[data-image-id="${imageId}"]`);
            if (card) {
                const commentBtn = card.querySelector(".comment-btn");
                if (commentBtn) {
                    const countSpan = commentBtn.querySelector(".action-count");
                    if (countSpan) {
                        const currentCount = parseInt(countSpan.textContent) || 0;
                        countSpan.textContent = currentCount + 1;
                    }
                }
                const modal = document.getElementById("commentsModal");
                if (modal && modal.classList.contains("active") && modal.dataset.imageId == imageId) {
                    const freshComments = await fetchCommentsForImage(imageId);
                    const commentsList = document.getElementById("commentsList");
                    commentsList.innerHTML = "";
                    const imageCard = document.querySelector(`[data-image-id="${imageId}"]`);
                    let imageCaption = null;
                    if (imageCard) {
                        const commentBtn = imageCard.querySelector(".comment-btn");
                        if (commentBtn && commentBtn.dataset.imageCaption) {
                            imageCaption = commentBtn.dataset.imageCaption;
                        }
                    }
                    if (imageCaption) {
                        const captionItem = document.createElement("div");
                        captionItem.className = "comment-item caption-item";
                        const captionText = document.createElement("div");
                        captionText.className = "comment-text";
                        captionText.textContent = imageCaption;
                        captionItem.appendChild(captionText);
                        commentsList.appendChild(captionItem);
                        const separator = document.createElement("div");
                        separator.className = "comments-separator";
                        commentsList.appendChild(separator);
                    }
                    if (freshComments.length === 0) {
                        if (!imageCaption) {
                            commentsList.innerHTML = await loadTemplate("states/comments-empty");
                        }
                    } else {
                        for (const c of freshComments) {
                            const commentItem = document.createElement("div");
                            commentItem.className = "comment-item";
                            commentItem.innerHTML = await renderTemplate("components/comment-item", {
                                username: c.username || "Unknown",
                                comment: c.comment || ""
                            });
                            commentsList.appendChild(commentItem);
                        }
                    }
                    commentsList.scrollTop = commentsList.scrollHeight;
                }
            }
        }
    } catch (err) {
        if (typeof showInlineMessage === "function") {
            showInlineMessage(document.querySelector(`[data-image-id="${imageId}"] .commentBtn`), "Failed to add comment", "error");
        } else {
            alert("Failed to add comment: " + err);
        }
    }
}

async function deleteImage(imageId, buttonElement) {
    const deleteHandler = async () => {
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(IMG_API_BASE + "delete.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    image_id: imageId
                })
            });
            const data = await res.json();
            if (data.success) {
                setTimeout(() => {
                    renderGallery(1);
                }, 500);
            } else {
                if (typeof showInlineMessage === "function" && buttonElement) {
                    showInlineMessage(buttonElement, data.error || "Failed to delete image", "error");
                } else {
                    alert(data.error || "Failed to delete image");
                }
            }
        } catch (err) {
            if (typeof showInlineMessage === "function" && buttonElement) {
                showInlineMessage(buttonElement, "Failed to delete image", "error");
            } else {
                alert("Failed to delete image: " + err);
            }
        }
    };
    if (typeof showConfirmation === "function" && buttonElement) {
        showConfirmation(buttonElement, "Are you sure you want to delete this image? This cannot be undone.", deleteHandler);
    } else {
        if (confirm("Are you sure you want to delete this image?")) {
            deleteHandler();
        }
    }
}

async function renderImageCard(img, loggedIn) {
    const div = document.createElement("div");
    div.classList.add("image-card");
    div.setAttribute("data-image-id", img.id);
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "image-wrapper";
    const imageEl = document.createElement("img");
    const imageSrc = `${API_CONFIG.UPLOADS_URL}${img.filename}`;
    imageEl.dataset.src = imageSrc;
    imageEl.alt = "User upload";
    imageEl.loading = "lazy";
    imageEl.onerror = function() {
        this.onerror = null;
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23ddd" width="300" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
    };
    imageWrapper.appendChild(imageEl);
    if (img.caption && img.caption.trim()) {
        const captionDiv = document.createElement("div");
        captionDiv.className = "image-caption-overlay";
        captionDiv.textContent = img.caption.trim();
        imageWrapper.appendChild(captionDiv);
    }
    div.appendChild(imageWrapper);
    if (imageObserver) {
        requestAnimationFrame(() => {
            const rect = imageEl.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight + 100 && rect.bottom > -100;
            if (isInViewport && imageEl.dataset.src) {
                imageEl.src = imageEl.dataset.src;
                imageEl.removeAttribute("data-src");
            } else if (imageEl.dataset.src) {
                imageObserver.observe(imageEl);
            }
        });
    } else {
        imageEl.src = imageSrc;
        imageEl.removeAttribute("data-src");
    }
    const infoDiv = document.createElement("div");
    infoDiv.className = "image-info";
    const date = new Date(img.created_at);
    const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const formattedTime = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });
    infoDiv.innerHTML = await renderTemplate("components/image-info", {
        username: img.username || "Unknown",
        formattedDate: formattedDate,
        formattedTime: formattedTime
    });
    div.appendChild(infoDiv);
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "actions-div";
    const likeBtn = document.createElement("button");
    likeBtn.className = "action-btn like-btn";
    likeBtn.innerHTML = await renderTemplate("components/like-button", {
        likesCount: img.likes_count || 0
    });
    if (loggedIn) {
        likeBtn.onclick = () => toggleLike(img.id);
    } else {
        likeBtn.onclick = () => promptLogin("like this image");
        likeBtn.title = "Login to like images";
    }
    actionsDiv.appendChild(likeBtn);
    const commentsCount = (img.comments || []).length;
    const commentBtn = document.createElement("button");
    commentBtn.className = "action-btn primary comment-btn";
    commentBtn.innerHTML = await renderTemplate("components/comment-button", {
        commentsCount: commentsCount
    });
    commentBtn.dataset.imageId = img.id;
    commentBtn.dataset.imageCaption = img.caption || "";
    if (loggedIn) {
        commentBtn.onclick = () => openCommentsModal(img.id, img.comments || [], img.caption);
    } else {
        commentBtn.onclick = () => promptLogin("comment on this image");
        commentBtn.title = "Login to comment";
    }
    actionsDiv.appendChild(commentBtn);
    div.appendChild(actionsDiv);
    return div;
}

async function loadMoreImages() {
    if (isLoading || !hasMorePages) return;
    currentPage++;
    const result = await fetchImages(currentPage, 10);
    const images = result.images;
    const pagination = result.pagination;
    if (pagination) {
        totalPages = pagination.total_pages || 1;
    }
    if (!images || images.length === 0) {
        hasMorePages = false;
        removeLoadingIndicator();
        return;
    }
    const galleryDiv = document.getElementById("gallery");
    const loggedIn = typeof isLoggedIn === "function" ? await isLoggedIn() : false;
    for (const img of images) {
        const card = await renderImageCard(img, loggedIn);
        galleryDiv.appendChild(card);
    }
    updateLoadingIndicator();
}

function createLoadingIndicator() {
    const galleryDiv = document.getElementById("gallery");
    const main = galleryDiv.closest("main");
    const existing = document.getElementById("galleryLoadingIndicator");
    if (existing) {
        existing.remove();
    }
    if (!hasMorePages) return;
    const loader = document.createElement("div");
    loader.id = "galleryLoadingIndicator";
    loader.className = "loading-indicator";
    loader.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Loading more images...</div>';
    if (main) {
        main.appendChild(loader);
    } else {
        galleryDiv.appendChild(loader);
    }
    if (loadingObserver) {
        loadingObserver.observe(loader);
    }
}

function updateLoadingIndicator() {
    if (!hasMorePages) {
        removeLoadingIndicator();
    } else {
        createLoadingIndicator();
    }
}

function removeLoadingIndicator() {
    const existing = document.getElementById("galleryLoadingIndicator");
    if (existing) {
        existing.remove();
    }
}

async function renderGallery(page = 1) {
    const galleryDiv = document.getElementById("gallery");
    const loggedIn = typeof isLoggedIn === "function" ? await isLoggedIn() : false;
    galleryDiv.innerHTML = "";
    currentPage = page;
    hasMorePages = true;
    const result = await fetchImages(page, 10);
    const images = result.images;
    const pagination = result.pagination;
    if (pagination) {
        totalPages = pagination.total_pages || 1;
        currentPage = pagination.page || page;
        hasMorePages = page < totalPages;
    }
    if (!images || images.length === 0) {
        galleryDiv.classList.add("empty");
        delete window.templateCache["states/gallery-empty-state"];
        delete window.templateCache["states/gallery-empty-state.html"];
        const loggedInValue = typeof isLoggedIn === "function" ? await isLoggedIn() : false;
        galleryDiv.innerHTML = await renderTemplate("states/gallery-empty-state", {
            loggedIn: loggedInValue
        });
        return;
    }
    galleryDiv.classList.remove("empty");
    for (const img of images) {
        const card = await renderImageCard(img, loggedIn);
        galleryDiv.appendChild(card);
    }
    createLoadingIndicator();
}

function setupObservers() {
    loadingObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && hasMorePages && !isLoading) {
                loadMoreImages();
            }
        });
    }, {
        rootMargin: "200px"
    });
    imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute("data-src");
                    imageObserver.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: "50px"
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupObservers();
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get("page");
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    currentPage = initialPage;
    renderGallery(initialPage);
    setupCommentsModal();
});