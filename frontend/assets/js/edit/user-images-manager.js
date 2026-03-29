class UserImagesManager {
    constructor() {
        this.allImages = [];
        this.currentFilter = "posted";
    }
    async load() {
        const grid = document.getElementById("userImagesGrid");
        if (!grid) return;
        grid.innerHTML = await loadTemplate("states/loading-state");
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(API_CONFIG.IMAGES_API + "user_images.php", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success && data.images && data.images.length > 0) {
                this.allImages = data.images;
                if (!this.currentFilter) {
                    this.currentFilter = "posted";
                }
                await this.filter(this.currentFilter);
            } else {
                this.allImages = [];
                grid.classList.add("empty");
                grid.innerHTML = await loadTemplate("states/empty-state");
            }
        } catch (err) {
            grid.innerHTML = await loadTemplate("states/error-state");
        }
    }
    async filter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        const filterBtn = document.getElementById("filter" + filter.charAt(0).toUpperCase() + filter.slice(1));
        if (filterBtn) {
            filterBtn.classList.add("active");
        }
        const grid = document.getElementById("userImagesGrid");
        if (!grid) return;
        grid.innerHTML = "";
        let filteredImages = this.allImages;
        if (filter === "drafts") {
            filteredImages = this.allImages.filter(img => !img.is_posted);
        } else if (filter === "posted") {
            filteredImages = this.allImages.filter(img => img.is_posted);
        } else {
            filteredImages = this.allImages;
        }
        if (filteredImages.length === 0) {
            grid.classList.add("empty");
            grid.innerHTML = await loadTemplate("states/empty-state");
            return;
        }
        grid.classList.remove("empty");
        filteredImages.forEach(img => {
            const item = this.createItem(img);
            grid.appendChild(item);
        });
    }
    createItem(img) {
        const item = document.createElement("div");
        item.className = "user-image-item";
        item.setAttribute("data-image-id", img.id);
        item.setAttribute("data-is-posted", img.is_posted ? "1" : "0");
        if (!img.is_posted) {
            item.classList.add("draft");
        }
        const imgEl = document.createElement("img");
        const thumbnailFilename = img.filename;
        imgEl.src = `${API_CONFIG.IMAGES_API}get_image.php?filename=${encodeURIComponent(thumbnailFilename)}`;
        imgEl.alt = "Your image";
        imgEl.onerror = function() {
            this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage%3C/text%3E%3C/svg%3E";
        };
        item.appendChild(imgEl);
        const statusEl = document.createElement("div");
        statusEl.className = "image-status";
        statusEl.textContent = img.is_posted ? "Posted" : "Draft";
        item.appendChild(statusEl);
        const dateEl = document.createElement("div");
        dateEl.className = "image-date";
        dateEl.textContent = new Date(img.created_at).toLocaleDateString();
        item.appendChild(dateEl);
        item.addEventListener("click", function(e) {
            if (e.target.closest(".image-actions")) {
                return;
            }
            if (typeof showImagePreview === "function") {
                showImagePreview(img);
            }
        });
        return item;
    }
    getCurrentFilter() {
        return this.currentFilter;
    }
    getAllImages() {
        return this.allImages;
    }
}

const userImagesManager = new UserImagesManager;

window.userImagesManager = userImagesManager;