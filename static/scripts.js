// Line items data by trade
const lineItemsByTrade = {
    "16":[
                { description: "Wiring Methods", code: "16-1000" },
                { description: "Electrical Power", code: "16-2000" },
                { description: "Low-Voltage Distribution", code: "16-4000" },
                { description: "Lighting", code: "16-5000" },
                { description: "Communications", code: "16-7000" },
                { description: "Sound & Video", code: "16-8000" }
            ],
            "15": [
                { description: "Sprinkler", code: "15-3000" },
                { description: "Plumbing", code: "15-4000" },
                { description: "HVAC", code: "15-7000" },
                { description: "HVAC Instrumentation & Control", code: "15-9000" }
            ],
            "03": [
                { description: "Basic Concrete Materials and Methods", code: "03-0050" },
                { description: "Concrete Forms and Accessories", code: "03-1000" },
                { description: "Concrete Reinforcement", code: "03-2000" },
                { description: "Cast-In-Place Concrete", code: "03-3000" }
            ],
            "04": [
                { description: "Basic Masonry Materials and Methods", code: "04-0050" },
                { description: "Masonry Units", code: "04-2000" },
                { description: "Stone", code: "04-4000" },
                { description: "Refractories", code: "04-5000" }

            ],
            "05": [
                { description: "Basic Metal Materials and Methods", code: "05-0050" },
                { description: "Metal Units", code: "05-2000" },
                { description: "Steel", code: "05-4000" },

            ],

             "06": [
                { description: "Rough Carpentry", code: "06-1000" },
                { description: "Architectural Woodwork", code: "06-4000" },

            ],
             "07": [
                { description: "Dampproofing & Waterproofing", code: "07-1000" },
                { description: "Thermal Protection", code: "07-2000" },
                { description: "Flashing & Sheet Metal", code: "07-6000" },
                { description: "Fire & Smoke Protection", code: "07-8000" },

            ],

             "08": [
                { description: "Metal Doors & Frames (1)", code: "08-1000" },
                { description: "Wood Doors & Frames (1)", code: "08-2000" },
                { description: "Speciality Doors", code: "08-3000" },
                { description: "Entrances & Storefronts (1)", code: "08-4000" },
                { description: "Windows", code: "08-5000" },
                { description: "Skylights", code: "08-6000" },
                { description: "Hardware", code: "08-7000" },
                { description: "Glazing", code: "08-8000" },

            ]
            ,"09":  [
                { description: "Plaster Gypsum Board ", code: "09-2000" },
                { description: "Stone & Tile", code: "09-3000" },
                { description: "Terrazzo", code: "09-4000" },
                { description: "Ceilings", code: "09-5000" },
                { description: "Wood Flooring", code: "09-6000" },
                { description: "Carpet Flooring", code: "09-6000" },
                { description: "Vinyl Flooring", code: "09-6000" },
                { description: "Vinyl Floor Base", code: "09-6000" },
                { description: "Acoustical Treatment", code: "09-8000" },
                { description: "Paints & Coatings", code: "09-9000" },
                { description: "Wall Coverings", code: "09-9000" },


            ], "10":[

                { description: "Signage", code: "10-4000" },
                { description: "Appliances Including All Accessories", code: "10-5000" },
                { description: "Fire Protection Specialties", code: "10-5200" },
                { description: "Partitions", code: "10-6000" },
                { description: "Toilet & Bath Accessories", code: "10-8000" },

                ]
                , "11":[

                { description: "Fluid Waste Treatment", code: "11-3000" },
                { description: "Food Service Equipment", code: "11-4000" },

                ]
                , "12":[
                        { description: "Fabrics DR1/2", code: "12-0500" },
                        { description: "Window Treatment Distraction Markers", code: "12-4900" },
                        { description: "Loose Furniture", code: "12-5000" },
                        { description: "Furnishings Repairs & Restoration", code: "12-9000" },

                ]
                , "13":[

             { description: "Fire Suppression/ Fire Alarm", code: "13-9000" },

                ]

                , "14":[ { description: "Dumbwaiter", code: "14-1000" },
                { description: "Elevators", code: "14-2000" },
                { description: "Lifts", code: "14-4000" },
                { description: "Hoists & Cranes", code: "14-6000" },
                ]

                , "02":[ { description: "Demolition", code: "02-2000" },
                ]
};

// Function to show the login modal
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

// Function to close the login modal
function closeModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('modalBackdrop').classList.remove('active');
}

// Function to handle login with test credentials
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // For testing, use username "TEST" and password "TEST"
    if (username === 'TEST' && password === 'TEST') {
        window.location.href = '/folor_dashboard';  // Redirect to the dashboard on successful login
    } else {
        alert('Invalid credentials. Please use TEST for both username and password.');
    }
}

// Ensure that the modal functions are properly hooked up
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('folorIncBtn').addEventListener('click', showLoginModal);
});

// Function to show line items based on selected trade
function showLineItems() {
    const trade = document.getElementById('trade').value;
    const lineItems = lineItemsByTrade[trade] || [];
    const lineItemFields = document.getElementById('lineItemFields');
    lineItemFields.innerHTML = '';

    lineItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.code}</td>
            <td>${item.description}</td>
            <td><input type="number" placeholder="Enter cost" oninput="calculateTotalCost()"></td>
        `;
        lineItemFields.appendChild(row);
    });

    document.getElementById('lineItems').classList.toggle('hidden', lineItems.length === 0);
}

// Function to calculate the total cost of all line items
function calculateTotalCost() {
    let total = 0;
    document.querySelectorAll('#lineItemFields input[type="number"]').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('totalCost').value = total.toFixed(2);
}

// Function to add a custom line item row
function addCustomLineItemRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" placeholder="Enter cost code"></td>
        <td><input type="text" placeholder="Enter description"></td>
        <td><input type="number" placeholder="Enter cost" oninput="calculateTotalCost()"></td>
    `;
    document.getElementById('lineItemFields').appendChild(row);
}

// Enable submit button if checkbox is checked
function toggleSubmitButton() {
    const checkbox = document.getElementById('confirmationCheckbox');
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = !checkbox.checked;
}

// Go back to the previous page
function goBack() {
    window.history.back();
}

// Set up event listeners on page load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trade').addEventListener('change', showLineItems);
});


function filterJobs() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const jobList = document.getElementById('jobList');
    const jobs = jobList.getElementsByClassName('job-folder');

    Array.from(jobs).forEach(job => {
        const jobNumber = job.getAttribute('data-job-number').toLowerCase();
        if (jobNumber.includes(input)) {
            job.style.display = '';
        } else {
            job.style.display = 'none';
        }
    });
}