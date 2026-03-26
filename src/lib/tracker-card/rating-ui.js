export function renderStaticStars(rating) {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    const isActive = i <= rating;
    const cls = isActive ? "star active" : "star inactive";
    const icon = isActive ? "star" : "star_border";
    starsHtml += `<span class="material-icons ${cls}">${icon}</span>`;
  }
  return starsHtml;
}

export function initRatingInput({ container, input }) {
  if (!container) {
    return {
      setRating: () => {},
      reset: () => {},
      getRating: () => Number(input?.value || 0)
    };
  }

  let selectedRating = Number(input?.value || 0);
  let hoveredRating = 0;

  function ensureInteractiveStars() {
    if (container.children.length === 5) return;
    container.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("button");
      star.type = "button";
      star.className = "material-icons star inactive";
      star.dataset.rating = String(i);
      star.setAttribute("aria-label", `Set rating to ${i}`);
      star.textContent = "star_border";
      container.appendChild(star);
    }
  }

  function render() {
    ensureInteractiveStars();
    const displayRating = hoveredRating > 0 ? hoveredRating : selectedRating;
    Array.from(container.children).forEach((star, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= displayRating;
      const isHovered = hoveredRating > 0 && starValue <= hoveredRating;
      star.className = `material-icons star ${isHovered ? "hovered" : isFilled ? "active" : "inactive"}`;
      star.textContent = isFilled ? "star" : "star_border";
    });
    if (input) input.value = String(selectedRating);
  }

  function getRatingFromEvent(e) {
    const buttons = Array.from(container.querySelectorAll("[data-rating]"));
    if (!buttons.length) return 0;

    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    const directStar = targetEl?.closest("[data-rating]");
    if (directStar) return Number(directStar.dataset.rating);

    const x = e.clientX;
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) {
        return Number(button.dataset.rating);
      }
    }

    let nearest = buttons[0];
    let minDist = Infinity;
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(x - center);
      if (dist < minDist) {
        minDist = dist;
        nearest = button;
      }
    }
    return Number(nearest.dataset.rating);
  }

  function resetHoveredStars() {
    hoveredRating = 0;
    render();
  }

  function selectFromEvent(e) {
    const rating = getRatingFromEvent(e);
    if (rating > 0) {
      selectedRating = rating;
      hoveredRating = 0;
      render();
    }
  }

  container.addEventListener("pointermove", function(e) {
    const rating = getRatingFromEvent(e);
    if (rating > 0) {
      hoveredRating = rating;
      render();
    }
  });
  container.addEventListener("mouseleave", resetHoveredStars);
  container.addEventListener("pointerleave", resetHoveredStars);
  container.addEventListener("focusout", function() {
    requestAnimationFrame(() => {
      if (!container.contains(document.activeElement)) {
        resetHoveredStars();
      }
    });
  });
  container.addEventListener("pointerdown", selectFromEvent);
  container.addEventListener("click", selectFromEvent);
  container.addEventListener("keydown", function(e) {
    const star = e.target.closest("[data-rating]");
    if (star && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      selectedRating = Number(star.dataset.rating);
      hoveredRating = 0;
      render();
    }
  });

  render();

  return {
    setRating(value) {
      selectedRating = Math.max(0, Math.min(5, Number(value) || 0));
      hoveredRating = 0;
      render();
    },
    reset() {
      selectedRating = 0;
      hoveredRating = 0;
      render();
    },
    getRating() {
      return selectedRating;
    }
  };
}
