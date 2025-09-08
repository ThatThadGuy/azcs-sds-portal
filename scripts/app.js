function initializeApp() {
    const sdsTableBody = document.getElementById('sds-table-body');
    const searchInput = document.getElementById('search');
    const sortSelect = document.getElementById('sort');
    const manufacturerFilter = document.getElementById('filter-manufacturer');
    const categoryFilter = document.getElementById('filter-category');
    const signalWordFilter = document.getElementById('filter-signal-word');
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');
    const toast = document.getElementById('toast');

    let sdsData = [];
    let displayedData = [];

    const columnMapping = {
        productName: "Product Name",
        manufacturer: "Manufacturer",
        category: "Category / Use",
        signalWord: "Signal Word",
        ghsCodes: "GHS Hazard Codes",
        pCodes: "Precautionary (P) Codes",
        dotUn: "DOT / UN",
        appearanceOdor: "Appearance / Odor",
        ph: "pH",
        specificGravity: "Specific Gravity",
        flashPoint: "Flash Point",
        boilingPoint: "Boiling Point",
        solubility: "Solubility",
        dilution: "Dilution",
        coverage: "Coverage (sq ft/gal)",
        specFile: "Spec File",
        notes: "Notes",
        sdsFile: "SDS File",
    };

    // --- Data Fetching and Initialization ---

    async function fetchData() {
        try {
            const response = await fetch('/data/sds.csv', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: header => header.trim(),
                complete: (results) => {
                    sdsData = cleanData(results.data);
                    populateFilters();
                    applyFiltersAndSort();
                },
                error: (error) => {
                    console.error("PapaParse Error:", error);
                    resultsCount.textContent = "Error parsing data. Please check the console.";
                }
            });
        } catch (error) {
            console.error("Failed to load or parse SDS data:", error);
            resultsCount.textContent = "Error loading data. Please check the console.";
        }
    }

    function cleanData(data) {
        return data.map(row => {
            // Create a mutable copy of the row
            let newRow = { ...row };

            // Special case for "Sizzle Powder Add"
            if (newRow[columnMapping.productName] && newRow[columnMapping.productName].includes('Sizzle Powder Add')) {
                const manufacturer = newRow[columnMapping.signalWord];
                const category = newRow[columnMapping.ghsCodes];
                const signalWord = newRow[columnMapping.pCodes];
                const ghsCodes = newRow[columnMapping.dotUn];
                const pCodes = newRow[columnMapping.appearanceOdor];
                const ph = newRow[columnMapping.boilingPoint];
                const notes = newRow[columnMapping.coverage];
                const sdsFile = newRow[columnMapping.dilution];


                newRow[columnMapping.manufacturer] = manufacturer;
                newRow[columnMapping.category] = category;
                newRow[columnMapping.signalWord] = signalWord;
                newRow[columnMapping.ghsCodes] = ghsCodes;
                newRow[columnMapping.pCodes] = pCodes;
                newRow[columnMapping.dotUn] = '';
                newRow[columnMapping.appearanceOdor] = '';
                newRow[columnMapping.ph] = ph;
                newRow[columnMapping.notes] = notes;
                newRow[columnMapping.sdsFile] = sdsFile;

            }


            // Trim and clean all fields
            for (const key in newRow) {
                if (typeof newRow[key] === 'string') {
                    newRow[key] = newRow[key].trim().replace(/^"+|"+$/g, '');
                }
            }
            // Check for 'EXTRA_LEFT' in notes and parse it
            const notes = newRow[columnMapping.notes] || '';
            if (notes.includes('EXTRA_LEFT:')) {
                const parts = notes.split('EXTRA_LEFT:');
                newRow[columnMapping.notes] = parts[0].replace('FR SDS available. |', '').trim();
                const extraData = parts[1].trim().split('|').map(s => s.trim());

                if (extraData.length > 0 && extraData[0] && !newRow[columnMapping.ph]) newRow[columnMapping.ph] = extraData[0];
                if (extraData.length > 1 && extraData[1] && !newRow[columnMapping.specificGravity]) newRow[columnMapping.specificGravity] = extraData[1];
                if (extraData.length > 2 && extraData[2] && !newRow[columnMapping.flashPoint]) newRow[columnMapping.flashPoint] = extraData[2];
                if (extraData.length > 0 && extraData[0] && !newRow[columnMapping.appearanceOdor]) {
                    newRow[columnMapping.appearanceOdor] = extraData[0];
                }
            }

            return newRow;
        });
    }

    function populateFilters() {
        const manufacturers = [...new Set(sdsData.map(item => item[columnMapping.manufacturer]).filter(Boolean))].sort();
        const categories = [...new Set(sdsData.map(item => item[columnMapping.category]).filter(Boolean))].sort();

        // Clear existing options
        manufacturerFilter.innerHTML = '<option value="">All</option>';
        categoryFilter.innerHTML = '<option value="">All</option>';


        manufacturers.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m;
            manufacturerFilter.appendChild(option);
        });

        categories.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            categoryFilter.appendChild(option);
        });
    }

    // --- Rendering ---

    function renderTable() {
        sdsTableBody.innerHTML = ''; // Clear existing rows

        if (displayedData.length === 0) {
            emptyState.classList.remove('hidden');
            resultsCount.textContent = '0 results found.';
        } else {
            emptyState.classList.add('hidden');
            resultsCount.textContent = `${displayedData.length} result(s) found.`;
        }

        displayedData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${item[columnMapping.productName]}</td>
                <td class="px-6 py-4 whitespace-nowrap">${item[columnMapping.manufacturer]}</td>
                <td class="px-6 py-4 whitespace-nowrap">${item[columnMapping.category]}</td>
                <td class="px-6 py-4 whitespace-nowrap">${item[columnMapping.signalWord]}</td>
                <td class="px-6 py-4 whitespace-nowrap">${createGhsChips(item[columnMapping.ghsCodes])}</td>
                <td class="px-6 py-4 whitespace-nowrap">${createLinkCell(item[columnMapping.sdsFile], 'SDS')}</td>
                <td class="px-6 py-4 whitespace-nowrap">${createLinkCell(item[columnMapping.specFile], 'Spec')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${item[columnMapping.sdsFile] ? `<button class="text-sky-600 hover:text-sky-800 mr-4" data-sds-url="${item[columnMapping.sdsFile]}" aria-label="Copy SDS link for ${item[columnMapping.productName]}" data-testid="copy-sds-link-button">Copy Link</button>` : ''}
                    <button class="text-sky-600 hover:text-sky-800" data-index="${index}" aria-expanded="false" aria-controls="details-${index}">
                        Details
                    </button>
                </td>
            `;
            sdsTableBody.appendChild(row);
        });
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300); // Wait for fade out to complete
        }, 3000);
    }

    function createGhsChips(codes) {
        if (!codes) return '';
        return codes.split(/[\s,]+/).filter(Boolean).map(code => {
            return `<span class="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-2 mb-2">${code}</span>`;
        }).join('');
    }

    function createLinkCell(url, text) {
        if (!url) return 'N/A';
        const isLocal = url.startsWith('/sds/');
        const fullUrl = isLocal ? window.location.origin + url : url;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:text-sky-800">${text}</a>`;
    }

    function toggleDetails(button, index) {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const detailsRowId = `details-${index}`;

        // Close any other open details rows
        document.querySelectorAll('[aria-expanded="true"]').forEach(b => {
            if (b !== button) {
                b.setAttribute('aria-expanded', 'false');
                const otherRowId = b.getAttribute('aria-controls');
                document.getElementById(otherRowId)?.remove();
                b.textContent = 'Details';
            }
        });

        if (isExpanded) {
            button.setAttribute('aria-expanded', 'false');
            document.getElementById(detailsRowId)?.remove();
            button.textContent = 'Details';
        } else {
            button.setAttribute('aria-expanded', 'true');
            const item = displayedData[index];
            const detailsRow = document.createElement('tr');
            detailsRow.id = detailsRowId;
            detailsRow.classList.add('details-row');
            detailsRow.innerHTML = `
                <td colspan="8" class="p-4">
                    <dl class="details-grid">
                        <div><dt>Precautionary (P) Codes</dt><dd>${item[columnMapping.pCodes] || 'N/A'}</dd></div>
                        <div><dt>DOT / UN</dt><dd>${item[columnMapping.dotUn] || 'N/A'}</dd></div>
                        <div><dt>Appearance / Odor</dt><dd>${item[columnMapping.appearanceOdor] || 'N/A'}</dd></div>
                        <div><dt>pH</dt><dd>${item[columnMapping.ph] || 'N/A'}</dd></div>
                        <div><dt>Specific Gravity</dt><dd>${item[columnMapping.specificGravity] || 'N/A'}</dd></div>
                        <div><dt>Flash Point</dt><dd>${item[columnMapping.flashPoint] || 'N/A'}</dd></div>
                        <div><dt>Boiling Point</dt><dd>${item[columnMapping.boilingPoint] || 'N/A'}</dd></div>
                        <div><dt>Solubility</dt><dd>${item[columnMapping.solubility] || 'N/A'}</dd></div>
                        <div><dt>Dilution</dt><dd>${item[columnMapping.dilution] || 'N/A'}</dd></div>
                        <div><dt>Coverage (sq ft/gal)</dt><dd>${item[columnMapping.coverage] || 'N/A'}</dd></div>
                        <div style="grid-column: 1 / -1;"><dt>Notes</dt><dd>${item[columnMapping.notes] || 'N/A'}</dd></div>
                    </dl>
                </td>
            `;
            button.closest('tr').after(detailsRow);
            button.textContent = 'Hide';
        }
    }

    // --- Filtering and Sorting Logic ---

    function applyFiltersAndSort() {
        const searchTerm = searchInput.value.toLowerCase().split(' ').filter(Boolean);
        const selectedManufacturers = Array.from(manufacturerFilter.selectedOptions).map(opt => opt.value);
        const category = categoryFilter.value;
        const signalWord = signalWordFilter.value;
        const sortBy = sortSelect.value;

        displayedData = sdsData.filter(item => {
            const manufacturerMatch = selectedManufacturers.length === 0 || selectedManufacturers.includes(item[columnMapping.manufacturer]);
            const categoryMatch = !category || item[columnMapping.category] === category;
            const signalWordMatch = !signalWord || item[columnMapping.signalWord] === signalWord;

            if (!manufacturerMatch || !categoryMatch || !signalWordMatch) {
                return false;
            }

            if (searchTerm.length === 0) return true;

            const searchFields = [
                item[columnMapping.productName],
                item[columnMapping.manufacturer],
                item[columnMapping.category],
                item[columnMapping.ghsCodes],
                item[columnMapping.pCodes],
                item[columnMapping.dotUn],
                item[columnMapping.notes]
            ].join(' ').toLowerCase();

            return searchTerm.every(term => searchFields.includes(term));
        });

        displayedData.sort((a, b) => {
            const valA = a[sortBy] || '';
            const valB = b[sortBy] || '';
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        });

        renderTable();
    }

    // --- Event Listeners ---

    searchInput.addEventListener('input', applyFiltersAndSort);
    sortSelect.addEventListener('change', applyFiltersAndSort);
    manufacturerFilter.addEventListener('change', applyFiltersAndSort);
    categoryFilter.addEventListener('change', applyFiltersAndSort);
    signalWordFilter.addEventListener('change', applyFiltersAndSort);

    sdsTableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName === 'BUTTON' && target.dataset.index) {
            toggleDetails(target, parseInt(target.dataset.index, 10));
        }

        if (target.tagName === 'BUTTON' && target.dataset.sdsUrl) {
            const urlToCopy = target.dataset.sdsUrl;
            const fullUrl = urlToCopy.startsWith('/sds/') ? window.location.origin + urlToCopy : urlToCopy;

            navigator.clipboard.writeText(fullUrl).then(() => {
                showToast('Link copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy link: ', err);
                showToast('Failed to copy link.');
            });
        }
    });

    // Focus search on '/' key press
    window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
            e.preventDefault();
            searchInput.focus();
        }
    });


    // --- Initial Load ---
    fetchData();
}

// More robust initialization logic
const startApp = () => {
    // This runs after Papa is ready. Now we check if the DOM is also ready.
    if (document.readyState === 'loading') {
        // The DOM is still loading, so wait for it.
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // The DOM is already ready, so we can initialize immediately.
        initializeApp();
    }
};

// Poll to see if PapaParse has been loaded from the CDN.
const papaParseReady = setInterval(() => {
    if (window.Papa) {
        clearInterval(papaParseReady);
        startApp();
    }
}, 100);
