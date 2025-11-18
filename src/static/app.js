document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById("activities-list");
  const activitySelectEl = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  async function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
      messageEl.className = "hidden";
      messageEl.textContent = "";
    }, 4000);
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderParticipants(participants) {
    const container = document.createElement("div");
    container.className = "participants";

    const title = document.createElement("h5");
    title.textContent = "Deelnemers";
    const countSpan = document.createElement("span");
    countSpan.className = "count";
    countSpan.textContent = `(${participants.length})`;
    title.appendChild(countSpan);
    container.appendChild(title);

    if (!participants || participants.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Nog geen deelnemers.";
      container.appendChild(empty);
      return container;
    }

    const ul = document.createElement("ul");
    participants.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      ul.appendChild(li);
    });
    container.appendChild(ul);
    return container;
  }

  function createActivityCard(name, info) {
    const card = document.createElement("div");
    card.className = "activity-card";

    const h4 = document.createElement("h4");
    h4.textContent = name;
    card.appendChild(h4);

    const desc = document.createElement("p");
    desc.textContent = info.description;
    card.appendChild(desc);

    const schedule = document.createElement("p");
    schedule.textContent = `Schema: ${info.schedule}`;
    card.appendChild(schedule);

    // Participants section
    const participantsSection = renderParticipants(info.participants || []);
    card.appendChild(participantsSection);

    return card;
  }

  async function loadActivities() {
    activitiesListEl.innerHTML = "<p>Loading activities...</p>";
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const activities = await res.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants.map(email => `
                  <li class="participant-item">
                    <span>${email}</span>
                    <span class="delete-participant" title="Unregister" data-activity="${name}" data-email="${email}">&#128465;</span>
                  </li>
                `).join("")}
              </ul>
            </div>
        `;

        activitiesList.appendChild(activityCard);
  // Event delegation for delete icon
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-participant")) {
      const activity = event.target.getAttribute("data-activity");
      const email = event.target.getAttribute("data-email");
      try {
        const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
          method: "POST"
        });
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message || "Participant removed.";
          messageDiv.className = "success";
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "Failed to remove participant.";
          messageDiv.className = "error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } catch (error) {
        messageDiv.textContent = "Failed to remove participant. Please try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    }
  });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // fill select
      clearChildren(activitySelectEl);
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select an activity --";
      activitySelectEl.appendChild(placeholder);
      Object.keys(activities).forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        activitySelectEl.appendChild(opt);
      });
    } catch (err) {
      activitiesListEl.innerHTML = "<p>Kon de activiteiten niet laden.</p>";
      console.error(err);
    }
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!email || !activity) {
      showMessage("Vul een e-mail en kies een activiteit.", "error");
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Inschrijving mislukt");
      }
      const body = await res.json();
      showMessage(body.message || "Inschrijving gelukt!", "success");
      // refresh activities to show updated participants
      await loadActivities();
      signupForm.reset();
    } catch (err) {
      showMessage(err.message || "Er trad een fout op.", "error");
      console.error(err);
    }
  });

  // initial load
  loadActivities();
});
