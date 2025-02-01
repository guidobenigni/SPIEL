document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');
    const API_KEY = 'QS58IEEF80QDBT3Y'; // 🔑 Dein API-Schlüssel

    // Erstelle einen Fehlerbereich und füge ihn dem Dokument hinzu
    const errorMessageEl = document.createElement('div');
    errorMessageEl.id = 'error-message';
    errorMessageEl.style.display = 'none';
    errorMessageEl.style.color = 'red';
    errorMessageEl.style.marginTop = '20px';
    document.body.appendChild(errorMessageEl);

    // Standardmäßig die erste Sektion anzeigen
    if (sections.length > 0) sections[0].classList.remove('hidden');

    // Menü-Interaktion
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Sektionen verwalten
            sections.forEach(section => section.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');

            // Aktive Klasse setzen
            links.forEach(link => link.classList.remove('active'));
            this.classList.add('active');

            // Watchlist laden, falls angeklickt
            if (targetId === 'watchlist') loadWatchlist();
        });
    });

    // Watchlist laden
    async function loadWatchlist() {
        // Alle Symbole, wie ursprünglich verwendet
        const stocks = [
            // S&P 500
            { symbol: 'AAPL', name: 'Apple' },
            { symbol: 'MSFT', name: 'Microsoft' },
            { symbol: 'AMZN', name: 'Amazon' },
            { symbol: 'GOOGL', name: 'Alphabet' },
            { symbol: 'TSLA', name: 'Tesla' },
            { symbol: 'NVDA', name: 'NVIDIA' },
            { symbol: 'META', name: 'Meta Platforms' },
            { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
            { symbol: 'JNJ', name: 'Johnson & Johnson' },
            { symbol: 'V', name: 'Visa' },
            // DAX
            { symbol: 'SAP', name: 'SAP SE' },
            { symbol: 'BMW', name: 'BMW' },
            { symbol: 'VOW3', name: 'Volkswagen' },
            { symbol: 'DBK', name: 'Deutsche Bank' },
            { symbol: 'ALV', name: 'Allianz' },
            // CAC 40
            { symbol: 'AIR', name: 'Airbus' },
            { symbol: 'OR', name: "L'Oréal" },
            { symbol: 'MC', name: 'LVMH' },
            { symbol: 'SAN', name: 'Sanofi' },
            { symbol: 'BNP', name: 'BNP Paribas' },
            // Dow Jones
            { symbol: 'BA', name: 'Boeing' },
            { symbol: 'DIS', name: 'Disney' },
            { symbol: 'JPM', name: 'JPMorgan Chase' },
            { symbol: 'GS', name: 'Goldman Sachs' },
            { symbol: 'HD', name: 'Home Depot' },
            // ATX
            { symbol: 'EBS', name: 'Erste Group Bank' },
            { symbol: 'OMV', name: 'OMV AG' },
            { symbol: 'VER', name: 'Verbund' },
            { symbol: 'RBI', name: 'Raiffeisen Bank International' },
            { symbol: 'VOE', name: 'Voestalpine' }
        ];

        // Fehlerbereich zurücksetzen und Tabelle leeren
        hideError();
        const watchlistBody = document.querySelector('#watchlist-table tbody');
        watchlistBody.innerHTML = '';

        // Erstelle eine Warteschlange für API-Aufrufe
        const queue = [];
        let isProcessing = false;

        // Füge alle Aufgaben (API-Aufrufe) der Warteschlange hinzu
        stocks.forEach(stock => {
            queue.push(() => processStock(stock, watchlistBody));
        });

        processQueue();

        // Verarbeitet die Aufgaben aus der Warteschlange mit einer Pause von 12 Sekunden zwischen den Aufrufen
        async function processQueue() {
            if (isProcessing || queue.length === 0) return;
            isProcessing = true;

            // Bis zu 5 API-Aufrufe pro Durchgang (also ca. 1 pro 12 Sekunden)
            for (let i = 0; i < 5 && queue.length > 0; i++) {
                const task = queue.shift();
                await task();
                await new Promise(resolve => setTimeout(resolve, 12000)); // 12 Sekunden warten
            }

            isProcessing = false;
            if (queue.length > 0) processQueue();
        }

        // Verarbeitet ein einzelnes Symbol
        async function processStock(stock, tbody) {
            try {
                const rsi = await getRSI(stock.symbol);
                // Filter: Zeige nur, wenn der RSI zwischen 25 und 35 liegt
                if (rsi >= 25 && rsi <= 35) {
                    const row = `
                        <tr>
                            <td>${stock.symbol}</td>
                            <td>${stock.name}</td>
                            <td>${rsi.toFixed(2)}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                }
            } catch (error) {
                showError(`Fehler bei ${stock.symbol}: ${error.message || error}`);
            }
        }
    }

    // Ruft den RSI-Wert von der API ab (RSI über 260 Wochen)
    async function getRSI(symbol) {
        const url = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=weekly&time_period=260&series_type=close&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }
        const data = await response.json();

        // Überprüfen, ob die erwarteten RSI-Daten vorhanden sind
        if (!data || !data['Technical Analysis: RSI']) {
            throw new Error(`Keine RSI-Daten für ${symbol}`);
        }

        // Extrahiere den neuesten RSI-Wert
        const dates = Object.keys(data['Technical Analysis: RSI']);
        if (dates.length === 0) {
            throw new Error(`Keine RSI-Daten für ${symbol}`);
        }
        const latestDate = dates[0];
        return parseFloat(data['Technical Analysis: RSI'][latestDate].RSI);
    }

    // Zeige eine Fehlermeldung im Fehlerbereich an
    function showError(message) {
        console.error(message);
        errorMessageEl.style.display = 'block';
        errorMessageEl.textContent = message;
    }

    // Verstecke den Fehlerbereich
    function hideError() {
        errorMessageEl.style.display = 'none';
        errorMessageEl.textContent = '';
    }
});
