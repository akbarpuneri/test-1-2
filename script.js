document.addEventListener('DOMContentLoaded', () => {
    const btnProposer = document.getElementById('btnProposer');
    const btnReviewer = document.getElementById('btnReviewer');
    const proposerView = document.getElementById('proposerView');
    const reviewerView = document.getElementById('reviewerView');
    const notaForm = document.getElementById('notaForm');
    const financialCsvInput = document.getElementById('financialCsv');
    const csvPreview = document.getElementById('csvPreview');
    const notaListDiv = document.getElementById('notaList');
    const notificationArea = document.getElementById('notificationArea');

    // Simulate a list of potential reviewers for the escalation logic
    const ALL_REVIEWERS =;

    let currentUserRole = 'proposer'; // Default role on page load
    // Load notas from localStorage or initialize as empty array
    let notas = JSON.parse(localStorage.getItem('notas')) ||;

    // --- Role-Based Access Control (RBAC) ---
    function switchView(role) {
        currentUserRole = role;
        btnProposer.classList.remove('active');
        btnReviewer.classList.remove('active');
        proposerView.classList.remove('active');
        reviewerView.classList.remove('active');

        if (role === 'proposer') {
            btnProposer.classList.add('active');
            proposerView.classList.add('active');
            // Ensure form fields are enabled for proposer
            notaForm.querySelectorAll('input, textarea, button[type="submit"]').forEach(el => {
                el.removeAttribute('disabled');
            });
            document.getElementById('submitNota').style.display = 'block';
        } else { // reviewer
            btnReviewer.classList.add('active');
            reviewerView.classList.add('active');
            // Disable form fields for reviewer
            notaForm.querySelectorAll('input, textarea, button[type="submit"]').forEach(el => {
                el.setAttribute('disabled', 'true');
            });
            document.getElementById('submitNota').style.display = 'none';
            renderNotasForReview();
            checkOverdueNotas(); // Check for overdue notas when reviewer view is active
        }
    }

    btnProposer.addEventListener('click', () => switchView('proposer'));
    btnReviewer.addEventListener('click', () => switchView('reviewer'));

    // Initial view setup
    switchView(currentUserRole);

    // --- CSV File Validation and Preview ---
    window.validateCsvFile = function() {
        const fileInput = document.getElementById('financialCsv');
        const file = fileInput.files;
        const messageDiv = document.getElementById('csvValidationMessage');
        csvPreview.innerHTML = ''; // Clear previous preview

        if (!file) {
            messageDiv.textContent = 'Silakan unggah file CSV.';
            fileInput.classList.add('invalid');
            return false;
        }

        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (fileExtension!== 'csv') {
            messageDiv.textContent = 'Tipe file tidak valid. Harap unggah file.csv.';
            fileInput.value = ''; // Clear the input
            fileInput.classList.add('invalid');
            return false;
        }

        messageDiv.textContent = ''; // Clear previous message
        fileInput.classList.remove('invalid');
        fileInput.classList.add('valid');

        // Read and display CSV content (simple preview)
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim()!== '');
            if (lines.length > 0) {
                let html = '<table><thead><tr>';
                const headers = lines.split(',').map(h => h.trim());
                headers.forEach(header => {
                    html += `<th>${header}</th>`;
                });
                html += '</tr></thead><tbody>';
                for (let i = 1; i < Math.min(lines.length, 5); i++) { // Show max 4 data rows
                    html += '<tr>';
                    const cells = lines[i].split(',').map(c => c.trim());
                    cells.forEach(cell => {
                        html += `<td>${cell}</td>`;
                    });
                    html += '</tr>';
                }
                html += '</tbody></table>';
                if (lines.length > 5) {
                    html += '<p>... dan data lainnya.</p>';
                }
                csvPreview.innerHTML = html;
            } else {
                csvPreview.innerHTML = '<p>File CSV kosong atau tidak memiliki data.</p>';
            }
        };
        reader.readAsText(file);
        return true;
    };

    // --- Form Submission and Validation ---
    notaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (currentUserRole!== 'proposer') {
            showNotification('Anda tidak memiliki izin untuk mengajukan nota.', 'error');
            return;
        }

        let allFieldsFilled = true;
        const requiredFields = notaForm.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            const validationMessageId = field.id + 'ValidationMessage';
            const validationMessageDiv = document.getElementById(validationMessageId);

            if (!field.value.trim()) {
                allFieldsFilled = false;
                field.classList.add('invalid');
                if (validationMessageDiv) {
                    validationMessageDiv.textContent = 'Bidang ini wajib diisi.';
                }
            } else {
                field.classList.remove('invalid');
                field.classList.add('valid');
                if (validationMessageDiv) {
                    validationMessageDiv.textContent = '';
                }
            }
        });

        // Specific validation for CSV file
        if (!validateCsvFile()) {
            allFieldsFilled = false;
        }

        if (allFieldsFilled) {
            const newNota = {
                id: Date.now(),
                financialDataHtml: csvPreview.innerHTML, // Store preview HTML for simplicity
                aspekKepentingan: document.getElementById('aspekKepentingan').value,
                aspekLingkungan: document.getElementById('aspekLingkungan').value,
                aspekFiskal: document.getElementById('aspekFiskal').value,
                aspekPelayanan: document.getElementById('aspekPelayanan').value,
                aspekLegal: document.getElementById('aspekLegal').value,
                aspekManajemenRisiko: document.getElementById('aspekManajemenRisiko').value,
                aspekCG: document.getElementById('aspekCG').value,
                aspekLainnya: document.getElementById('aspekLainnya').value |

| 'Tidak ada', // Optional field
                status: 'Dalam Peninjauan',
                submissionDate: new Date().toISOString(),
                reviewerComments:,
                reviewersActioned: // To track which reviewers have commented/acted
            };
            notas.push(newNota);
            localStorage.setItem('notas', JSON.stringify(notas));
            notaForm.reset();
            csvPreview.innerHTML = ''; // Clear CSV preview after submission
            // Clear validation styles
            requiredFields.forEach(field => {
                field.classList.remove('valid', 'invalid');
                const validationMessageId = field.id + 'ValidationMessage';
                const validationMessageDiv = document.getElementById(validationMessageId);
                if (validationMessageDiv) validationMessageDiv.textContent = '';
            });
            financialCsvInput.classList.remove('valid', 'invalid');

            showNotification('Nota Analisa Investasi berhasil diajukan!', 'success');
        } else {
            showNotification('Harap lengkapi semua bidang wajib.', 'error');
        }
    });

    // --- Reviewer View Rendering ---
    function renderNotasForReview() {
        notaListDiv.innerHTML = '';
        if (notas.length === 0) {
            notaListDiv.innerHTML = '<p>Tidak ada nota untuk ditinjau.</p>';
            return;
        }

        // Sort by submission date, oldest first
        notas.sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));

        notas.forEach(nota => {
            const notaItem = document.createElement('div');
            notaItem.classList.add('nota-item');
            notaItem.dataset.id = nota.id;

            const submissionDate = new Date(nota.submissionDate);
            const today = new Date();
            const diffDays = Math.floor((today - submissionDate) / (1000 * 60 * 60 * 24));

            let statusClass = '';
            let statusText = nota.status;
            let unresponsiveReviewers =;

            if (nota.status === 'Dalam Peninjauan') {
                unresponsiveReviewers = ALL_REVIEWERS.filter(reviewer =>!nota.reviewersActioned.includes(reviewer));
                if (diffDays >= 5) {
                    statusClass = 'returned';
                    statusText = `Dikembalikan (Reviewer Belum Bertindak: ${unresponsiveReviewers.length > 0? unresponsiveReviewers.join(', ') : 'Tidak Ada'})`;
                } else if (diffDays >= 3) {
                    statusClass = 'overdue';
                    statusText = `Perlu Perhatian Segera (${diffDays} hari)`;
                } else {
                    statusClass = 'pending';
                }
            } else if (nota.status === 'Disetujui') {
                statusClass = 'approved';
            } else if (nota.status === 'Ditolak') {
                statusClass = 'rejected';
            } else if (nota.status === 'Dikembalikan untuk Revisi/Tindak Lanjut') {
                statusClass = 'returned';
                statusText = `Dikembalikan (Reviewer Belum Bertindak: ${unresponsiveReviewers.length > 0? unresponsiveReviewers.join(', ') : 'Tidak Ada'})`;
            }


            notaItem.innerHTML = `
                <h3>Nota #${nota.id} - Diajukan pada: ${submissionDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</h3>
                <p>Status: <span class="status ${statusClass}">${statusText}</span></p>
                <button class="toggle-detail">Lihat Detail</button>
                <div class="nota-detail" style="display: none;">
                    <h4>Detail Finansial:</h4>
                    <div class="csv-preview">${nota.financialDataHtml}</div>
                    <h4>Aspek Kajian:</h4>
                    <p><strong>Kepentingan / Objektivitas / Tujuan:</strong> ${nota.aspekKepentingan}</p>
                    <p><strong>Lingkungan, Sosial, dan Ekonomi:</strong> ${nota.aspekLingkungan}</p>
                    <p><strong>Fiskal:</strong> ${nota.aspekFiskal}</p>
                    <p><strong>Pelayanan dan Operasional:</strong> ${nota.aspekPelayanan}</p>
                    <p><strong>Legal:</strong> ${nota.aspekLegal}</p>
                    <p><strong>Manajemen Risiko:</strong> ${nota.aspekManajemenRisiko}</p>
                    <p><strong>Corporate Governance & Compliance:</strong> ${nota.aspekCG}</p>
                    <p><strong>Aspek Lainnya:</strong> ${nota.aspekLainnya}</p>

                    <div class="comment-section">
                        <h4>Komentar Reviewer:</h4>
                        <div class="reviewer-comments" id="comments-${nota.id}">
                            ${nota.reviewerComments.length > 0? nota.reviewerComments.map(c => `<p><strong>${c.reviewer}</strong> (${new Date(c.date).toLocaleDateString('id-ID')}): ${c.comment}</p>`).join('') : '<p>Belum ada komentar.</p>'}
                        </div>
                        <textarea placeholder="Tambahkan komentar Anda..." id="commentInput-${nota.id}" rows="2"></textarea>
                        <button class="add-comment" data-id="${nota.id}">Tambah Komentar</button>
                    </div>
                    <button class="approve-nota" data-id="${nota.id}">Setujui</button>
                    <button class="reject-nota reject" data-id="${nota.id}">Tolak</button>
                </div>
            `;
            notaListDiv.appendChild(notaItem);
        });

        addReviewerEventListeners();
    }

    function addReviewerEventListeners() {
        document.querySelectorAll('.toggle-detail').forEach(button => {
            button.addEventListener('click', (e) => {
                const detailDiv = e.target.nextElementSibling;
                detailDiv.style.display = detailDiv.style.display === 'none'? 'block' : 'none';
            });
        });

        document.querySelectorAll('.add-comment').forEach(button => {
            button.addEventListener('click', (e) => {
                const notaId = parseInt(e.target.dataset.id);
                const commentInput = document.getElementById(`commentInput-${notaId}`);
                const comment = commentInput.value.trim();
                if (comment) {
                    const notaIndex = notas.findIndex(n => n.id === notaId);
                    if (notaIndex!== -1) {
                        // Simulate reviewer name (in a real app, this would be authenticated user)
                        const currentReviewer = ALL_REVIEWERS; // Random reviewer for demo
                        notas[notaIndex].reviewerComments.push({ reviewer: currentReviewer, comment: comment, date: new Date().toISOString() });
                        if (!notas[notaIndex].reviewersActioned.includes(currentReviewer)) {
                            notas[notaIndex].reviewersActioned.push(currentReviewer);
                        }
                        localStorage.setItem('notas', JSON.stringify(notas));
                        commentInput.value = '';
                        renderNotasForReview(); // Re-render to show new comment
                        showNotification('Komentar berhasil ditambahkan.', 'success');
                    }
                } else {
                    showNotification('Komentar tidak boleh kosong.', 'error');
                }
            });
        });

        document.querySelectorAll('.approve-nota').forEach(button => {
            button.addEventListener('click', (e) => {
                const notaId = parseInt(e.target.dataset.id);
                updateNotaStatus(notaId, 'Disetujui');
            });
        });

        document.querySelectorAll('.reject-nota').forEach(button => {
            button.addEventListener('click', (e) => {
                const notaId = parseInt(e.target.dataset.id);
                updateNotaStatus(notaId, 'Ditolak');
            });
        });
    }

    function updateNotaStatus(notaId, status) {
        const notaIndex = notas.findIndex(n => n.id === notaId);
        if (notaIndex!== -1) {
            notas[notaIndex].status = status;
            // Mark all reviewers as actioned if approved/rejected to stop further escalations
            if (status === 'Disetujui' |

| status === 'Ditolak') {
                notas[notaIndex].reviewersActioned = ALL_REVIEWERS;
            }
            localStorage.setItem('notas', JSON.stringify(notas));
            renderNotasForReview();
            showNotification(`Nota #${notaId} berhasil ${status.toLowerCase()}.`, 'success');
        }
    }

    // --- Notification and Escalation Logic ---
    function showNotification(message, type = 'info') {
        notificationArea.textContent = message;
        notificationArea.className = `notification-area show ${type}`;
        setTimeout(() => {
            notificationArea.classList.remove('show');
        }, 5000); // Hide after 5 seconds
    }

    function checkOverdueNotas() {
        const today = new Date();
        let notificationsTriggered = false;

        notas.forEach(nota => {
            if (nota.status === 'Dalam Peninjauan') {
                const submissionDate = new Date(nota.submissionDate);
                const diffDays = Math.floor((today - submissionDate) / (1000 * 60 * 60 * 24));

                if (diffDays >= 5) {
                    // Auto-send back to Proposer
                    if (nota.status!== 'Dikembalikan untuk Revisi/Tindak Lanjut') { // Prevent multiple returns
                        nota.status = 'Dikembalikan untuk Revisi/Tindak Lanjut';
                        const unresponsive = ALL_REVIEWERS.filter(reviewer =>!nota.reviewersActioned.includes(reviewer));
                        const notificationMsg = `Nota #${nota.id} dikembalikan ke Proposer. Reviewer yang belum bertindak: ${unresponsive.length > 0? unresponsive.join(', ') : 'Tidak ada'}.`;
                        showNotification(notificationMsg, 'warning');
                        notificationsTriggered = true;
                        // In a real app, this would trigger an email to Proposer
                    }
                } else if (diffDays >= 3) {
                    // Warning for committee
                    // Only show warning if not already returned and not already actioned by all
                    const unresponsive = ALL_REVIEWERS.filter(reviewer =>!nota.reviewersActioned.includes(reviewer));
                    if (unresponsive.length > 0) {
                        const notificationMsg = `Peringatan: Nota #${nota.id} belum ditinjau selama ${diffDays} hari. Harap segera tinjau.`;
                        showNotification(notificationMsg, 'warning');
                        notificationsTriggered = true;
                        // In a real app, this would trigger an email to Reviewers
                    }
                }
            }
        });

        if (notificationsTriggered) {
            localStorage.setItem('notas', JSON.stringify(notas)); // Save any status changes
            renderNotasForReview(); // Update UI to reflect status changes
        }
    }

    // Periodically check for overdue notas (e.g., every 12 hours in a real app, or on page load/role switch)
    // For this static demo, we'll run it on reviewer view activation and once on page load.
    // setInterval(checkOverdueNotas, 12 * 60 * 60 * 1000); // Example for real app
    checkOverdueNotas(); // Run once on page load
});