export function initItemAutocomplete(options) {
  const {
    enableOmdbAutocomplete,
    omdbApiKey,
    autocompleteEndpoint,
    itemInput,
    itemSuggestions,
    itemSuggestionsList,
    enableAuthorField,
    autoPopulateAuthor,
    authorInput,
    enableDirectorField,
    autoPopulateDirector,
    directorInput,
    enablePublisherField,
    autoPopulatePublisher,
    publisherInput,
    enableCategoryField,
    categoryInput,
    enableReadingProgress,
    autoPopulateTotalPages,
    totalPagesInput,
    audiobookInput,
    onSelectionChange,
    onSuggestionApplied
  } = options;

  if ((!enableOmdbAutocomplete && !autocompleteEndpoint) || !itemInput || !itemSuggestions) {
    return;
  }

  let autocompleteTimer = null;
  let currentSuggestions = [];
  let activeSuggestionIdx = -1;

  function normalizeSuggestion(item) {
    if (typeof item === "string") {
      return {
        label: item,
        value: item,
        subtitle: "",
        author: "",
        director: "",
        publisher: "",
        category: "",
        totalPages: "",
        imdbID: "",
        coverId: 0,
        coverEditionKey: "",
        coverUrl: "",
        posterUrl: ""
      };
    }
    if (item && typeof item === "object") {
      const value = item.value || item.label || "";
      const label = item.label || value;
      if (!value) return null;
      return {
        label,
        value,
        subtitle: item.subtitle || "",
        author: item.author || "",
        director: item.director || "",
        publisher: item.publisher || "",
        category: item.category || "",
        totalPages: item.totalPages || "",
        imdbID: item.imdbID || "",
        coverId: Number(item.coverId) || 0,
        coverEditionKey: item.coverEditionKey || "",
        coverUrl: item.coverUrl || "",
        posterUrl: item.posterUrl || ""
      };
    }
    return null;
  }

  async function fetchOmdbDetails(imdbID) {
    if (!omdbApiKey || !imdbID) return null;
    const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbApiKey)}&i=${encodeURIComponent(imdbID)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.Response === "False") return null;
    return data;
  }

  async function fetchOmdbDirector(imdbID) {
    const details = await fetchOmdbDetails(imdbID);
    if (!details?.Director || details.Director === "N/A") return "";
    return details.Director;
  }

  async function fetchSuggestions(query) {
    if (autocompleteEndpoint) {
      const url = `${autocompleteEndpoint}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (Array.isArray(data?.suggestions) ? data.suggestions : []);
      return raw.map(normalizeSuggestion).filter(Boolean);
    }

    if (!enableOmdbAutocomplete || !omdbApiKey) return [];
    const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbApiKey)}&type=movie&s=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || data.Response === "False" || !Array.isArray(data.Search)) return [];

    const baseSuggestions = data.Search.slice(0, 8).map((movie) => normalizeSuggestion({
      label: `${movie.Title} (${movie.Year})`,
      value: movie.Title,
      imdbID: movie.imdbID,
      posterUrl: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : ""
    })).filter(Boolean);

    if (!baseSuggestions.length) return [];

    return Promise.all(
      baseSuggestions.map(async (suggestion) => {
        if (!suggestion.imdbID) return suggestion;
        const details = await fetchOmdbDetails(suggestion.imdbID);
        if (!details) return suggestion;
        const director = details.Director && details.Director !== "N/A" ? details.Director : suggestion.director;
        const posterUrl = details.Poster && details.Poster !== "N/A" ? details.Poster : suggestion.posterUrl;
        return {
          ...suggestion,
          director,
          posterUrl,
          subtitle: director || suggestion.subtitle
        };
      })
    );
  }

  function hideSuggestions() {
    itemSuggestions.classList.add("hidden");
    itemInput.setAttribute("aria-expanded", "false");
    activeSuggestionIdx = -1;
  }

  function showSuggestions() {
    itemSuggestions.classList.remove("hidden");
    itemInput.setAttribute("aria-expanded", "true");
  }

  function applyActiveState() {
    if (!itemSuggestionsList) return;
    const options = Array.from(itemSuggestionsList.querySelectorAll(".omdb-option"));
    options.forEach((option, idx) => {
      option.classList.toggle("is-active", idx === activeSuggestionIdx);
    });
  }

  function renderSuggestions(items) {
    if (!itemSuggestionsList) return;
    itemSuggestionsList.innerHTML = "";
    currentSuggestions = items;
    activeSuggestionIdx = -1;

    items.forEach((suggestion, index) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "omdb-option";
      button.setAttribute("data-index", String(index));
      const subtitle = suggestion.subtitle || suggestion.author || suggestion.director || suggestion.publisher || "";
      if (subtitle) {
        button.innerHTML = `${suggestion.label}<span class="omdb-option-subtitle">${subtitle}</span>`;
      } else {
        button.textContent = suggestion.label;
      }
      li.appendChild(button);
      itemSuggestionsList.appendChild(li);
    });

    if (items.length) {
      showSuggestions();
    } else {
      hideSuggestions();
    }
  }

  async function chooseSuggestion(index) {
    if (index < 0 || index >= currentSuggestions.length) return;
    const suggestion = currentSuggestions[index];
    itemInput.value = suggestion.value;

    onSelectionChange?.({
      coverId: Number(suggestion.coverId) || 0,
      coverEditionKey: suggestion.coverEditionKey || "",
      coverUrl: suggestion.coverUrl || "",
      posterUrl: suggestion.posterUrl || "",
      imdbID: suggestion.imdbID || ""
    });

    if (enableAuthorField && autoPopulateAuthor && authorInput && suggestion.author) {
      authorInput.value = suggestion.author;
    }
    if (enableDirectorField && autoPopulateDirector && directorInput) {
      if (suggestion.director) {
        directorInput.value = suggestion.director;
      } else if (suggestion.imdbID) {
        const director = await fetchOmdbDirector(suggestion.imdbID);
        if (director) directorInput.value = director;
      }
    }
    if (enablePublisherField && autoPopulatePublisher && publisherInput && suggestion.publisher) {
      publisherInput.value = suggestion.publisher;
    }
    if (enableCategoryField && categoryInput && suggestion.category) {
      categoryInput.value = suggestion.category;
    }
    if (enableReadingProgress && autoPopulateTotalPages && totalPagesInput && suggestion.totalPages && !audiobookInput?.checked) {
      totalPagesInput.value = String(suggestion.totalPages);
    }
    onSuggestionApplied?.();
    hideSuggestions();
  }

  itemInput.addEventListener("input", function() {
    const query = itemInput.value.trim();
    onSelectionChange?.({
      coverId: 0,
      coverEditionKey: "",
      coverUrl: "",
      posterUrl: "",
      imdbID: ""
    });
    clearTimeout(autocompleteTimer);

    if (query.length < 2) {
      renderSuggestions([]);
      return;
    }

    autocompleteTimer = setTimeout(async () => {
      try {
        const suggestions = await fetchSuggestions(query);
        if (itemInput.value.trim() === query) {
          renderSuggestions(suggestions);
        }
      } catch {
        renderSuggestions([]);
      }
    }, 250);
  });

  itemInput.addEventListener("keydown", function(e) {
    if (!currentSuggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionIdx = Math.min(activeSuggestionIdx + 1, currentSuggestions.length - 1);
      applyActiveState();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionIdx = Math.max(activeSuggestionIdx - 1, 0);
      applyActiveState();
    } else if (e.key === "Enter" && activeSuggestionIdx >= 0) {
      e.preventDefault();
      void chooseSuggestion(activeSuggestionIdx);
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  if (itemSuggestionsList) {
    itemSuggestionsList.addEventListener("pointerdown", function(e) {
      const option = e.target.closest(".omdb-option");
      if (!option) return;
      e.preventDefault();
      const idx = Number(option.getAttribute("data-index"));
      if (idx >= 0) {
        void chooseSuggestion(idx);
      }
    });
  }

  document.addEventListener("pointerdown", function(e) {
    if (!itemSuggestions.contains(e.target) && e.target !== itemInput) {
      hideSuggestions();
    }
  });
}
