document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');
    const API_KEY = 'QS58IEEF80QDBT3Y'; // 🔑 Dein API-Schlüssel

    // Standardmäßig erste Sektion anzeigen
    sections[0].classList.remove('hidden');

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

            // Watchlist laden
            if (targetId === 'watchlist') loadWatchlist();
        });
    });

    // Watchlist laden
    async function loadWatchlist() {
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
            { symbol: 'OR', name: 'L\'Oréal' },
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

        const watchlistBody = document.querySelector('#watchlist-table tbody');
        watchlistBody.innerHTML = ''; // Tabelle leeren

        // Warteschlange für API-Aufrufe (5 pro Minute)
        const queue = [];
        let isProcessing = false;

        for (const stock of stocks) {
            queue.push(() => processStock(stock));
        }

        processQueue();

        async function processQueue() {
            if (isProcessing || queue.length === 0) return;
            isProcessing = true;

            // 5 Aufrufe pro Minute (12 Sekunden Pause zwischen jedem Aufruf)
            for (let i = 0; i < 5 && queue.length > 0; i++) {
                const task = queue.shift();
                await task();
                await new Promise(resolve => setTimeout(resolve, 12000)); // 12 Sekunden warten
            }

            isProcessing = false;
            if (queue.length > 0) processQueue();
        }

        async function processStock(stock) {
            try {
                const rsi = await getRSI(stock.symbol);
                if (rsi >= 25 && rsi <= 35) { // RSI zwischen 25-35
                    const row = `
                        <tr>
                            <td>${stock.symbol}</td>
                            <td>${stock.name}</td>
                            <td>${rsi.toFixed(2)}</td>
                        </tr>
                    `;
                    watchlistBody.innerHTML += row;
                }
            } catch (error) {
                console.error(`Fehler bei ${stock.symbol}:`, error.message || error);
            }
        }
    }

    // RSI aus API abrufen (5 Jahre = 260 Wochen)
    async function getRSI(symbol) {
        const response = await fetch(
            `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=weekly&time_period=260&series_type=close&apikey=${API_KEY}`
        );
        const data = await response.json();

        // Überprüfen, ob Daten vorhanden sind
        if (!data || !data['Technical Analysis: RSI']) {
            throw new Error(`Keine RSI-Daten für ${symbol}`);
        }

        // Neuesten RSI-Wert extrahieren
        const latestDate = Object.keys(data['Technical Analysis: RSI'])[0];
        return parseFloat(data['Technical Analysis: RSI'][latestDate].RSI);
    }
});
