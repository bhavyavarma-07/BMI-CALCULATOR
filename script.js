document.addEventListener('DOMContentLoaded', function() {
    const bmiForm = document.getElementById('bmiForm');
    const resultsSection = document.getElementById('results');
    const bmiValueElement = document.getElementById('bmiValue');
    const bmiCategoryElement = document.getElementById('bmiCategory');
    const meterPointer = document.getElementById('meterPointer');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);

        if (isDarkMode) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });

    // Load BMI History
    loadBMIHistory();

    // Clear History
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your BMI history?')) {
            localStorage.removeItem('bmiHistory');
            loadBMIHistory();
        }
    });

    bmiForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('name').value;
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const age = parseInt(document.getElementById('age').value);
        const heightValue = parseFloat(document.getElementById('height').value);
        const heightUnit = document.getElementById('heightUnit').value;
        const weightValue = parseFloat(document.getElementById('weight').value);
        const weightUnit = document.getElementById('weightUnit').value;

        // Convert height to meters
        let heightInMeters;
        switch (heightUnit) {
            case 'm':
                heightInMeters = heightValue;
                break;
            case 'cm':
                heightInMeters = heightValue / 100;
                break;
            case 'ft':
                heightInMeters = heightValue * 0.3048;
                break;
            case 'in':
                heightInMeters = heightValue * 0.0254;
                break;
        }

        // Convert weight to kg
        let weightInKg;
        if (weightUnit === 'kg') {
            weightInKg = weightValue;
        } else {
            weightInKg = weightValue * 0.453592; // Convert from lb to kg
        }

        // Calculate BMI
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        const roundedBMI = bmi.toFixed(1);

        // Determine BMI category and pointer position
        let category, pointerPosition;
        if (bmi < 18.5) {
            category = 'Underweight';
            pointerPosition = (bmi / 18.5) * 25;
        } else if (bmi < 25) {
            category = 'Normal Weight';
            pointerPosition = 25 + ((bmi - 18.5) / 6.5) * 25;
        } else if (bmi < 30) {
            category = 'Overweight';
            pointerPosition = 50 + ((bmi - 25) / 5) * 25;
        } else {
            category = 'Obese';
            pointerPosition = 75 + Math.min((bmi - 30) / 10, 1) * 25;
        }

        // Limit pointer position to the meter width
        pointerPosition = Math.min(Math.max(pointerPosition, 0), 100);

        // Display results
        bmiValueElement.textContent = roundedBMI;
        bmiCategoryElement.textContent = category;
        meterPointer.style.left = `${pointerPosition}%`;

        // Show results section with animation
        resultsSection.style.display = 'block';

        // Set category in localStorage for other pages
        localStorage.setItem('bmiCategory', category);
        localStorage.setItem('userGender', gender);
        localStorage.setItem('userAge', age);

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Save to history
        saveToHistory(roundedBMI, category, heightValue, heightUnit, weightValue, weightUnit, gender, age, name);
    });

    // Save BMI calculation to history
    function saveToHistory(bmi, category, height, heightUnit, weight, weightUnit, gender, age, name) {
        const date = new Date();
        const historyItem = {
            date: date.toISOString(),
            name: name,
            bmi: bmi,
            category: category,
            height: height,
            heightUnit: heightUnit,
            weight: weight,
            weightUnit: weightUnit,
            gender: gender,
            age: age
        };

        // Get existing history or initialize new array
        let bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];

        // Add new item to beginning of array
        bmiHistory.unshift(historyItem);

        // Limit history to 20 items
        if (bmiHistory.length > 20) {
            bmiHistory = bmiHistory.slice(0, 20);
        }

        // Save back to localStorage
        localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));

        // Refresh history display
        loadBMIHistory();
    }

    // Load and display BMI history
    function loadBMIHistory() {
        const bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];

        if (bmiHistory.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No history records yet</div>';
            return;
        }

        let historyHtml = '';
        bmiHistory.forEach(item => {
            const date = new Date(item.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            historyHtml += `
                <div class="history-item">
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-details">
                        <div>
                            <strong>Name:</strong> ${item.name} | 
                            <strong>Age:</strong> ${item.age} | 
                            <strong>Gender:</strong> ${item.gender} | 
                            <strong>Height:</strong> ${item.height} ${item.heightUnit} | 
                            <strong>Weight:</strong> ${item.weight} ${item.weightUnit}
                        </div>
                        <div class="history-bmi">
                            BMI: ${item.bmi} (${item.category})
                        </div>
                    </div>
                </div>
            `;
        });

        historyList.innerHTML = historyHtml;

        // Add click event to history items to show that record's results
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach((item, index) => {
            item.addEventListener('click', function() {
                const record = bmiHistory[index];

                // Display the BMI and category
                bmiValueElement.textContent = record.bmi;
                bmiCategoryElement.textContent = record.category;

                // Calculate pointer position
                let bmi = parseFloat(record.bmi);
                let pointerPosition;
                if (bmi < 18.5) {
                    pointerPosition = (bmi / 18.5) * 25;
                } else if (bmi < 25) {
                    pointerPosition = 25 + ((bmi - 18.5) / 6.5) * 25;
                } else if (bmi < 30) {
                    pointerPosition = 50 + ((bmi - 25) / 5) * 25;
                } else {
                    pointerPosition = 75 + Math.min((bmi - 30) / 10, 1) * 25;
                }

                meterPointer.style.left = `${pointerPosition}%`;

                // Show results section
                resultsSection.style.display = 'block';

                // Scroll to results
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
});