// grab CSRF from cookie
function getCookie(name) {
    let v = null;
    document.cookie.split(';').forEach(c => {
        const [k, val] = c.trim().split('=');
        if (k === name) v = decodeURIComponent(val);
    });
    return v;
}
document.addEventListener('DOMContentLoaded', () => {

    // ————————————————————————————————
    // vars change pass modal
    // ————————————————————————————————
    const passBtn = document.getElementById('change-password');
    const passModal = document.getElementById('pass-modal');
    const passContent = document.getElementById('pass-modal-content');
    const passCloseBtn = document.getElementById('pass-closeBtn');
    const passCurrent = document.getElementById('current-password');
    const passNew = document.getElementById('new-password');
    const passConfirm = document.getElementById('confirm-password');
    const passSubmit = document.getElementById('pass-submit');
    const passNewErr = document.getElementById('new-password-error');
    const passErrors = document.getElementById('password-errors');

    const toggleCurrentPassword = document.getElementById('toggleCurrentPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    // ————————————————————————————————
    // vars change email modal
    // ————————————————————————————————
    const emailBtn = document.getElementById('change-email');
    const emailModal = document.getElementById('email-modal');
    const emailContent = document.getElementById('email-modal-content');
    const emailCloseBtn = document.getElementById('email-closeBtn');
    const emailNew = document.getElementById('new-email');
    const emailCurrentPass = document.getElementById('email-current-password');
    const emailSubmit = document.getElementById('email-submit');
    const emailErrors = document.getElementById('email-errors');
    const emailNewError = document.getElementById('new-email-error');

    const toggleEmailCurrentPassword = document.getElementById('toggleEmailCurrentPassword');

    // ————————————————————————————————
    // vars import modal
    // ————————————————————————————————
    const importBtn = document.getElementById('import-btn');
    const importModal = document.getElementById('import-modal');
    const importModalContent = document.getElementById('import-modal-content');
    const fileInput = document.getElementById('import-file-input');
    const importFeedback = document.getElementById('import-feedback');
    const fileNameDisplay = document.getElementById('file-name-display');
    const confirmImportBtn = document.getElementById('confirm-import-btn');
    const importCancelBtn = document.getElementById('cancel-import-btn');
    const dropzone = importModalContent.querySelector('.group\\/dropzone div');

    // --------- animate open/close modal 

    function showModal(modalWrapper, modalContent) {
        document.body.classList.add('overflow-hidden');
        // Enable interaction
        modalWrapper.classList.remove('opacity-0', 'pointer-events-none');
        modalWrapper.classList.add('opacity-100', 'pointer-events-auto');

        // Animate content
        modalContent.classList.remove('opacity-0', 'scale-95');
        modalContent.classList.add('opacity-100', 'scale-100');
    }

    function hideModal(modalWrapper, modalContent) {
        document.body.classList.remove('overflow-hidden');
        // Start content fade out
        modalContent.classList.remove('opacity-100', 'scale-100');
        modalContent.classList.add('opacity-0', 'scale-95');

        // Start overlay fade out
        modalWrapper.classList.remove('opacity-100');
        modalWrapper.classList.add('opacity-0');

        // Wait for animation to complete, then disable pointer events
        setTimeout(() => {
            modalWrapper.classList.add('pointer-events-none');
            modalWrapper.classList.remove('pointer-events-auto');
        }, 300); // match Tailwind duration-300
    }

    // --------- input show/hide password modal 

    const toggleVisibility = (inputElement, eyeSlashIconId, eyeOpenIconId) => {
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        const eyeSlashIcon = document.getElementById(eyeSlashIconId);
        const eyeOpenIcon = document.getElementById(eyeOpenIconId);

        if (type === 'password') {
            eyeSlashIcon.classList.remove('hidden');
            eyeOpenIcon.classList.add('hidden');
        } else {
            eyeSlashIcon.classList.add('hidden');
            eyeOpenIcon.classList.remove('hidden');
        }
    }

    // ————————————————————————————————
    // for change password
    // ————————————————————————————————

    passBtn.addEventListener('click', () => {
        showModal(passModal, passContent);
    });

    passCloseBtn.addEventListener('click', () => {
        hideModal(passModal, passContent);
    });

    passModal.addEventListener('click', e => {
        if (e.target === passModal) {
            hideModal(passModal, passContent);
        }
    });

    toggleCurrentPassword.addEventListener('click', () => {
        toggleVisibility(passCurrent, 'eye-slash-icon-current', 'eye-open-icon-current');
    });

    toggleNewPassword.addEventListener('click', () => {
        toggleVisibility(passNew, 'eye-slash-icon-new', 'eye-open-icon-new');
    });

    toggleConfirmPassword.addEventListener('click', () => {
        toggleVisibility(passConfirm, 'eye-slash-icon-confirm', 'eye-open-icon-confirm');
    });

    passSubmit.addEventListener('click', async () => {
        const currentPasswordValue = passCurrent.value.trim();
        const newPasswordValue = passNew.value.trim();
        const confirmPasswordValue = passConfirm.value.trim();

        // clear old errors
        passErrors.textContent = ''
        passNewErr.textContent = ''

        // Password: min 8 chars, uppercase, lowercase, digit, symbol
        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!newPasswordValue) {
            passNewErr.textContent = 'Password is required.';
            return;
        } else if (!pwdRegex.test(newPasswordValue)) {
            passNewErr.textContent = 'Min 8 chars with uppercase, lowercase, number & symbol.';
            return;
        }
        if (newPasswordValue !== confirmPasswordValue) {
            passErrors.textContent = 'New passwords do not match.';
            return;
        }
        if (!currentPasswordValue) {
            passErrors.textContent = 'Current Password is required.';
            return;
        }

        const payload = {
            current_password: currentPasswordValue,
            new_password: newPasswordValue
        };

        try {
            const response = await fetch('/auth/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const json = await response.json();

            if (json.success) {
                // Clear the inputs
                passCurrent.value = '';
                passNew.value = '';
                passConfirm.value = '';
                hideModal(passModal, passContent);
                showToast('Password changed successfully!', 'success');
            } else {
                passErrors.textContent = json.error || 'Error changing password.';
            }

        } catch (error) {
            console.error('Password change error:', error);
            passErrors.textContent = 'Network or server error.';
        }
    });

    // ————————————————————————————————
    // for edit email
    // ————————————————————————————————

    emailBtn.addEventListener('click', () => {
        showModal(emailModal, emailContent);
    });

    emailCloseBtn.addEventListener('click', () => {
        hideModal(emailModal, emailContent);
    });

    emailModal.addEventListener('click', e => {
        if (e.target === emailModal) {
            hideModal(emailModal, emailContent);
        }
    });

    toggleEmailCurrentPassword.addEventListener('click', () => {
        toggleVisibility(emailCurrentPass, 'eye-slash-icon-email-current', 'eye-open-icon-email-current');
    });


    emailSubmit.addEventListener('click', async () => {

        const currentPasswordValue = emailCurrentPass.value.trim();
        const newEmailValue = emailNew.value.trim();

        // clear old errors
        emailErrors.textContent = ''
        emailNewError.textContent = ''

        // 2) Email: basic format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|io|co)$/i;
        if (!newEmailValue) {
            emailNewError.textContent = 'Email is required.';
            return;
        } else if (!emailRegex.test(newEmailValue)) {
            emailNewError.textContent = 'Invalid email (e.g. user@example.com).';
            return;
        }

        if (!currentPasswordValue) {
            emailErrors.textContent = 'Password is required'
            return;
        }

        const payload = {
            current_password: currentPasswordValue,
            new_email: newEmailValue
        };

        try {
            const response = await fetch('/auth/change-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Server returned status ' + response.status);
            }

            const json = await response.json();

            if (json.success) {
                emailCurrentPass.value = '';
                emailNew.value = '';
                hideModal(emailModal, emailContent);
                document.getElementById('user-email').textContent = newEmailValue;
                document.getElementById('current-email').value = newEmailValue;

                showToast('Email changed successfully!', 'success');

            } else {
                emailErrors.textContent = json.error || 'Error changing email';
            }

        } catch (error) {
            console.error('Change email error:', error);
            emailErrors.textContent = 'Network or server error';
        }
    });


    // ————————————————————————————————
    //   for import json
    // ————————————————————————————————

    // Keep track of the file chosen by the user
    let selectedFile = null;

    // Clear file selection and feedback in modal
    function clearImportState() {
        selectedFile = null;
        importFeedback.textContent = '';
        fileNameDisplay.textContent = '';
        confirmImportBtn.classList.add('hidden');
        fileInput.value = null;
    }

    // 4) Basic JSON Structure Validation (client-side)
    function validateJSONStructure(parsed) {
        if (!Array.isArray(parsed)) {
            return "Top-level JSON must be an array of bookmark objects.";
        }
        if (parsed.length > 0) {
            const sample = parsed[0];
            if (typeof sample !== 'object' || sample === null) {
                return "Each array item must be an object.";
            }
            const requiredKeys = ['name', 'url', 'platform', 'tags'];
            for (const key of requiredKeys) {
                if (!(key in sample)) {
                    return `Missing key '${key}' in bookmark objects.`;
                }
            }
            if (!Array.isArray(sample.tags)) {
                return "'tags' must be an array of strings.";
            }
        }
        return null;
    }

    // 5) Called when a file is dropped or chosen: validate & display UI, but do NOT fetch yet
    async function prepareFile(file) {
        clearImportState();
        importFeedback.textContent = '';

        // 5.1) Extension + size checks
        if (!file.name.toLowerCase().endsWith('.json')) {
            importFeedback.textContent = "Only .json files allowed.";
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10 MB limit
            importFeedback.textContent = "File too large (max 10 MB).";
            return;
        }

        // 5.2) Read as text for a quick JSON parse
        let text;
        try {
            text = await file.text();
        } catch {
            importFeedback.textContent = "Cannot read file.";
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            importFeedback.textContent = "Invalid JSON format.";
            return;
        }

        // 5.3) Check structure (must be an array of objects with required keys)
        const schemaError = validateJSONStructure(parsed);
        if (schemaError) {
            importFeedback.textContent = schemaError;
            return;
        }

        // 5.4) All good → store file and reveal “Confirm Import” UI
        selectedFile = file;
        fileNameDisplay.textContent = `Selected file: ${file.name}`;
        confirmImportBtn.classList.remove('hidden');
    }

    let isImporting = false;

    async function handleConfirmImport() {
        if (isImporting) return; // prevent duplicate submissions
        if (!selectedFile) {
            importFeedback.textContent = "No file selected.";
            return;
        }

        isImporting = true;
        confirmImportBtn.disabled = true;
        confirmImportBtn.classList.add('opacity-50', 'pointer-events-none');
        importFeedback.textContent = ""; // Clear previous feedback

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/bookmarks/import/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                if (result.errors.length) {
                    importFeedback.textContent = "Errors:\n" + result.errors.join("\n");
                } else {
                    clearImportState();
                    hideModal(importModal, importModalContent);
                    location.reload();
                }
            } else {
                importFeedback.textContent = result.error || "Unknown server error.";
            }
        } catch (err) {
            console.error(err);
            importFeedback.textContent = "Network or server error during import.";
        } finally {
            isImporting = false;
            confirmImportBtn.disabled = false;
            confirmImportBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
    }


    // 7) Drag & Drop Listeners (for the entire modal backdrop)
    importModal.addEventListener('dragenter', (e) => {
        e.preventDefault();
        importModalContent.classList.add('shadow-[0_0_20px_var(--btn-bg)]');
        dropzone.classList.add('border-[#703edbcc]');
    });

    importModal.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    importModal.addEventListener('dragleave', (e) => {
        e.preventDefault();
        // Only remove highlight if truly leaving the content area
        if (!importModalContent.contains(e.relatedTarget)) {
            importModalContent.classList.remove('shadow-[0_0_20px_var(--btn-bg)]');
            dropzone.classList.remove('border-[#703edbcc]');
        }
    });

    importModal.addEventListener('drop', (e) => {
        e.preventDefault();
        importModalContent.classList.remove('shadow-[0_0_20px_var(--btn-bg)]');
        dropzone.classList.remove('border-[#703edbcc]');

        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
            prepareFile(dt.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
            prepareFile(fileInput.files[0]);
        }
    });

    // ————————————————————————————————
    // Open / Close Modal Buttons
    // ————————————————————————————————
    importBtn.addEventListener('click', () => {
        showModal(importModal, importModalContent);
    });

    importCancelBtn.addEventListener('click', () => {
        clearImportState();
        hideModal(importModal, importModalContent);
    });

    // Clicking outside content closes modal
    importModal.addEventListener('click', (e) => {
        if (e.target === importModal) {
            clearImportState();
            hideModal(importModal, importModalContent);
        }
    });

    // Pressing ESC closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && importModal.classList.contains('opacity-100')) {
            clearImportState();
            hideModal(importModal, importModalContent);
        }
    });
    confirmImportBtn.addEventListener('click', handleConfirmImport);
});
