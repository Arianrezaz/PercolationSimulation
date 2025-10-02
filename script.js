// Function to draw the grid on the canvas
function draw(N, perc) {
    var canvas = document.getElementById('animation');
    var ctx = canvas.getContext('2d');
    var canvasSize = canvas.width;
    var siteSize = Math.floor(canvasSize / N);
    var firstSiteLocation = (canvasSize - siteSize * N) / 2;

    function loc(coordinate) {
        return firstSiteLocation + (coordinate - 1) * siteSize;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    this.drawGrid = function () {
        for (var row = 1; row < N + 1; row++) {
            for (var col = 1; col < N + 1; col++) {
                if (perc.isFull(row, col)) {
                    ctx.fillStyle = "#6699FF";
                    ctx.fillRect(loc(col), loc(row), siteSize, siteSize);
                } else if (perc.isOpen(row, col)) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(loc(col), loc(row), siteSize, siteSize);
                } else {
                    ctx.fillStyle = "black";
                    ctx.fillRect(loc(col), loc(row), siteSize, siteSize);
                }
            }
        }
    }
}

// Global variables for simulation state
var currentPerc, currentDrawPerc, currentN, currentCount = 0, isPaused = false, isRunning = false;
var lastThresholds = [];


// Main function to simulate percolation
function simulatePercolation() {
    if (isRunning) return; // Prevent multiple simulations

    clearInterval(interval);
    resetSimulationState();

    var N = +document.getElementById("gridSize").value;
    var radios = document.getElementsByName('speed');
    var delay = 50; // Default
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            if (radios[i].value == "instant") { delay = 0; }
            else if (radios[i].value == "fast") { delay = 5; }
            else if (radios[i].value == "slow") { delay = 100; }
            break;
        }
    }

    currentN = N;
    currentPerc = new Percolation(N);
    currentDrawPerc = new draw(N, currentPerc);
    currentCount = 0;
    isRunning = true;
    isPaused = false;

    document.getElementById("runBtn").disabled = true;
    document.getElementById("pauseBtn").disabled = false;
    document.getElementById("pauseBtn").textContent = "Pause";
    document.getElementById("resetBtn").disabled = false;

    function openRandom() {
        var i = Math.floor(Math.random() * N + 1);
        var j = Math.floor(Math.random() * N + 1);

        if (currentPerc.isOpen(i, j)) {
            openRandom();
        } else {
            currentPerc.open(i, j);
            return;
        }
    }

    function checkPerc() {
        if (isPaused) return;

        if (!currentPerc.percolates()) {
            openRandom();
            currentCount++;
            currentDrawPerc.drawGrid();
            updateStats();
        } else {
            clearInterval(interval);
            finishSimulation();
        }
    }

    function outputInstantly() {
        while (!currentPerc.percolates()) {
            openRandom();
            currentCount++;
        }
        currentDrawPerc.drawGrid();
        updateStats();
        finishSimulation();
    }

    if (delay === 0) {
        outputInstantly();
    } else {
        interval = setInterval(checkPerc, delay);
    }
}

function togglePause() {
    if (!isRunning) return;

    isPaused = !isPaused;
    document.getElementById("pauseBtn").textContent = isPaused ? "Resume" : "Pause";
}

function resetSimulation() {
    clearInterval(interval);
    resetSimulationState();

    // Clear canvas
    var canvas = document.getElementById('animation');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset UI
    document.getElementById("simulation-result").innerHTML = "";
    document.getElementById("simulation-result").style.display = "none";
    document.getElementById("currentPercent").textContent = "Sites opened: 0% (0/0)";

    document.getElementById("runBtn").disabled = false;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("resetBtn").disabled = true;
}

function resetSimulationState() {
    currentPerc = null;
    currentDrawPerc = null;
    currentN = 0;
    currentCount = 0;
    isRunning = false;
    isPaused = false;
}

function updateStats() {
    var percentage = parseFloat((currentCount * 100) / (currentN * currentN)).toFixed(1);
    document.getElementById("currentPercent").textContent = `Sites opened: ${percentage}% (${currentCount}/${currentN * currentN})`;
}

function finishSimulation() {
    var percentage = parseFloat((currentCount * 100) / (currentN * currentN)).toFixed(1);
    var outstring = `With ${currentCount} sites opened, a spanning cluster has formed. ${percentage}% of sites are open`;
    document.getElementById("simulation-result").innerHTML = outstring;
    document.getElementById("simulation-result").style.display = "block";

    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("runBtn").disabled = false;
    isRunning = false;
}

function runStatistics() {
    var N = +document.getElementById("gridSize").value;
    var numSims = +document.getElementById("numSimulations").value;
    lastThresholds = [];

    document.getElementById("statsBtn").disabled = true;
    document.getElementById("statsBtn").textContent = "Running...";

    // Run simulations
    for (var sim = 0; sim < numSims; sim++) {
        var perc = new Percolation(N);
        var count = 0;

        function openRandom() {
            var i = Math.floor(Math.random() * N + 1);
            var j = Math.floor(Math.random() * N + 1);
            if (perc.isOpen(i, j)) {
                openRandom();
            } else {
                perc.open(i, j);
                return;
            }
        }

        while (!perc.percolates()) {
            openRandom();
            count++;
        }
        var threshold = (count * 100) / (N * N);
        lastThresholds.push(threshold);
    }

    // Calculate statistics
    var sum = lastThresholds.reduce((a, b) => a + b, 0);
    var avg = (sum / numSims).toFixed(2);
    var min = Math.min(...lastThresholds).toFixed(2);
    var max = Math.max(...lastThresholds).toFixed(2);

    // Display results in modal
    var statsResult = `
        <div class="stats-meta" style="text-align: center; margin-bottom: 20px; font-size: 16px; color: var(--text-color); opacity: 0.8;">
            ${numSims} simulations • Grid: ${N}×${N}
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${avg}%</div>
                <div class="stat-label">Average Threshold</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${min}% - ${max}%</div>
                <div class="stat-label">Range</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${lastThresholds.length}</div>
                <div class="stat-label">Total Samples</div>
            </div>
        </div>
        <div class="thresholds-list">
            <div class="thresholds-label">Individual Thresholds:</div>
            <div class="thresholds-values">${lastThresholds.map(t => t.toFixed(2)).join('%, ')}%</div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button type="button" class="btn btn-secondary" onclick="exportResults()" style="margin-right: 10px;">📊 Export Results</button>
            <button type="button" class="btn btn-secondary" onclick="closeStatsModal()">Close</button>
        </div>
    `;
    document.getElementById("stats-content").innerHTML = statsResult;
    document.getElementById("stats-modal").style.display = "flex";

    document.getElementById("statsBtn").disabled = false;
    document.getElementById("statsBtn").textContent = "Run Statistics";
}

function closeStatsModal() {
    document.getElementById("stats-modal").style.display = "none";
}

function exportResults() {
    if (lastThresholds.length === 0) {
        alert("No statistics data to export. Run statistics first.");
        return;
    }

    var N = +document.getElementById("gridSize").value;
    var numSims = lastThresholds.length;
    var sum = lastThresholds.reduce((a, b) => a + b, 0);
    var avg = (sum / numSims).toFixed(2);

    var csvContent = "Simulation,Grid Size,Threshold (%)\n";
    for (var i = 0; i < lastThresholds.length; i++) {
        csvContent += `${i + 1},${N},${lastThresholds[i]}\n`;
    }
    csvContent += `Average,,${avg}\n`;

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `percolation_stats_${N}x${N}_${numSims}_simulations.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Percolation simulation class
function Percolation(N) {
    var size = N;
    var uf = new WeightedQuickUnionUF(N * N + 2);
    var topUF = new WeightedQuickUnionUF(N * N + 2);
    var opened = [];
    for (var i = 0; i < N * N; i++) {
        opened[i] = false;
    }

    function xyTo1D(i, j) {
        return size * (i - 1) + j;
    }

    this.open = function (i, j) {
        opened[xyTo1D(i, j)] = true;

        if (i != 1 && this.isOpen(i - 1, j)) {
            uf.union(xyTo1D(i, j), xyTo1D(i - 1, j));
            topUF.union(xyTo1D(i, j), xyTo1D(i - 1, j));
        }
        if (i != size && this.isOpen(i + 1, j)) {
            uf.union(xyTo1D(i, j), xyTo1D(i + 1, j));
            topUF.union(xyTo1D(i, j), xyTo1D(i + 1, j));
        }
        if (j != 1 && this.isOpen(i, j - 1)) {
            uf.union(xyTo1D(i, j), xyTo1D(i, j - 1));
            topUF.union(xyTo1D(i, j), xyTo1D(i, j - 1));
        }
        if (j != size && this.isOpen(i, j + 1)) {
            uf.union(xyTo1D(i, j), xyTo1D(i, j + 1));
            topUF.union(xyTo1D(i, j), xyTo1D(i, j + 1));
        }
        if (i == 1) {
            uf.union(0, xyTo1D(i, j));
            topUF.union(0, xyTo1D(i, j));
        }
        if (i == size) {
            uf.union(size * size + 1, xyTo1D(i, j));
        }
    }

    this.isOpen = function (i, j) {
        return opened[xyTo1D(i, j)];
    }

    this.isFull = function (i, j) {
        return topUF.connected(0, xyTo1D(i, j));
    }

    this.percolates = function () {
        return uf.connected(0, size * size + 1);
    }
}

// Union-Find class for efficiently managing and checking connections
function WeightedQuickUnionUF(N) {
    var parent = [];
    var size = [];
    for (var i = 0; i < N; i++) {
        parent[i] = i;
        size[i] = 1;
    }

    function root(i) {
        while (i != parent[i]) {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        return i;
    }

    this.union = function (p, q) {
        var i = root(p);
        var j = root(q);
        if (i == j) return;

        if (size[i] < size[j]) {
            parent[i] = j;
            size[j] += size[i];
        } else {
            parent[j] = i;
            size[i] += size[j];
        }
    }

    this.connected = function (p, q) {
        return root(p) == root(q);
    }
}