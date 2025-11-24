document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset UI elements
      activitiesList.innerHTML = "";
      // Reset activity select while keeping the placeholder
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build the main card HTML (title, description, schedule, availability)
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Build participants list
        const participants = Array.isArray(details.participants) ? details.participants : [];
        const participantsContainer = document.createElement('div');
        participantsContainer.className = 'participants';

        const participantsTitle = document.createElement('h5');
        participantsTitle.textContent = 'Participants';
        participantsContainer.appendChild(participantsTitle);

        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        if (participants.length === 0) {
          const li = document.createElement('li');
          li.className = 'participant-empty';
          li.textContent = 'No participants yet';
          ul.appendChild(li);
        } else {
          participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'participant-name';
            nameSpan.textContent = p;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'participant-remove';
            removeBtn.type = 'button';
            removeBtn.title = `Remove ${p}`;
            removeBtn.innerHTML = '&times;';

            removeBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: 'POST' }
                );
                const resJson = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = resJson.message;
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  fetchActivities();
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
              setTimeout(() => {
                messageDiv.classList.add('hidden');
              }, 5000);
            });

            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
        }

        participantsContainer.appendChild(ul);
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly-signed-up participant appears
        // without requiring a manual page reload.
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
