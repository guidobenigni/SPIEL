document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');
    const API_KEY = 'QS58IEEF80QDBT3Y'; // Dein API-Schlüssel

    // Fehlerbereich dynamisch erstellen
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
            sections.forEach(section => section.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');
            links.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            if (targetId === 'watchlist') loadWatchlist();
        });
    });

    // Vollständige Aktienliste (S&P 500, DAX, CAC 40, Dow Jones, ATX)
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

        const watchlistBody = document.querySelector('#watchlist-table tbody');
        watchlistBody.innerHTML = ''; // Tabelle leeren
        hideError();

        for (const stock of stocks) {
            try {
                const rsi = await getRSI(stock.symbol);
                // Filter: Beispielweise nur anzeigen, wenn der RSI zwischen 25 und 35 liegt
                if (rsi !== null && rsi >= 25 && rsi <= 35) {
                    addTableRow(watchlistBody, stock.symbol, stock.name, rsi.toFixed(2));
                } else {
                    addTableRow(watchlistBody, stock.symbol, stock.name, rsi !== null ? rsi.toFixed(2) : 'N/A');
                }
            } catch (error) {
                showError(`Fehler bei ${stock.symbol}: ${error.message}`);
                addTableRow(watchlistBody, stock.symbol, stock.name, 'Fehler');
            }
        }
    }

    // Versucht, den RSI direkt über den Alpha Vantage RSI-Endpunkt abzurufen.
    // Falls keine Daten vorhanden sind, wird ein Fallback zur Berechnung anhand von Tagesdaten genutzt.
    async function getRSI(symbol) {
        const urlRSI = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=weekly&time_period=260&series_type=close&apikey=${API_KEY}`;
        const response = await fetch(urlRSI);
        if (!response.ok) {
            throw new Error(`HTTP-Fehler beim RSI-Aufruf: ${response.status}`);
        }
        const data = await response.json();
        if (data && data['Technical Analysis: RSI']) {
            const dates = Object.keys(data['Technical Analysis: RSI']);
            if (dates.length > 0) {
                return parseFloat(data['Technical Analysis: RSI'][dates[0]].RSI);
            }
        }
        // Fallback: Berechne den RSI aus Tageskursdaten
        return await computeRSIFromDaily(symbol);
    }

    // Holt Tageskursdaten und berechnet daraus den RSI (Standardperiode 14)
    async function computeRSIFromDaily(symbol) {
        const dailyUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}&outputsize=compact`;
        const response = await fetch(dailyUrl);
        if (!response.ok) {
            throw new Error(`HTTP-Fehler beim Tagesdaten-Aufruf: ${response.status}`);
        }
        const data = await response.json();
        if (!data["Time Series (Daily)"]) {
            throw new Error(`Keine Tagesdaten für ${symbol} gefunden.`);
        }
        const timeSeries = data["Time Series (Daily)"];
        // Sortiere die Daten chronologisch (älteste zuerst)
        const dates = Object.keys(timeSeries).sort();
        const closes = dates.map(date => parseFloat(timeSeries[date]["4. close"]));
        const period = 14;
        if (closes.length < period + 1) {
            throw new Error("Nicht genügend Daten, um den RSI zu berechnen.");
        }
        return calculateRSI(closes, period);
    }

    // Berechnet den RSI anhand eines Arrays von Schlusskursen und einer Periode
    function calculateRSI(closes, period) {
        let gains = 0, losses = 0;
        // Initiale Berechnung (einfacher Durchschnitt)
        for (let i = 1; i <= period; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses += Math.abs(change);
            }
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        let rsi = 100 - (100 / (1 + rs));
        // Exponentielle Glättung für alle weiteren Tage
        for (let i = period + 1; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? Math.abs(change) : 0;
            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;
            rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi = 100 - (100 / (1 + rs));
        }
        return rsi;
    }

    // Hilfsfunktion zum Hinzufügen einer Tabellenzeile
    function addTableRow(tbody, symbol, name, rsi) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${symbol}</td><td>${name}</td><td>${rsi}</td>`;
        tbody.appendChild(row);
    }

    // Zeigt eine Fehlermeldung an
    function showError(message) {
        console.error(message);
        errorMessageEl.style.display = 'block';
        errorMessageEl.textContent = message;
    }

    // Versteckt den Fehlerbereich
    function hideError() {
        errorMessageEl.style.display = 'none';
        errorMessageEl.textContent = '';
    }
});
