document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');
    const API_KEY = 'QS58IEEF80QDBT3Y'; // 🔑 Ersetze dies mit deinem API-Schlüssel!

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
            // DAX
            { symbol: 'SAP.DE', name: 'SAP SE' },
            { symbol: 'BMW.DE', name: 'BMW' },
            { symbol: 'VOW3.DE', name: 'Volkswagen' },
            // CAC 40
            { symbol: 'AIR.PA', name: 'Airbus' },
            { symbol: 'OR.PA', name: 'L\'Oréal' },
            // Dow Jones
            { symbol: 'BA', name: 'Boeing' },
            { symbol: 'DIS', name: 'Disney' },
            // ATX
            { symbol: 'EBS.VI', name: 'Erste Group Bank' },
            { symbol: 'OMV.VI', name: 'OMV AG' }
        ];

        const watchlistBody = document.querySelector('#watchlist-table tbody');
        watchlistBody.innerHTML = ''; // Tabelle leeren

        for (const stock of stocks) {
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
                console.error(`Fehler bei ${stock.symbol}:`, error);
            }
        }
    }

    // RSI aus API abrufen (5 Jahre = 260 Wochen)
    async function getRSI(symbol) {
        const response = await fetch(
            `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=weekly&time_period=260&series_type=close&apikey=${API_KEY}`
        );
        const data = await response.json();
        
        // Neuesten RSI-Wert extrahieren
        const latestDate = Object.keys(data['Technical Analysis: RSI'])[0];
        return parseFloat(data['Technical Analysis: RSI'][latestDate].RSI);
    }
});
