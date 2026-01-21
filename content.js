/**********************
 *  GLOBAL STYLE
 **********************/
let IS_SINGLE_PAPER_VIEW = false;

function detectSinglePaperView() {
  // Abstract veya tek makale layout varsa
  if (
    document.querySelector(".gs_fma_abs") ||
    document.querySelector(".gs_scl_summ")
  ) {
    IS_SINGLE_PAPER_VIEW = true;
  }
}

detectSinglePaperView();

const style = document.createElement("style");
style.textContent = `
#scholar-note-overlay,
#scholar-notes-list-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 9999;
}

#scholar-note-modal,
#scholar-notes-list-modal {
  background: #fff;
  width: 520px;
  max-height: 75vh;
  overflow-y: auto;
  margin: 80px auto;
  padding: 15px;
  border-radius: 6px;
}

#scholar-note-modal textarea {
  width: 100%;
  height: 150px;
}

#scholar-note-modal .buttons {
  margin-top: 10px;
  text-align: right;
}

#scholar-note-modal button {
  margin-left: 8px;
}
`;
document.head.appendChild(style);

/**********************
 *  NOTE MODAL
 **********************/
function createModal() {
  if (document.getElementById("scholar-note-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "scholar-note-overlay";
  overlay.innerHTML = `
    <div id="scholar-note-modal">
      <h3>Paper Note</h3>
      <textarea id="scholar-note-text" placeholder="Write your note here..."></textarea>
      <div class="buttons">
        <button id="scholar-note-delete" style="display:none;color:#a00">
          Delete note
        </button>
        <button id="scholar-note-cancel">Cancel</button>
        <button id="scholar-note-save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("scholar-note-cancel").onclick = closeModal;
  overlay.onclick = e => {
    if (e.target.id === "scholar-note-overlay") closeModal();
  };
}

function openModal(existingNote, onSave, onDelete) {
  createModal();

  const textarea  = document.getElementById("scholar-note-text");
  const deleteBtn = document.getElementById("scholar-note-delete");

  textarea.value = existingNote || "";
  deleteBtn.style.display = existingNote ? "inline-block" : "none";

  document.getElementById("scholar-note-save").onclick = () => {
    onSave(textarea.value);
    closeModal();
  };

  deleteBtn.onclick = () => {
    if (confirm("Do you really want to delete this note?")) {
      onDelete();
      closeModal();
    }
  };
}

function closeModal() {
  const overlay = document.getElementById("scholar-note-overlay");
  if (overlay) overlay.remove();
}

/**********************
 *  ADD NOTE BUTTONS
 **********************/
function addNoteButtons() {
  const results = document.querySelectorAll(".gs_r.gs_or.gs_scl");

  results.forEach(result => {
    if (result.querySelector(".scholar-note-btn")) return;

    const cid = result.getAttribute("data-cid");
    if (!cid) return;

    const storageKey = "note_" + cid;

    chrome.storage.sync.get([storageKey], data => {
      const stored = data[storageKey];

      let noteText = "";
      let title = "";
      let url = "";

      if (stored && typeof stored === "object") {
        noteText = stored.note || "";
        title    = stored.title || "";
        url      = stored.url || "";
      }

      const btn = document.createElement("a");
      btn.className = "scholar-note-btn";
      btn.href = "#";
      btn.style.marginLeft = "8px";
      btn.style.cursor = "pointer";
      btn.textContent = noteText ? "📝 Edit note" : "📝 Add note";

	applyHighlight(result, noteText);







btn.onclick = e => {
  e.preventDefault();

  chrome.storage.sync.get([storageKey], data => {
    let freshNote = "";
    let stored = data[storageKey];

    if (typeof stored === "string") {
      freshNote = stored;
    } else if (stored && stored.note) {
      freshNote = stored.note;
    }

    openModal(
      freshNote,

      // onSave
      newNote => {
        const titleEl = result.querySelector("h3.gs_rt a");
        const newTitle = titleEl ? titleEl.textContent : "";
        const newUrl   = titleEl ? titleEl.href : "";
		const metaEl = result.querySelector(".gs_a");

		let authors = "";
		let publication = "";
		let year = "";

		if (metaEl) {
		  const text = metaEl.textContent;

		  // Böl: [authors] - [journal, year] - [site]
		  const parts = text.split(" - ");

		  if (parts.length > 0) {
			authors = parts[0].trim();
		  }

		  if (parts.length > 1) {
			const pubPart = parts[1];

			// Yıl ayıkla (4 haneli)
			const yearMatch = pubPart.match(/\b(19|20)\d{2}\b/);
			if (yearMatch) {
			  year = yearMatch[0];
			}

			// Dergi adı: yıldan önceki kısım
			publication = pubPart.replace(/,\s*\b(19|20)\d{2}\b.*/, "").trim();
		  }
		}


		chrome.storage.sync.set({
		  [storageKey]: {
			note: newNote,
			title: newTitle,
			url: newUrl,
			authors: authors,
			publication: publication,
			year: year,
			updatedAt: Date.now()
		  }
		}, () => {
		  updateNotesBadge();
		});


        btn.textContent = "📝 Edit note";
		applyHighlight(result, newNote);


        updateNotesBadge();
      },

      // onDelete
      () => {
        chrome.storage.sync.remove(storageKey);

        noteText = "";
        btn.textContent = "📝 Add note";
        result.style.background = "";
        result.style.borderLeft = "";

        updateNotesBadge();
      }
    );
  });
};

      const saveBtn = result.querySelector("a.gs_or_sav");
      if (saveBtn) saveBtn.insertAdjacentElement("afterend", btn);
    });
  });
}

function hasAbstractOrSummary(result) {
  return (
    result.querySelector(".gs_fma_abs") !== null ||
    result.querySelector(".gs_scl_summ") !== null
  );
}



/**********************
 *  TOP NOTES LINK
 **********************/

function addFloatingNotesLink() {
  if (document.getElementById("scholar-notes-floating")) return;

  const link = document.createElement("div");
  link.id = "scholar-notes-floating";
  link.textContent = "📚 My saved notes";

  link.style.position = "fixed";
  link.style.right = "12px";
  link.style.top = "50%";
  link.style.transform = "translateY(-50%)";
  link.style.background = "#1a73e8";
  link.style.color = "#fff";
  link.style.padding = "10px 12px";
  link.style.borderRadius = "6px 0 0 6px";
  link.style.cursor = "pointer";
  link.style.fontSize = "13px";
  link.style.zIndex = "9999";
  link.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  link.style.opacity = "0.85";

  link.onmouseenter = () => {
    link.style.opacity = "1";
  };

  link.onmouseleave = () => {
    link.style.opacity = "0.85";
  };

  link.onclick = () => {
    openNotesListModal();
  };

  document.body.appendChild(link);
}

function applyHighlight(result, noteText) {
  if (IS_SINGLE_PAPER_VIEW) return;
  if (!noteText) return;

  result.title =
    noteText.length > 300
      ? noteText.slice(0, 300) + "…"
      : noteText;

  result.style.background = "#fffbe6";
  result.style.borderLeft = "4px solid #f4c430";
  result.style.paddingLeft = "6px";
}



/**********************
 *  NOTES LIST MODAL
 **********************/
function openNotesListModal() {
  if (document.getElementById("scholar-notes-list-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "scholar-notes-list-overlay";
  overlay.innerHTML = `
    <div id="scholar-notes-list-modal">
      <h3>📚 My saved notes</h3>
      <div id="scholar-notes-list"></div>
      <button id="scholar-notes-list-close">Close</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("scholar-notes-list-close").onclick = () => {
    overlay.remove();
  };

  overlay.onclick = e => {
    if (e.target.id === "scholar-notes-list-overlay") overlay.remove();
  };

  loadNotesList();
}

function loadNotesList() {
  const container = document.getElementById("scholar-notes-list");
  container.innerHTML = "<p>Loading...</p>";

  chrome.storage.sync.get(null, data => {
    const notes = Object.entries(data)
	  .filter(([k, v]) => k.startsWith("note_") && v && typeof v === "object")
	  .sort((a, b) => {
		const t1 = a[1].updatedAt || 0;
		const t2 = b[1].updatedAt || 0;
		return t2 - t1; // DESC: newest first
	  });


    if (!notes.length) {
      container.innerHTML = "<p>No saved notes yet.</p>";
      return;
    }

    container.innerHTML = "";

    notes.forEach(([key, val]) => {
      const item = document.createElement("div");
      item.style.marginBottom = "12px";
      item.style.paddingBottom = "8px";
      item.style.borderBottom = "1px solid #eee";

      const title = document.createElement("strong");
      title.textContent = val.title || "Untitled paper";
      title.style.cursor = "pointer";

      title.onclick = () => {
        if (val.url) window.open(val.url, "_blank");
      };
		const meta = document.createElement("div");
		meta.style.fontSize = "12px";
		meta.style.color = "#444";
		meta.style.margin = "2px 0";

		const metaParts = [];

		if (val.authors) metaParts.push(val.authors);
		if (val.publication) metaParts.push(val.publication);
		if (val.year) metaParts.push(val.year);

		meta.textContent = metaParts.join(" • ");

		const links = document.createElement("div");
		links.style.fontSize = "12px";
		links.style.marginTop = "4px";

		const pubLink = document.createElement("a");
		pubLink.textContent = "Publisher page";
		pubLink.href = val.url;
		pubLink.target = "_blank";
		pubLink.style.marginRight = "10px";

		const scholarLink = document.createElement("a");
		scholarLink.textContent = "View on Scholar";
		scholarLink.href =
		  "https://scholar.google.com/scholar?q=" +
		  encodeURIComponent(val.title);
		scholarLink.target = "_blank";

		links.appendChild(pubLink);
		links.appendChild(scholarLink);


      const preview = document.createElement("div");
      preview.style.fontSize = "12px";
      preview.style.color = "#555";
      preview.textContent =
        val.note.slice(0, 120) + (val.note.length > 120 ? "..." : "");

		const date = document.createElement("div");
		date.style.fontSize = "11px";
		date.style.color = "#888";
		date.style.marginTop = "2px";

		let editedText = "Last edited: unknown";

		if (val.updatedAt && !isNaN(val.updatedAt)) {
		  const d = new Date(val.updatedAt);
		  editedText = "Last edited: " + d.toLocaleString();
		}
		date.textContent = editedText;

      const remove = document.createElement("span");
      remove.textContent = "Remove note";
      remove.style.color = "#a00";
      remove.style.fontSize = "12px";
      remove.style.cursor = "pointer";
      remove.style.marginLeft = "10px";

      remove.onclick = () => {
        if (!confirm("Remove this note?")) return;

		chrome.storage.sync.remove(key, () => {
		  const cid = key.replace("note_", "");   // ⭐ KRİTİK SATIR
		  resetResultHighlightByCid(cid);          // ⭐ ANA SAYFAYI TEMİZLE
		  loadNotesList();                         // listeyi yenile
		  updateNotesBadge();                     // badge güncelle
		});

      };
	  
	  const previewBox = document.createElement("div");
		previewBox.style.marginTop = "6px";
		previewBox.style.padding = "6px 8px";
		previewBox.style.background = "#f6f6f6";
		previewBox.style.border = "1px solid #e0e0e0";
		previewBox.style.borderRadius = "4px";
		previewBox.style.fontSize = "12px";
		previewBox.style.color = "#555";
	previewBox.appendChild(preview);

	  
      item.appendChild(document.createElement("br"));
      item.appendChild(title);
      item.appendChild(document.createElement("br"));
	  item.appendChild(meta);
	  //item.appendChild(document.createElement("br"));
	  item.appendChild(links);
	  //item.appendChild(document.createElement("br"));	  
      item.appendChild(previewBox);
	  item.appendChild(document.createElement("br"));
	  item.appendChild(date);
      //item.appendChild(document.createElement("br"));
      item.appendChild(remove);

      container.appendChild(item);
    });
  });
}

function getNotesCount(callback) {
  chrome.storage.sync.get(null, data => {
    const count = Object.keys(data).filter(
      k => k.startsWith("note_") && data[k]
    ).length;
    callback(count);
  });
}

function addFloatingNotesPanel() {
  if (document.getElementById("scholar-notes-floating-panel")) return;

  const panel = document.createElement("div");
  panel.id = "scholar-notes-floating-panel";

  panel.style.position = "fixed";
  panel.style.right = "12px";
  panel.style.top = "50%";
  panel.style.transform = "translateY(-50%)";
  panel.style.zIndex = "9999";
  panel.style.fontFamily = "Arial, sans-serif";

	panel.innerHTML = `
	  <div id="scholar-notes-btn-main" style="
		background:#1a73e8;
		color:#fff;
		padding:10px 12px;
		border-radius:6px 0 0 0;
		cursor:pointer;
		font-size:13px;
		box-shadow:0 2px 6px rgba(0,0,0,0.2);
		opacity:0.9;
		position:relative;
	  ">
		📚 My saved notes
		<span id="scholar-notes-badge" style="
		  position:absolute;
		  top:-6px;
		  right:-6px;
		  background:#e53935;
		  color:#fff;
		  font-size:11px;
		  padding:2px 6px;
		  border-radius:10px;
		  display:none;
		">0</span>
	  </div>

	  <div id="scholar-notes-btn-save" style="
		background:#f1f3f4;
		color:#333;
		padding:8px 12px;
		cursor:pointer;
		font-size:12px;
		border-top:1px solid #ddd;
	  ">
		💾 Export notes
	  </div>

	  <div id="scholar-notes-btn-clear" style="
		background:#fafafa;
		color:#a00;
		padding:6px 12px;
		cursor:pointer;
		font-size:11px;
		border-top:1px solid #eee;
		border-radius:0 0 0 6px;
	  ">
		⚠️ Clear all notes
	  </div>
	`;
	



  document.body.appendChild(panel);

  const mainBtn = document.getElementById("scholar-notes-btn-main");
  const saveBtn = document.getElementById("scholar-notes-btn-save");

  mainBtn.onclick = () => openNotesListModal();

  saveBtn.onclick = () => {
    alert("Export notes feature will be available in a future version.");
  };

  // hover efekti
  panel.onmouseenter = () => panel.style.opacity = "1";
  panel.onmouseleave = () => panel.style.opacity = "0.9";


	const clearBtn = document.getElementById("scholar-notes-btn-clear");

	clearBtn.onclick = () => {
	  if (!confirm("This will permanently delete ALL your notes. Continue?")) {
		return;
	  }

	  chrome.storage.sync.get(null, data => {
		const keysToRemove = Object.keys(data).filter(k =>
		  k.startsWith("note_")
		);

		if (!keysToRemove.length) return;

		chrome.storage.sync.remove(keysToRemove, () => {
		  updateNotesBadge();

		  // 🔄 Reset current page UI
		  document.querySelectorAll(".gs_r.gs_or.gs_scl").forEach(result => {
			result.style.background = "";
			result.style.borderLeft = "";
			result.style.paddingLeft = "";

			const btn = result.querySelector(".scholar-note-btn");
			if (btn) {
			  btn.textContent = "📝 Add note";
			}
		  });

		  // 🔄 Refresh open notes list if visible
		  if (document.getElementById("scholar-notes-list")) {
			loadNotesList();
		  }
		});
	  });
	};





  updateNotesBadge();
}

function updateNotesBadge() {
  const badge = document.getElementById("scholar-notes-badge");
  if (!badge) return;

  getNotesCount(count => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  });
}

function resetResultHighlightByCid(cid) {
  const results = document.querySelectorAll(".gs_r.gs_or.gs_scl");

  results.forEach(result => {
    if (result.getAttribute("data-cid") === cid) {
      // highlight temizle
      result.style.background = "";
      result.style.borderLeft = "";
      result.style.paddingLeft = "";

      // buton resetle
      const btn = result.querySelector(".scholar-note-btn");
      if (btn) {
        btn.textContent = "📝 Add note";
      }
    }
  });
}



/**********************
 *  INIT
 **********************/
addFloatingNotesPanel();
addNoteButtons();
setInterval(addNoteButtons, 2000);