console.log('main.js loaded on the audit_log.html page');
document.addEventListener('DOMContentLoaded', function () {
    const expenseForm = document.getElementById('expense-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const transactionTable = document.getElementById('transaction-table');
    const barChartContainer = document.getElementById('bar-chart-container');

    // Initialize the line graph
    const svg = d3.select(barChartContainer)
        .append('svg')
        .attr('width', 400)
        .attr('height', 200);

    const g = svg.append('g');

    // Function to fetch and display transactions
   // Function to fetch and display transactions, and calculate total expenses
function displayTransactions() {
    fetch('/get-transactions')
        .then(response => response.json())
        .then(transactions => {
            // Display transactions in a table
            const tableHTML = transactions.map(transaction => {
                return `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.description}</td>
                        <td>$${transaction.amount.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
            transactionTable.innerHTML = `
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                    ${tableHTML}
                </table>
            `;

            // Calculate the total expenses
            const totalAmount = transactions.reduce((total, transaction) => total + transaction.amount, 0);
            document.getElementById('total-amount').textContent = totalAmount.toFixed(2);

            const data = transactions;
            updateLineGraph(data);
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
        });
}


    // Function to update the line graph with new data
// Function to update the line graph with new data
function updateLineGraph(data) {
    // Define margins and dimensions for the graph
    const margin = { top: 20, right: 30, bottom: 40, left: 40 }; // Increase the bottom margin for y-axis labels
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create a scale for x-axis
    const x = d3.scaleBand()
        .domain(data.map(transaction => transaction.description))
        .range([0, width])
        .padding(0.1);

    // Create a scale for y-axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.amount)])
        .range([height, 0]);

    // Define the line function
    const line = d3.line()
        .x(d => x(d.description) + x.bandwidth() / 2)
        .y(d => y(d.amount));

    g.selectAll('*').remove(); // Clear the existing graph

    // Create x-axis
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Create y-axis with dynamic interval for ticks
    g.append('g')
        .call(d3.axisLeft(y)
            .ticks(Math.min(data.length, 5)) // You can adjust the number of ticks here
            .tickFormat(d3.format("$.2f")) // Format the tick labels as currency
        );

    // Create the line path
    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'purple')
        .attr('stroke-width', 1.5)
        .attr('d', line);

    // Label the x-axis
    g.append('text')
        .attr('transform', `translate(${width / 2}, ${height + margin.top + 20})`)
        .style('text-anchor', 'middle')
        .text('Transaction (Description)');

    // Label the y-axis
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 10)
        .style('text-anchor', 'middle')
        .text('Value ($)');

// Create y-axis with dynamic interval for ticks
g.append('g')
    .call(d3.axisLeft(y)
        .ticks(Math.min(data.length, 5)) // You can adjust the number of ticks here
        .tickFormat(d3.format("$.2f")) // Format the tick labels as currency
    )
    .selectAll("text")
    .style("font-size", "12px") // Increase the font size for y-axis labels
    .attr("dy", "0.32em") // Adjust the vertical position of labels
    .attr("text-anchor", "end"); // Position labels to the right of the ticks

}


    // Event listener to submit a new transaction
    expenseForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const description = descriptionInput.value;
        const amount = parseFloat(amountInput.value);

        if (description && !isNaN(amount)) {
            fetch('/add-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ description, amount })
            })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        descriptionInput.value = '';
                        amountInput.value = '';
                        // Refresh the table and update the line graph with new data
                        displayTransactions();
                    } else {
                        console.error('Error adding transaction:', result.error);
                    }
                })
                .catch(error => {
                    console.error('Error adding transaction:', error);
                });
        }
    });

    // Display transactions and line graph when the page loads
    displayTransactions();
});


// Event listener for the search button
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const resultsList = document.getElementById('results-list');

searchButton.addEventListener('click', () => {
    const searchText = searchInput.value;
    searchTransactions(searchText);
});

// Function to search transactions based on the search text
function searchTransactions(searchText) {
    fetch('/search-transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchText }),
    })
    .then(response => response.json())
    .then(filteredTransactions => {
        displaySearchResults(filteredTransactions);
    })
    .catch(error => {
        console.error('Error searching transactions:', error);
    });
}

// Function to display the search results
function displaySearchResults(filteredTransactions) {
    resultsList.innerHTML = '';

    if (filteredTransactions.length === 0) {
        resultsList.innerHTML = '<p>No results found.</p>';
    } else {
        filteredTransactions.forEach(transaction => {
            const listItem = document.createElement('li');
            listItem.textContent = `ID: ${transaction.id}, Description: ${transaction.description}, Amount: $${transaction.amount.toFixed(2)}`;
            resultsList.appendChild(listItem);
        });
    }
}
// ... (your existing code)

// Event listener for the "Download CSV" button
const downloadCsvButton = document.getElementById('download-csv');
downloadCsvButton.addEventListener('click', () => {
    downloadCsv();
});

// Function to download transaction data as a CSV file
function downloadCsv() {
    fetch('/export-csv') // This should be the route where you generate the CSV file on the server
        .then(response => response.blob())
        .then(blob => {
            const a = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = 'transactions.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading CSV:', error);
        });
}

// ... (your existing code)

const downloadGraphButton = document.getElementById('download-graph');
downloadGraphButton.addEventListener('click', () => {
    downloadGraph();
});


// Function to download the graph as an image
function downloadGraph() {
    const svg = d3.select(barChartContainer).select('svg').node();

    // Create a data URL from the SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const img = new Image();
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        // Use html2canvas to capture the canvas as an image
        html2canvas(canvas).then(function (canvas) {
            // Convert the canvas to a data URL
            const dataUrl = canvas.toDataURL('image/png');

            // Create a download link and trigger the download
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'graph.png';
            a.click();
        });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

